'use client'

import { useState } from 'react'
import { GenerateFormData } from '@/app/generate/page'

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

        {/* Example brief chips */}
        <div className="mt-2 mb-2">
          <p className="mb-1.5 text-xs text-gray-500">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_BRIEFS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => handleBriefChange(ex.brief)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
