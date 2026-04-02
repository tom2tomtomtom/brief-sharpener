import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { checkRateLimit } from '@/lib/rate-limit'

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

function calculateBriefScore(briefText: string, extractedBrief: Record<string, unknown>): number {
  const presentCount = BRIEF_CHECKS.filter(({ aliases }) => hasValue(extractedBrief, ...aliases)).length

  const fieldScore = (presentCount / BRIEF_CHECKS.length) * 70
  const lengthScore = Math.min((briefText.length / 500) * 20, 20)
  const structureScore = briefText.includes('\n') ? 10 : 0

  return Math.round(Math.min(fieldScore + lengthScore + structureScore, 100))
}

function identifyGaps(extractedBrief: Record<string, unknown>): string[] {
  return BRIEF_CHECKS
    .filter(({ aliases }) => !hasValue(extractedBrief, ...aliases))
    .map(({ label }) => label)
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

    // Track usage and save for authenticated users
    let generation: { id: string } | null = null
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
      generation = data
    }

    return NextResponse.json({
      extractedBrief,
      strategicAnalysis,
      gaps,
      score,
      generationId: generation?.id ?? null,
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
