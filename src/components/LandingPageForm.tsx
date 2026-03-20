'use client'

import { useState } from 'react'
import { GenerateFormData } from '@/app/generate/page'

const INDUSTRIES = [
  'FMCG',
  'Tech',
  'Finance',
  'Healthcare',
  'Retail',
  'Automotive',
  'Entertainment',
  'Other',
]

const BRIEF_TYPES = [
  'Campaign',
  'Brand',
  'Digital',
  'Social',
  'Media',
  'Other',
]

interface FormFields {
  briefText: string
  brandName: string
  industry: string
  briefType: string
}

interface FormErrors {
  briefText?: string
}

interface LandingPageFormProps {
  onGenerate: (data: GenerateFormData) => void
  isLoading: boolean
  error: string | null
  onFormChange?: (filled: boolean) => void
}

const initialFormData: FormFields = {
  briefText: '',
  brandName: '',
  industry: '',
  briefType: '',
}

export default function LandingPageForm({ onGenerate, isLoading, error, onFormChange }: LandingPageFormProps) {
  const [formData, setFormData] = useState<FormFields>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!formData.briefText.trim()) {
      newErrors.briefText = 'Brief text is required.'
    } else if (formData.briefText.trim().length < 100) {
      newErrors.briefText = 'Brief must be at least 100 characters.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleBriefChange(val: string) {
    setFormData((p) => ({ ...p, briefText: val }))
    onFormChange?.(val.trim().length >= 100)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onGenerate({
      briefText: formData.briefText,
      brandName: formData.brandName || undefined,
      industry: formData.industry || undefined,
      briefType: formData.briefType || undefined,
    })
  }

  return (
    <form id="generate-form" onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* API error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Brief textarea */}
      <div>
        <label htmlFor="briefText" className="block text-sm font-medium text-gray-700">
          Paste your brief here <span className="text-red-500">*</span>
        </label>
        <textarea
          id="briefText"
          rows={10}
          value={formData.briefText}
          onChange={(e) => handleBriefChange(e.target.value)}
          maxLength={10000}
          placeholder="Paste your full brief here…"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            errors.briefText ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        <div className="mt-1 flex justify-between">
          {errors.briefText ? (
            <p className="text-xs text-red-500">{errors.briefText}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400">{formData.briefText.length}/10000</p>
        </div>
      </div>

      {/* Brand name */}
      <div>
        <label htmlFor="brandName" className="block text-sm font-medium text-gray-700">
          Brand / Company name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="brandName"
          type="text"
          value={formData.brandName}
          onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
          placeholder="e.g. Acme Corp"
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
          Industry <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          id="industry"
          value={formData.industry}
          onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select industry…</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Brief type */}
      <div>
        <label htmlFor="briefType" className="block text-sm font-medium text-gray-700">
          Brief type <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          id="briefType"
          value={formData.briefType}
          onChange={(e) => setFormData((p) => ({ ...p, briefType: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select type…</option>
          {BRIEF_TYPES.map((bt) => (
            <option key={bt} value={bt}>{bt}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating…
          </>
        ) : (
          'Interrogate this brief'
        )}
      </button>
    </form>
  )
}
