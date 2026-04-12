import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { checkGuestMonthlyLimit, checkRateLimit, incrementGuestMonthlyUsage, checkIpDailyLimit, incrementIpDailyUsage } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { getClassicPrinciplesPrompt, scoreAgainstClassics, findRelevantClassics } from '@/lib/classic-briefs'
import { enrichWithMarketInsights, formatInsightsForPrompt } from '@/lib/market-enrichment'
import { estimateCost, recordCost, checkBudget, type UserTier } from '@/lib/cost-tracker'

const AIDEN_API_BASE = process.env.AIDEN_API_URL ?? 'https://aiden-api-production.up.railway.app'
const AIDEN_API_KEY = process.env.AIDEN_API_KEY ?? ''

interface AnalyzeBriefRequest {
  briefText: string
  brandName?: string
  industry?: string
  briefType?: string
}

const GUEST_COOKIE_NAME = 'aiden_guest_id'

function normalizeIdentifier(input: string | null | undefined): string {
  if (!input) return 'none'
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'none'
}

function getGuestIdentity(request: NextRequest): { id: string; isNew: boolean } {
  const existing = request.cookies.get(GUEST_COOKIE_NAME)?.value
  if (existing) {
    return { id: normalizeIdentifier(existing), isNew: false }
  }

  return { id: crypto.randomUUID().replace(/-/g, ''), isNew: true }
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

interface DimensionScore {
  dimension: string
  score: number
  maxScore: number
  status: 'missing' | 'thin' | 'adequate' | 'strong'
  evidence: string
}

function scoreField(text: string | null): { score: number; status: DimensionScore['status']; evidence: string } {
  if (text === null) return { score: 0, status: 'missing', evidence: 'Not found in brief' }
  const words = wordCount(text)
  if (words < 3) return { score: 3, status: 'thin', evidence: `Only ${words} word${words === 1 ? '' : 's'} — needs real detail` }
  if (words < 10) return { score: 3, status: 'thin', evidence: `${words} words — present but underspecified` }
  if (words < 30) return { score: 6, status: 'adequate', evidence: `${words} words — covers basics` }
  return { score: 10, status: 'strong', evidence: `${words} words — well defined` }
}

interface ScoreBreakdown {
  total: number
  dimensions: DimensionScore[]
  structureScore: number
  completenessScore: number
}

function calculateBriefScore(briefText: string, extractedBrief: Record<string, unknown>): ScoreBreakdown {
  const dimensions: DimensionScore[] = []
  let fieldScore = 0

  for (const { aliases, label } of BRIEF_CHECKS) {
    const value = getFieldValue(extractedBrief, aliases)
    const { score, status, evidence } = scoreField(value)
    fieldScore += score
    dimensions.push({ dimension: label, score, maxScore: 10, status, evidence })
  }

  const lines = briefText.split('\n').filter(l => l.trim().length > 0)
  const structureScore = lines.length >= 4 ? 10 : lines.length >= 2 ? 5 : 0

  const presentCount = BRIEF_CHECKS.filter(({ aliases }) => getFieldValue(extractedBrief, aliases) !== null).length
  const completenessScore = Math.round((presentCount / BRIEF_CHECKS.length) * 10)

  const total = Math.round(Math.min(fieldScore + structureScore + completenessScore, 100))

  return { total, dimensions, structureScore, completenessScore }
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

function generateClarifyingQuestions(gaps: string[], extractedBrief: Record<string, unknown>): string[] {
  const questions: string[] = []
  const gapMap: Record<string, string> = {
    'objective': 'What specific business outcome should this campaign achieve, and how will you measure it?',
    'goal': 'What specific business outcome should this campaign achieve, and how will you measure it?',
    'target audience': 'Who exactly are you trying to reach — what defines them beyond demographics (behaviours, mindset, tensions)?',
    'audience': 'Who exactly are you trying to reach — what defines them beyond demographics (behaviours, mindset, tensions)?',
    'deliverable': 'What specific assets do you need (formats, dimensions, quantities)?',
    'budget': 'What is the production budget range? Even "high / medium / low" helps scope creative ambition.',
    'timeline': 'What are the key milestones — brief date, creative review, final approval, live date?',
    'kpi': 'How will you know this worked? What are the primary and secondary success metrics?',
    'metric': 'How will you know this worked? What are the primary and secondary success metrics?',
    'tone': 'Describe the tone in 3 adjectives and one contrast ("X but never Y").',
    'brand': 'What brand context should creatives know — positioning, recent campaigns, things to avoid?',
  }

  for (const gap of gaps) {
    const lower = gap.toLowerCase()
    for (const [keyword, question] of Object.entries(gapMap)) {
      if (lower.includes(keyword) && !questions.includes(question)) {
        questions.push(question)
        break
      }
    }
  }

  if (questions.length === 0 && gaps.length > 0) {
    questions.push('What is the single most important thing this campaign must achieve?')
  }

  const hasInsight = !!(extractedBrief.insight ?? extractedBrief.human_truth ?? extractedBrief.tension)
  if (!hasInsight) {
    questions.push('What human truth or cultural tension should the creative be built on?')
  }

  return questions.slice(0, 7)
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

  let guestIdentity: { id: string; isNew: boolean } | null = null

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

  if (briefText.trim().length < 50) {
    return NextResponse.json({ error: 'Brief is too short. Please provide at least a few sentences for meaningful analysis.' }, { status: 400 })
  }

  if (briefText.length > 100000) {
    return NextResponse.json({ error: 'Brief text exceeds maximum length (100,000 characters).' }, { status: 400 })
  }

  let guestIdentifier: string | null = null
  if (!user) {
    // Layer 1: Per-IP daily hard cap (can't bypass with cookies/user-agent changes)
    const ipDaily = await checkIpDailyLimit(ip)
    if (!ipDaily.allowed) {
      return NextResponse.json(
        {
          error: 'Daily free analysis limit reached for this network. Sign up for more analyses.',
          code: 'GUEST_DAILY_IP_LIMIT',
          upgradeUrl: '/login?redirect=/generate',
        },
        { status: 429 }
      )
    }

    // Layer 2: Per-identity monthly cap (cookie-based, tighter)
    guestIdentity = getGuestIdentity(request)
    const userAgent = normalizeIdentifier(request.headers.get('user-agent'))
    guestIdentifier = `${ip}:${guestIdentity.id}:${userAgent}`
    const guestQuota = await checkGuestMonthlyLimit(guestIdentifier)

    if (!guestQuota.allowed) {
      const response = NextResponse.json(
        {
          error: 'You\'ve used your free analysis. Sign up to unlock more.',
          code: 'GUEST_MONTHLY_LIMIT',
          limit: guestQuota.limit,
          upgradeUrl: '/login?redirect=/generate',
        },
        { status: 429 }
      )
      response.cookies.set(GUEST_COOKIE_NAME, guestIdentity.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
      return response
    }
  }

  // Budget check — block if daily/monthly spend exceeded (free tier gets tighter cap)
  const userTier: UserTier = user
    ? (await getUserPlan(adminSupabase, user.id) as UserTier)
    : (guestIdentifier ? 'guest' : 'free')

  const budget = await checkBudget(adminSupabase, userTier)
  if (!budget.allowed) {
    return NextResponse.json(
      { error: budget.reason, code: 'BUDGET_EXCEEDED' },
      { status: 503 }
    )
  }

  const startTime = Date.now()

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
    const scoreBreakdown = calculateBriefScore(briefText, extractedBrief)
    const score = scoreBreakdown.total
    const gaps = identifyGaps(extractedBrief)
    const clarifyingQuestions = generateClarifyingQuestions(gaps, extractedBrief)

    // Step 2b: Classic benchmark scoring + market enrichment (local - no AI needed)
    const classicScores = scoreAgainstClassics(extractedBrief, gaps, briefText)
    const classicBenchmarks = findRelevantClassics(industry, extractedBrief, briefText)
    const marketInsights = enrichWithMarketInsights(industry, extractedBrief, briefText)

    const classicPrinciplesBlock = getClassicPrinciplesPrompt()
    const marketInsightsBlock = formatInsightsForPrompt(marketInsights)

    const benchmarkContext = classicBenchmarks.length > 0
      ? `\nCLASSIC BRIEF BENCHMARKS (reference these when making your analysis richer):
${classicBenchmarks.map(b => `• ${b.brand} "${b.campaign}" (${b.agency}, ${b.year}) — Proposition: "${b.singleMindedProposition}" — Human truth: "${b.humanTruth}" — Why it worked: ${b.whyItWorked}`).join('\n')}`
      : ''

    // Step 3: Brain analysis + rewrite in ONE call (Opus + phantom system)
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

${classicPrinciplesBlock}
${benchmarkContext}
${marketInsightsBlock}

Please provide two things:

## STRATEGIC ANALYSIS & RECOMMENDATIONS

Give me your honest creative director take on this brief — informed by the classic advertising standards above. Judge it against the masters: Does it have a Bernbach-grade human truth? An Ogilvy-sharp proposition? A Hegarty-worthy tension? Where would Trott say it fails to get noticed? Be specific about which standards it meets and which it doesn't.

Also cite any relevant market intelligence where it strengthens your point. If benchmark data suggests the brief is overlooking a channel or audience reality, say so.

Be conclusive and actionable. This is your definitive take.

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
          output_copy: { extractedBrief, strategicAnalysis, gaps, score, scoreBreakdown, rewrittenBrief, clarifyingQuestions, classicScores, classicBenchmarks, marketInsights },
        })
        .select('id')
        .single()
      generationId = data?.id ?? null
    } else if (guestIdentifier) {
      await incrementGuestMonthlyUsage(guestIdentifier)
      await incrementIpDailyUsage(ip)
    }

    const durationMs = Date.now() - startTime
    const costEstimate = estimateCost(
      briefText,
      brainMessage,
      JSON.stringify(extractResult),
      brainResponse
    )

    await recordCost(adminSupabase, {
      user_tier: userTier,
      user_id: user?.id ?? null,
      extract_input_tokens: costEstimate.extractTokens.input,
      extract_output_tokens: costEstimate.extractTokens.output,
      chat_input_tokens: costEstimate.chatTokens.input,
      chat_output_tokens: costEstimate.chatTokens.output,
      extract_cost_usd: costEstimate.extractCost,
      chat_cost_usd: costEstimate.chatCost,
      total_cost_usd: costEstimate.totalCost,
      brief_length: briefText.length,
      response_length: brainResponse.length,
      duration_ms: durationMs,
    })

    logger.info('analysis.complete', {
      userId: user?.id ?? 'guest',
      score,
      gapCount: gaps.length,
      questionCount: clarifyingQuestions.length,
      durationMs,
      generationId,
      costUsd: costEstimate.totalCost.toFixed(4),
      userTier,
    })

    const response = NextResponse.json({
      extractedBrief,
      strategicAnalysis,
      gaps,
      score,
      scoreBreakdown,
      rewrittenBrief,
      clarifyingQuestions,
      classicScores,
      classicBenchmarks,
      marketInsights,
      generationId,
    })
    if (guestIdentity) {
      response.cookies.set(GUEST_COOKIE_NAME, guestIdentity.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    return response
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
    logger.error('analysis.failed', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
      userId: user?.id ?? 'guest',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
