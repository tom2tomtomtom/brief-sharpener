'use client'

import { useMemo } from 'react'
import { GeneratedContent } from './LandingPagePreview'

interface CriterionResult {
  label: string
  points: number
  max: number
  passed: boolean
  suggestion: string
}

function evaluateCopy(data: GeneratedContent): CriterionResult[] {
  const activeHeadline = data.headline_variants?.[data.recommended_index ?? 0]?.headline ?? data.headline
  const words = activeHeadline.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const headlinePassed = wordCount >= 8 && wordCount <= 12

  const numberRegex = /\b\d+[\d,]*\.?\d*\s*(%|x|k\b|\+|hrs?|days?|months?|years?|mins?|seconds?)?\b/i
  const allCopy = [
    data.headline,
    data.subheadline,
    ...(data.features?.map(f => f.description) ?? []),
    data.cta,
    data.socialProof,
  ].join(' ')
  const hasStat = numberRegex.test(allCopy)

  const actionVerbs = /\b(get|start|try|join|discover|boost|unlock|launch|build|grow|save|increase|improve|transform|create|access|claim)\b/i
  const ctaPassed = actionVerbs.test(data.cta)

  const benefitWords = /\b(save|gain|boost|increase|improve|reduce|eliminate|grow|maximize|faster|easier|more|better|higher|less|without|no more|never again|instantly|automatically)\b/i
  const featureDescriptions = data.features?.map(f => f.description).join(' ') ?? ''
  const hasBenefitFocus = benefitWords.test(featureDescriptions)

  const socialProofPassed = data.socialProof?.trim().length > 10

  return [
    {
      label: 'Headline length',
      points: headlinePassed ? 25 : 0,
      max: 25,
      passed: headlinePassed,
      suggestion: headlinePassed
        ? ''
        : wordCount < 8
        ? `Your headline is too short (${wordCount} words). Aim for 8–12 words for optimal impact.`
        : `Your headline is too long (${wordCount} words). Trim it to 8–12 words for better scannability.`,
    },
    {
      label: 'Numbers & stats',
      points: hasStat ? 20 : 0,
      max: 20,
      passed: hasStat,
      suggestion: hasStat ? '' : 'Add a specific stat or number (e.g. "Save 5 hours/week" or "Join 2,000+ users") to build credibility.',
    },
    {
      label: 'Action-driven CTA',
      points: ctaPassed ? 20 : 0,
      max: 20,
      passed: ctaPassed,
      suggestion: ctaPassed ? '' : `Your CTA "${data.cta}" could be stronger. Start with an action verb like "Get", "Start", or "Unlock".`,
    },
    {
      label: 'Benefit-focused features',
      points: hasBenefitFocus ? 20 : 0,
      max: 20,
      passed: hasBenefitFocus,
      suggestion: hasBenefitFocus ? '' : 'Feature descriptions read like features, not benefits. Reframe them around what the user gains (e.g. "Save 2 hours" instead of "Automated scheduling").',
    },
    {
      label: 'Social proof',
      points: socialProofPassed ? 15 : 0,
      max: 15,
      passed: socialProofPassed,
      suggestion: socialProofPassed ? '' : 'Add a social proof statement: a customer count, testimonial snippet, or press mention builds trust fast.',
    },
  ]
}

interface CircleProgressProps {
  score: number
  size?: number
  strokeWidth?: number
}

function CircleProgress({ score, size = 100, strokeWidth = 8 }: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 76 ? '#16a34a' : // green-600
    score >= 50 ? '#ca8a04' : // yellow-600
    '#dc2626'                  // red-600

  const bgColor =
    score >= 76 ? '#dcfce7' :
    score >= 50 ? '#fef9c3' :
    '#fee2e2'

  const label =
    score >= 76 ? 'Strong' :
    score >= 50 ? 'Decent' :
    'Needs work'

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      </div>
    </div>
  )
}

interface CopyScoreProps {
  data: GeneratedContent
}

export default function CopyScore({ data }: CopyScoreProps) {
  const criteria = useMemo(() => evaluateCopy(data), [data])
  const score = useMemo(() => criteria.reduce((sum, c) => sum + c.points, 0), [criteria])
  const suggestions = useMemo(
    () => criteria.filter(c => !c.passed).map(c => c.suggestion).slice(0, 3),
    [criteria]
  )

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">Copy Score</h3>

      <div className="flex items-center gap-6">
        <CircleProgress score={score} size={96} strokeWidth={9} />

        <div className="flex-1 space-y-2">
          {criteria.map(c => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${c.passed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {c.passed ? '✓' : '–'}
                </span>
                <span className="truncate text-xs text-gray-600">{c.label}</span>
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold tabular-nums ${c.passed ? 'text-green-600' : 'text-gray-400'}`}>
                {c.points}/{c.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-700">Suggestions to improve</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <span className="mt-0.5 flex-shrink-0 text-amber-500">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && (
        <p className="mt-3 text-xs text-green-600 font-medium border-t border-gray-100 pt-3">
          Great copy! All criteria met.
        </p>
      )}
    </div>
  )
}
