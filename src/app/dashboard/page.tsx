import type { Metadata } from 'next'
import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBalance } from '@/lib/gateway-tokens'
import { AidenLogo } from '@/components/ui/aiden-logo'
import { redirect } from 'next/navigation'
import DashboardSearch from '@/components/DashboardSearch'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your brief analysis history and manage your AIDEN account.',
}

function scoreFromOutputCopy(outputCopy: unknown): number | null {
  if (!outputCopy || typeof outputCopy !== 'object') return null
  const o = outputCopy as Record<string, unknown>
  if (typeof o.score === 'number') return o.score
  if (typeof o.briefScore === 'number') return o.briefScore
  return null
}

interface GenerationRecord {
  id: string
  input_data: {
    productName?: string
    productDescription?: string
    briefText?: string
    brandName?: string
    template?: string
    targetAudience?: string
    tone?: string
  }
  output_copy: unknown
  template_id: string | null
  created_at: string
}

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()
  const [{ data: generations }, balance] = await Promise.all([
    adminSupabase
      .from('generations')
      .select('id, input_data, output_copy, template_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    getBalance(user.id),
  ])

  const plan = balance?.plan ?? 'free'
  const tokenBalance = balance?.balance ?? 0
  const lifetimeUsed = balance?.lifetime_used ?? 0
  const lifetimePurchased = balance?.lifetime_purchased ?? 0
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const isOutOfTokens = tokenBalance <= 0
  const isLowOnTokens = !isOutOfTokens && tokenBalance < 20
  const progressMax = Math.max(lifetimePurchased, tokenBalance + lifetimeUsed, 1)

  const totalAnalyses = generations?.length ?? 0
  const avgScore = totalAnalyses > 0
    ? Math.round(
        (generations as GenerationRecord[])
          .map(g => scoreFromOutputCopy(g.output_copy))
          .filter((s): s is number => s !== null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0)
      )
    : null

  async function signOut() {
    'use server'
    redirect('https://www.aiden.services/auth/logout')
  }

  return (
    <main id="main-content" className="min-h-screen bg-black-ink">
      <header className="border-b-2 border-red-hot bg-black-deep sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl tracking-tight flex items-center gap-1">
              <AidenLogo size="md" />
              <span className="aiden-app-name text-white-dim">.Brief&nbsp;Sharpener</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/generate" className="bg-red-hot px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-hot/90 transition-colors">
                New analysis
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-white-full font-medium">{tokenBalance}</span>
                <span className="text-white-dim text-xs">tokens</span>
              </div>
              <Link
                href="https://www.aiden.services/pricing"
                className="text-white-dim text-sm hover:text-red-hot transition-colors"
              >
                Pricing
              </Link>
              <a
                href="https://www.aiden.services/dashboard"
                className="text-white-dim text-sm hover:text-red-hot transition-colors"
              >
                Back to Hub
              </a>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-white-dim text-sm hover:text-red-hot transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {isOutOfTokens && (
          <div className="border border-red-hot/30 bg-red-hot/10 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-white">
              You are out of AIDEN tokens. Top up to keep analysing briefs.
            </p>
            <Link href="https://www.aiden.services/pricing" className="shrink-0 bg-red-hot px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
              Buy tokens
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-border-subtle bg-black-card p-5">
            <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Plan</p>
            <p className="mt-1 text-2xl font-bold text-white">{planLabel}</p>
          </div>
          <div className="border border-border-subtle bg-black-card p-5">
            <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Tokens</p>
            <p className="mt-1 text-2xl font-bold text-white">{tokenBalance}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-border-subtle">
              <div
                className={`h-1.5 rounded-full transition-all ${isOutOfTokens ? 'bg-red-hot' : isLowOnTokens ? 'bg-orange-accent' : 'bg-green-500'}`}
                style={{ width: `${Math.min((tokenBalance / progressMax) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="border border-border-subtle bg-black-card p-5">
            <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Total analyses</p>
            <p className="mt-1 text-2xl font-bold text-white">{totalAnalyses}</p>
          </div>
          <div className="border border-border-subtle bg-black-card p-5">
            <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Avg score</p>
            <p className="mt-1 text-2xl font-bold text-white">{avgScore !== null ? `${avgScore}/100` : 'N/A'}</p>
          </div>
        </div>

        {isLowOnTokens && (
          <div className="border border-yellow-electric/20 bg-black-card px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-white-muted">
              Running low on tokens ({tokenBalance} left). One brief analysis costs 20 tokens.
            </p>
            <Link href="https://www.aiden.services/pricing" className="text-sm font-medium text-orange-accent underline hover:opacity-80">
              Top up
            </Link>
          </div>
        )}

        {/* User info */}
        <div className="border border-border-subtle bg-black-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center bg-red-hot/20 border border-red-hot/30">
                <span className="text-sm font-semibold text-red-hot">
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.email}</p>
                <p className="text-xs text-white-dim">{planLabel} plan · Authenticated via magic link</p>
              </div>
            </div>
            <Link href="https://www.aiden.services/pricing" className="border border-border-subtle px-3 py-1.5 text-xs font-medium text-white-muted hover:text-white hover:border-white transition-colors">
              Buy tokens
            </Link>
          </div>
        </div>

        {/* Brief analysis history with search */}
        <div className="border border-border-subtle bg-black-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white uppercase">Brief Analyses</h2>
            <Link href="/generate" className="bg-red-hot px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
              Analyse new brief
            </Link>
          </div>

          {generations && generations.length >= 2 && (() => {
            const scoredGens = (generations as GenerationRecord[])
              .slice()
              .reverse()
              .slice(-10)
              .map(g => scoreFromOutputCopy(g.output_copy))
              .filter((s): s is number => s !== null)
            if (scoredGens.length < 2) return null
            const W = 200
            const H = 40
            const PAD = 4
            const min = Math.min(...scoredGens)
            const max = Math.max(...scoredGens)
            const range = max - min || 1
            const points = scoredGens
              .map((s, i) => {
                const x = PAD + (i / (scoredGens.length - 1)) * (W - PAD * 2)
                const y = PAD + (1 - (s - min) / range) * (H - PAD * 2)
                return `${x},${y}`
              })
              .join(' ')
            return (
              <div className="mb-6 border border-border-subtle bg-black-ink px-5 py-4">
                <p className="text-xs font-medium text-white-dim uppercase tracking-wide mb-3">Score trend</p>
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Score trend sparkline">
                  <polyline points={points} fill="none" stroke="#ff2e2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )
          })()}

          {!generations || generations.length === 0 ? (
            <p className="text-sm text-white-muted">
              No analyses yet.{' '}
              <Link href="/generate" className="text-orange-accent hover:underline">Analyse your first brief</Link>.
            </p>
          ) : (
            <DashboardSearch
              generations={JSON.parse(JSON.stringify(generations))}
              isPaidPlan={plan !== 'free'}
            />
          )}
        </div>
      </div>
    </main>
  )
}
