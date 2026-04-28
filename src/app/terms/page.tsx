import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | AIDEN',
  description: 'Terms of service for AIDEN brief analysis tool.',
}

export default function TermsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-black-ink">
      {/* Nav */}
      <nav className="border-b border-border-subtle bg-black-ink/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold tracking-tight text-white uppercase">AIDEN</Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-white-muted hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-white-muted hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/generate" className="rounded-lg bg-red-hot px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase mb-2">Terms of Service</h1>
          <p className="text-sm text-white-dim mb-12">Last updated: March 2026</p>

          <div className="space-y-10 text-sm text-white-muted leading-relaxed">

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">1. The Service</h2>
              <p>
                AIDEN Brief Intelligence is an AI-powered brief analysis tool. When you provide a creative brief,
                AIDEN uses AI to identify gaps, assumptions, and ambiguities, then generates a scored analysis with
                strategic recommendations, classic benchmark comparisons, and a rewritten brief. The analysis is
                created by AI models and may not be suitable for all use cases without human review.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">2. Ownership of Generated Output</h2>
              <p>
                You own the brief analyses AIDEN generates for you. Once downloaded, the analyses and
                recommendations are yours to use, modify, and distribute however you see fit, commercially or
                otherwise, without attribution to AIDEN (except on the free plan, which includes a small
                &ldquo;Analysed by AIDEN&rdquo; attribution when copied).
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">3. No Warranty on Results</h2>
              <p>
                AIDEN generates brief analysis using proven strategic frameworks, but we make no guarantees about
                creative outcomes, revenue results, or business performance. Brief quality depends on many
                factors outside our control, including your inputs, audience, and creative execution.
                The service is provided &ldquo;as is&rdquo; without warranty of any kind.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">4. Payment Terms</h2>
              <p className="mb-3">AIDEN offers the following plans:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Free:</strong> 3 brief analyses per month at no cost. No credit card required.</li>
                <li><strong className="text-white">Single ($30 one-time):</strong> 50 brief analyses with no attribution footer. This is a one-time charge &mdash; you will not be billed again.</li>
                <li><strong className="text-white">Pro ($99/month):</strong> Unlimited brief analyses billed monthly. You can cancel at any time; cancellation takes effect at the end of the current billing period.</li>
              </ul>
              <p className="mt-3">
                All payments are processed by Stripe. Charges appear on your statement as &ldquo;AIDEN&rdquo;. We do not
                offer refunds on completed analyses, but please contact us if you experience a technical issue.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">5. Right to Modify Pricing</h2>
              <p>
                We reserve the right to change our pricing at any time. If you are on a Pro subscription, we
                will give you at least 30 days notice before any price increase takes effect. Continued use of
                the service after a price change constitutes acceptance of the new pricing.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">6. Acceptable Use</h2>
              <p>
                You may not use AIDEN to generate content that is illegal, deceptive, defamatory, or that
                infringes on third-party intellectual property. We reserve the right to suspend accounts that
                violate these terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">7. Changes to These Terms</h2>
              <p>
                We may update these terms from time to time. We will notify users of material changes via email.
                Your continued use of the service constitutes acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">8. Contact</h2>
              <p>
                Questions about these terms? Email us at{' '}
                <a href="mailto:hello@aiden.services" className="text-orange-accent hover:opacity-80 transition-opacity">
                  hello@aiden.services
                </a>
                .
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white-dim">
          <Link href="/" className="font-semibold text-white uppercase">AIDEN</Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          <span>Built with Claude AI by Anthropic</span>
        </div>
      </footer>
    </main>
  )
}
