import { SupabaseClient } from '@supabase/supabase-js'

export type Plan = 'free' | 'single' | 'pro'

export interface PlanLimits {
  plan: Plan
  limit: number | null // null = unlimited
  used: number
  resetType: 'monthly' | 'lifetime' | 'none'
}

const PLAN_LIMITS: Record<Plan, { limit: number | null; resetType: PlanLimits['resetType'] }> = {
  free: { limit: 1, resetType: 'monthly' },
  single: { limit: 10, resetType: 'lifetime' },
  pro: { limit: null, resetType: 'none' },
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<Plan> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()

  return (data?.plan as Plan) ?? 'free'
}

export async function getPlanLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanLimits> {
  const plan = await getUserPlan(supabase, userId)
  const config = PLAN_LIMITS[plan]

  if (plan === 'pro') {
    return { plan, limit: null, used: 0, resetType: 'none' }
  }

  const month = plan === 'single' ? 'total' : currentMonth()

  const { data } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  return {
    plan,
    limit: config.limit,
    used: data?.count ?? 0,
    resetType: config.resetType,
  }
}

export async function canGenerate(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; planLimits: PlanLimits }> {
  const planLimits = await getPlanLimits(supabase, userId)

  if (planLimits.limit === null) {
    return { allowed: true, planLimits }
  }

  return { allowed: planLimits.used < planLimits.limit, planLimits }
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan
): Promise<void> {
  const month = plan === 'single' ? 'total' : currentMonth()

  await supabase.rpc('increment_usage', { p_user_id: userId, p_month: month })
}
