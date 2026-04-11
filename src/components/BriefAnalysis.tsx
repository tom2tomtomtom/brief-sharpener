'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export interface PhantomPerspective {
  role: string
  shorthand: string
  verdict: number
  critique: string
  suggestion: string
}

export interface BriefAnalysisData {
  extractedBrief: Record<string, unknown>
  strategicAnalysis: Record<string, unknown>
  gaps: string[]
  score: number
  briefText?: string
  rewrittenBrief?: string | null
  phantomAnalysis?: PhantomPerspective[] | null
}

interface BriefAnalysisProps {
  data: BriefAnalysisData
  previewUrl?: string
  isPro?: boolean
  isPaidUser?: boolean
  isFirstAnalysis?: boolean
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
      className="relative ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white-dim hover:bg-white-faint hover:text-white-muted transition-colors"
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

function getScoreColor(score: number): { text: string; stroke: string; bg: string; label: string; interpretation: string } {
  if (score >= 86) return { text: 'text-green-500', stroke: '#ff2e2e', bg: 'bg-black-card', label: 'Strong brief', interpretation: 'Excellent' }
  if (score >= 71) return { text: 'text-green-500', stroke: '#ff2e2e', bg: 'bg-black-card', label: 'Strong brief', interpretation: 'Good' }
  if (score >= 51) return { text: 'text-yellow-electric', stroke: '#ff2e2e', bg: 'bg-black-card', label: 'Needs work', interpretation: 'Average' }
  if (score >= 31) return { text: 'text-orange-accent', stroke: '#ff2e2e', bg: 'bg-black-card', label: 'Needs work', interpretation: 'Below Average' }
  return { text: 'text-red-hot', stroke: '#ff2e2e', bg: 'bg-black-card', label: 'Incomplete brief', interpretation: 'Needs Work' }
}

const CONFETTI_DOTS = [
  { dx: '0px', dy: '-80px', color: '#6366f1', delay: '0ms' },
  { dx: '57px', dy: '-57px', color: '#f59e0b', delay: '60ms' },
  { dx: '80px', dy: '0px', color: '#10b981', delay: '120ms' },
  { dx: '57px', dy: '57px', color: '#6366f1', delay: '180ms' },
  { dx: '0px', dy: '80px', color: '#f59e0b', delay: '240ms' },
  { dx: '-57px', dy: '57px', color: '#10b981', delay: '300ms' },
  { dx: '-80px', dy: '0px', color: '#6366f1', delay: '360ms' },
  { dx: '-57px', dy: '-57px', color: '#f59e0b', delay: '420ms' },
]

function ScoreCircle({ score, showCelebration }: { score: number; showCelebration?: boolean }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius

  const [displayScore, setDisplayScore] = useState(0)
  const [displayOffset, setDisplayOffset] = useState(circumference)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 1500
    const start = performance.now()

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = Math.round(eased * score)
      setDisplayScore(current)
      setDisplayOffset(circumference - (eased * score / 100) * circumference)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [score, circumference])

