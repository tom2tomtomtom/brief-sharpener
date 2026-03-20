'use client'

import { useState } from 'react'
import { GenerateFormData } from '@/app/page'
import { TEMPLATES, TemplateId, DEFAULT_TEMPLATE_ID, getTemplate } from '@/lib/templates'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'bold', label: 'Bold' },
  { value: 'minimal', label: 'Minimal' },
] as const

type Tone = (typeof TONES)[number]['value']

interface FormFields {
  productName: string
  productDescription: string
  targetAudience: string
  features: string[]
  tone: Tone
  template: TemplateId
}

interface FormErrors {
  productName?: string
  productDescription?: string
}

interface LandingPageFormProps {
  onGenerate: (data: GenerateFormData) => void
  isLoading: boolean
  error: string | null
}

const initialFormData: FormFields = {
  productName: '',
  productDescription: '',
  targetAudience: '',
  features: ['', '', '', '', '', ''],
  tone: 'professional',
  template: DEFAULT_TEMPLATE_ID,
}

export default function LandingPageForm({ onGenerate, isLoading, error }: LandingPageFormProps) {
  const [formData, setFormData] = useState<FormFields>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleTemplateChange(id: TemplateId) {
    const tpl = getTemplate(id)
    setFormData((prev) => ({
      ...prev,
      template: id,
      tone: tpl.defaultTone,
    }))
  }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onGenerate({
      productName: formData.productName,
      productDescription: formData.productDescription,
      targetAudience: formData.targetAudience || undefined,
      features: formData.features.filter((f) => f.trim()),
      tone: formData.tone,
      template: formData.template,
    })
  }

  const selectedTemplate = getTemplate(formData.template)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* API error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Template */}
      <div>
        <label htmlFor="template" className="block text-sm font-medium text-gray-700">
          Industry template
        </label>
        <select
          id="template"
          value={formData.template}
          onChange={(e) => handleTemplateChange(e.target.value as TemplateId)}
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500"
        >
          {TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">{selectedTemplate.description}</p>
      </div>

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
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating…
          </>
        ) : (
          'Generate landing page'
        )}
      </button>
    </form>
  )
}
