import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canGenerate, incrementUsage, getUserPlan } from '@/lib/usage'
import { getTemplate, TemplateId } from '@/lib/templates'

const client = new Anthropic()

interface GenerateRequest {
  productName: string
  productDescription: string
  targetAudience?: string
  features?: string[]
  tone?: 'professional' | 'casual' | 'bold' | 'minimal'
  template?: string
}

interface Feature {
  title: string
  description: string
}

interface FAQ {
  question: string
  answer: string
}

interface GenerateResponse {
  headline: string
  subheadline: string
  features: Feature[]
  faq: FAQ[]
  cta: string
  socialProof: string
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  let body: GenerateRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { productName, productDescription, targetAudience, features, tone = 'professional', template } = body

  if (!productName?.trim()) {
    return NextResponse.json({ error: 'productName is required' }, { status: 400 })
  }
  if (!productDescription?.trim()) {
    return NextResponse.json({ error: 'productDescription is required' }, { status: 400 })
  }

  const filledFeatures = (features ?? []).filter((f) => f?.trim())
  const tpl = getTemplate(template as TemplateId | undefined)

  const prompt = `${tpl.promptInstructions}

Product name: ${productName}
Description: ${productDescription}
${targetAudience ? `Target audience: ${targetAudience}` : ''}
${filledFeatures.length > 0 ? `Key features: ${filledFeatures.join(', ')}` : ''}
Tone: ${tone}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "headline": "compelling headline under 10 words",
  "subheadline": "supporting subheadline under 20 words",
  "features": [
    { "title": "feature name", "description": "one-sentence benefit description" }
  ],
  "faq": [
    { "question": "common question", "answer": "concise answer" }
  ],
  "cta": "call-to-action button text",
  "socialProof": "placeholder social proof text (e.g. '2,000+ teams already using ${productName}')"
}

Generate 3-5 features and 3-4 FAQ items. Match the ${tone} tone throughout.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
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

    // Track usage after successful generation
    const plan = await getUserPlan(adminSupabase, user.id)
    await incrementUsage(adminSupabase, user.id, plan)

    return NextResponse.json(parsed)
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 408 || error.message.toLowerCase().includes('timeout')) {
        return NextResponse.json({ error: 'AI request timed out. Please try again.' }, { status: 504 })
      }
      return NextResponse.json({ error: `AI API error: ${error.message}` }, { status: 502 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
