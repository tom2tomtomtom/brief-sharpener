const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'AIDEN_API_KEY',
  'AIDEN_SERVICE_KEY',
] as const

const optionalVars = ['NEXT_PUBLIC_URL', 'AIDEN_BRAIN_API_URL', 'AIDEN_BRAIN_API_KEY', 'AIDEN_API_URL', 'GATEWAY_URL'] as const

type RequiredVars = (typeof requiredVars)[number]
type OptionalVars = (typeof optionalVars)[number]

type Env = Record<RequiredVars, string> & Partial<Record<OptionalVars, string>>

// Canonical AIDEN hub Supabase project. Fail loudly if NEXT_PUBLIC_SUPABASE_URL
// points anywhere else. This prevents silent misrouting to a legacy/decommissioned
// project (ref: 2026-04-19 Pitch incident, where hardcoded fallbacks
// `|| 'https://ahenbjcauqpzsdcxeyfa.supabase.co'` silently redirected the
// backend whenever Railway env wasn't threaded through).
const EXPECTED_PROJECT_REFS = new Set(['bktujlufguenjytbdndn'])

function validateSupabaseProjectRef(url: string): void {
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/)
  const ref = match?.[1]
  if (!ref || !EXPECTED_PROJECT_REFS.has(ref)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL points at an unexpected project (ref: ${ref ?? 'unparseable'}). ` +
        `Expected one of: ${Array.from(EXPECTED_PROJECT_REFS).join(', ')}. ` +
        'Update Railway env or add the new ref to EXPECTED_PROJECT_REFS in src/lib/env.ts.'
    )
  }
}

function validateEnv(): Env {
  const missing = requiredVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nCheck your .env.local file or deployment environment configuration.`
    )
  }

  validateSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL as string)

  const env: Env = {} as Env

  for (const key of requiredVars) {
    env[key] = process.env[key] as string
  }

  for (const key of optionalVars) {
    if (process.env[key]) {
      env[key] = process.env[key]
    }
  }

  return env
}

// Only validate at runtime, not during build
export const env: Env =
  process.env.NODE_ENV === 'test' || typeof window !== 'undefined'
    ? ({} as Env)
    : (() => {
        // Skip validation during Next.js build phase
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          return {} as Env
        }
        return validateEnv()
      })()

export function validateEnvOnStartup(): void {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  validateEnv()
}
