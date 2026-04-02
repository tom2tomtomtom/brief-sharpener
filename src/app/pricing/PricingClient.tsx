'use client'

import { useState } from 'react'
import Link from 'next/link'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: null,
    description: 'See what your brief is missing.',
    features: [
      '1 brief analysis per month',
      'Full gap analysis',
      'AIDEN branding on output',
    ],
    cta: 'Interrogate your brief',
    ctaType: 'link' as const,
    href: '/generate',
    plan: null,
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: 'one-time',
    description: '10 analyses. Use them whenever you need them.',
    features: [
      '10 brief analyses',
      'Full strategic output',
      'No AIDEN branding',
      'Never expires',
    ],
    cta: 'Buy 10 analyses',
    ctaType: 'checkout' as const,
    href: null,
    plan: 'single' as const,
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'per month',
    description: 'For agencies and teams who live inside briefs.',
    features: [
      'Unlimited brief analyses',
      'Priority processing',
      'No AIDEN branding',
    ],
    cta: 'Go Pro',
    ctaType: 'checkout' as const,
    href: null,
    plan: 'pro' as const,
    highlighted: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(plan: 'single' | 'pro') {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error(data.error || 'Failed to start checkout')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-black-ink py-16 px-4">
      {/* Header */}
      <div className="text-center mb-14">
        <Link href="/" className="text-sm text-orange-accent hover:text-red-hot font-medium mb-6 inline-block uppercase tracking-wide transition-colors">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold text-red-hot mb-4 uppercase tracking-tight">Brief Intelligence Pricing</h1>
        <p className="text-lg text-white-muted max-w-xl mx-auto">
          Start free. Interrogate your brief with the rigour it deserves.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-md mx-auto mb-8 bg-black-card border-2 border-red-hot text-red-hot px-4 py-3 text-sm text-center uppercase tracking-wide">
          {error}
        </div>
      )}

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative p-8 flex flex-col ${
              tier.highlighted
                ? 'bg-black-card border-2 border-red-hot'
                : 'bg-black-card border-2 border-border-subtle'
            }`}
          >
            {/* Most Popular badge */}
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-red-hot text-white text-xs font-bold px-3 py-1 uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            {/* Tier name */}
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3 text-orange-accent">
                {tier.name}
              </h2>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm mb-1 text-white-muted">
                    / {tier.period}
                  </span>
                )}
              </div>
              <p className="text-sm text-white-muted">
                {tier.description}
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white-muted">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {tier.ctaType === 'link' ? (
              <Link
                href={tier.href!}
                className="block text-center py-3 px-6 font-bold text-sm uppercase tracking-wide transition-all bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim"
              >
                {tier.cta}
              </Link>
            ) : (
              <button
                onClick={() => handleCheckout(tier.plan!)}
                disabled={loading !== null}
                className="block w-full text-center py-3 px-6 font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim"
              >
                {loading === tier.plan ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                  </span>
                ) : (
                  tier.cta
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="max-w-5xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-red-hot text-center mb-8 uppercase">Compare Plans</h2>
        <div className="bg-black-card border-2 border-border-subtle overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-4 px-6 font-bold text-white-muted uppercase tracking-wide w-1/2">Feature</th>
                <th className="text-center py-4 px-6 font-bold text-white-muted uppercase tracking-wide">Free</th>
                <th className="text-center py-4 px-6 font-bold text-orange-accent uppercase tracking-wide bg-black-deep">Starter</th>
                <th className="text-center py-4 px-6 font-bold text-white-muted uppercase tracking-wide">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Analyses', free: '1 / month', single: '10 (one-time)', pro: 'Unlimited' },
{ feature: 'Share results', free: false, single: true, pro: true },
                { feature: 'Priority processing', free: false, single: false, pro: true },
                { feature: 'Custom branding', free: false, single: true, pro: true },
                { feature: 'Support', free: 'Community', single: 'Email', pro: 'Priority' },
              ].map((row, i) => (
                <tr key={row.feature} className={`border-b border-border-subtle ${i % 2 === 0 ? 'bg-black-card' : 'bg-black-deep'}`}>
                  <td className="py-4 px-6 font-medium text-white-muted">{row.feature}</td>
                  {(['free', 'single', 'pro'] as const).map((tier) => (
                    <td
                      key={tier}
                      className={`py-4 px-6 text-center ${tier === 'single' ? 'bg-black-deep' : ''}`}
                    >
                      {typeof row[tier] === 'boolean' ? (
                        row[tier] ? (
                          <svg className="w-5 h-5 text-orange-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white-faint mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-white-muted">{row[tier]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-white-dim mt-12 uppercase tracking-wide">
        Payments processed securely by Stripe. Cancel anytime.
      </p>
    </main>
  )
}
