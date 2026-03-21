'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GenerateFormData } from '@/app/generate/GenerateClient'
import { useToast } from '@/components/Toast'

const EXAMPLE_BRIEFS = [
  {
    label: 'FMCG Launch',
    brief: `Project: NovaBite Protein Bar — UK Market Launch

Brand: NovaBite
Category: Health & Wellness Snacks
Target Audience: Health-conscious millennials aged 25–40, gym-goers and busy professionals seeking convenient nutrition. Primary skew female, ABC1 socioeconomic group, urban and suburban UK.

Campaign Objective: Drive trial and awareness for NovaBite's new plant-based protein bar range across the UK. Target 15% prompted awareness among core audience within 6 months of launch. Generate 50,000 units sold in month one.

Key Message: Real ingredients, real protein — fuel your day without compromise.

Tone of Voice: Energetic, honest, and aspirational without being preachy. Think Innocent Drinks meets Gymshark.

Channels: Paid social (Instagram, TikTok), influencer seeding (micro and macro), sampling activations in gyms and co-working spaces, OOH in commuter zones.

Mandatories: Logo lock-up, "8 ingredients or less" claim, recyclable packaging callout, BRC certified.

Budget: £450,000 total. Deliverables required: campaign concept, hero visual, social assets, sampling kit design.`,
  },
  {
    label: 'Tech SaaS',
    brief: `Project: Flowdesk CRM — Series B Launch Campaign

Brand: Flowdesk
Category: B2B SaaS / Sales Enablement
Target Audience: Sales Directors and Revenue Operations leaders at mid-market B2B companies (50–500 employees). Decision-makers evaluating Salesforce alternatives. North America and UK.

Campaign Objective: Position Flowdesk as the intelligent CRM for modern sales teams. Generate 2,000 qualified demo requests in Q1. Establish thought leadership in the "AI-native CRM" category ahead of key industry conferences.

Key Message: Stop managing your CRM. Start closing deals. Flowdesk thinks so you don't have to.

Tone of Voice: Sharp, confident, and peer-to-peer. No corporate jargon. Speak like a senior sales leader, not a vendor.

Channels: LinkedIn paid (sponsored content and InMail), SEM (bottom-of-funnel), G2 review campaign, partner co-marketing with HubSpot consultants, podcast sponsorships (sales-focused shows).

Mandatories: SOC 2 Type II compliance badge, Salesforce migration messaging, "deploy in 48 hours" proof point.

Budget: $600,000 USD. Deliverables: campaign strategy, LinkedIn creative suite, landing page copy, sales deck.`,
  },
  {
    label: 'Charity Campaign',
    brief: `Project: See The Child — Annual Awareness and Fundraising Campaign

Organisation: ChildFirst UK (registered charity)
Cause Area: Child poverty and educational inequality in the UK
Target Audience: Socially conscious UK adults aged 30–60, existing donors and lapsed supporters, corporate giving leads at FTSE 350 companies. Secondary: general public aged 18+.

Campaign Objective: Raise £2.1M through the annual appeal. Reactivate 8,000 lapsed donors. Grow brand awareness by 20% among primary audience. Secure three new corporate partnerships worth £150K+ each.

Key Message: Right now, 4.2 million children in the UK are living in poverty. You can change one child's story today.

Tone of Voice: Warm, urgent, and empowering — not guilt-driven. Give donors agency and hope, not despair.

Channels: TV and radio (30-second spots), direct mail, email nurture sequence, social media (Facebook, Instagram), PR campaign targeting national press.

Mandatories: Charity Commission registration number, real case studies with consent, GDPR-compliant data capture, Gift Aid messaging.

Budget: £320,000. Deliverables: campaign concept, TV script, DM pack, email series, social content plan.`,
  },
  {
    label: 'Retail Seasonal',
    brief: `Project: Hartley's Home — Christmas 2025 Seasonal Campaign

Brand: Hartley's Home
Category: Mid-premium homeware and gifting retail (UK)
Target Audience: Gift-buyers aged 28–55, predominantly female, ABC1. Existing loyalty card holders and new-to-brand shoppers. Focus on those buying gifts for the home — partners, parents, friends.

Campaign Objective: Drive a 22% uplift in Christmas period revenue versus prior year. Increase average basket value by 15% through gifting bundles. Grow email subscriber list by 40,000 ahead of peak trading.

Key Message: The gift that makes a house feel like home.

Tone of Voice: Warm, nostalgic, and generous. Evoke the feeling of Christmas morning — considered, personal, and a little luxurious. Not discount-led.

Channels: TV (brand-led 60-second hero ad), digital display, email (8-touch nurture from October), Instagram and Pinterest, in-store POS and window displays, gift guide PR placement.

Mandatories: Free gifting service messaging, sustainability credentials (FSC packaging), loyalty points multiplier offer, returns policy callout.

Budget: £875,000. Deliverables: TV concept and script, hero visual, in-store kit, email templates, social content calendar.`,
  },
]

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

