'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

export interface BriefAnalysisData {
  extractedBrief: Record<string, unknown>
  strategicAnalysis: Record<string, unknown>
  gaps: string[]
  score: number
}

interface BriefAnalysisProps {
  data: BriefAnalysisData
  previewUrl?: string
  isPro?: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="relative ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

function getScoreColor(score: number): { text: string; stroke: string; bg: string; label: string } {
  if (score >= 71) return { text: 'text-green-600', stroke: '#16a34a', bg: 'bg-green-50', label: 'Strong brief' }
  if (score >= 40) return { text: 'text-amber-600', stroke: '#d97706', bg: 'bg-amber-50', label: 'Needs work' }
  return { text: 'text-red-600', stroke: '#dc2626', bg: 'bg-red-50', label: 'Incomplete brief' }
}

function ScoreCircle({ score }: { score: number }) {
  const { text, stroke, bg, label } = getScoreColor(score)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${bg} border border-gray-200 p-8`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none" stroke={stroke} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${text}`}>{score}</span>
          <span className="text-xs text-gray-500 font-medium">/100</span>
        </div>
      </div>
      <p className={`mt-3 text-base font-semibold ${text}`}>{label}</p>
      <p className="mt-1 text-sm text-gray-500">Brief quality score</p>
    </div>
  )
}

const BRIEF_FIELD_LABELS: Record<string, string> = {
  campaign_name: 'Campaign',
  objectives: 'Objectives',
  objective: 'Objective',
  target_audience: 'Target Audience',
  brand: 'Brand',
  brand_name: 'Brand',
  deliverables: 'Deliverables',
  requirements: 'Requirements',
  platforms: 'Platforms',
  tone: 'Tone of Voice',
  tone_of_voice: 'Tone of Voice',
  budget: 'Budget',
  timeline: 'Timeline',
  kpis: 'Success Metrics / KPIs',
  confidence: 'Confidence',
  key_message: 'Key Message',
  constraints: 'Constraints',
  aiden_analysis: 'AIDEN Analysis',
}

