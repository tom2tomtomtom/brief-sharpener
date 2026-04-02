import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { checkRateLimit } from '@/lib/rate-limit'
import { runPhantomAnalysis, PhantomPerspective } from '@/lib/phantom-analysis'

const BRAIN_API_BASE = process.env.AIDEN_BRAIN_API_URL ?? 'https://aiden-brain-v2-production.up.railway.app'

interface AnalyzeBriefRequest {
  briefText: string
  brandName?: string
  industry?: string
  briefType?: string
}

async function callBrainAPI<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${BRAIN_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Brain API ${path} failed (${response.status}): ${errorText}`)
    }

    return response.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

// Brain V2 returns different field names than expected. Map to canonical names.
function hasValue(obj: Record<string, unknown>, ...fields: string[]): boolean {
  for (const field of fields) {
    const value = obj[field]
    if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      return true
    }
  }
  return false
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
  // Field quality score: each of 8 fields scores 0-10 (max 80)
  let fieldScore = 0
  for (const { aliases } of BRIEF_CHECKS) {
    const value = getFieldValue(extractedBrief, aliases)
    fieldScore += scoreField(value)
  }

  // Structure bonus (max 10): distinct sections indicated by newlines
  const lines = briefText.split('\n').filter(l => l.trim().length > 0)
  const structureScore = lines.length >= 4 ? 10 : lines.length >= 2 ? 5 : 0

  // Completeness bonus (max 10): proportional to how many fields are present at all
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
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Auth check (optional - anonymous users can analyze, just no save/tracking)
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()

  // Usage limit check (only for authenticated users)
  if (user) {
    const { allowed, planLimits } = await canGenerate(adminSupabase, user.id)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Generation limit reached',
          plan: planLimits.plan,
          used: planLimits.used,
          limit: planLimits.limit,
          upgradeUrl: '/pricing',
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
    // Step 1: Extract structured brief via Brain V2
    const extractResult = await callBrainAPI<{ content: Record<string, unknown> }>('/api/extract-brief', {
      brief_text: briefText,
      ...(brandName && { brand_name: brandName }),
      ...(industry && { industry }),
      ...(briefType && { brief_type: briefType }),
    })
    const extractedBrief = extractResult.content ?? extractResult

    // Step 2: Generate strategy from extracted brief via Brain V2
    const strategicAnalysis = await callBrainAPI<Record<string, unknown>>('/aiden/generate-strategy', {
      briefData: extractedBrief,
    })

    const score = calculateBriefScore(briefText, extractedBrief)
    const gaps = identifyGaps(extractedBrief)

    // Step 3: Phantom analysis for Pro users
    let phantomAnalysis: PhantomPerspective[] | null = null
    if (user) {
      const plan = await getUserPlan(adminSupabase, user.id)

      if (plan === 'pro' || plan === 'agency') {
        try {
          phantomAnalysis = await runPhantomAnalysis(extractedBrief, briefText)
        } catch (err) {
          console.error('Phantom analysis failed (non-blocking):', err)
        }
      }

      // Track usage and save
      await incrementUsage(adminSupabase, user.id, plan)

      const { data } = await adminSupabase
        .from('generations')
        .insert({
          user_id: user.id,
          input_data: { briefText, brandName, industry, briefType },
          output_copy: { extractedBrief, strategicAnalysis, gaps, score, phantomAnalysis },
        })
        .select('id')
        .single()

      return NextResponse.json({
        extractedBrief,
        strategicAnalysis,
        gaps,
        score,
        phantomAnalysis,
        generationId: data?.id ?? null,
      })
    }

    return NextResponse.json({
      extractedBrief,
      strategicAnalysis,
      gaps,
      score,
      phantomAnalysis: null,
      generationId: null,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Analysis is taking longer than expected. Please try again.' },
          { status: 504 }
        )
      }
      if (error.message.includes('Brain API') || error.message.includes('Brain API key')) {
        return NextResponse.json({ error: error.message }, { status: 502 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
