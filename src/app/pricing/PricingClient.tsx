'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// AIDEN moved to unified token billing across all hub apps in April 2026.
// Brief Intelligence (formerly Brief Sharpener) is metered against the
// shared token balance held by Gateway. There are no per-product
// subscriptions any more. The "Get tokens" button below routes users to
// the Gateway pricing page where token packs and subscriptions are sold.
// Source of truth for costs: aiden-gateway/lib/tokens.ts.

const TOKEN_COSTS = {
  analyze: 20,
  generate: 5,
} as const

const FREE_TOKEN_GRANT = 200

// How many of each operation a 200-token welcome bonus covers.
const FREE_ANALYSES = Math.floor(FREE_TOKEN_GRANT / TOKEN_COSTS.analyze)
const FREE_GENERATIONS = Math.floor(FREE_TOKEN_GRANT / TOKEN_COSTS.generate)

const GATEWAY_PRICING_URL = 'https://www.aiden.services/pricing'

export default function PricingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
    })
  }, [])

  return (
    <main id="main-content" className="min-h-screen bg-black-ink py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Link
          href="/"
          className="text-sm text-orange-accent hover:text-red-hot font-medium mb-6 inline-block uppercase tracking-wide transition-colors"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold text-red-hot mb-4 uppercase tracking-tight">
          Brief Intelligence runs on tokens
        </h1>
        <p className="text-lg text-white-muted max-w-2xl mx-auto">
          Pay for what you use. One shared token balance across every AIDEN tool.
          No per-product subscriptions, no monthly minimums.
        </p>
      </div>

      {/* Per-operation costs */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black-card border-2 border-border-subtle p-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-5xl font-bold text-orange-accent font-mono">
                {TOKEN_COSTS.analyze}
              </span>
              <span className="text-sm text-white-muted uppercase tracking-widest">tokens</span>
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
              Full Brief Analysis
            </h2>
            <p className="text-sm text-white-muted">
              Score across seven dimensions. Gaps surfaced. Weak sections rewritten. Strategic
              output ready to ship.
            </p>
          </div>

          <div className="bg-black-card border-2 border-border-subtle p-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-5xl font-bold text-orange-accent font-mono">
                {TOKEN_COSTS.generate}
              </span>
              <span className="text-sm text-white-muted uppercase tracking-widest">tokens</span>
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
              Generate (per call)
            </h2>
            <p className="text-sm text-white-muted">
              Targeted rewrite or sharpen of a specific brief section. Lighter weight, lower cost.
            </p>
          </div>
        </div>
      </div>

      {/* Free trial card */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="bg-black-card border-2 border-orange-accent p-8 text-center">
          <span className="text-[10px] font-bold text-orange-accent uppercase tracking-widest border border-orange-accent px-2 py-0.5 inline-block mb-4">
            New users
          </span>
          <h2 className="text-2xl font-bold text-white uppercase mb-3">
            {FREE_TOKEN_GRANT} tokens free
          </h2>
          <p className="text-sm text-white-muted mb-2">
            Every new AIDEN account gets {FREE_TOKEN_GRANT} tokens on sign-up. One-time grant,
            never expires.
          </p>
          <p className="text-xs text-white-dim font-mono">
            ≈ {FREE_ANALYSES} full analyses or {FREE_GENERATIONS} generations
          </p>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="mt-6 inline-block py-3 px-8 font-bold text-sm uppercase tracking-wide transition-all bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim"
            >
              Start free
            </Link>
          )}
        </div>
      </div>

      {/* Get tokens CTA */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="bg-black-deep border-2 border-red-hot p-10 text-center">
          <h2 className="text-2xl font-bold text-white uppercase mb-3">Need more tokens?</h2>
          <p className="text-sm text-white-muted mb-6">
            Subscriptions or one-off token packs. Buy through the AIDEN Hub, use across every tool.
          </p>
          <a
            href={GATEWAY_PRICING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-4 px-10 font-bold text-base uppercase tracking-wide bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim transition-colors"
          >
            Get tokens
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
          <p className="mt-4 text-xs text-white-dim uppercase tracking-wide">
            Opens AIDEN Hub pricing
          </p>
        </div>
      </div>

      {/* How tokens work */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-black-card border-2 border-border-subtle p-8">
          <h3 className="text-lg font-bold text-white uppercase mb-6 tracking-wide">
            How tokens work
          </h3>
          <div className="space-y-4 text-sm text-white-muted">
            <div className="flex items-start gap-4">
              <span className="text-orange-accent font-bold font-mono w-8 flex-shrink-0">01</span>
              <p>
                Every AIDEN tool charges tokens against your shared balance. Brief Intelligence,
                Brand Audit, Pitch, Listen, Synthetic Research, all of it.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-orange-accent font-bold font-mono w-8 flex-shrink-0">02</span>
              <p>
                Operations only deduct on success. If a Claude call fails or returns an error,
                no tokens are spent.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-orange-accent font-bold font-mono w-8 flex-shrink-0">03</span>
              <p>
                Subscription plans grant tokens monthly. One-off packs let you top up without
                a subscription. Both buyable through AIDEN Hub.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-orange-accent font-bold font-mono w-8 flex-shrink-0">04</span>
              <p>
                Token costs cover real spend: Claude API, web research, document parsing, vector
                search. We pass through, not mark up.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authenticated billing link */}
      {isAuthenticated && (
        <div className="max-w-md mx-auto mt-12 text-center space-y-3">
          <a
            href={GATEWAY_PRICING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border-subtle bg-black-card px-5 py-2.5 text-sm font-medium text-white-muted hover:text-white hover:border-white transition-colors"
          >
            Manage billing on AIDEN Hub
          </a>
          <p className="text-xs text-white-dim">
            <Link
              href="/dashboard"
              className="text-orange-accent hover:text-red-hot transition-colors"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      )}

      <p className="text-center text-sm text-white-dim mt-8 uppercase tracking-wide">
        Payments processed securely by Stripe through AIDEN Hub. Cancel anytime.
      </p>
    </main>
  )
}
