'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LandingPageForm from '@/components/LandingPageForm'
import BriefAnalysis, { BriefAnalysisData } from '@/components/BriefAnalysis'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastProvider, useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'done' | 'error' | 'unauthenticated'
type Plan = 'free' | 'single' | 'pro'

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
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single()

        const plan = (sub?.plan as Plan) ?? 'free'

        if (plan === 'pro') {
          setPlanInfo({ plan: 'pro', used: 0 })
        } else {
          const now = new Date()
          const month = plan === 'single'
            ? 'total'
            : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

          const { data: usageData } = await supabase
            .from('usage_tracking')
            .select('count')
            .eq('user_id', user.id)
            .eq('month', month)
            .single()

          setPlanInfo({ plan, used: usageData?.count ?? 0 })
        }
      }
    }
    checkAuth()
  }, [])

  async function handleGenerate(formData: GenerateFormData) {
    if (!isAuthenticated) {
      setStatus('unauthenticated')
      return
    }
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
        const err = await response.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysisData(data as BriefAnalysisData)
      setGenerationId(data.generationId ?? null)
      setStatus('done')
      setPlanInfo(prev => prev && prev.plan !== 'pro' ? { ...prev, used: prev.used + 1 } : prev)
      showToast('Brief analysis complete!')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
              AIDEN Brief Intelligence
            </Link>
            <p className="mt-0.5 text-sm text-gray-500">
              AI-powered brief intelligence.
            </p>
          </div>
          <Link href="/pricing" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Pricing
          </Link>
        </div>
      </header>

      {/* Usage warning banner */}
      {planInfo?.plan === 'free' && planInfo.used >= 2 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-amber-800">
                You have {Math.max(0, 3 - planInfo.used)} free {Math.max(0, 3 - planInfo.used) === 1 ? 'analysis' : 'analyses'} remaining this month.
              </p>
            </div>
            <Link href="/pricing" className="flex-shrink-0 text-sm font-semibold text-amber-700 underline hover:text-amber-900 transition-colors">
              Upgrade for unlimited
            </Link>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:pb-8 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left: Form */}
          <div className="w-full lg:w-[420px] lg:flex-shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
            {status === 'unauthenticated' && <AuthPrompt />}
            {status === 'done' && analysisData && (
              <div>
                <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => lastFormData && handleGenerate(lastFormData)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Re-interrogate
                    </button>
                    <button
                      onClick={() => { setAnalysisData(null); setGenerationId(null); setStatus('idle'); setLastFormData(null) }}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Start over
                    </button>
                  </div>
                </div>
                <BriefAnalysis
                  data={analysisData}
                  previewUrl={generationId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${generationId}` : undefined}
                  isPro={planInfo?.plan === 'pro'}
                  isPaidUser={planInfo?.plan !== 'free' && planInfo?.plan !== undefined}
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
      {/* Sticky mobile interrogate button */}
      {isFormFilled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden">
          <button
            type="submit"
            form="generate-form"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
    </main>
    </ErrorBoundary>
  )
}

const ANALYSIS_STEPS = [
  { label: 'Reading your brief' },
  { label: 'Extracting key elements' },
  { label: 'Identifying gaps and tensions' },
  { label: 'Building strategic analysis' },
]

function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timings = [1200, 2400, 3800]
    const timeouts = timings.map((delay, i) =>
      setTimeout(() => setCurrentStep(i + 1), delay)
    )
    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 px-8 text-center shadow-sm">
      <p className="mb-8 text-base font-semibold text-gray-800">Interrogating your brief…</p>
      <ol className="w-full max-w-xs space-y-4 text-left">
        {ANALYSIS_STEPS.map((step, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep
          const isPending = i > currentStep
          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 transition-opacity duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                {isDone ? (
                  <svg className="h-5 w-5 text-indigo-600 transition-all duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isActive ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
              </span>
              <span className={`text-sm font-medium transition-colors duration-300 ${isDone ? 'text-indigo-600' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function AuthPrompt() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 py-24 text-center px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
        <svg
          className="h-7 w-7 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">Sign up free to interrogate your brief</h2>
      <p className="mt-2 text-sm text-gray-600 max-w-xs">
        Get 3 free analyses per month. No credit card required.
      </p>
      <Link
        href="/login?redirect=/generate"
        className="mt-6 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Sign up free
      </Link>
      <p className="mt-3 text-xs text-gray-400">
        Already have an account?{' '}
        <Link href="/login?redirect=/generate" className="text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <svg
          className="h-7 w-7 text-indigo-400"
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
      <p className="mt-4 text-sm font-medium text-gray-700">Paste your brief for AIDEN interrogation</p>
      <p className="mt-1 text-xs text-gray-400">Fill in the form and click Interrogate</p>
    </div>
  )
}
