import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { checkRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const AIDEN_API_BASE = process.env.AIDEN_API_URL ?? 'https://aiden-api-production.up.railway.app'
const AIDEN_API_KEY = process.env.AIDEN_API_KEY ?? ''

interface AnalyzeBriefRequest {
  briefText: string
  brandName?: string
  industry?: string
  briefType?: string
}

async function callAidenAPI<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s for Opus

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

async function pollJob<T>(jobId: string, maxWait = 120000): Promise<T> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`${AIDEN_API_BASE}/api/v1/jobs/${jobId}/status`, {
        headers: { 'X-API-Key': AIDEN_API_KEY },
        signal: controller.signal,
      })
      const data = await response.json()

      if (data.status === 'completed') {
        // Fetch the result
        const resultResp = await fetch(`${AIDEN_API_BASE}/api/v1/jobs/${jobId}/result`, {
          headers: { 'X-API-Key': AIDEN_API_KEY },
        })
        const result = await resultResp.json()
        return (result.data ?? result) as T
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Analysis failed')
      }
    } finally {
      clearTimeout(timeout)
    }

    // Wait 2s before polling again
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  throw new Error('Analysis timed out')
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
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Auth check
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
    // Step 1: Extract structured brief via AIDEN API (Haiku - fast)
    const extractResult = await callAidenAPI<{ success: boolean; data: Record<string, unknown> }>('/extract-brief', {
      brief_text: briefText,
      ...(brandName && { brand_name: brandName }),
      ...(industry && { industry }),
      ...(briefType && { brief_type: briefType }),
    })
    const extractedBrief = extractResult.data?.content ?? extractResult.data ?? extractResult

    // Step 2: Score + identify gaps (local - no AI needed)
    const score = calculateBriefScore(briefText, extractedBrief as Record<string, unknown>)
    const gaps = identifyGaps(extractedBrief as Record<string, unknown>)

    // Step 3: Full Brain strategic analysis via AIDEN API (Opus - phantom system fires)
    // This is an async job, so we submit and poll
    const strategyJob = await callAidenAPI<{ job_id: string }>('/generate/strategy', {
      brief_data: extractedBrief,
    })
    const strategicAnalysis = await pollJob<Record<string, unknown>>(strategyJob.job_id)

    // Step 4: Rewrite the brief (Sonnet - fast, good quality for rewriting)
    // Uses direct Anthropic call, not Brain/AIDEN API, to stay within Vercel timeout
    let rewrittenBrief: string | null = null
    try {
      const anthropic = new Anthropic()
      const rewriteResult = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are an expert creative strategist rewriting briefs. Output ONLY the rewritten brief. No commentary, no preamble.',
        messages: [{
          role: 'user',
          content: `Rewrite this creative brief completely. Fill every gap. Strengthen every thin section.

ORIGINAL BRIEF:
${briefText.slice(0, 5000)}

GAPS IDENTIFIED:
${gaps.join('\n')}

STRATEGIC ANALYSIS:
${JSON.stringify(strategicAnalysis, null, 2).slice(0, 3000)}

Add the missing elements (${gaps.map(g => g.split(' (')[0]).join(', ')}). Make the audience specific with psychographics. Make the objective measurable. Add a clear tension or insight. Make deliverables specific with formats and platforms.

Preserve the author's intent. Write it as a polished, ready-to-brief document.`
        }],
      })
      const text = rewriteResult.content[0]
      rewrittenBrief = text.type === 'text' ? text.text : null
    } catch (err) {
      console.error('Brief rewrite failed (non-blocking):', err)
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
          output_copy: { extractedBrief, strategicAnalysis, gaps, score },
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
