'use client'

import { useState } from 'react'
import LandingPageForm from '@/components/LandingPageForm'
import LandingPagePreview, { GeneratedContent } from '@/components/LandingPagePreview'

type Status = 'idle' | 'loading' | 'done' | 'error'

export interface GenerateFormData {
  productName: string
  productDescription: string
  targetAudience?: string
  features?: string[]
  tone?: 'professional' | 'casual' | 'bold' | 'minimal'
}

export default function Home() {
  const [status, setStatus] = useState<Status>('idle')
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [productName, setProductName] = useState('')

  async function handleGenerate(formData: GenerateFormData) {
    setStatus('loading')
    setApiError(null)
    setProductName(formData.productName)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data: GeneratedContent = await response.json()
      setGeneratedData(data)
      setStatus('done')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            AIDEN Landing Page Generator
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Describe your product and get high-converting copy instantly.
          </p>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left: Form */}
          <div className="w-full lg:w-[420px] lg:flex-shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <LandingPageForm
                onGenerate={handleGenerate}
                isLoading={status === 'loading'}
                error={status === 'error' ? apiError : null}
              />
            </div>
          </div>

          {/* Right: Preview / Loading / Empty */}
          <div className="min-w-0 flex-1">
            {status === 'loading' && <LoadingState />}
            {status === 'done' && generatedData && (
              <LandingPagePreview data={generatedData} productName={productName} />
            )}
            {(status === 'idle' || status === 'error') && !generatedData && (
              <EmptyPreview />
            )}
            {status === 'done' && !generatedData && <EmptyPreview />}
          </div>
        </div>
      </div>
    </main>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-center shadow-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      <p className="mt-4 text-sm font-medium text-gray-700">Generating your landing page…</p>
      <p className="mt-1 text-xs text-gray-400">This usually takes a few seconds</p>
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
      <p className="mt-4 text-sm font-medium text-gray-700">Your preview will appear here</p>
      <p className="mt-1 text-xs text-gray-400">Fill in the form and click Generate</p>
    </div>
  )
}
