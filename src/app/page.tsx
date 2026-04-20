import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import FAQAccordion from '@/components/FAQAccordion'
import TryDemoSection from '@/components/TryDemoSection'
import EmailCapture from '@/components/EmailCapture'
import ExampleOutputs from '@/components/ExampleOutputs'
import type { StatsResponse } from '@/app/api/stats/route'
import { verifyGatewayJWT, GW_COOKIE_NAME } from '@/lib/gateway-jwt'

export const metadata: Metadata = {
  title: 'AIDEN Brief Intelligence | AI-Powered Brief Analysis',
  description: 'Paste your brief. AIDEN interrogates it with AI-powered creative analysis. Get gaps identified and a sharper brief back quickly. Start free.',
  alternates: {
    canonical: 'https://brief-sharpener.aiden.services',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AIDEN Brief Intelligence',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered brief analysis tool that interrogates creative briefs across 7 strategic frameworks to identify gaps and produce sharper briefs.',
  url: 'https://brief-sharpener.aiden.services',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      description: '3 brief analyses per month',
    },
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '30',
      priceCurrency: 'USD',
      description: '50 brief analyses, never expires',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '99',
      priceCurrency: 'USD',
      description: 'Unlimited brief analyses for agencies and teams',
    },
  ],
  publisher: {
    '@type': 'Organization',
    name: 'AIDEN',
    url: 'https://brief-sharpener.aiden.services',
  },
}

async function getStats(): Promise<StatsResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://brief-sharpener.aiden.services'
    const res = await fetch(`${baseUrl}/api/stats`, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error('Stats fetch failed')
    return res.json() as Promise<StatsResponse>
  } catch {
    return { briefCount: 0, avgScore: 72, gapCount: 0 }
  }
}

const steps = [
  {
    number: '01',
    title: 'Paste your brief',
    description: 'Drop in your campaign brief, creative brief, or strategy document. Any format works — rough notes to polished docs.',
  },
  {
    number: '02',
    title: 'AIDEN interrogates it',
    description: 'Expert creative perspectives — strategists, planners, and creatives — stress-test every line. They find what you missed and why it matters.',
  },
  {
    number: '03',
    title: 'Get gaps identified and brief rewritten',
    description: 'Receive a full gap report and a sharpened brief ready to brief your team. Clear, specific, and built to produce better creative.',
  },
]

const weakBrief = {
  title: 'Original brief',
  content: [
    { label: 'Objective', value: 'Increase brand awareness and drive sales for our new product launch.' },
    { label: 'Audience', value: 'Young adults who like our brand.' },
    { label: 'Key message', value: 'Our product is innovative and high quality.' },
    { label: 'Deliverables', value: 'Social posts, some video, maybe a campaign.' },
    { label: 'Tone', value: 'Fun and engaging.' },
  ],
  badge: 'Weak brief',
  badgeColor: 'border border-red-hot/50 text-red-hot bg-black-card',
}

const strongBrief = {
  title: 'AIDEN-sharpened brief',
  content: [
    { label: 'Objective', value: 'Drive 12% uplift in trial sign-ups among lapsed users aged 25–34 within 6 weeks of launch.' },
    { label: 'Audience', value: 'Lapsed users (12–18 months inactive) who tried the product but never converted — they need a reason to believe again, not a reason to discover.' },
    { label: 'Key message', value: 'This is not the product you left. Here\'s the one thing that\'s actually different now.' },
    { label: 'Deliverables', value: '3× paid social (Meta/TikTok), 1× 30s hero film, 6× retargeting banners. All laddering to a dedicated landing page.' },
    { label: 'Tone', value: 'Direct and honest. No hype. Like a friend who knows they let you down and is showing you why it\'s worth another chance.' },
  ],
  badge: 'AIDEN-sharpened',
  badgeColor: 'border border-orange-accent/50 text-orange-accent bg-black-card',
}

