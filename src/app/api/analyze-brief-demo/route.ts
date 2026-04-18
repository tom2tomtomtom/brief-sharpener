import { NextRequest, NextResponse } from 'next/server'
import { DEMO_BRIEF_TEXT } from '@/lib/demo-brief'
import { checkRateLimit } from '@/lib/rate-limit'

const BRAIN_API_BASE = process.env.AIDEN_BRAIN_API_URL ?? 'https://aiden-brain-v2-production.up.railway.app'

async function callBrainAPI<T>(path: string, body: unknown, timeoutMs = 75_000): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
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
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Brain API ${path} timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

function hasValue(obj: Record<string, unknown>, ...fields: string[]): boolean {
  for (const field of fields) {
    const value = obj[field]
    if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      return true
    }
  }
  return false
}

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
  // Per-IP rate limit — even though the demo brief text is hardcoded, we still
  // hit Brain API (two Opus calls) on every invocation. Cap spam early.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many demo requests. Please wait a moment.', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(retryAfter ?? 60) } }
    )
  }

  let body: { briefText?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { briefText } = body

  // Reject oversized payloads before the equality check. Without this
  // cap an attacker can ship a 100MB string that we allocate and compare
  // on every request, effectively DoSing this endpoint even though the
  // comparison would ultimately fail.
  if (
    typeof briefText !== 'string' ||
    briefText.length > DEMO_BRIEF_TEXT.length + 100
  ) {
    return NextResponse.json(
      { error: 'This demo endpoint only works with the provided demo brief.' },
      { status: 403 }
    )
  }

  // Abuse prevention: only the exact demo brief is accepted
  if (briefText.trim() !== DEMO_BRIEF_TEXT.trim()) {
    return NextResponse.json(
      { error: 'This demo endpoint only works with the provided demo brief.' },
      { status: 403 }
    )
  }

  try {
    const extractResult = await callBrainAPI<{ content: Record<string, unknown> }>('/api/extract-brief', {
      brief_text: briefText,
      brand_name: 'Vitafresh Drinks',
      industry: 'FMCG / Beverages',
    })
    const extractedBrief = (extractResult.content ?? extractResult) as Record<string, unknown>

    const strategicAnalysis = await callBrainAPI<Record<string, unknown>>('/aiden/generate-strategy', {
      briefData: extractedBrief,
    })

    const score = calculateBriefScore(briefText, extractedBrief)
    const gaps = identifyGaps(extractedBrief)

    return NextResponse.json({ extractedBrief, strategicAnalysis, gaps, score })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Demo is taking longer than usual. Please try again in a moment.' },
        { status: 504 }
      )
    }
    if (message.includes('Brain API')) {
      return NextResponse.json(
        { error: 'Demo temporarily unavailable. Please try again shortly.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
