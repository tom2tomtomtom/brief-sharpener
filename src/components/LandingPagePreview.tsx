'use client'

import { useState } from 'react'
import { TemplateId, getTemplate } from '@/lib/templates'

export interface GeneratedContent {
  headline: string
  subheadline: string
  features: Array<{ title: string; description: string }>
  faq: Array<{ question: string; answer: string }>
  cta: string
  socialProof: string
}

interface LandingPagePreviewProps {
  data: GeneratedContent
  productName: string
  templateId?: TemplateId
}

const FEATURE_ICONS = ['⚡', '🎯', '🔒', '📊', '🚀', '✨']

export default function LandingPagePreview({ data, productName, templateId }: LandingPagePreviewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const theme = getTemplate(templateId).previewTheme

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
      {/* Hero */}
      <section className={`${theme.heroGradient} px-6 py-16 text-center sm:px-12 sm:py-24`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {data.headline}
          </h1>
          <p className={`mx-auto mt-4 max-w-xl text-base sm:text-lg ${theme.heroSubtext}`}>
            {data.subheadline}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button className={`w-full rounded-lg px-8 py-3 text-sm font-semibold shadow-md transition sm:w-auto ${theme.ctaButton}`}>
              {data.cta}
            </button>
          </div>
          <p className={`mt-4 text-xs sm:text-sm ${theme.heroSubtext} opacity-80`}>{data.socialProof}</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {theme.featuresHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500 sm:text-base">
            {theme.featuresSubtext}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.features.map((feature, i) => (
              <div
                key={i}
                className={`rounded-xl border border-gray-100 bg-gray-50 p-6 transition ${theme.featureHover}`}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg ${theme.featureIconBg}`}>
                  {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-6 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
            {data.faq.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-gray-900">{item.question}</span>
                  <svg
                    className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme.footerBg} px-6 py-10 sm:px-12`}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base font-semibold text-white">{productName}</p>
          <p className="mt-1 text-xs text-gray-400">
            © {new Date().getFullYear()} {productName}. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <span key={link} className="cursor-pointer text-xs text-gray-500 transition hover:text-gray-300">
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