const INDUSTRY_PLACEHOLDERS: Record<string, string> = {
  FMCG: `Product Name:
Category:
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Mandatories:
Budget:`,
  Tech: `Product / Service:
Category (B2B / B2C / SaaS):
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Proof Points:
Budget:`,
  Finance: `Product / Service:
Sector (Retail Banking / Wealth / Insurance):
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Regulatory Mandatories:
Budget:`,
  Healthcare: `Product / Service / Condition:
Audience (Patients / HCPs / Carers):
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Medical / Regulatory Constraints:
Budget:`,
  Retail: `Brand:
Category / Season:
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Promotions / Offers:
Budget:`,
  Automotive: `Vehicle / Model:
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Technical Claims / Mandatories:
Budget:`,
  Entertainment: `Title / Project:
Genre / Format:
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Release Window:
Budget:`,
  Other: `Project / Brand:
Category:
Target Audience:
Campaign Objective:
Key Message:
Tone of Voice:
Channels:
Budget:`,
}

const DEFAULT_PLACEHOLDER = 'Paste your full brief here…'

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

function getFileTypeIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 4a2 2 0 0 1 2-2h12l6 6v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5"/>
        <path d="M20 2v6h6" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
        <text x="8" y="23" fontFamily="sans-serif" fontSize="7" fontWeight="700" fill="#ef4444">PDF</text>
      </svg>
    )
  }
  if (ext === 'docx' || ext === 'doc') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 4a2 2 0 0 1 2-2h12l6 6v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M20 2v6h6" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"/>
        <text x="5" y="23" fontFamily="sans-serif" fontSize="6.5" fontWeight="700" fill="#3b82f6">DOC</text>
      </svg>
    )
  }
  // txt / md
  return (
    <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 4a2 2 0 0 1 2-2h12l6 6v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5"/>
      <path d="M20 2v6h6" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
      <text x="7" y="23" fontFamily="sans-serif" fontSize="6.5" fontWeight="700" fill="#22c55e">TXT</text>
    </svg>
  )
}

const DocumentIcon = () => (
  <svg className="h-8 w-8 text-white-dim" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 4a2 2 0 0 1 2-2h12l6 6v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z" fill="#f3f4f6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M20 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="10" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="24" x2="17" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.md'
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
]

