'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { BriefAnalysisData } from '@/components/BriefAnalysis'

interface AnalysisPreviewContentProps {
  data: BriefAnalysisData
  previewUrl: string
}

function getScoreColor(score: number): { text: string; stroke: string; bg: string; label: string; border: string } {
  if (score >= 71) return { text: 'text-green-600', stroke: '#16a34a', bg: 'bg-green-50', label: 'Strong brief', border: 'border-green-200' }
  if (score >= 40) return { text: 'text-amber-600', stroke: '#d97706', bg: 'bg-amber-50', label: 'Needs work', border: 'border-amber-200' }
  return { text: 'text-red-600', stroke: '#dc2626', bg: 'bg-red-50', label: 'Incomplete brief', border: 'border-red-200' }
}

type GapSeverity = 'critical' | 'warning' | 'info'

function getGapSeverity(gap: string): GapSeverity {
  const lower = gap.toLowerCase()
  if (lower.includes('objective') || lower.includes('target audience') || lower.includes('deliverable')) return 'critical'
  if (lower.includes('budget') || lower.includes('timeline') || lower.includes('kpi') || lower.includes('metric')) return 'warning'
  return 'info'
}

const SEVERITY_LABEL: Record<GapSeverity, string> = {
  critical: 'Critical',
  warning: 'Missing',
  info: 'Consider adding',
}

const SEVERITY_COLOR: Record<GapSeverity, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
}

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback for environments without clipboard API
    }
  }, [url])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl bg-red-hot px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-hot/90 transition-colors focus:outline-none focus:ring-2 focus:ring-red-hot focus:ring-offset-2 focus:ring-offset-black-ink"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Link copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share your brief score
        </>
      )}
    </button>
  )
}

export default function AnalysisPreviewContent({ data, previewUrl }: AnalysisPreviewContentProps) {
  const { score, gaps } = data
  const { text, stroke, bg, label, border } = getScoreColor(score)
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="min-h-screen bg-black-ink">
      {/* Header */}
      <header className="border-b border-border-subtle bg-black-card px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-white hover:text-orange-accent transition-colors">
            AIDEN Brief Intelligence
          </Link>
          <Link
            href="/generate"
            className="text-sm font-medium text-orange-accent hover:text-orange-accent/80 transition-colors"
          >
            Try it free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Score Hero */}
        <div className={`rounded-2xl ${bg} ${border} border p-10 text-center`}>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white-muted">Brief Quality Score</p>

          <div className="relative inline-flex items-center justify-center">
            <svg width="172" height="172" className="-rotate-90">
              <circle cx="86" cy="86" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="86" cy="86" r={radius} fill="none" stroke={stroke} strokeWidth="12"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-6xl font-bold ${text}`}>{score}</span>
              <span className="text-sm text-white-muted font-medium">/100</span>
            </div>
          </div>

          <p className={`mt-4 text-2xl font-bold ${text}`}>{label}</p>

          {gaps.length > 0 && (
            <p className="mt-2 text-sm text-white-muted">
              {gaps.length} gap{gaps.length !== 1 ? 's' : ''} identified
            </p>
          )}

          <div className="mt-6">
            <ShareButton url={previewUrl} />
          </div>
        </div>

        {/* Gap Summary */}
        {gaps.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">Gaps Found</h2>
            <div className="space-y-3">
              {gaps.map((gap) => {
                const severity = getGapSeverity(gap)
                return (
                  <div
                    key={gap}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${SEVERITY_COLOR[severity]}`}
                  >
                    <span className="mt-0.5 text-xs font-bold uppercase tracking-wide opacity-70 min-w-[80px]">
                      {SEVERITY_LABEL[severity]}
                    </span>
                    <span className="text-sm leading-relaxed">{gap}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {gaps.length === 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-green-800">No gaps found. This brief covers all key areas.</p>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-border-subtle bg-black-card px-8 py-8 text-center">
          <p className="text-lg font-semibold text-white">Want to interrogate YOUR brief?</p>
          <p className="mt-2 text-sm text-white-muted">
            Get an instant quality score, gap analysis, and strategic tensions. Free.
          </p>
          <Link
            href="/generate"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-hot px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-hot/90 transition-colors"
          >
            Interrogate my brief
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 text-xs text-white-muted">200 free tokens on signup · No credit card required</p>
        </div>
      </main>

      {/* Powered by badge */}
      <div className="border-t border-border-subtle bg-black-card py-4 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white-muted hover:text-white transition-colors">
          <span>Powered by</span>
          <span className="font-semibold tracking-tight text-white">AIDEN</span>
        </Link>
      </div>
    </div>
  )
}