  const { text, stroke, bg, label, interpretation } = getScoreColor(score)

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${bg} border border-border-subtle p-8`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none" stroke={stroke} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={displayOffset}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${text}`}>{displayScore}</span>
          <span className="text-xs text-white-dim font-medium">/100</span>
          <span className={`text-xs font-medium ${text}`}>{interpretation}</span>
        </div>
        {showCelebration && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {/* Expanding rings */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #6366f1', animation: 'aidenCelebRing 0.8s ease-out 0.2s forwards', opacity: 0 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #f59e0b', animation: 'aidenCelebRing 0.8s ease-out 0.5s forwards', opacity: 0 }} />
            {/* Confetti dots */}
            {CONFETTI_DOTS.map(({ dx, dy, color, delay }, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: color,
                  ['--dx' as string]: dx,
                  ['--dy' as string]: dy,
                  animation: `aidenCelebDot 0.8s ease-out ${delay} forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <p className={`mt-3 text-base font-semibold ${text}`}>{label}</p>
      <p className="mt-1 text-sm text-white-muted">Brief quality score</p>
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

// Fields that are AIDEN's own output, not extracted from the user's brief
const AIDEN_META_FIELDS = new Set(['aiden_analysis', 'aiden_brief_version', 'confidence', 'rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief'])

function ExtractedBriefCard({ extractedBrief }: { extractedBrief: Record<string, unknown> }) {
  const fields = Object.entries(extractedBrief).filter(([key, v]) => {
    if (AIDEN_META_FIELDS.has(key)) return false
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
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Extracted Brief</h2>
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
            <div key={key} className="border border-border-subtle bg-black-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white-dim">{label}</p>
              <p className="mt-1 text-sm text-white leading-relaxed">{displayValue}</p>
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
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-black-card border border-border-strong">
        <svg className="h-3.5 w-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  if (severity === 'warning') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-black-card border border-border-subtle">
        <svg className="h-3.5 w-3.5 text-yellow-electric" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-black-card border border-border-subtle">
      <svg className="h-3.5 w-3.5 text-orange-accent" fill="currentColor" viewBox="0 0 20 20">
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

const SEVERITY_BORDER: Record<GapSeverity, string> = {
  critical: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-yellow-electric',
  info: 'border-l-4 border-l-orange-accent',
}

const GAP_SUGGESTIONS: Array<{ keywords: string[]; suggestion: string }> = [
  {
    keywords: ['objective', 'goal', 'aim', 'purpose'],
    suggestion: 'Add a clear objective using the format: "We want to [action] among [audience] in order to [business outcome]." E.g. "We want to drive trial among lapsed users in order to re-engage 10% of churned customers."',
  },
  {
    keywords: ['target audience', 'audience', 'demographic', 'persona'],
    suggestion: 'Define your audience with specifics: age range, mindset, life stage, and key behaviours. E.g. "Urban professionals 28–40, time-poor but health-conscious, who snack mindlessly and feel mild guilt about it."',
  },
  {
    keywords: ['deliverable', 'asset', 'format', 'output'],
    suggestion: 'List the exact deliverables with formats and quantities. E.g. "1× hero video (30s), 3× static social posts (1:1 and 9:16), 1× OOH 48-sheet."',
  },
  {
    keywords: ['budget'],
    suggestion: 'Include a production budget range to help scope creative ambition. E.g. "Production budget: £80k–£120k" or at minimum "TBC — ballpark high/medium/low."',
  },
  {
    keywords: ['timeline', 'deadline', 'launch', 'date'],
    suggestion: 'Specify key milestones: brief date, creative review, final approval, and live date. E.g. "Creative review: 10 Apr / Final approval: 24 Apr / Live: 1 May."',
  },
  {
    keywords: ['kpi', 'metric', 'success', 'measure', 'result'],
    suggestion: 'Define how success will be measured with specific, trackable KPIs. E.g. "Primary KPI: 15% uplift in brand awareness (YouGov). Secondary: CTR >2% on paid social."',
  },
  {
    keywords: ['tone', 'voice', 'personality', 'character'],
    suggestion: 'Describe tone with 3 adjectives and one "tone is X, not Y" contrast. E.g. "Warm, direct, optimistic — inspirational but never preachy."',
  },
  {
    keywords: ['brand', 'brand context', 'brand background'],
    suggestion: 'Add brand context: positioning, recent campaigns, what to avoid, and mandatory brand elements. E.g. "Brand is moving from functional to emotional — avoid category clichés and competitor comparisons."',
  },
]

function generateGapSuggestion(gap: string, strategicAnalysis: Record<string, unknown>): string {
  const lower = gap.toLowerCase()

  // Try to find relevant strategic context first
  const relevantContext = Object.entries(strategicAnalysis).find(([key, value]) => {
    if (typeof value !== 'string' || !value) return false
    const keyLower = key.toLowerCase()
    return (
      lower.split(' ').some(word => word.length > 3 && keyLower.includes(word)) ||
      lower.split(' ').some(word => word.length > 3 && (value as string).toLowerCase().includes(word))
    )
  })

  const contextHint = relevantContext
    ? ` Based on your brief, consider: "${String(relevantContext[1]).slice(0, 120)}${String(relevantContext[1]).length > 120 ? '…' : ''}"`
    : ''

  // Match against known gap patterns
  for (const { keywords, suggestion } of GAP_SUGGESTIONS) {
    if (keywords.some(kw => lower.includes(kw))) {
      return contextHint ? `${suggestion}${contextHint}` : suggestion
    }
  }

  // Generic fallback
  return `Add specific, measurable details to address this gap. Use concrete numbers, named formats, or explicit criteria wherever possible.${contextHint}`
}

function GapCard({ gap, strategicAnalysis }: { gap: string; strategicAnalysis: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  const severity = getGapSeverity(gap)
  const suggestion = generateGapSuggestion(gap, strategicAnalysis)

  return (
    <div className={`border border-border-subtle bg-black-card overflow-hidden ${SEVERITY_BORDER[severity]}`}>
      <div className="flex items-start gap-3 p-4">
        <GapIcon severity={severity} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white-dim">{SEVERITY_LABEL[severity]}</p>
          <p className="mt-0.5 text-sm text-white">{gap}</p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide suggestion' : 'Show suggestion'}
          className="ml-2 flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-accent hover:bg-white-faint transition-colors"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {open ? 'Hide' : 'Suggest'}
        </button>
      </div>
      {open && (
        <div className="border-t border-border-strong bg-black-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent mb-1">Suggested rewrite</p>
          <p className="text-sm text-white leading-relaxed">{suggestion}</p>
        </div>
      )}
    </div>
  )
}

function GapAnalysisSection({ gaps, strategicAnalysis }: { gaps: string[]; strategicAnalysis: Record<string, unknown> }) {
  if (gaps.length === 0) {
    return (
      <section>
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Gap Analysis</h2>
          <CopyButton text="No gaps found. Your brief covers all key areas." />
        </div>
        <div className="flex items-center gap-3 border border-border-subtle bg-black-card p-4">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-500">No gaps found. Your brief covers all key areas.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Gap Analysis</h2>
        <CopyButton text={gaps.map(g => `${SEVERITY_LABEL[getGapSeverity(g)]}: ${g}`).join('\n')} />
      </div>
      <div className="space-y-3">
        {gaps.map((gap) => (
          <GapCard key={gap} gap={gap} strategicAnalysis={strategicAnalysis} />
        ))}
      </div>
    </section>
  )
}

function TensionCards({ tensions }: { tensions: unknown[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tensions.map((tension, i) => {
        const isExpanded = !!expanded[i]

        if (typeof tension === 'string') {
          const [summary, ...rest] = tension.split('. ')
          const hasMore = rest.length > 0
          const panelId = `tension-panel-${i}`
          return (
            <div
              key={i}
              className={`border bg-black-card p-4 transition-colors ${isExpanded ? 'border-orange-accent' : 'border-border-subtle'}`}
            >
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <p className="text-sm text-white leading-relaxed">{summary}{!isExpanded ? '...' : ''}</p>
                  <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 text-white-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <p className="text-sm text-white leading-relaxed">{summary}</p>
              )}
              {isExpanded && hasMore && (
                <p id={panelId} className="mt-2 text-sm text-white-muted leading-relaxed">{rest.join('. ')}</p>
              )}
            </div>
          )
        }

        if (typeof tension === 'object' && tension !== null) {
          const t = tension as Record<string, unknown>
          const title = String(t.title ?? t.name ?? t.tension ?? `Tension ${i + 1}`)
          const description = String(t.description ?? t.insight ?? t.explanation ?? t.detail ?? '')
          const recommendation = String(t.recommendation ?? t.action ?? t.suggest ?? '')
          const hasMore = !!(description || recommendation)
          const panelId = `tension-panel-${i}`
          return (
            <div
              key={i}
              className={`border bg-black-card p-4 transition-colors ${isExpanded ? 'border-orange-accent' : 'border-border-subtle'}`}
            >
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent">Tension</p>
                    <p className="mt-1 text-sm font-semibold text-white">{title}</p>
                  </div>
                  <svg className={`mt-1 h-4 w-4 flex-shrink-0 text-white-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent">Tension</p>
                  <p className="mt-1 text-sm font-semibold text-white">{title}</p>
                </div>
              )}
              {isExpanded && (
                <div id={panelId} className="mt-2 space-y-2">
                  {description && <p className="text-sm text-white-muted leading-relaxed">{description}</p>}
                  {recommendation && (
                    <p className="text-sm text-white-muted leading-relaxed border-t border-border-subtle pt-2">{recommendation}</p>
                  )}
                </div>
              )}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-white prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wide
      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
      prose-p:text-white-muted prose-p:leading-relaxed
      prose-strong:text-white prose-em:text-orange-accent
      prose-li:text-white-muted prose-li:leading-relaxed
      prose-ul:space-y-1 prose-ol:space-y-1
      prose-hr:border-border-subtle
      prose-a:text-orange-accent prose-a:no-underline hover:prose-a:text-red-hot">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

function StrategicAnalysisSection({ strategicAnalysis }: { strategicAnalysis: Record<string, unknown> }) {
  const analysis = (strategicAnalysis.aidenAnalysis ?? strategicAnalysis.aiden_analysis) as string | undefined
  if (!analysis) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Strategic Analysis</h2>
        <CopyButton text={analysis} />
      </div>
      <div className="border border-border-subtle bg-black-card p-6">
        <MarkdownContent content={analysis} />
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
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Strategic Analysis</h2>
          <CopyButton text={insightsCopyText} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            return (
              <div key={key} className="border border-border-strong bg-black-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent">{label}</p>
                <p className="mt-1 text-sm text-white leading-relaxed">{String(value)}</p>
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
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Strategic Tensions</h2>
        <CopyButton text={tensionsCopyText} />
      </div>
      <TensionCards tensions={tensions} />
    </section>
  )
}

function verdictLabel(v: number): string {
  if (v >= 5) return 'Sharp'
  if (v >= 4) return 'Nearly there'
  if (v >= 3) return 'Needs work'
  if (v >= 2) return 'Weak'
  return 'Missing'
}

function verdictColor(v: number): string {
  if (v >= 4) return 'text-green-400'
  if (v >= 3) return 'text-orange-accent'
  return 'text-red-hot'
}

function PhantomAnalysisSection({ phantoms }: { phantoms: PhantomPerspective[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Phantom Perspectives</h2>
        <span className="ml-2 inline-flex items-center border border-border-strong px-2 py-0.5 text-xs font-semibold text-orange-accent">Pro</span>
      </div>
      <p className="mb-4 text-sm text-white-muted">Four expert strategic perspectives interrogated your brief independently.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {phantoms.map((p) => (
          <div key={p.role} className="border border-border-subtle bg-black-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent">{p.role}</p>
              <span className={`text-xs font-bold ${verdictColor(p.verdict)}`}>{p.verdict}/5 {verdictLabel(p.verdict)}</span>
            </div>
            <p className="text-sm text-white leading-relaxed">{p.critique}</p>
            <div className="mt-3 border-t border-border-subtle pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white-dim mb-1">How to fix</p>
              <p className="text-sm text-white-muted leading-relaxed">{p.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PhantomLockedSection() {
  return (
    <section>
      <div className="mb-4 flex items-center">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Phantom Perspectives</h2>
        <span className="ml-2 inline-flex items-center border border-border-strong px-2 py-0.5 text-xs font-semibold text-orange-accent">Pro</span>
      </div>
      <div className="relative overflow-hidden border border-border-strong bg-black-card">
        <div className="select-none p-5 blur-sm pointer-events-none" aria-hidden="true">
          <div className="grid gap-3 sm:grid-cols-2">
            {['The Audience Skeptic', 'The Single-Minded Purist', 'The Tension Finder', 'The Scope Realist'].map((role) => (
              <div key={role} className="border border-border-subtle bg-black-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent">{role}</p>
                <p className="mt-1 text-sm text-white">This brief lacks a clear emotional hook. Push harder on the tension between aspiration and reality.</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center border border-border-strong bg-black-card">
            <svg className="h-6 w-6 text-orange-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="mt-3 text-base font-semibold uppercase tracking-wider text-white">Unlock Phantom Perspectives</h3>
          <p className="mt-1 text-sm text-white-muted max-w-xs">Four expert strategic perspectives interrogate your brief independently. See what each one finds.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1.5 bg-red-hot px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dim transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </section>
  )
}

function BriefLines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.+)$/)
        if (boldMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-white-dim pt-0.5">{boldMatch[1]}</span>
              <span className="text-sm text-white leading-relaxed">{boldMatch[2]}</span>
            </div>
          )
        }
        return (
          <p key={i} className="text-sm text-white leading-relaxed">{line}</p>
        )
      })}
    </div>
  )
}

function RewrittenBriefSection({ strategicAnalysis, extractedBrief, isPro, briefText, rewrittenBriefFromAPI }: { strategicAnalysis: Record<string, unknown>; extractedBrief: Record<string, unknown>; isPro?: boolean; briefText?: string; rewrittenBriefFromAPI?: string | null }) {
  const [showComparison, setShowComparison] = useState(false)

  // Prefer the dedicated rewrite from the chat API if available
  let rewrittenBrief: string | null = rewrittenBriefFromAPI ?? null

  // Fallback: look for a rewritten brief embedded in Brain V2 response fields
  if (!rewrittenBrief) {
    const rewriteFields = ['aiden_brief_version', 'rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief']

    // Check both strategicAnalysis and extractedBrief for rewrite fields
    for (const source of [strategicAnalysis, extractedBrief]) {
      for (const field of rewriteFields) {
        if (typeof source[field] === 'string' && (source[field] as string).length > 0) {
          rewrittenBrief = source[field] as string
          break
        }
      }
      if (rewrittenBrief) break
    }
  }

  // Also check for aiden_analysis as supplementary context
  const aidenAnalysis = (extractedBrief.aiden_analysis ?? strategicAnalysis.aiden_analysis) as string | undefined

  if (!rewrittenBrief) {
    // Fallback: build from extracted fields
    const parts: string[] = []
    const objectives = extractedBrief.objectives ?? extractedBrief.objective
    const audience = extractedBrief.target_audience ?? extractedBrief.audience
    const deliverables = extractedBrief.deliverables ?? extractedBrief.requirements
    const tone = extractedBrief.tone ?? extractedBrief.tone_of_voice
    const kpis = extractedBrief.kpis ?? extractedBrief.success_metrics
    const budget = extractedBrief.budget
    const timeline = extractedBrief.timeline ?? extractedBrief.timing
    const brand = extractedBrief.brand ?? extractedBrief.campaign_name ?? extractedBrief.brand_name

    if (brand) parts.push(`**Brand:** ${brand}`)
    if (objectives) parts.push(`**Objectives:** ${Array.isArray(objectives) ? objectives.join('; ') : objectives}`)
    if (audience) parts.push(`**Target Audience:** ${Array.isArray(audience) ? audience.join(', ') : audience}`)
    if (deliverables) parts.push(`**Deliverables:** ${Array.isArray(deliverables) ? deliverables.join(', ') : deliverables}`)
    if (tone) parts.push(`**Tone:** ${tone}`)
    if (budget) parts.push(`**Budget:** ${budget}`)
    if (timeline) parts.push(`**Timeline:** ${timeline}`)
    if (kpis) parts.push(`**Success Metrics:** ${Array.isArray(kpis) ? kpis.join(', ') : kpis}`)

    if (parts.length === 0) return null
    rewrittenBrief = parts.join('\n')
  }

  // Prepend aiden_analysis if we have it and rewrittenBrief is from fallback fields (not from API rewrite)
  const REWRITE_FIELD_NAMES = ['aiden_brief_version', 'rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief']
  if (!rewrittenBriefFromAPI && aidenAnalysis && !REWRITE_FIELD_NAMES.some(f => typeof extractedBrief[f] === 'string' || typeof strategicAnalysis[f] === 'string')) {
    rewrittenBrief = aidenAnalysis + '\n\n' + rewrittenBrief
  }

  const sharpenedLines = rewrittenBrief.split('\n').filter(Boolean)
  const ATTRIBUTION = '\n\nAnalysed by AIDEN Brief Intelligence — brief-sharpener.aiden.services'
  const copyText = isPro ? rewrittenBrief : rewrittenBrief + ATTRIBUTION

  // Build original brief text for comparison
  const originalText = briefText ?? Object.entries(extractedBrief)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    .map(([key, value]) => {
      const label = BRIEF_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)
      return `**${label}:** ${displayValue}`
    })
    .join('\n')

  const originalLines = originalText.split('\n').filter(Boolean)

  return (
    <section>
      <div className="mb-4 flex items-center flex-wrap gap-2">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Sharpened Brief</h2>
        <CopyButton text={copyText} />
        <button
          onClick={() => setShowComparison(v => !v)}
          className="ml-auto inline-flex items-center gap-1.5 border border-border-subtle bg-black-card px-3 py-1 text-xs font-medium text-white-muted hover:bg-white-faint transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {showComparison ? 'Hide comparison' : 'Show comparison'}
        </button>
      </div>

      {showComparison ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-border-subtle bg-black-card p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white-dim border-b border-border-subtle pb-2">Original Brief</p>
            <BriefLines lines={originalLines} />
          </div>
          <div className="border border-border-subtle bg-black-card p-5" style={{ background: 'rgba(255,46,46,0.04)' }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-orange-accent border-b border-border-subtle pb-2">Sharpened Brief</p>
            <MarkdownContent content={rewrittenBrief} />
          </div>
        </div>
      ) : (
        <div className="border border-border-subtle bg-black-card p-5">
          <MarkdownContent content={rewrittenBrief} />
        </div>
      )}
    </section>
  )
}

function buildFullMarkdown(data: BriefAnalysisData): string {
  const { score, extractedBrief, strategicAnalysis, gaps } = data
  const sections: string[] = []

  // Score
  const { label } = getScoreColor(score)
  sections.push(`# Brief Analysis\n\n**Score:** ${score}/100 — ${label}`)

  // Extracted Brief (exclude AIDEN meta fields)
  const briefFields = Object.entries(extractedBrief).filter(([key, v]) => {
    if (AIDEN_META_FIELDS.has(key)) return false
    if (v === null || v === undefined || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
  if (briefFields.length > 0) {
    const lines = briefFields.map(([key, value]) => {
      const label = BRIEF_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)
      return `**${label}:** ${displayValue}`
    })
    sections.push(`## Extracted Brief\n\n${lines.join('\n')}`)
  }

  // Gap Analysis
  if (gaps.length === 0) {
    sections.push(`## Gap Analysis\n\nNo gaps found. Your brief covers all key areas.`)
  } else {
    const gapLines = gaps.map(g => `- **${SEVERITY_LABEL[getGapSeverity(g)]}:** ${g}`)
    sections.push(`## Gap Analysis\n\n${gapLines.join('\n')}`)
  }

  // Strategic Tensions / Analysis
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

  if (tensions.length > 0) {
    const tensionLines = tensions.map((tension, i) => {
      if (typeof tension === 'string') return `- ${tension}`
      if (typeof tension === 'object' && tension !== null) {
        const t = tension as Record<string, unknown>
        const title = String(t.title ?? t.name ?? t.tension ?? `Tension ${i + 1}`)
        const description = String(t.description ?? t.insight ?? t.explanation ?? t.detail ?? '')
        return description ? `- **${title}:** ${description}` : `- ${title}`
      }
      return ''
    }).filter(Boolean)
    sections.push(`## Strategic Tensions\n\n${tensionLines.join('\n')}`)
  } else {
    const insights = Object.entries(strategicAnalysis).filter(([, v]) => typeof v === 'string' && v.length > 0)
    if (insights.length > 0) {
      const insightLines = insights.map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        return `**${label}:** ${String(value)}`
      })
      sections.push(`## Strategic Analysis\n\n${insightLines.join('\n')}`)
    }
  }

  // Rewritten Brief - check both sources, including aiden_brief_version
  const rewriteFields2 = ['aiden_brief_version', 'rewritten_brief', 'sharpened_brief', 'improved_brief', 'refined_brief', 'brief_rewrite', 'recommended_brief']
  let rewrittenBrief: string | null = null
  for (const source of [strategicAnalysis, extractedBrief]) {
    for (const field of rewriteFields2) {
      if (typeof source[field] === 'string' && (source[field] as string).length > 0) {
        rewrittenBrief = source[field] as string
        break
      }
    }
    if (rewrittenBrief) break
  }
  if (!rewrittenBrief) {
    const parts: string[] = []
    const objectives = extractedBrief.objectives ?? extractedBrief.objective
    const audience = extractedBrief.target_audience ?? extractedBrief.audience
    const deliverables = extractedBrief.deliverables ?? extractedBrief.requirements
    const tone = extractedBrief.tone ?? extractedBrief.tone_of_voice
    const kpis = extractedBrief.kpis ?? extractedBrief.success_metrics
    if (objectives) parts.push(`**Objectives:** ${Array.isArray(objectives) ? objectives.join('; ') : objectives}`)
    if (audience) parts.push(`**Target Audience:** ${Array.isArray(audience) ? audience.join(', ') : audience}`)
    if (deliverables) parts.push(`**Deliverables:** ${Array.isArray(deliverables) ? deliverables.join(', ') : deliverables}`)
    if (tone) parts.push(`**Tone:** ${tone}`)
    if (kpis) parts.push(`**Success Metrics:** ${Array.isArray(kpis) ? kpis.join(', ') : kpis}`)
    if (parts.length > 0) rewrittenBrief = parts.join('\n')
  }
  if (rewrittenBrief) {
    sections.push(`## Sharpened Brief\n\n${rewrittenBrief}`)
  }

  return sections.join('\n\n---\n\n')
}

function BriefMetadataBar({ data }: { data: BriefAnalysisData }) {
  const briefText = data.briefText ?? Object.values(data.extractedBrief)
    .filter(v => v !== null && v !== undefined && v !== '')
    .map(v => Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v))
    .join(' ')

  const wordCount = briefText.trim() ? briefText.trim().split(/\s+/).length : 0
  const readTime = Math.ceil(wordCount / 200)
  const gapCount = data.gaps.length

  return (
    <div className="mt-3 flex items-center justify-center gap-5 text-xs text-white-muted">
      <span><span className="font-medium text-white">{wordCount}</span> words</span>
      <span className="text-white-dim">·</span>
      <span><span className="font-medium text-white">{readTime} min</span> read</span>
      <span className="text-white-dim">·</span>
      <span><span className="font-medium text-white">{gapCount}</span> gap{gapCount !== 1 ? 's' : ''} found</span>
    </div>
  )
}

function CopyAllButton({ data }: { data: BriefAnalysisData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildFullMarkdown(data))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [data])

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 border border-border-subtle bg-black-card px-3 py-1.5 text-xs font-semibold text-white-muted hover:bg-white-faint transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy full analysis
        </>
      )}
    </button>
  )
}

