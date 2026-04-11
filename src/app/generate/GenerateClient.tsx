'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import LandingPageForm from '@/components/LandingPageForm'
import BriefAnalysis, { BriefAnalysisData } from '@/components/BriefAnalysis'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastProvider, useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'done' | 'error'
type Plan = 'free' | 'single' | 'pro' | 'agency'

interface PlanInfo {
  plan: Plan
  used: number
}

export interface GenerateFormData {
  briefText: string
  brandName?: string
  industry?: string
  briefType?: string
}

interface ApiErrorPayload {
  error?: string
  code?: string
  retryAfter?: string | number
}

async function parseApiError(response: Response): Promise<ApiErrorPayload> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => ({}))
    return json as ApiErrorPayload
  }
  const text = await response.text().catch(() => '')
  return text ? { error: text } : {}
}

export default function GeneratePage() {
  return (
    <ToastProvider>
      <GeneratePageInner />
    </ToastProvider>
  )
}

function GeneratePageInner() {
  const { showToast } = useToast()
  const [status, setStatus] = useState<Status>('idle')
  const [analysisData, setAnalysisData] = useState<BriefAnalysisData | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isFormFilled, setIsFormFilled] = useState(false)
  const [lastFormData, setLastFormData] = useState<GenerateFormData | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [mobileResultsCollapsed, setMobileResultsCollapsed] = useState(false)
  const emailModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFirstAnalysis) {
      const dismissed = localStorage.getItem('aiden_email_dismissed')
      if (!dismissed) {
        emailModalTimerRef.current = setTimeout(() => setShowEmailModal(true), 3000)
      }
    }
    return () => {
      if (emailModalTimerRef.current) clearTimeout(emailModalTimerRef.current)
    }
  }, [isFirstAnalysis])

  useEffect(() => {
    const hasVisited = localStorage.getItem('aiden_has_visited')
    if (!hasVisited) {
      setShowWelcomeBanner(true)
      localStorage.setItem('aiden_has_visited', 'true')
    }
  }, [])

  function dismissWelcomeBanner() {
    setShowWelcomeBanner(false)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (status !== 'done' || !analysisData) return
      if (window.innerWidth < 1024) {
        setMobileResultsCollapsed(true)
      }
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const textarea = formPanelRef.current?.querySelector('textarea')
      if (textarea) {
        setTimeout(() => textarea.focus(), 100)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [status, analysisData])

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        const planRes = await fetch('/api/user-plan')
        if (planRes.ok) {
          const planData = await planRes.json()
          setPlanInfo({ plan: planData.plan as Plan, used: planData.used ?? 0 })
        } else {
          setPlanInfo({ plan: 'free', used: 0 })
        }
      }
    }
    checkAuth()
  }, [])

  async function handleGenerate(formData: GenerateFormData) {
    setStatus('loading')
    setApiError(null)
    setLastFormData(formData)

    try {
      const response = await fetch('/api/analyze-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefText: formData.briefText,
          brandName: formData.brandName,
          industry: formData.industry,
          briefType: formData.briefType,
        }),
      })

      if (!response.ok) {
        const err = await parseApiError(response)
        if (response.status === 429) {
          if (err.code === 'RATE_LIMIT') {
            const retryAfter = Number(response.headers.get('Retry-After') ?? err.retryAfter ?? 60)
            throw new Error(`Too many requests right now. Please wait ${Math.max(1, retryAfter)}s and try again.`)
          }
          if (err.code === 'GUEST_MONTHLY_LIMIT') {
            throw new Error('Free guest limit reached. Sign in to continue with 3 analyses per month.')
          }
          if (err.code === 'PLAN_LIMIT') {
            throw new Error('You have reached your analysis limit for this plan. Upgrade to continue.')
          }
          throw new Error('Request limit reached. Please try again in a moment.')
        }
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysisData(data as BriefAnalysisData)
      setGenerationId(data.generationId ?? null)
      setMobileResultsCollapsed(false)
      setStatus('done')
      setCompletedAt(new Date().toLocaleTimeString())
      setPlanInfo(prev => prev && prev.plan !== 'pro' && prev.plan !== 'agency' ? { ...prev, used: prev.used + 1 } : prev)
      showToast('Brief analysis complete!')
      if (!localStorage.getItem('aiden_first_analysis_done')) {
        localStorage.setItem('aiden_first_analysis_done', 'true')
        setIsFirstAnalysis(true)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen bg-black-ink">
      {/* Header */}
      <header className="border-b border-border-subtle bg-black-deep px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-1.5 text-xs text-white-dim">
              <li>
                <Link href="/" className="hover:text-white-muted transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="font-medium text-white-muted">Interrogate Brief</li>
            </ol>
          </nav>
          {/* Logo + Nav */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-orange-accent transition-colors">
                AIDEN Brief Intelligence
              </Link>
              <p className="mt-0.5 text-sm text-white-muted">
                AI-powered brief intelligence.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {planInfo?.plan === 'free' && (
                <span className="text-sm text-white-muted">
                  <span className="font-semibold text-white">{Math.max(0, 3 - planInfo.used)}</span>
                  {' '}free {Math.max(0, 3 - planInfo.used) === 1 ? 'analysis' : 'analyses'} remaining
                </span>
              )}
              <Link href="/pricing" className="text-sm font-medium text-orange-accent hover:text-red-hot transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Loading progress bar */}
      {status === 'loading' && (
        <>
          <style>{`
            @keyframes nprogress-indeterminate {
              0% { left: -35%; right: 100%; }
              60% { left: 100%; right: -90%; }
              100% { left: 100%; right: -90%; }
            }
            @keyframes nprogress-short {
              0% { left: -200%; right: 100%; }
              60% { left: 107%; right: -8%; }
              100% { left: 107%; right: -8%; }
            }
            .nprogress-bar::after {
              content: '';
              display: block;
              position: absolute;
              top: 0; left: 0; bottom: 0; right: 0;
              animation: nprogress-indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
              background: #ff2e2e;
              border-radius: 2px;
            }
            .nprogress-bar::before {
              content: '';
              display: block;
              position: absolute;
              top: 0; left: 0; bottom: 0; right: 0;
              animation: nprogress-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
              animation-delay: 1.15s;
              background: #ff2e2e;
              border-radius: 2px;
            }
          `}</style>
          <div
            className="nprogress-bar"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Interrogating your brief"
            style={{ position: 'relative', height: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}
          />
        </>
      )}

      {/* Welcome banner for first-time users */}
      {showWelcomeBanner && (
        <div className="border-b border-border-strong bg-black-card px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-orange-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-white-muted">
                Welcome! Paste your creative brief and AIDEN will interrogate it for gaps, tensions, and strategic insights.
              </p>
            </div>
            <button
              onClick={dismissWelcomeBanner}
              aria-label="Dismiss welcome banner"
              className="flex-shrink-0 p-1 text-white-dim hover:text-white-muted transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Usage warning banner */}
      {planInfo?.plan === 'free' && planInfo.used >= 2 && (
        <div className="border-b border-yellow-electric/20 bg-black-card px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-yellow-electric" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-white-muted">
                You have {Math.max(0, 3 - planInfo.used)} free {Math.max(0, 3 - planInfo.used) === 1 ? 'analysis' : 'analyses'} remaining this month.
              </p>
            </div>
            <Link href="/pricing" className="flex-shrink-0 text-sm font-semibold text-orange-accent underline hover:text-red-hot transition-colors">
              Upgrade for unlimited
            </Link>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:pb-8 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left: Form */}
          <div ref={formPanelRef} className="w-full lg:w-[420px] lg:flex-shrink-0">
            <div className="border border-border-subtle bg-black-card p-6">
              <LandingPageForm
                onGenerate={handleGenerate}
                isLoading={status === 'loading'}
                error={status === 'error' ? apiError : null}
                onFormChange={setIsFormFilled}
              />
            </div>
          </div>

          {/* Right: Analysis / Loading / Empty */}
          <div className="min-w-0 flex-1">
            {status === 'loading' && <LoadingState />}
            {status === 'done' && analysisData && mobileResultsCollapsed && (
              <button
                onClick={() => setMobileResultsCollapsed(false)}
                className="w-full border border-border-subtle bg-black-card px-4 py-3 text-sm font-medium text-white-muted hover:text-white transition-colors lg:hidden"
              >
                Show analysis results ↓
              </button>
            )}
            {status === 'done' && analysisData && !mobileResultsCollapsed && (
              <div>
                <div className="mb-4 flex items-center justify-between border border-border-subtle bg-black-deep px-4 py-3 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => lastFormData && handleGenerate(lastFormData)}
                      className="flex items-center gap-1.5 bg-red-hot px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-dim transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Re-interrogate
                    </button>
                    <button
                      onClick={() => { setAnalysisData(null); setGenerationId(null); setStatus('idle'); setLastFormData(null) }}
                      className="text-xs font-medium text-white-muted hover:text-white transition-colors"
                    >
                      Start over
                    </button>
                  </div>
                  {completedAt && (
                    <span className="text-xs text-white-dim">Analysed at {completedAt}</span>
                  )}
                </div>
                <BriefAnalysis
                  data={analysisData}
                  previewUrl={generationId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${generationId}` : undefined}
                  isPro={planInfo?.plan === 'pro' || planInfo?.plan === 'agency'}
                  isPaidUser={planInfo?.plan !== 'free' && planInfo?.plan !== undefined}
                  isFirstAnalysis={isFirstAnalysis}
                />
              </div>
            )}
            {(status === 'idle' || status === 'error') && !analysisData && (
              <EmptyPreview />
            )}
            {status === 'done' && !analysisData && <EmptyPreview />}
          </div>
        </div>
      </div>
      {/* Keyboard shortcuts help button */}
      <div className="fixed bottom-6 right-6 z-30 hidden lg:block">
        <div className="relative">
          {showShortcuts && (
            <div className="absolute bottom-10 right-0 w-52 border border-border-subtle bg-black-deep p-3">
              <p className="mb-2 text-xs font-semibold text-white-muted">Keyboard shortcuts</p>
              <ul className="space-y-1.5">
                <li className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white-dim">Submit brief</span>
                  <kbd className="bg-black-card px-1.5 py-0.5 text-xs font-mono text-white-muted border border-border-subtle">⌘ Enter</kbd>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white-dim">Close results</span>
                  <kbd className="bg-black-card px-1.5 py-0.5 text-xs font-mono text-white-muted border border-border-subtle">Esc</kbd>
                </li>
              </ul>
            </div>
          )}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            onMouseEnter={() => setShowShortcuts(true)}
            onMouseLeave={() => setShowShortcuts(false)}
            aria-label="Keyboard shortcuts"
            className="flex h-8 w-8 items-center justify-center border border-border-subtle bg-black-card text-sm font-semibold text-white-muted hover:bg-black-deep hover:text-white transition-colors"
          >
            ?
          </button>
        </div>
      </div>
      {/* Sticky mobile interrogate button */}
      {isFormFilled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-black-deep p-4 lg:hidden">
          <button
            type="submit"
            form="generate-form"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 bg-red-hot px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-dim focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Interrogating…
              </>
            ) : (
              'Interrogate brief'
            )}
          </button>
        </div>
      )}
      {showEmailModal && (
        <EmailCaptureModal onDismiss={() => {
          setShowEmailModal(false)
          localStorage.setItem('aiden_email_dismissed', 'true')
        }} />
      )}
    </main>
    </ErrorBoundary>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white-faint ${className ?? ''}`} />
}

function LoadingState() {
  return (
    <div className="space-y-8">
      {/* Score circle + action buttons */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-col items-center justify-center border border-border-subtle bg-black-card p-8">
            <div className="animate-pulse">
              <div className="relative inline-flex items-center justify-center">
                <svg width="140" height="140" className="-rotate-90">
                  <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                  <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset="245" />
                </svg>
                <div className="absolute flex flex-col items-center gap-2">
                  <SkeletonBlock className="h-9 w-12" />
                  <SkeletonBlock className="h-3 w-8" />
                </div>
              </div>
            </div>
            <SkeletonBlock className="mt-3 h-4 w-24" />
            <SkeletonBlock className="mt-1 h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 pb-2">
          <SkeletonBlock className="h-7 w-28" />
          <SkeletonBlock className="h-7 w-24" />
        </div>
      </div>

      {/* Extracted brief fields */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <SkeletonBlock className="h-6 w-36" />
          <SkeletonBlock className="h-5 w-12" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[80, 60, 90, 50, 70, 65].map((w, i) => (
            <div key={i} className="border border-border-subtle bg-black-card p-4">
              <SkeletonBlock className="h-3 w-20 mb-2" />
              <SkeletonBlock className={`h-4 w-${w === 80 ? '[80%]' : w === 60 ? '[60%]' : w === 90 ? '[90%]' : w === 50 ? '[50%]' : w === 70 ? '[70%]' : '[65%]'}`} />
              <SkeletonBlock className="h-4 w-[40%] mt-1.5" />
            </div>
          ))}
        </div>
      </section>

      {/* Gap analysis */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-5 w-12" />
        </div>
        <div className="space-y-3">
          {[['w-[75%]', 'w-[55%]'], ['w-[65%]', 'w-[45%]'], ['w-[80%]', 'w-[35%]']].map(([w1, w2], i) => (
            <div key={i} className="flex items-start gap-3 border border-border-subtle bg-black-card p-4">
              <SkeletonBlock className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className={`h-4 ${w1}`} />
                <SkeletonBlock className={`h-4 ${w2}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic tensions */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <SkeletonBlock className="h-6 w-44" />
          <SkeletonBlock className="h-5 w-12" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['w-[70%]', 'w-full', 'w-[80%]'], ['w-[60%]', 'w-full', 'w-[65%]'], ['w-[75%]', 'w-full', 'w-[55%]'], ['w-[65%]', 'w-full', 'w-[70%]']].map(([w1, w2, w3], i) => (
            <div key={i} className="border border-border-strong bg-black-card p-4">
              <SkeletonBlock className="h-3 w-14 mb-2" />
              <SkeletonBlock className={`h-4 ${w1}`} />
              <SkeletonBlock className={`h-4 ${w2} mt-1.5`} />
              <SkeletonBlock className={`h-4 ${w3} mt-1`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function EmailCaptureModal({ onDismiss }: { onDismiss: () => void }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Subscription failed')
      }
      setSubmitted(true)
      setTimeout(onDismiss, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="relative w-full max-w-md border-2 border-red-hot bg-black-deep p-8">
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 text-white-dim hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-white">You&apos;re in.</p>
            <p className="mt-1 text-sm text-white-muted">We&apos;ll send future brief-sharpening insights to your inbox.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Get your full report</h2>
            <p className="mt-2 text-sm text-white-muted">
              Enter your email to get future brief-sharpening insights and product updates.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full border border-border-subtle bg-black-card px-4 py-3 text-sm text-white placeholder-white-dim focus:border-red-hot focus:outline-none"
              />
              {error && <p className="text-xs text-red-hot">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-hot px-4 py-3 text-sm font-semibold text-white hover:bg-red-dim transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save my email'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle bg-black-card py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center bg-black-deep border border-border-subtle">
        <svg
          className="h-7 w-7 text-orange-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-white-muted">Paste your brief for AIDEN interrogation</p>
      <p className="mt-1 text-xs text-white-dim">Fill in the form and click Interrogate</p>
    </div>
  )
}
