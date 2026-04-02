import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — AIDEN',
  description: 'Privacy policy for AIDEN Brief Intelligence.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black-ink">
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
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase mb-2">Privacy Policy</h1>
          <p className="text-sm text-white-dim mb-12">Last updated: March 2026</p>

          <div className="space-y-10 text-sm text-white-muted leading-relaxed">

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">1. What We Collect</h2>
              <p>We collect only what is necessary to run the service:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li><strong className="text-white">Email address:</strong> Collected when you create an account or sign in. Used for authentication and to send you important account-related messages (e.g. billing receipts, password resets).</li>
                <li><strong className="text-white">Product descriptions:</strong> The text you enter when generating a landing page. Stored to power the generation and accessible in your dashboard.</li>
                <li><strong className="text-white">Usage data:</strong> Number of generations used, plan type, and timestamps. Used to enforce plan limits and improve the service.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">2. Payments</h2>
              <p>
                All payments are processed by{' '}
                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-orange-accent hover:opacity-80 transition-opacity">
                  Stripe
                </a>
                . We never see or store your credit card details — Stripe handles all card data under their own
                PCI-compliant infrastructure. We receive a customer ID and subscription status from Stripe so we
                know which plan you are on.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">3. Analytics</h2>
              <p>
                We use Vercel Analytics to understand how the site is used — page views, country of origin, and
                general usage patterns. This data is aggregated and not linked to individual users. No
                third-party advertising trackers are used.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">4. Cookies</h2>
              <p>
                We use cookies solely for authentication. When you sign in, a session cookie is set so you stay
                logged in. This cookie is essential for the service to function and does not track you across
                other websites.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">5. We Do Not Sell Your Data</h2>
              <p>
                We do not sell, rent, or share your personal information with third parties for marketing
                purposes. Full stop.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">6. Data Retention</h2>
              <p>
                Your account data and generated pages are retained as long as your account is active. You can
                delete your account at any time by contacting us, and we will remove your personal data within
                30 days.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">7. Third-Party Services</h2>
              <p>We use the following third-party services to run AIDEN:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li><strong className="text-white">Supabase:</strong> Authentication and database hosting.</li>
                <li><strong className="text-white">Stripe:</strong> Payment processing.</li>
                <li><strong className="text-white">Anthropic (Claude):</strong> AI content generation. Your product description is sent to Anthropic&apos;s API to generate the landing page copy.</li>
                <li><strong className="text-white">Vercel:</strong> Hosting and analytics.</li>
              </ul>
              <p className="mt-3">Each of these services operates under their own privacy policies.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be communicated via email.
                The date at the top of this page reflects when it was last updated.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white uppercase mb-3">9. Contact</h2>
              <p>
                Privacy questions or data requests? Email us at{' '}
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
