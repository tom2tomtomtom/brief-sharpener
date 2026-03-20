'use client'

import { useState, useCallback } from 'react'
import { TemplateId, getTemplate, Template } from '@/lib/templates'

export interface HeadlineVariant {
  headline: string
  subheadline: string
}

export interface GeneratedContent {
  headline: string
  subheadline: string
  headline_variants?: HeadlineVariant[]
  recommended_index?: number
  features: Array<{ title: string; description: string }>
  howItWorks?: Array<{ step: number; title: string; description: string }>
  faq: Array<{ question: string; answer: string }>
  cta: string
  socialProof: string
}

interface LandingPagePreviewProps {
  data: GeneratedContent
  productName: string
  templateId?: TemplateId
  isPaidUser?: boolean
  onToast?: (message: string) => void
  generationId?: string | null
}

const FEATURE_ICONS = ['⚡', '🎯', '🔒', '📊', '🚀', '✨']

// Maps template IDs to concrete CSS values for self-contained HTML export
const THEME_CSS: Record<TemplateId, {
  heroGradient: string
  heroSubtextColor: string
  ctaBg: string
  ctaColor: string
  featureIconBg: string
  footerBg: string
}> = {
  saas: {
    heroGradient: 'linear-gradient(to bottom right, #312e81, #3730a3, #4c1d95)',
    heroSubtextColor: '#c7d2fe',
    ctaBg: '#ffffff',
    ctaColor: '#4338ca',
    featureIconBg: '#e0e7ff',
    footerBg: '#111827',
  },
  agency: {
    heroGradient: 'linear-gradient(to bottom right, #111827, #1e293b, #18181b)',
    heroSubtextColor: '#9ca3af',
    ctaBg: '#ffffff',
    ctaColor: '#111827',
    featureIconBg: '#f3f4f6',
    footerBg: '#000000',
  },
  freelancer: {
    heroGradient: 'linear-gradient(to bottom right, #d97706, #ea580c, #e11d48)',
    heroSubtextColor: '#fef3c7',
    ctaBg: '#ffffff',
    ctaColor: '#b45309',
    featureIconBg: '#fef3c7',
    footerBg: '#111827',
  },
  ecommerce: {
    heroGradient: 'linear-gradient(to bottom right, #047857, #0f766e, #0e7490)',
    heroSubtextColor: '#d1fae5',
    ctaBg: '#ffffff',
    ctaColor: '#047857',
    featureIconBg: '#d1fae5',
    footerBg: '#111827',
  },
  'local-business': {
    heroGradient: 'linear-gradient(to bottom right, #be123c, #b91c1c, #c2410c)',
    heroSubtextColor: '#ffe4e6',
    ctaBg: '#ffffff',
    ctaColor: '#be123c',
    featureIconBg: '#ffe4e6',
    footerBg: '#111827',
  },
}

