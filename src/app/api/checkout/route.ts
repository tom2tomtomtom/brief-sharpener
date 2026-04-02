import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json() as { plan: 'single' | 'pro' | 'agency' }

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const planConfig = PLANS[plan]
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? `https://${request.headers.get('host')}`

  const session = await stripe.checkout.sessions.create({
    mode: planConfig.mode,
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      plan,
    },
    ...(planConfig.mode === 'subscription' && {
      subscription_data: { metadata: { userId: user.id, plan } },
    }),
  })

  return NextResponse.json({ url: session.url })
}
