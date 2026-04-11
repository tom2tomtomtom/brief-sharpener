import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { checkGuestMonthlyLimit, checkRateLimit } from '@/lib/rate-limit'

const AIDEN_API_BASE = process.env.AIDEN_API_URL ?? 'https://aiden-api-production.up.railway.app'
const AIDEN_API_KEY = process.env.AIDEN_API_KEY ?? ''

interface AnalyzeBriefRequest {
  briefText: string
  brandName?: string
  industry?: string
  briefType?: string
}

function compactToken(input: string | null | undefined): string {
  if (!input) return 'none'
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'none'
}

async function callAidenAPI<T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${AIDEN_API_BASE}/api/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AIDEN_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`AIDEN API ${path} failed (${response.status}): ${errorText}`)
    }

    return response.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

// Fields to check, with Brain V2 field name aliases
const BRIEF_CHECKS = [
  { aliases: ['objectives', 'objective'], label: 'Clear campaign objective or goal' },
  { aliases: ['target_audience', 'audience'], label: 'Target audience definition' },
  { aliases: ['campaign_name', 'brand', 'brand_name'], label: 'Brand context or guidelines' },
  { aliases: ['deliverables', 'requirements', 'platforms'], label: 'Specific deliverables' },
  { aliases: ['tone', 'tone_of_voice'], label: 'Tone of voice or messaging direction' },
  { aliases: ['budget'], label: 'Budget or scope constraints' },
  { aliases: ['timeline', 'timing'], label: 'Timeline or deadlines' },
  { aliases: ['kpis', 'success_metrics', 'confidence'], label: 'Success metrics or KPIs' },
] as const

function getFieldValue(obj: Record<string, unknown>, aliases: readonly string[]): string | null {
  for (const field of aliases) {
    const value = obj[field]
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length === 0) continue
        return value.join(' ')
      }
      return String(value)
    }
  }
  return null
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function scoreField(text: string | null): number {
  if (text === null) return 0
  const words = wordCount(text)
  if (words < 3) return 3
  if (words < 10) return 3
  if (words < 30) return 6
  return 10
}

function calculateBriefScore(briefText: string, extractedBrief: Record<string, unknown>): number {
  let fieldScore = 0
  for (const { aliases } of BRIEF_CHECKS) {
    const value = getFieldValue(extractedBrief, aliases)
    fieldScore += scoreField(value)
  }

  const lines = briefText.split('\n').filter(l => l.trim().length > 0)
  const structureScore = lines.length >= 4 ? 10 : lines.length >= 2 ? 5 : 0

  const presentCount = BRIEF_CHECKS.filter(({ aliases }) => getFieldValue(extractedBrief, aliases) !== null).length
  const completenessScore = Math.round((presentCount / BRIEF_CHECKS.length) * 10)

  return Math.round(Math.min(fieldScore + structureScore + completenessScore, 100))
}