function ExtractedBriefCard({ extractedBrief }: { extractedBrief: Record<string, unknown> }) {
  const fields = Object.entries(extractedBrief).filter(([, v]) => {
    if (v === null || v === undefined || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })

  if (fields.length === 0) return null

  const copyText = fields.map(([key, value]) => {
    const label = BRIEF_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)
    return `${label}: ${displayValue}`
  }).join('\n')

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Extracted Brief</h2>
        <CopyButton text={copyText} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, value]) => {
          const label = BRIEF_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          const displayValue = Array.isArray(value)
            ? value.join(', ')
            : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value)

          return (
            <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
              <p className="mt-1 text-sm text-gray-800 leading-relaxed">{displayValue}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type GapSeverity = 'critical' | 'warning' | 'info'

function getGapSeverity(gap: string): GapSeverity {
  const lower = gap.toLowerCase()
  if (lower.includes('objective') || lower.includes('target audience') || lower.includes('deliverable')) return 'critical'
  if (lower.includes('budget') || lower.includes('timeline') || lower.includes('kpi') || lower.includes('metric')) return 'warning'
  return 'info'
}

function GapIcon({ severity }: { severity: GapSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
        <svg className="h-3.5 w-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  if (severity === 'warning') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
        <svg className="h-3.5 w-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
      <svg className="h-3.5 w-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </span>
  )
}

const SEVERITY_LABEL: Record<GapSeverity, string> = {
  critical: 'Critical',
  warning: 'Missing',
  info: 'Consider adding',
}

function GapAnalysisSection({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) {
    return (
      <section>
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Gap Analysis</h2>
          <CopyButton text="No gaps found. Your brief covers all key areas." />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-800">No gaps found. Your brief covers all key areas.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Gap Analysis</h2>
        <CopyButton text={gaps.map(g => `${SEVERITY_LABEL[getGapSeverity(g)]}: ${g}`).join('\n')} />
      </div>
      <div className="space-y-3">
        {gaps.map((gap) => {
          const severity = getGapSeverity(gap)
          return (
            <div key={gap} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <GapIcon severity={severity} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{SEVERITY_LABEL[severity]}</p>
                <p className="mt-0.5 text-sm text-gray-800">{gap}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StrategicTensionsSection({ strategicAnalysis }: { strategicAnalysis: Record<string, unknown> }) {
  const tensionFields = ['tensions', 'strategic_tensions', 'cultural_tensions', 'audience_tensions', 'key_tensions']
  let tensions: unknown[] = []

  for (const field of tensionFields) {
    if (Array.isArray(strategicAnalysis[field]) && (strategicAnalysis[field] as unknown[]).length > 0) {
      tensions = strategicAnalysis[field] as unknown[]
      break
    }
  }

  if (tensions.length === 0) {
    for (const [, value] of Object.entries(strategicAnalysis)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        tensions = value
        break
      }
    }
  }

  if (tensions.length === 0) {
    const insights = Object.entries(strategicAnalysis).filter(([, v]) => typeof v === 'string' && v.length > 0)
    if (insights.length === 0) return null

    const insightsCopyText = insights.map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      return `${label}: ${String(value)}`
    }).join('\n')
    return (
      <section>
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Strategic Analysis</h2>
          <CopyButton text={insightsCopyText} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            return (
              <div key={key} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">{label}</p>
                <p className="mt-1 text-sm text-indigo-900 leading-relaxed">{String(value)}</p>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const tensionsCopyText = tensions.map((tension, i) => {
    if (typeof tension === 'string') return tension
    if (typeof tension === 'object' && tension !== null) {
      const t = tension as Record<string, unknown>
      const title = String(t.title ?? t.name ?? t.tension ?? `Tension ${i + 1}`)
      const description = String(t.description ?? t.insight ?? t.explanation ?? t.detail ?? '')
      return description ? `${title}: ${description}` : title
    }
    return ''
  }).filter(Boolean).join('\n')

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Strategic Tensions</h2>
        <CopyButton text={tensionsCopyText} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tensions.map((tension, i) => {
          if (typeof tension === 'string') {
            return (
              <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-900 leading-relaxed">{tension}</p>
              </div>
            )
          }
          if (typeof tension === 'object' && tension !== null) {
            const t = tension as Record<string, unknown>
            const title = String(t.title ?? t.name ?? t.tension ?? `Tension ${i + 1}`)
            const description = String(t.description ?? t.insight ?? t.explanation ?? t.detail ?? '')
            return (
              <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Tension</p>
                <p className="mt-1 text-sm font-semibold text-indigo-900">{title}</p>
                {description && <p className="mt-1 text-sm text-indigo-700 leading-relaxed">{description}</p>}
              </div>
            )
          }
          return null
        })}
      </div>
    </section>
  )
}

function PhantomCDLockedSection() {
  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Phantom Creative Director</h2>
        <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">Pro</span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50">
        {/* Blurred preview */}
        <div className="select-none p-5 blur-sm pointer-events-none" aria-hidden="true">
          <div className="grid gap-3 sm:grid-cols-2">
            {['Provocateur', 'Strategist', 'Contrarian', 'Empath'].map((role) => (
              <div key={role} className="rounded-xl border border-indigo-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">{role}</p>
                <p className="mt-1 text-sm text-indigo-900">This brief lacks a clear emotional hook. Push harder on the tension between aspiration and reality — that&apos;s where the work lives.</p>
              </div>
            ))}
          </div>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">Unlock Phantom Creative Director</h3>
          <p className="mt-1 text-sm text-gray-600 max-w-xs">See how 340+ creative minds would attack this brief.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </section>
  )
}

function RewrittenBriefSection({ strategicAnalysis, extractedBrief, isPro }: { strategicAnalysis: Record<string, unknown>; extractedBrief: Record<string, unknown>; isPro?: boolean }) {
  const rewriteFields = ['rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief']
  let rewrittenBrief: string | null = null

  for (const field of rewriteFields) {
    if (typeof strategicAnalysis[field] === 'string' && (strategicAnalysis[field] as string).length > 0) {
      rewrittenBrief = strategicAnalysis[field] as string
      break
    }
  }

  if (!rewrittenBrief) {
    const parts: string[] = []
    const objective = extractedBrief.objective
    const audience = extractedBrief.target_audience
    const deliverables = extractedBrief.deliverables
    const tone = extractedBrief.tone
    const kpis = extractedBrief.kpis

    if (objective) parts.push(`**Objective:** ${objective}`)
    if (audience) parts.push(`**Target Audience:** ${Array.isArray(audience) ? audience.join(', ') : audience}`)
    if (deliverables) parts.push(`**Deliverables:** ${Array.isArray(deliverables) ? deliverables.join(', ') : deliverables}`)
    if (tone) parts.push(`**Tone:** ${tone}`)
    if (kpis) parts.push(`**Success Metrics:** ${Array.isArray(kpis) ? kpis.join(', ') : kpis}`)

    if (parts.length === 0) return null
    rewrittenBrief = parts.join('\n')
  }

  const lines = rewrittenBrief.split('\n').filter(Boolean)
  const ATTRIBUTION = '\n\nAnalysed by AIDEN Brief Intelligence — aiden-landing-gen.vercel.app'
  const copyText = isPro ? rewrittenBrief : rewrittenBrief + ATTRIBUTION

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Sharpened Brief</h2>
        <CopyButton text={copyText} />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {lines.map((line, i) => {
            const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.+)$/)
            if (boldMatch) {
              return (
                <div key={i} className="flex gap-2">
                  <span className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-gray-400 pt-0.5">{boldMatch[1]}</span>
                  <span className="text-sm text-gray-800 leading-relaxed">{boldMatch[2]}</span>
                </div>
              )
            }
            return (
              <p key={i} className="text-sm text-gray-800 leading-relaxed">{line}</p>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ShareResultButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard not available
    }
  }, [url])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Link copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share result
        </>
      )}
    </button>
  )
}

export default function BriefAnalysis({ data, previewUrl, isPro }: BriefAnalysisProps) {
  const { score, extractedBrief, strategicAnalysis, gaps } = data

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <ScoreCircle score={score} />
        </div>
        {previewUrl && (
          <div className="pb-2">
            <ShareResultButton url={previewUrl} />
          </div>
        )}
      </div>
      <ExtractedBriefCard extractedBrief={extractedBrief} />
      <GapAnalysisSection gaps={gaps} />
      <StrategicTensionsSection strategicAnalysis={strategicAnalysis} />
      {!isPro && <PhantomCDLockedSection />}
      <RewrittenBriefSection strategicAnalysis={strategicAnalysis} extractedBrief={extractedBrief} isPro={isPro} />
    </div>
  )
}
