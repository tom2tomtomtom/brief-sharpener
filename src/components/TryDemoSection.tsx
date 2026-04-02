'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DEMO_BRIEF_TEXT } from '@/lib/demo-brief'

interface DemoResult {
  score: number
  gaps: string[]
  extractedBrief: Record<string, unknown>
  strategicAnalysis: Record<string, unknown>
}

function getScoreStyle(score: number) {
  if (score >= 71) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Strong brief' }
  if (score >= 40) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Needs work' }
  return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Incomplete brief' }
}

function extractDisplayValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .slice(0, 2)
      .map((v) => (typeof v === 'object' && v !== null ? Object.values(v as Record<string, unknown>)[0] : v))
      .join(' · ')
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>)
      .slice(0, 1)
      .map(extractDisplayValue)
      .join('')
  }
  return ''
}

export default function TryDemoSection() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemoResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleTryDemo() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze-brief-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefText: DEMO_BRIEF_TEXT }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Demo failed. Please try again.')
      }
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const blurredEntries = result
    ? Object.entries(result.strategicAnalysis)
        .filter(([, v]) => {
          const display = extractDisplayValue(v)
          return display.length > 20
        })
        .slice(0, 6)
    : []

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-4">
            Live demo
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Try it now — no signup required
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            See AIDEN interrogate a real brief in seconds. We&apos;ve pre-loaded a typical campaign brief — the kind that gets sent every day.
          </p>
        </div>

        {/* Brief textarea */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-300" />
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
              <span className="h-3 w-3 rounded-full bg-green-300" />
              <span className="ml-2 text-xs text-gray-400">campaign-brief-vitafresh.doc</span>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Pre-loaded brief
            </span>
          </div>
          <textarea
            readOnly
            value={DEMO_BRIEF_TEXT}
            className="w-full resize-none bg-white px-6 py-5 text-sm text-gray-700 leading-relaxed font-mono focus:outline-none"
            rows={12}
            aria-label="Demo brief text"
          />
        </div>

        {/* Try demo button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleTryDemo}
            disabled={loading || !!result}
            className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Interrogating brief…
              </>
            ) : result ? (
              'Analysis complete'
            ) : (
              "Try demo — see AIDEN's analysis"
            )}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-5 animate-pulse">
            {/* Score skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-3 w-32 rounded bg-gray-200 mb-4" />
              <div className="flex items-center gap-4">
                <div className="h-16 w-36 rounded-xl bg-gray-200" />
              </div>
              <div className="mt-3 h-3 w-3/4 rounded bg-gray-200" />
            </div>

            {/* Gaps skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-3 w-40 rounded bg-gray-200 mb-4" />
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-gray-200" />
                    <div className="h-3 flex-1 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic analysis skeleton */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-3 w-36 rounded bg-gray-200 mb-4" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="h-2.5 w-24 rounded bg-indigo-200 mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full rounded bg-indigo-200" />
                      <div className="h-2.5 w-4/5 rounded bg-indigo-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5">
            {/* Score — visible */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Brief quality score</p>
              <div className="flex items-center gap-4">
                {(() => {
                  const s = getScoreStyle(result.score)
                  return (
                    <div className={`inline-flex items-center gap-3 rounded-xl border px-5 py-3 ${s.bg} ${s.border}`}>
                      <span className={`text-4xl font-bold ${s.color}`}>{result.score}</span>
                      <div>
                        <div className="text-xs font-medium text-gray-400">/100</div>
                        <div className={`text-sm font-semibold ${s.color}`}>{s.label}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Scored across 8 dimensions: objectives, audience clarity, deliverables, KPIs, tone, budget, timeline, and brand context.
              </p>
            </div>

            {/* Gaps — visible */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Gaps identified —{' '}
                <span className="text-red-600">
                  {result.gaps.length} issue{result.gaps.length !== 1 ? 's' : ''} found
                </span>
              </p>
              {result.gaps.length === 0 ? (
                <p className="text-sm font-medium text-green-700">No gaps found — your brief covers all key areas.</p>
              ) : (
                <ul className="space-y-2.5">
                  {result.gaps.map((gap) => (
                    <li key={gap} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Strategic analysis — blurred with CTA overlay */}
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Blurred real content */}
              <div className="blur-sm select-none pointer-events-none p-6 space-y-4" aria-hidden="true">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Strategic analysis</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {blurredEntries.length > 0
                    ? blurredEntries.map(([key, value]) => {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                        const display = extractDisplayValue(value)
                        return (
                          <div key={key} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">{label}</p>
                            <p className="text-sm text-indigo-900 leading-relaxed line-clamp-3">{display}</p>
                          </div>
                        )
                      })
                    : [0, 1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">
                            Strategic insight {i + 1}
                          </p>
                          <p className="text-sm text-indigo-900 leading-relaxed">
                            AIDEN has identified a critical strategic tension in this brief that your creative team needs to exploit to produce standout work.
                          </p>
                        </div>
                      ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-2">Sharpened brief</p>
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  {['Objective', 'Target Audience', 'Key Message', 'Deliverables', 'Success Metrics'].map((label) => (
                    <div key={label} className="flex gap-2">
                      <span className="min-w-[130px] text-xs font-semibold uppercase tracking-wide text-gray-400 pt-0.5">
                        {label}
                      </span>
                      <span className="text-sm text-gray-800 leading-relaxed">
                        AIDEN-sharpened version of this field with specific, measurable, actionable detail.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient overlay + CTA */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 bg-gradient-to-t from-white via-white/95 to-white/10">
                <div className="text-center px-6">
                  <p className="text-base font-semibold text-gray-900 mb-1">Your full analysis is ready</p>
                  <p className="text-sm text-gray-500 mb-5">
                    Tensions, opportunities, and a fully sharpened brief — sign up free to unlock it.
                  </p>
                  <Link
                    href="/generate"
                    className="inline-block rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                    Sign up free to see your full analysis
                  </Link>
                  <p className="mt-2.5 text-xs text-gray-400">Free · No credit card required · 1 analysis per month</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
