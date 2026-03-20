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
  const response = await fetch(`${BRAIN_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Brain API ${path} failed (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

function calculateBriefScore(briefText: string, extractedBrief: Record<string, unknown>): number {
  const importantFields = [
    'objective',
    'target_audience',
    'brand',
    'deliverables',
    'tone',
    'budget',
    'timeline',
    'kpis',
  ]

  const presentCount = importantFields.filter((field) => {
    const value = extractedBrief[field]
    return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)
  }).length

  const fieldScore = (presentCount / importantFields.length) * 70
  const lengthScore = Math.min((briefText.length / 500) * 20, 20)
  const structureScore = briefText.includes('\n') ? 10 : 0

  return Math.round(Math.min(fieldScore + lengthScore + structureScore, 100))
}

function identifyGaps(extractedBrief: Record<string, unknown>): string[] {
  const checks: Array<{ field: string; label: string }> = [
    { field: 'objective', label: 'Clear campaign objective or goal' },
    { field: 'target_audience', label: 'Target audience definition' },
    { field: 'brand', label: 'Brand context or guidelines' },
    { field: 'deliverables', label: 'Specific deliverables' },
    { field: 'tone', label: 'Tone of voice or messaging direction' },
    { field: 'budget', label: 'Budget or scope constraints' },
    { field: 'timeline', label: 'Timeline or deadlines' },
    { field: 'kpis', label: 'Success metrics or KPIs' },
  ]

  return checks
    .filter(({ field }) => {
      const value = extractedBrief[field]
      return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
    })
    .map(({ label }) => label)
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed: rateLimitAllowed, retryAfter } = checkRateLimit(ip)
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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Usage limit check
  const adminSupabase = createAdminClient()
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

    // Track usage after successful analysis
    const plan = await getUserPlan(adminSupabase, user.id)
    await incrementUsage(adminSupabase, user.id, plan)

    return NextResponse.json({
      extractedBrief,
      strategicAnalysis,
      gaps,
      score,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Brain API') || error.message.includes('Brain API key')) {
        return NextResponse.json({ error: error.message }, { status: 502 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