function generateHtml(
  data: GeneratedContent,
  productName: string,
  template: Template,
  isPaidUser: boolean,
): string {
  const css = THEME_CSS[template.id] ?? THEME_CSS.saas

  const featuresHtml = data.features
    .map(
      (f, i) => `
        <div class="feature-card">
          <div class="feature-icon" style="background:${css.featureIconBg}">
            ${FEATURE_ICONS[i % FEATURE_ICONS.length]}
          </div>
          <h3 class="feature-title">${escapeHtml(f.title)}</h3>
          <p class="feature-desc">${escapeHtml(f.description)}</p>
        </div>`,
    )
    .join('')

  const howItWorksHtml = data.howItWorks && data.howItWorks.length > 0
    ? data.howItWorks
        .map(
          (step, i) => `
        <div class="hiw-step">
          <div class="hiw-number" style="background:${css.featureIconBg}">${String(i + 1).padStart(2, '0')}</div>
          <h3 class="hiw-title">${escapeHtml(step.title)}</h3>
          <p class="hiw-desc">${escapeHtml(step.description)}</p>
        </div>`,
        )
        .join('')
    : null

  const faqHtml = data.faq
    .map(
      (item, i) => `
        <div class="faq-item">
          <button class="faq-btn" onclick="toggleFaq(${i})" aria-expanded="false" id="faq-btn-${i}">
            <span>${escapeHtml(item.question)}</span>
            <svg class="faq-chevron" id="faq-chevron-${i}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div class="faq-answer" id="faq-answer-${i}" style="display:none">
            <p>${escapeHtml(item.answer)}</p>
          </div>
        </div>`,
    )
    .join('')

  const attributionHtml = isPaidUser
    ? ''
    : `<div class="attribution">
        Made with <a href="https://aiden.so" target="_blank" rel="noopener noreferrer">AIDEN</a>
       </div>`

  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(productName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.5; }
    a { color: inherit; }

    /* Hero */
    .hero {
      background: ${css.heroGradient};
      padding: 96px 24px;
      text-align: center;
    }
    .hero-inner { max-width: 768px; margin: 0 auto; }
    .hero h1 {
      font-size: clamp(1.75rem, 4vw, 3rem);
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    .hero-sub {
      margin-top: 16px;
      font-size: clamp(0.9rem, 2vw, 1.125rem);
      color: ${css.heroSubtextColor};
      max-width: 560px;
      margin-left: auto;
      margin-right: auto;
    }
    .cta-wrap { margin-top: 32px; display: flex; justify-content: center; }
    .cta-btn {
      display: inline-block;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      background: ${css.ctaBg};
      color: ${css.ctaColor};
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .social-proof {
      margin-top: 16px;
      font-size: 0.75rem;
      color: ${css.heroSubtextColor};
      opacity: 0.8;
    }

    /* Features */
    .features {
      background: #ffffff;
      padding: 80px 24px;
    }
    .features-inner { max-width: 960px; margin: 0 auto; }
    .section-heading {
      text-align: center;
      font-size: clamp(1.25rem, 3vw, 1.875rem);
      font-weight: 700;
      color: #111827;
    }
    .section-sub {
      text-align: center;
      margin-top: 12px;
      font-size: 0.875rem;
      color: #6b7280;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .features-grid {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
    .feature-card {
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 24px;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      margin-bottom: 12px;
    }
    .feature-title { font-size: 0.875rem; font-weight: 600; color: #111827; }
    .feature-desc { margin-top: 6px; font-size: 0.875rem; color: #4b5563; line-height: 1.6; }

    /* How It Works */
    .how-it-works {
      background: #f9fafb;
      padding: 80px 24px;
    }
    .hiw-inner { max-width: 960px; margin: 0 auto; }
    .hiw-grid {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 32px;
    }
    .hiw-step { text-align: center; }
    .hiw-number {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0 auto 16px;
    }
    .hiw-title { font-size: 0.875rem; font-weight: 600; color: #111827; }
    .hiw-desc { margin-top: 6px; font-size: 0.875rem; color: #4b5563; line-height: 1.6; }

    /* FAQ */
    .faq {
      background: #f9fafb;
      padding: 80px 24px;
    }
    .faq-inner { max-width: 640px; margin: 0 auto; }
    .faq-list {
      margin-top: 32px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .faq-item { border-bottom: 1px solid #e5e7eb; }
    .faq-item:last-child { border-bottom: none; }
    .faq-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }
    .faq-chevron {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: #9ca3af;
      transition: transform 0.2s;
    }
    .faq-chevron.open { transform: rotate(180deg); }
    .faq-answer { padding: 0 20px 16px; font-size: 0.875rem; color: #4b5563; line-height: 1.6; }

    /* Footer */
    .footer {
      background: ${css.footerBg};
      padding: 40px 24px;
      text-align: center;
    }
    .footer-name { font-size: 1rem; font-weight: 600; color: #ffffff; }
    .footer-copy { margin-top: 4px; font-size: 0.75rem; color: #6b7280; }
    .footer-links { margin-top: 16px; display: flex; justify-content: center; gap: 24px; }
    .footer-links span { font-size: 0.75rem; color: #6b7280; cursor: pointer; }

    /* Attribution */
    .attribution {
      background: #f3f4f6;
      text-align: center;
      padding: 12px;
      font-size: 0.75rem;
      color: #6b7280;
    }
    .attribution a { color: #4f46e5; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-inner">
      <h1>${escapeHtml(data.headline)}</h1>
      <p class="hero-sub">${escapeHtml(data.subheadline)}</p>
      <div class="cta-wrap">
        <button class="cta-btn">${escapeHtml(data.cta)}</button>
      </div>
      <p class="social-proof">${escapeHtml(data.socialProof)}</p>
    </div>
  </section>

  <!-- Features -->
  <section class="features">
    <div class="features-inner">
      <h2 class="section-heading">${escapeHtml(template.previewTheme.featuresHeading)}</h2>
      <p class="section-sub">${escapeHtml(template.previewTheme.featuresSubtext)}</p>
      <div class="features-grid">
        ${featuresHtml}
      </div>
    </div>
  </section>

  ${howItWorksHtml ? `<!-- How It Works -->
  <section class="how-it-works">
    <div class="hiw-inner">
      <h2 class="section-heading">How it works</h2>
      <div class="hiw-grid">
        ${howItWorksHtml}
      </div>
    </div>
  </section>` : ''}

  <!-- FAQ -->
  <section class="faq">
    <div class="faq-inner">
      <h2 class="section-heading">Frequently asked questions</h2>
      <div class="faq-list">
        ${faqHtml}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <p class="footer-name">${escapeHtml(productName)}</p>
    <p class="footer-copy">© ${year} ${escapeHtml(productName)}. All rights reserved.</p>
    <div class="footer-links">
      <span>Privacy</span>
      <span>Terms</span>
      <span>Contact</span>
    </div>
  </footer>

  ${attributionHtml}

  <script>
    function toggleFaq(index) {
      var answer = document.getElementById('faq-answer-' + index);
      var chevron = document.getElementById('faq-chevron-' + index);
      var btn = document.getElementById('faq-btn-' + index);
      var isOpen = answer.style.display !== 'none';
      answer.style.display = isOpen ? 'none' : 'block';
      chevron.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    }
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Copy icon SVG
function CopyIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

// Check icon SVG
function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

interface CopyButtonProps {
  text: string
  copiedKey: string | null
  id: string
  onCopy: (text: string, id: string) => void
  light?: boolean
}

function CopyButton({ text, copiedKey, id, onCopy, light = false }: CopyButtonProps) {
  const copied = copiedKey === id
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCopy(text, id)
      }}
      className={`
        inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium
        opacity-0 transition-opacity duration-150 group-hover:opacity-100
        ${light
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
        }
        ${copied ? (light ? 'opacity-100 bg-white/30' : 'opacity-100 bg-green-50 text-green-600') : ''}
      `}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copied!</span>
        </>
      ) : (
        <CopyIcon />
      )}
    </button>
  )
}

export default function LandingPagePreview({ data, productName, templateId, isPaidUser = false, onToast, generationId }: LandingPagePreviewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<number>(() => data.recommended_index ?? 0)
  const template = getTemplate(templateId)
  const theme = template.previewTheme

  const variants = data.headline_variants
  const activeVariant = variants?.[selectedVariant] ?? { headline: data.headline, subheadline: data.subheadline }
  const activeHeadline = activeVariant.headline
  const activeSubheadline = activeVariant.subheadline

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(id)
      setTimeout(() => setCopiedKey(null), 2000)
      onToast?.('Copied to clipboard!')
    })
  }, [onToast])

  function handleDownload() {
    const html = generateHtml(data, productName, template, isPaidUser)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-landing-page.html`
    a.click()
    URL.revokeObjectURL(url)
    onToast?.('HTML downloaded!')
  }

  function handleShare() {
    if (!generationId) return
    const url = `${window.location.origin}/preview/${generationId}`
    navigator.clipboard.writeText(url).then(() => {
      onToast?.('Share link copied!')
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Preview</p>
        <div className="flex items-center gap-2">
          {generationId && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share link
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download HTML
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
        {/* Headline variant tabs */}
        {variants && variants.length > 1 && (
          <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-4 py-2">
            <span className="mr-2 text-xs font-medium text-gray-500">Headlines:</span>
            {variants.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariant(i)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedVariant === i
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {String.fromCharCode(65 + i)}
                {i === (data.recommended_index ?? 0) && (
                  <span className={`ml-1 text-[10px] ${selectedVariant === i ? 'text-indigo-200' : 'text-indigo-500'}`}>★</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Hero */}
        <section className={`${theme.heroGradient} px-6 py-16 text-center sm:px-12 sm:py-24`}>
          <div className="mx-auto max-w-3xl">
            {/* Headline */}
            <div className="group relative inline-block">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                {activeHeadline}
              </h1>
              <div className="absolute -right-2 top-0 translate-x-full pl-1 hidden sm:block">
                <CopyButton text={activeHeadline} copiedKey={copiedKey} id="headline" onCopy={handleCopy} light />
              </div>
            </div>

            {/* Subheadline */}
            <div className="group relative mx-auto mt-4 max-w-xl">
              <p className={`text-base sm:text-lg ${theme.heroSubtext}`}>
                {activeSubheadline}
              </p>
              <div className="absolute -right-2 top-0 translate-x-full pl-1 hidden sm:block">
                <CopyButton text={activeSubheadline} copiedKey={copiedKey} id="subheadline" onCopy={handleCopy} light />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="group relative">
                <button className={`w-full rounded-lg px-8 py-3 text-sm font-semibold shadow-md transition sm:w-auto ${theme.ctaButton}`}>
                  {data.cta}
                </button>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full pl-1 hidden sm:block">
                  <CopyButton text={data.cta} copiedKey={copiedKey} id="cta" onCopy={handleCopy} light />
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="group relative mx-auto mt-4 inline-block">
              <p className={`text-xs sm:text-sm ${theme.heroSubtext} opacity-80`}>{data.socialProof}</p>
              <div className="absolute -right-2 top-0 translate-x-full pl-1 hidden sm:block">
                <CopyButton text={data.socialProof} copiedKey={copiedKey} id="socialProof" onCopy={handleCopy} light />
              </div>
            </div>
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
                  className={`group relative rounded-xl border border-gray-100 bg-gray-50 p-6 transition ${theme.featureHover}`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg ${theme.featureIconBg}`}>
                    {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{feature.description}</p>
                  <div className="absolute right-3 top-3">
                    <CopyButton
                      text={`${feature.title}\n${feature.description}`}
                      copiedKey={copiedKey}
                      id={`feature-${i}`}
                      onCopy={handleCopy}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        {data.howItWorks && data.howItWorks.length > 0 && (
          <section className="bg-gray-50 px-6 py-14 sm:px-12 sm:py-20">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
                How it works
              </h2>
              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {data.howItWorks.map((step, i) => (
                  <div key={i} className="group relative flex flex-col items-center text-center">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-gray-900 ${theme.featureIconBg}`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.description}</p>
                    <div className="absolute right-0 top-0">
                      <CopyButton
                        text={`${step.title}\n${step.description}`}
                        copiedKey={copiedKey}
                        id={`how-it-works-${i}`}
                        onCopy={handleCopy}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-gray-50 px-6 py-14 sm:px-12 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
              {data.faq.map((item, i) => (
                <div key={i} className="group relative">
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
                  <div className="absolute right-10 top-3">
                    <CopyButton
                      text={`${item.question}\n${item.answer}`}
                      copiedKey={copiedKey}
                      id={`faq-${i}`}
                      onCopy={handleCopy}
                    />
                  </div>
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
    </div>
  )
}