function DownloadPDFButton({ data, isPaidUser }: { data: BriefAnalysisData; isPaidUser?: boolean }) {
  const handleClick = useCallback(() => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/export-pdf'
    form.target = '_blank'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'data'
    input.value = JSON.stringify(data)
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }, [data])

  if (!isPaidUser) {
    return (
      <Link
        href="/pricing"
        title="Upgrade to export PDF"
        className="inline-flex items-center gap-1.5 border border-border-subtle bg-black-card px-3 py-1.5 text-xs font-semibold text-white-dim cursor-not-allowed select-none"
        tabIndex={-1}
        aria-disabled="true"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download PDF
        <span className="ml-0.5 bg-white-faint px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white-dim">Pro</span>
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 border border-border-subtle bg-black-card px-3 py-1.5 text-xs font-semibold text-white-muted hover:bg-white-faint transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download PDF
    </button>
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
      className="inline-flex items-center gap-1.5 border border-border-strong bg-black-card px-3 py-1.5 text-xs font-semibold text-orange-accent hover:bg-white-faint transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500">Link copied!</span>
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

function TeamHandoffPanel({ data, previewUrl }: { data: BriefAnalysisData; previewUrl?: string }) {
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const checklist = data.gaps.map((gap, index) => {
    const cleanGap = gap.replace(/\s*\(.*\)\s*$/, '')
    return `${index + 1}. Resolve: ${cleanGap}`
  })

  const payload = [
    'Team Handoff Checklist',
    `Score: ${data.score}/100`,
    previewUrl ? `Share link: ${previewUrl}` : null,
    '',
    'Action items:',
    ...checklist,
    '',
    'Team notes:',
    notes.trim() || '(none)',
  ].filter(Boolean).join('\n')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [payload])

  return (
    <section className="border border-border-subtle bg-black-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Team Handoff</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 border border-border-subtle bg-black-deep px-3 py-1.5 text-xs font-semibold text-white-muted hover:bg-white-faint transition-colors"
        >
          {copied ? 'Checklist copied' : 'Copy checklist'}
        </button>
      </div>
      <div className="space-y-2">
        {checklist.length === 0 ? (
          <p className="text-sm text-green-500">No critical gaps left to action.</p>
        ) : (
          checklist.map((item) => (
            <p key={item} className="text-sm text-white-muted">{item}</p>
          ))
        )}
      </div>
      <label htmlFor="team-notes" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white-dim">
        Team comments
      </label>
      <textarea
        id="team-notes"
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Add client context, owners, deadlines, and next review notes..."
        className="mt-2 w-full border border-border-subtle bg-black-deep px-3 py-2 text-sm text-white outline-none focus:border-red-hot"
      />
    </section>
  )
}

function UpgradeCtaCard() {
  return (
    <div className="border border-border-strong bg-black-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent mb-1">Unlock more with Pro</p>
          <h3 className="text-base font-bold uppercase tracking-wider text-white mb-3">Get the full picture</h3>
          <ul className="space-y-1.5">
            {[
              { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', label: 'PDF export of your analysis' },
              { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'Unlimited analyses every month' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Priority processing' },
            ].map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-white-muted">
                <svg className="h-4 w-4 shrink-0 text-orange-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-red-hot px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-dim transition-colors"
          >
            See pricing
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BriefAnalysis({ data, previewUrl, isPro, isPaidUser, isFirstAnalysis }: BriefAnalysisProps) {
  const { score, extractedBrief, strategicAnalysis, gaps } = data

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <ScoreCircle score={score} showCelebration={isFirstAnalysis} />
          <BriefMetadataBar data={data} />
        </div>
        <div className="flex flex-col items-end gap-2 pb-2">
          <CopyAllButton data={data} />
          <DownloadPDFButton data={data} isPaidUser={isPaidUser} />
          {previewUrl && <ShareResultButton url={previewUrl} />}
        </div>
      </div>
      <div style={{ animation: 'aidenFadeInUp 0.5s ease-out 0ms both' }}>
        <ExtractedBriefCard extractedBrief={extractedBrief} />
      </div>
      <div style={{ animation: 'aidenFadeInUp 0.5s ease-out 150ms both' }}>
        <GapAnalysisSection gaps={gaps} strategicAnalysis={strategicAnalysis} />
      </div>
      <div style={{ animation: 'aidenFadeInUp 0.5s ease-out 250ms both' }}>
        <StrategicAnalysisSection strategicAnalysis={strategicAnalysis} />
      </div>
      <div style={{ animation: 'aidenFadeInUp 0.5s ease-out 350ms both' }}>
        <StrategicTensionsSection strategicAnalysis={strategicAnalysis} />
      </div>
      {isPro === false && <PhantomLockedSection />}
      <div style={{ animation: 'aidenFadeInUp 0.5s ease-out 450ms both' }}>
        <RewrittenBriefSection strategicAnalysis={strategicAnalysis} extractedBrief={extractedBrief} isPro={isPro} briefText={data.briefText} rewrittenBriefFromAPI={data.rewrittenBrief} />
      </div>
      <TeamHandoffPanel data={data} previewUrl={previewUrl} />
      {!isPaidUser && <UpgradeCtaCard />}
    </div>
  )
}
