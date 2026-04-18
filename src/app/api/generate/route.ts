import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth'
import { checkTokens, deductTokens } from '@/lib/gateway-tokens'
import { getTemplate, TemplateId } from '@/lib/templates'
import { checkRateLimit } from '@/lib/rate-limit'

const client = new Anthropic()

// Every field below ends up in the Claude prompt. Without caps, an
// authenticated user could deduct a single fixed token cost for /generate
// but still inflate their Claude usage by shipping megabytes of text in
// productDescription/targetAudience — we'd eat the delta. Hard caps on
// each string, a small array cap on features, and strict enums for
// tone/template keep the prompt size predictable.
const generateSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  productDescription: z.string().trim().min(1).max(5000),
  targetAudience: z.string().trim().max(1000).optional(),
  features: z.array(z.string().max(500)).max(20).optional(),
  tone: z.enum(['professional', 'casual', 'bold', 'minimal']).optional(),
  template: z.string().max(100).optional(),
})

interface Feature {
  title: string
  description: string
}

interface FAQ {
  question: string
  answer: string
}

interface HowItWorksStep {
  step: number
  title: string
  description: string
}

interface HeadlineVariant {
  headline: string
  subheadline: string
}

interface GenerateResponse {
  headline: string
  subheadline: string
  headline_variants: HeadlineVariant[]
  recommended_index: number
  features: Feature[]
  howItWorks: HowItWorksStep[]
  faq: FAQ[]
  cta: string
  socialProof: string
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

  // Auth check (Gateway JWT, then Supabase fallback)
  const user = await getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Token balance check
  const adminSupabase = createAdminClient()
  const { allowed, required, balance } = await checkTokens(user.id, 'generate')

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Not enough tokens to generate',
        code: 'INSUFFICIENT_TOKENS',
        required,
        balance,
        upgradeUrl: 'https://www.aiden.services/pricing',
      },
      { status: 402 }
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = generateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const body = parsed.data
  const {
    productName,
    productDescription,
    targetAudience,
    features,
    tone = 'professional',
    template,
  } = body

  const filledFeatures = (features ?? []).filter((f) => f?.trim())
  const tpl = getTemplate(template as TemplateId | undefined)

  const prompt = `You are an expert direct-response copywriter who specialises in high-converting SaaS and product landing pages. Your copy is specific, benefit-driven, and emotionally resonant. You never write generic filler.

${tpl.promptInstructions}

PRODUCT BRIEF
- Product name: ${productName}
- Description: ${productDescription}
${targetAudience ? `- Target audience: ${targetAudience}` : ''}
${filledFeatures.length > 0 ? `- Key features to highlight: ${filledFeatures.join(', ')}` : ''}
- Tone: ${tone}

COPYWRITING RULES
1. HEADLINE VARIANTS — Generate exactly 3 distinct headline variants. Each variant has a headline (under 10 words using the PAS framework) and a subheadline (1–2 sentences, under 25 words). Make each variant meaningfully different: vary the angle, emotion, or framing. Also provide a recommended_index (0, 1, or 2) for the strongest variant.
2. FEATURES — Write exactly 4 features. Each feature title should name the outcome, not the tool (e.g. "Ship faster" not "Auto-deploy"). Each description explains the specific mechanism that delivers that benefit in one sentence. No generic superlatives.
3. HOW IT WORKS — Explain the product in exactly 3 sequential steps. Each step has a short action title (3–5 words) and a one-sentence description of what happens and why it matters. Steps must feel logical and effortless.
4. FAQ — Write 3–4 FAQ items that address the most common objections or points of confusion a buyer would have before purchasing. Answers should be reassuring and specific.
5. CTA — A punchy call-to-action button label (2–5 words). Action verb first.
6. SOCIAL PROOF — Write a specific, credible social proof statement. Include a plausible but realistic number of users, companies, or a measurable result (e.g. "Trusted by 1,200+ SaaS teams to cut onboarding time by 40%"). Make it feel earned, not invented.

Return ONLY a raw JSON object with no markdown, no code fences, no commentary — just the JSON:
{
  "headline_variants": [
    { "headline": "under 10 words using PAS framework", "subheadline": "1-2 sentences agitating the problem or amplifying the promise" },
    { "headline": "different angle — outcome-focused or curiosity-driven", "subheadline": "1-2 sentences with a different emotional hook" },
    { "headline": "bold claim or transformation-focused headline", "subheadline": "1-2 sentences amplifying the transformation or result" }
  ],
  "recommended_index": 0,
  "features": [
    { "title": "outcome-focused feature title", "description": "one sentence explaining the mechanism and benefit" },
    { "title": "outcome-focused feature title", "description": "one sentence explaining the mechanism and benefit" },
    { "title": "outcome-focused feature title", "description": "one sentence explaining the mechanism and benefit" },
    { "title": "outcome-focused feature title", "description": "one sentence explaining the mechanism and benefit" }
  ],
  "howItWorks": [
    { "step": 1, "title": "short action title", "description": "one sentence describing what happens and why it matters" },
    { "step": 2, "title": "short action title", "description": "one sentence describing what happens and why it matters" },
    { "step": 3, "title": "short action title", "description": "one sentence describing what happens and why it matters" }
  ],
  "faq": [
    { "question": "objection or confusion a buyer would have", "answer": "specific, reassuring answer" }
  ],
  "cta": "action verb first, 2-5 words",
  "socialProof": "specific social proof with a real-feeling number and measurable result"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2800,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    let parsed: GenerateResponse
    try {
      parsed = JSON.parse(textBlock.text) as GenerateResponse
    } catch {
      // Try to extract JSON from the response if it contains extra text
      const match = textBlock.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 })
      }
      parsed = JSON.parse(match[0]) as GenerateResponse
    }

    // Derive top-level headline/subheadline from the recommended variant
    if (parsed.headline_variants?.length > 0) {
      const idx = parsed.recommended_index ?? 0
      const recommended = parsed.headline_variants[Math.min(idx, parsed.headline_variants.length - 1)]
      parsed.headline = recommended.headline
      parsed.subheadline = recommended.subheadline
    }

    // Deduct tokens after successful generation
    await deductTokens(user.id, 'generate')

    // Save generation to database
    const { data: savedGeneration } = await adminSupabase
      .from('generations')
      .insert({
        user_id: user.id,
        input_data: body,
        output_copy: parsed,
        template_id: template ?? null,
      })
      .select('id')
      .single()

    return NextResponse.json({ ...parsed, generationId: savedGeneration?.id ?? null })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 408 || error.message.toLowerCase().includes('timeout')) {
        return NextResponse.json({ error: 'AI request timed out. Please try again.' }, { status: 504 })
      }
      // Anthropic error messages can include the offending request URL,
      // model name, rate-limit hints, and fragments of system prompts.
      // Log them, but don't let them out of the process.
      console.error('[generate] Anthropic API error:', error.status, error.message)
      return NextResponse.json({ error: 'AI provider error. Please try again.' }, { status: 502 })
    }
    console.error('[generate] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
