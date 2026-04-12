const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_SINGLE',
  'STRIPE_PRICE_ID_PRO',
  'STRIPE_PRICE_ID_AGENCY',
  'AIDEN_API_KEY',
] as const

const optionalVars = ['NEXT_PUBLIC_URL', 'AIDEN_BRAIN_API_URL', 'AIDEN_BRAIN_API_KEY', 'AIDEN_API_URL'] as const

type RequiredVars = (typeof requiredVars)[number]
type OptionalVars = (typeof optionalVars)[number]

type Env = Record<RequiredVars, string> & Partial<Record<OptionalVars, string>>

function validateEnv(): Env {
  const missing = requiredVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nCheck your .env.local file or deployment environment configuration.`
    )
  }

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
