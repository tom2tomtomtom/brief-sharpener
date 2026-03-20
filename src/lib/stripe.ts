import Stripe from 'stripe'

// Lazy initialization: Stripe requires a non-empty key at construction.
// At build time env vars may not be set, so we defer construction to first use.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  }
  return _stripe
}

// Backward compat: existing code imports `stripe` directly
// This will throw at runtime if STRIPE_SECRET_KEY is missing (desired behavior)
export const stripe = {
  get checkout() { return getStripe().checkout },
  get subscriptions() { return getStripe().subscriptions },
  get webhooks() { return getStripe().webhooks },
  get customers() { return getStripe().customers },
} as unknown as Stripe

export const PLANS = {
  single: {
    name: 'Single',
    price: 1900, // $19.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_SINGLE!,
    mode: 'payment' as const,
  },
  pro: {
    name: 'Pro',
    price: 3900, // $39.00/month in cents
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    mode: 'subscription' as const,
  },
}