export default function LandingPageForm({ onGenerate, isLoading, error, onFormChange }: LandingPageFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<FormFields>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleFileUpload(file: File) {
    setUploadState('parsing')
    setUploadError(null)
    setUploadFileName(file.name)

    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch('/api/parse-brief', { method: 'POST', body })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse file')
      }

      handleBriefChange(data.text)

      // Auto-detect brand name from common patterns in first 500 chars
      if (!formData.brandName.trim()) {
        const preview = (data.text as string).slice(0, 500)
        const match = preview.match(/(?:brand\s*name|brand|client|company)\s*:\s*([^\n,]+)/i)
        if (match) {
          const detected = match[1].trim()
          if (detected) {
            setFormData((p) => ({ ...p, brandName: detected }))
          }
        }
      }

      setUploadState('done')
      if (data.truncated) {
        setUploadError('Brief was truncated to 10,000 characters.')
      }
      showToast(`Brief loaded from ${file.name}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file'
      setUploadState('error')
      setUploadError(message)
      showToast(message, 'error')
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isLoading && validate()) {
        onGenerate({
          briefText: formData.briefText,
          brandName: formData.brandName || undefined,
          industry: formData.industry || undefined,
          briefType: formData.briefType || undefined,
        })
      }
    }
  }, [isLoading, formData, onGenerate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
        <div className="rounded-lg border border-red-hot bg-black-card px-4 py-3 text-sm text-red-hot">
          {error}
        </div>
      )}

      {/* Brief textarea */}
      <div>
        <label htmlFor="briefText" className="block text-xs font-medium uppercase tracking-wide text-white-muted">
          Upload or paste your brief <span className="text-red-hot">*</span>
        </label>

        {/* File upload dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload brief file — drag and drop or press Enter to browse"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          className={`mt-2 cursor-pointer border-2 border-dashed p-4 text-center transition ${
            isDragOver
              ? 'border-red-hot bg-black-card'
              : uploadState === 'done'
              ? 'border-green-600 bg-black-card'
              : uploadState === 'error'
              ? 'border-red-hot bg-black-card'
              : 'border-border-subtle bg-black-deep hover:border-red-hot hover:bg-black-card'
          } rounded-lg`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="sr-only"
            aria-label="Choose a brief file to upload"
            tabIndex={-1}
          />
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {uploadState === 'parsing' && `Parsing ${uploadFileName}, please wait.`}
            {uploadState === 'done' && `${uploadFileName} loaded successfully.${uploadError ? ` Note: ${uploadError}` : ''}`}
            {uploadState === 'error' && `Upload failed. ${uploadError ?? ''}`}
          </div>
          {uploadState === 'parsing' ? (
            <div className="py-2 space-y-2">
              <p className="text-sm text-orange-accent">Parsing {uploadFileName}...</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black-card">
                <div className="h-full w-full origin-left animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-red-hot" />
              </div>
            </div>
          ) : uploadState === 'done' ? (
            <div className="py-1">
              <div className="flex items-center justify-center mb-2">
                {uploadFileName && getFileTypeIcon(uploadFileName)}
              </div>
              <p className="text-sm text-green-700">
                <span className="font-medium">{uploadFileName}</span> loaded
              </p>
              {uploadError && <p className="text-xs text-amber-600 mt-1">{uploadError}</p>}
              <div className="mt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadState('idle')
                    setUploadFileName(null)
                    setUploadError(null)
                    handleBriefChange('')
                  }}
                  className="rounded-md border border-red-hot bg-black-card px-3 py-1 text-xs font-medium text-red-hot transition hover:border-red-hot hover:bg-black-card"
                >
                  Clear file
                </button>
                <span className="text-xs text-white-dim">or click to upload a different file</span>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <div className="flex items-center justify-center mb-2">
                <DocumentIcon />
              </div>
              <p className="text-sm text-white-dim">
                <span className="font-medium text-orange-accent">Upload a file</span> or drag and drop
              </p>
              <p className="text-xs text-white-dim mt-1">PDF, Word (.docx), or text files up to 10MB</p>
              {uploadState === 'error' && uploadError && (
                <p className="text-xs text-red-hot mt-1">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-white-dim">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* Example brief chips */}
        <div className="mt-2 mb-2">
          <p className="mb-1.5 text-xs text-white-dim">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_BRIEFS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => handleBriefChange(ex.brief)}
                className="rounded-full border border-border-subtle bg-black-card px-3 py-1 text-xs font-medium text-orange-accent transition hover:border-red-hot hover:bg-black-card focus:outline-none focus:ring-2 focus:ring-red-hot"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="briefText"
          rows={10}
          value={formData.briefText}
          onChange={(e) => handleBriefChange(e.target.value)}
          maxLength={10000}
          placeholder={formData.industry ? (INDUSTRY_PLACEHOLDERS[formData.industry] ?? DEFAULT_PLACEHOLDER) : DEFAULT_PLACEHOLDER}
          aria-describedby={errors.briefText ? 'briefText-error' : undefined}
          aria-invalid={!!errors.briefText}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:ring-2 focus:ring-red-hot ${
            errors.briefText ? 'border-red-hot bg-black-card' : 'border-border-subtle bg-black-card'
          }`}
        />
        <div className="mt-1 flex justify-between">
          {errors.briefText ? (
            <p id="briefText-error" role="alert" className="text-xs text-red-hot">{errors.briefText}</p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3 text-xs">
            {(() => {
              const wordCount = formData.briefText.trim() === '' ? 0 : formData.briefText.trim().split(/\s+/).length
              const underMin = wordCount < 20
              return (
                <span className={underMin ? 'text-red-hot' : 'text-white-dim'}>
                  {wordCount} words (min 20)
                </span>
              )
            })()}
            {(() => {
              const charCount = formData.briefText.length
              const pct = charCount / 10000
              const radius = 8
              const circumference = 2 * Math.PI * radius
              const dashOffset = circumference * (1 - pct)
              const ringColor = charCount >= 9500 ? '#ef4444' : charCount >= 8000 ? '#f59e0b' : '#6366f1'
              const textColor = charCount >= 9500 ? 'text-red-hot' : charCount >= 8000 ? 'text-amber-500' : 'text-white-dim'
              return (
                <span className={`flex items-center gap-1 ${textColor}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <circle
                      cx="10" cy="10" r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 10 10)"
                    />
                  </svg>
                  {charCount}/10000
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Brand name */}
      <div>
        <label htmlFor="brandName" className="block text-xs font-medium uppercase tracking-wide text-white-muted">
          Brand / Company name <span className="text-white-dim font-normal">(optional)</span>
        </label>
        <input
          id="brandName"
          type="text"
          value={formData.brandName}
          onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
          placeholder="e.g. Acme Corp"
          className="mt-1 block w-full rounded-lg border border-border-subtle bg-black-card px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:ring-2 focus:ring-red-hot"
        />
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className="block text-xs font-medium uppercase tracking-wide text-white-muted">
          Industry <span className="text-white-dim font-normal">(optional)</span>
        </label>
        <select
          id="industry"
          value={formData.industry}
          onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-border-subtle bg-black-card px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:ring-2 focus:ring-red-hot"
        >
          <option value="">Select industry…</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Brief type */}
      <div>
        <label htmlFor="briefType" className="block text-xs font-medium uppercase tracking-wide text-white-muted">
          Brief type <span className="text-white-dim font-normal">(optional)</span>
        </label>
        <select
          id="briefType"
          value={formData.briefType}
          onChange={(e) => setFormData((p) => ({ ...p, briefType: e.target.value }))}
          className="mt-1 block w-full rounded-lg border border-border-subtle bg-black-card px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:ring-2 focus:ring-red-hot"
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-hot px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-dim focus:outline-none focus:ring-2 focus:ring-red-hot focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
      <p className="text-center text-xs text-white-dim">
        Press <kbd className="rounded border border-border-subtle bg-black-card px-1 py-0.5 font-mono text-xs">⌘ Enter</kbd> to submit
      </p>
    </form>
  )
}
