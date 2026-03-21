'use client'

import { useState } from 'react'
import Link from 'next/link'

const tiers = [
  {
    name: 'Free',
    price: '£0',
    period: null,
    description: 'Try Brief Intelligence and see what your brief is missing.',
    features: [
      '3 brief analyses per month',
      'Basic gap analysis',
      'AIDEN branding on output',
    ],
    cta: 'Interrogate your brief',
    ctaType: 'link' as const,
    href: '/generate',
    plan: null,
    highlighted: false,
  },
  {
    name: 'Single',
    price: '£49',
    period: 'one-time',
    description: 'One deep analysis, no compromises.',
    features: [
      '1 deep brief analysis',
      'Full strategic output',
      'PDF export',
      'No AIDEN branding',
    ],
    cta: 'Interrogate your brief',
    ctaType: 'checkout' as const,
    href: null,
    plan: 'single' as const,
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '£99',
    period: 'per month',
    description: 'For agencies and teams who live inside briefs.',
    features: [
      'Unlimited brief analyses',
      'Priority processing',
      'Team sharing',
      'API access',
      'No AIDEN branding',
    ],
    cta: 'Interrogate your brief',
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
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      {/* Header */}
      <div className="text-center mb-14">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Brief Intelligence pricing</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Start free. Interrogate your brief with the rigour it deserves.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
          {error}
        </div>
      )}

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl p-8 flex flex-col ${
              tier.highlighted
                ? 'bg-indigo-600 text-white shadow-2xl scale-105'
                : 'bg-white text-gray-900 shadow-md'
            }`}
          >
            {/* Most Popular badge */}
            {tier.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            {/* Tier name */}
            <div className="mb-6">
              <h2
                className={`text-sm font-semibold uppercase tracking-widest mb-3 ${
                  tier.highlighted ? 'text-indigo-200' : 'text-indigo-600'
                }`}
              >
                {tier.name}
              </h2>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span
                    className={`text-sm mb-1 ${
                      tier.highlighted ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    / {tier.period}
                  </span>
                )}
              </div>
              <p
                className={`text-sm ${
                  tier.highlighted ? 'text-indigo-100' : 'text-gray-500'
                }`}
              >
                {tier.description}
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <svg
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      tier.highlighted ? 'text-indigo-200' : 'text-indigo-500'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={tier.highlighted ? 'text-indigo-50' : 'text-gray-600'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {tier.ctaType === 'link' ? (
              <Link
                href={tier.href!}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                  tier.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {tier.cta}
              </Link>
            ) : (
              <button
                onClick={() => handleCheckout(tier.plan!)}
                disabled={loading !== null}
                className={`block w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  tier.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
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
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Compare plans</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 w-1/2">Feature</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Free</th>
                <th className="text-center py-4 px-6 font-semibold text-indigo-600 bg-indigo-50">Single</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Analyses per month', free: '3', single: '1', pro: 'Unlimited' },
                { feature: 'PDF export', free: false, single: true, pro: true },
                { feature: 'Share results', free: false, single: true, pro: true },
                { feature: 'Priority processing', free: false, single: false, pro: true },
                { feature: 'Custom branding', free: false, single: true, pro: true },
                { feature: 'Support', free: 'Community', single: 'Email', pro: 'Priority' },
              ].map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-4 px-6 font-medium text-gray-700">{row.feature}</td>
                  {(['free', 'single', 'pro'] as const).map((tier) => (
                    <td
                      key={tier}
                      className={`py-4 px-6 text-center ${tier === 'single' ? 'bg-indigo-50/60' : ''}`}
                    >
                      {typeof row[tier] === 'boolean' ? (
                        row[tier] ? (
                          <svg className="w-5 h-5 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-600">{row[tier]}</span>
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
      <p className="text-center text-sm text-gray-400 mt-12">
        Payments processed securely by Stripe. Cancel anytime.
      </p>
    </main>
  )
}
