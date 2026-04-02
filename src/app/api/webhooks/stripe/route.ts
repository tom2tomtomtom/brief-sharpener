import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan as 'single' | 'pro' | 'agency' | undefined

  if (!userId || !plan) {
    console.error('Missing userId or plan in checkout session metadata', session.id)
    return
  }

  const customerId = session.customer as string

  if (session.mode === 'payment') {
    // One-time payment (Single plan)
    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan: 'single',
          stripe_customer_id: customerId,
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } else if (session.mode === 'subscription') {
    // Subscription (Pro or Agency plan) — full details come via customer.subscription.updated
    const subscriptionId = session.subscription as string
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription

    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: subscription.items.data[0]?.price.id ?? null,
          status: subscription.status,
          current_period_end: (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  }
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      current_period_end: (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}
