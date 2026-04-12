import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? ''

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()

  const [todayRes, weekRes, monthRes, recentRes] = await Promise.all([
    supabase.from('api_costs').select('total_cost_usd, user_tier').gte('created_at', todayStart),
    supabase.from('api_costs').select('total_cost_usd, user_tier').gte('created_at', weekStart),
    supabase.from('api_costs').select('total_cost_usd, user_tier').gte('created_at', monthStart),
    supabase.from('api_costs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  function aggregate(rows: Array<{ total_cost_usd: number; user_tier: string }> | null) {
    const data = rows ?? []
    const total = data.reduce((s, r) => s + (r.total_cost_usd ?? 0), 0)
    const byTier: Record<string, { count: number; cost: number }> = {}
    for (const r of data) {
      const tier = r.user_tier ?? 'unknown'
      if (!byTier[tier]) byTier[tier] = { count: 0, cost: 0 }
      byTier[tier].count++
      byTier[tier].cost += r.total_cost_usd ?? 0
    }
    return { totalCost: Math.round(total * 10000) / 10000, count: data.length, byTier }
  }

  return NextResponse.json({
    today: aggregate(todayRes.data),
    week: aggregate(weekRes.data),
    month: aggregate(monthRes.data),
    budgets: {
      dailyLimit: Number(process.env.DAILY_BUDGET_USD || '20'),
      monthlyLimit: Number(process.env.MONTHLY_BUDGET_USD || '300'),
      dailyFreeLimit: Number(process.env.DAILY_FREE_BUDGET_USD || '10'),
    },
    recent: (recentRes.data ?? []).map(r => ({
      userTier: r.user_tier,
      totalCost: r.total_cost_usd,
      chatCost: r.chat_cost_usd,
      briefLength: r.brief_length,
      responseLength: r.response_length,
      durationMs: r.duration_ms,
      createdAt: r.created_at,
    })),
  })
}