function identifyGaps(extractedBrief: Record<string, unknown>): string[] {
  const gaps: string[] = []
  for (const { aliases, label } of BRIEF_CHECKS) {
    const value = getFieldValue(extractedBrief, aliases)
    if (value === null) {
      gaps.push(`${label} (missing)`)
    } else if (wordCount(value) < 10) {
      gaps.push(`${label} (present but lacks detail)`)
    }
  }
  return gaps
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed: rateLimitAllowed, retryAfter } = await checkRateLimit(ip)
  if (!rateLimitAllowed) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Auth check
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()

  // Monthly usage limit check
  if (user) {
    const { allowed, planLimits } = await canGenerate(adminSupabase, user.id)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Generation limit reached',
          code: 'PLAN_LIMIT',
          plan: planLimits.plan,
          used: planLimits.used,
          limit: planLimits.limit,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      )
    }
  } else {
    const guestToken = compactToken(request.headers.get('x-guest-token'))
    const fingerprint = compactToken(request.headers.get('x-guest-fingerprint'))
    const userAgent = compactToken(request.headers.get('user-agent'))
    const guestIdentifier = `${ip}:${guestToken}:${fingerprint}:${userAgent}`
    const guestQuota = await checkGuestMonthlyLimit(guestIdentifier)

    if (!guestQuota.allowed) {
      return NextResponse.json(
        {
          error: 'Free guest limit reached. Sign in to continue with 3 analyses per month.',
          code: 'GUEST_MONTHLY_LIMIT',
          limit: guestQuota.limit,
          upgradeUrl: '/login?redirect=/generate',
        },
        { status: 429 }
      )
    }
  }

  let body: AnalyzeBriefRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { briefText, brandName, industry, briefType } = body

  if (!briefText?.trim()) {
    return NextResponse.json({ error: 'briefText is required' }, { status: 400 })
  }

  try {
    // Step 1: Extract structured brief via AIDEN API (Haiku - fast)
    const extractResult = await callAidenAPI<{ success: boolean; data: Record<string, unknown> }>('/extract-brief', {
      brief_text: briefText,
      ...(brandName && { brand_name: brandName }),
      ...(industry && { industry }),
      ...(briefType && { brief_type: briefType }),
    })
    const extractedBrief = (extractResult.data?.content ?? extractResult.data ?? extractResult) as Record<string, unknown>

    // Step 2: Score + identify gaps (local - no AI needed)
    const score = calculateBriefScore(briefText, extractedBrief)
    const gaps = identifyGaps(extractedBrief)

    // Step 3: Brain analysis + rewrite in ONE call (Opus + phantom system)
    // Same pattern as Studio V2's BriefStep - Brain returns analysis AND rewritten brief
    const brainMessage = `I've just parsed this campaign brief. Here's what I extracted:

Campaign: ${extractedBrief.campaign_name || 'Unknown'}
Objectives: ${Array.isArray(extractedBrief.objectives) ? (extractedBrief.objectives as string[]).join(', ') : extractedBrief.objectives || 'Not specified'}
Target Audience: ${extractedBrief.target_audience || extractedBrief.audience || 'Not specified'}
Tone: ${extractedBrief.tone || extractedBrief.tone_of_voice || 'Not specified'}
Platforms: ${Array.isArray(extractedBrief.platforms) ? (extractedBrief.platforms as string[]).join(', ') : extractedBrief.platforms || 'Not specified'}
Requirements: ${extractedBrief.requirements || extractedBrief.deliverables || 'Not specified'}
Budget: ${extractedBrief.budget || 'Not specified'}
Timeline: ${extractedBrief.timeline || extractedBrief.timing || 'Not specified'}

Gaps identified: ${gaps.length > 0 ? gaps.join(', ') : 'None'}
Brief quality score: ${score}/100

Please provide two things:

## STRATEGIC ANALYSIS & RECOMMENDATIONS

Give me your honest creative director take on this brief. What's the idea here? Is it strong enough? What would you push harder on? Where's the missed opportunity? What tensions or insights could the work be built on? Be conclusive and actionable in your recommendations.

## AIDEN'S VERSION OF THE BRIEF

Rewrite this brief as a cohesive narrative that captures the strategic intent, sharpens the objectives, fills every gap (${gaps.map(g => g.split(' (')[0]).join(', ')}), and provides clear creative direction. This will be the master brief used throughout campaign development. Make it concise but comprehensive, focusing on what truly matters for creating breakthrough work.

IMPORTANT: Use the section headers exactly as shown above (## STRATEGIC ANALYSIS & RECOMMENDATIONS and ## AIDEN'S VERSION OF THE BRIEF). Write in conversational text, but be conclusive. This is your definitive take.`

    const chatResult = await callAidenAPI<{ success: boolean; data: { content: string; metadata?: unknown } }>('/chat', {
      message: brainMessage,
      context: {
        briefData: extractedBrief,
      },
    }, 300000) // 5 min timeout - Railway has no function time limit

    const brainResponse = chatResult.data?.content ?? ''

    // Parse Brain response into analysis and rewritten brief (same as Studio V2)
    let strategicAnalysis: Record<string, unknown> = {}
    let rewrittenBrief: string | null = null

    // Brain may use # or ## for headers, and AIDEN'S or AIDENS
    const sections = brainResponse.split(/#{1,2}\s*AIDEN.S VERSION OF THE BRIEF/i)
    if (sections.length === 2) {
      const analysisSection = sections[0]
        .replace(/#{1,2}\s*STRATEGIC ANALYSIS & RECOMMENDATIONS/i, '')
        .trim()
      const briefSection = sections[1].trim()

      strategicAnalysis = {
        aidenAnalysis: analysisSection,
        rawResponse: brainResponse,
      }
      rewrittenBrief = briefSection
    } else {
      // Fallback: use entire response as analysis
      strategicAnalysis = {
        aidenAnalysis: brainResponse,
        rawResponse: brainResponse,
      }
    }

    // Include extraction-level analysis too
    if (extractedBrief.aiden_analysis) {
      strategicAnalysis.extractionAnalysis = extractedBrief.aiden_analysis
    }

    // Track usage and save for authenticated users
    let generationId: string | null = null
    if (user) {
      const plan = await getUserPlan(adminSupabase, user.id)
      await incrementUsage(adminSupabase, user.id, plan)

      const { data } = await adminSupabase
        .from('generations')
        .insert({
          user_id: user.id,
          input_data: { briefText, brandName, industry, briefType },
          output_copy: { extractedBrief, strategicAnalysis, gaps, score, rewrittenBrief },
        })
        .select('id')
        .single()
      generationId = data?.id ?? null
    }

    return NextResponse.json({
      extractedBrief,
      strategicAnalysis,
      gaps,
      score,
      rewrittenBrief,
      generationId,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Analysis is taking longer than expected. Please try again.' },
          { status: 504 }
        )
      }
      if (error.message.includes('AIDEN API') || error.message.includes('timed out')) {
        return NextResponse.json({ error: error.message }, { status: 502 })
      }
    }
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
