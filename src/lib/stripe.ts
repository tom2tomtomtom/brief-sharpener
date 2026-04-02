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
    name: 'Starter',
    price: 4900, // $49.00 in cents — 10 analyses pack
    priceId: process.env.STRIPE_PRICE_ID_SINGLE!,
    mode: 'payment' as const,
    analysisLimit: 10,
  },
  pro: {
    name: 'Pro',
    price: 9900, // $99.00/month in cents
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    mode: 'subscription' as const,
  },
  agency: {
    name: 'Agency',
    price: 49900, // $499.00/month in cents
    priceId: process.env.STRIPE_PRICE_ID_AGENCY!,
    mode: 'subscription' as const,
  },
}