const gapTypes = [
  { icon: '👤', title: 'Missing audience insight', description: 'Demographics without psychology. "25–34 urban professionals" is not an insight. AIDEN finds who they really are and what actually moves them.' },
  { icon: '🎯', title: 'Vague objectives', description: '"Increase awareness" is not a brief objective. AIDEN rewrites it as a measurable outcome with a timeframe and a success bar.' },
  { icon: '⚡', title: 'No tension or conflict', description: 'Great briefs have a problem worth solving. AIDEN identifies the cultural or category tension your creative should exploit.' },
  { icon: '📋', title: 'Weak deliverables', description: 'Briefs that say "social content, maybe video" are briefs that produce forgettable work. AIDEN specifies format, platform, and purpose for each asset.' },
  { icon: '💬', title: 'Fuzzy tone of voice', description: '"Fun and engaging" briefs produce average creative. AIDEN translates tone into a behavioural guide your team can actually follow.' },
  { icon: '🔗', title: 'No single-minded proposition', description: 'Briefs that try to say five things say nothing. AIDEN isolates the one thing worth saying and builds a brief around it.' },
]

export default async function MarketingPage() {
  // If the user arrives with a live Gateway session, drop them straight
  // into the app. Prevents the "Log in / Try free" marketing chrome from
  // appearing for authenticated hub users arriving via subdomain SSO.
  const jar = await cookies()
  const gwToken = jar.get(GW_COOKIE_NAME)?.value
  if (gwToken) {
    const payload = await verifyGatewayJWT(gwToken)
    if (payload) redirect('/dashboard')
  }

  const stats = await getStats()

  return (
    <main id="main-content" className="min-h-screen bg-black-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar />

      {/* Live stats bar */}
      {stats.briefCount > 0 && (
        <section className="border-b border-border-subtle bg-red-hot py-2.5">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm font-medium text-white-muted">
              <span>
                <span className="font-bold text-white">{stats.briefCount.toLocaleString()}</span> briefs interrogated
              </span>
              <span className="hidden sm:inline text-white-dim">·</span>
              <span>
                Average score: <span className="font-bold text-white">{stats.avgScore}/100</span>
              </span>
              <span className="hidden sm:inline text-white-dim">·</span>
              <span>
                <span className="font-bold text-white">{stats.gapCount.toLocaleString()}</span> gaps found
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="bg-black-deep px-4 pt-20 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 border border-border-subtle bg-black-card px-3 py-1 text-xs font-medium text-orange-accent mb-6">
            AI-powered creative analysis · Powered by Claude AI
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white uppercase sm:text-6xl leading-tight">
            Your brief is{' '}
            <span className="text-red-hot whitespace-nowrap">holding you back.</span>
            <br />
            AIDEN will show you&nbsp;why.
          </h1>
          <p className="mt-6 text-xl text-white-muted max-w-2xl mx-auto leading-relaxed">
            Brief Intelligence interrogates your brief the way the best strategists do — relentlessly, specifically, and without mercy. Find every gap before it becomes a missed opportunity.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/generate"
              className="w-full sm:w-auto bg-red-hot px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-red-dim transition-colors"
            >
              Interrogate your brief — free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto border border-border-subtle bg-black-card px-8 py-4 text-base font-semibold text-white-muted hover:border-border-strong transition-colors"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-white-dim">No credit card required · 200 free tokens on signup (about 10 analyses)</p>
        </div>
      </section>

      {/* Social proof stats bar */}
      <section className="border-b border-border-subtle bg-black-ink px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border-subtle border-2 border-border-subtle">
            <div className="bg-black-card px-8 py-10 text-center">
              <p className="text-4xl font-bold text-red-hot">
                {stats.briefCount > 0 ? stats.briefCount.toLocaleString() : '—'}
              </p>
              <p className="mt-2 text-xs text-white-dim uppercase tracking-wide">Briefs Analysed</p>
            </div>
            <div className="bg-black-card px-8 py-10 text-center">
              <p className="text-4xl font-bold text-red-hot">{stats.avgScore}/100</p>
              <p className="mt-2 text-xs text-white-dim uppercase tracking-wide">Average Brief Score</p>
            </div>
            <div className="bg-black-card px-8 py-10 text-center">
              <p className="text-4xl font-bold text-red-hot">
                {stats.gapCount > 0 ? stats.gapCount.toLocaleString() : '—'}
              </p>
              <p className="mt-2 text-xs text-white-dim uppercase tracking-wide">Gaps Identified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border-subtle bg-black-deep py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Powered by AIDEN Brain V2' },
              { label: 'AI Creative Analysis' },
              { label: 'Built for agencies and brands' },
              { label: 'Built with Claude AI' },
            ].map(({ label }) => (
              <span
                key={label}
                className="border border-border-subtle bg-black-card px-4 py-1.5 text-xs font-medium text-white-muted"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-white-muted">Three steps from weak brief to sharp strategy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col border border-transparent p-6 transition-all duration-200 hover:border-border-subtle hover:bg-black-card">
                <span className="text-5xl font-black text-red-hot leading-none mb-4">{step.number}</span>
                <h3 className="text-lg font-semibold text-white uppercase mb-2">{step.title}</h3>
                <p className="text-white-muted text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="bg-black-deep px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 border border-border-subtle bg-black-card px-3 py-1 text-xs font-medium text-orange-accent mb-4">
              Real example
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
              The difference a sharp brief makes
            </h2>
            <p className="mt-4 text-lg text-white-muted max-w-xl mx-auto">
              See exactly how AIDEN transforms a vague, underspecified brief into something your team can actually use.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Weak brief */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white-dim uppercase tracking-widest">
                  <span className="flex h-6 w-6 items-center justify-center bg-black-card text-xs font-bold text-white-muted">1</span>
                  {weakBrief.title}
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold ${weakBrief.badgeColor}`}>
                  {weakBrief.badge}
                </span>
              </div>
              <div className="border border-border-subtle bg-black-card overflow-hidden">
                <div className="border-b border-border-subtle bg-black-deep px-5 py-3 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-300" />
                  <span className="h-3 w-3 rounded-full bg-yellow-300" />
                  <span className="h-3 w-3 rounded-full bg-green-300" />
                  <span className="ml-2 text-xs text-white-dim">campaign-brief-v3-FINAL.doc</span>
                </div>
                <div className="px-6 py-6 space-y-5">
                  {weakBrief.content.map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs font-semibold text-white-dim mb-1.5">{field.label}</label>
                      <div className="border border-red-hot/30 bg-black-ink px-3.5 py-2.5 text-sm text-white-muted">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sharp brief */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white-dim uppercase tracking-widest">
                  <span className="flex h-6 w-6 items-center justify-center bg-red-hot text-xs font-bold text-white">2</span>
                  {strongBrief.title}
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold ${strongBrief.badgeColor}`}>
                  {strongBrief.badge}
                </span>
              </div>
              <div className="border border-border-strong bg-black-card overflow-hidden">
                <div className="border-b border-border-subtle bg-black-deep px-5 py-3 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-300" />
                  <span className="h-3 w-3 rounded-full bg-yellow-300" />
                  <span className="h-3 w-3 rounded-full bg-green-300" />
                  <span className="ml-2 text-xs text-white-dim">brief-intelligence-output.pdf</span>
                </div>
                <div className="px-6 py-6 space-y-5">
                  {strongBrief.content.map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs font-semibold text-orange-accent mb-1.5">{field.label}</label>
                      <div className="border border-border-subtle bg-black-ink px-3.5 py-2.5 text-sm text-white-muted leading-relaxed">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-white-dim mb-4">Your brief. Interrogated. Sharpened. Ready to brief your team.</p>
            <Link
              href="/generate"
              className="inline-block bg-red-hot px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-red-dim transition-colors"
            >
              Interrogate your brief — free
            </Link>
            <p className="mt-3 text-xs text-white-dim">No credit card required</p>
          </div>
        </div>
      </section>

      {/* What AIDEN finds */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
              What AIDEN finds
            </h2>
            <p className="mt-4 text-lg text-white-muted max-w-xl mx-auto">
              Six types of gaps that kill creative work before it starts. AIDEN identifies all of them.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gapTypes.map((gap) => (
              <div key={gap.title} className="border border-border-subtle bg-black-card p-6 transition-all duration-200 hover:border-border-strong hover:-translate-y-0.5">
                <div className="text-2xl mb-3">{gap.icon}</div>
                <h3 className="text-base font-semibold text-white uppercase mb-2">{gap.title}</h3>
                <p className="text-sm text-white-muted leading-relaxed">{gap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-black-deep px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg text-white-muted">
            Built for agency strategists. Requested as the #1 tool by Uncommon Creative&apos;s strategy team.
          </p>
        </div>
      </section>

      {/* Try it now demo */}
      <TryDemoSection />

      {/* Example outputs */}
      <div id="examples">
        <ExampleOutputs />
      </div>

      {/* Pricing */}
      <section id="pricing" className="bg-black-deep px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-4 text-lg text-white-muted max-w-xl mx-auto">
            Start free. Go Pro when your briefs need to be immaculate.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                name: 'Free',
                price: '$0',
                period: '',
                description: '3 analyses per month',
                features: [
                  'Full gap analysis report',
                  'Brief rewrite included',
                  'AIDEN branding on output',
                ],
                cta: 'Start free',
                href: '/generate',
                highlight: false,
              },
              {
                name: 'Starter',
                price: '$30',
                period: 'one-time',
                description: '50 analyses, never expires',
                features: [
                  'Full strategic output',
                  'No AIDEN branding',
                  'Use them whenever',
                ],
                cta: 'Buy 50 analyses',
                href: '/pricing',
                highlight: true,
              },
              {
                name: 'Pro',
                price: '$99',
                period: '/ month',
                description: 'Unlimited for agencies and teams',
                features: [
                  'Unlimited brief analyses',
                  'Priority processing',
                  'No AIDEN branding',
                ],
                cta: 'Go Pro',
                href: '/pricing',
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`p-7 ${
                  tier.highlight
                    ? 'bg-red-hot text-white ring-2 ring-red-hot'
                    : 'bg-black-card border border-border-subtle'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${tier.highlight ? 'text-white-muted' : 'text-orange-accent'}`}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className={`text-sm ${tier.highlight ? 'text-white-muted' : 'text-white-muted'}`}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-5 ${tier.highlight ? 'text-white-muted' : 'text-white-muted'}`}>
                  {tier.description}
                </p>
                <ul className={`space-y-2 mb-6 text-sm ${tier.highlight ? 'text-white-muted' : 'text-white-muted'}`}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className={`text-base leading-none ${tier.highlight ? 'text-white-muted' : 'text-orange-accent'}`}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`block text-center py-2.5 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-black-ink text-red-hot hover:bg-black-deep'
                      : 'bg-red-hot text-white hover:bg-red-dim'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-sm text-white-muted mb-2">
              Need team access?{' '}
              <Link href="/pricing" className="font-medium text-orange-accent hover:text-red-hot transition-colors">
                See Agency pricing →
              </Link>
            </p>
          </div>
          <div className="mt-4">
            <Link href="/pricing" className="text-sm font-medium text-orange-accent hover:text-red-hot transition-colors">
              See full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <div id="faq">
        <FAQAccordion />
      </div>

      {/* Final CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl">
            Your brief deserves better
          </h2>
          <p className="mt-4 text-lg text-white-muted">
            Stop briefing your team with gaps. AIDEN finds them first.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/generate"
              className="w-full sm:w-auto bg-red-hot px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-red-dim transition-colors"
            >
              Interrogate your brief — free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto border border-border-subtle bg-black-card px-8 py-4 text-base font-semibold text-white-muted hover:border-border-strong transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-white-dim">No credit card required · 200 free tokens on signup (about 10 analyses)</p>
        </div>
      </section>

      {/* Email capture */}
      <EmailCapture />

    </main>
  )
}
