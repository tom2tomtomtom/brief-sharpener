'use client'

import { useState } from 'react'
import LandingPagePreview, { GeneratedContent } from './LandingPagePreview'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'bold', label: 'Bold' },
  { value: 'minimal', label: 'Minimal' },
] as const

type Tone = (typeof TONES)[number]['value']
type Status = 'idle' | 'loading' | 'done' | 'error'

interface FormData {
  productName: string
  productDescription: string
  targetAudience: string
  features: string[]
  tone: Tone
}

interface FormErrors {
  productName?: string
  productDescription?: string
}

const initialFormData: FormData = {
  productName: '',
  productDescription: '',
  targetAudience: '',
  features: ['', '', '', '', '', ''],
  tone: 'professional',
}

export default function LandingPageForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required.'
    }
    if (!formData.productDescription.trim()) {
      newErrors.productDescription = 'Product description is required.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleFeatureChange(index: number, value: string) {
    setFormData((prev) => {
      const features = [...prev.features]
      features[index] = value
      return { ...prev, features }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    setApiError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          productDescription: formData.productDescription,
          targetAudience: formData.targetAudience || undefined,
          features: formData.features.filter((f) => f.trim()),
          tone: formData.tone,
        }),
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

  function handleReset() {
    setStatus('idle')
    setGeneratedData(null)
    setApiError(null)
    setErrors({})
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-gray-700">Generating your landing page…</p>
        <p className="mt-1 text-xs text-gray-400">This usually takes a few seconds</p>
      </div>
    )
  }

  // Preview state
  if (status === 'done' && generatedData) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Live preview</p>
            <h2 className="text-lg font-semibold text-gray-900">{formData.productName}</h2>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Edit details
          </button>
        </div>
        <LandingPagePreview data={generatedData} productName={formData.productName} />
      </div>
    )
  }

  // Form state (idle + error)
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* API error banner */}
      {status === 'error' && apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Product Name */}
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
          Product name <span className="text-red-500">*</span>
        </label>
        <input
          id="productName"
          type="text"
          value={formData.productName}
          onChange={(e) => setFormData((p) => ({ ...p, productName: e.target.value }))}
          placeholder="e.g. Acme Analytics"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            errors.productName ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.productName && (
          <p className="mt-1 text-xs text-red-500">{errors.productName}</p>
        )}
      </div>

      {/* Product Description */}
      <div>
        <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700">
          Product description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="productDescription"
          rows={4}
          value={formData.productDescription}
          onChange={(e) => setFormData((p) => ({ ...p, productDescription: e.target.value }))}
          placeholder="Describe what your product does and the problem it solves…"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            errors.productDescription ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.productDescription && (
          <p className="mt-1 text-xs text-red-500">{errors.productDescription}</p>
        )}
      </div>

      {/* Target Audience */}
      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
          Target audience
        </label>
        <input
          id="targetAudience"
          type="text"
          value={formData.targetAudience}
          onChange={(e) => setFormData((p) => ({ ...p, targetAudience: e.target.value }))}
          placeholder="e.g. SaaS founders, marketing teams, freelance designers"
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Key Features */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Key features <span className="font-normal text-gray-400">(up to 6)</span>
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {formData.features.map((feature, index) => (
              <input
                key={index}
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* Tone */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">Tone</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TONES.map(({ value, label }) => (
              <label
                key={value}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition select-none ${
                  formData.tone === value
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={value}
                  checked={formData.tone === value}
                  onChange={() => setFormData((p) => ({ ...p, tone: value }))}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Generate landing page
      </button>
    </form>
  )
}
