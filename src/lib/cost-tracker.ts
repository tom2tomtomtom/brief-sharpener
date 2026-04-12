/**
 * API cost estimation, tracking, and budget enforcement.
 *
 * Estimates cost per analysis based on input/output token counts,
 * stores costs in Supabase `api_costs` table, and enforces daily/monthly
 * budget caps to prevent runaway spend on free-tier abuse.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Anthropic pricing (per million tokens) — update when rates change
const PRICING = {
  haiku: { input: 0.25, output: 1.25 },
  opus: { input: 15.0, output: 75.0 },
  sonnet: { input: 3.0, output: 15.0 },
} as const

// Budget caps — configurable via env, with safe defaults
const DAILY_BUDGET_USD = Number(process.env.DAILY_BUDGET_USD || '20')
const MONTHLY_BUDGET_USD = Number(process.env.MONTHLY_BUDGET_USD || '300')

// Free-tier specific caps (tighter than overall)
const DAILY_FREE_BUDGET_USD = Number(process.env.DAILY_FREE_BUDGET_USD || '10')

// ~4 chars per token is a reasonable estimate for English text
const CHARS_PER_TOKEN = 4

export type ModelTier = 'haiku' | 'opus' | 'sonnet'
export type UserTier = 'guest' | 'free' | 'single' | 'pro' | 'agency'

export interface CostEstimate {
  extractCost: number
  chatCost: number
  totalCost: number
  extractTokens: { input: number; output: number }
  chatTokens: { input: number; output: number }
}

export interface CostRecord {
  user_tier: UserTier
  user_id: string | null
  extract_input_tokens: number
  extract_output_tokens: number
  chat_input_tokens: number
  chat_output_tokens: number
  extract_cost_usd: number
  chat_cost_usd: number
  total_cost_usd: number
  brief_length: number
  response_length: number
  duration_ms: number
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function calculateCost(inputTokens: number, outputTokens: number, model: ModelTier): number {
  const pricing = PRICING[model]
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

export function estimateCost(
  briefText: string,
  promptText: string,
  extractResponse: string,
  chatResponse: string
): CostEstimate {
  const extractInputTokens = estimateTokens(briefText)
  const extractOutputTokens = estimateTokens(extractResponse)
  const chatInputTokens = estimateTokens(promptText)
  const chatOutputTokens = estimateTokens(chatResponse)

  const extractCost = calculateCost(extractInputTokens, extractOutputTokens, 'haiku')
  const chatCost = calculateCost(chatInputTokens, chatOutputTokens, 'opus')

  return {
    extractCost,
    chatCost,
    totalCost: extractCost + chatCost,
    extractTokens: { input: extractInputTokens, output: extractOutputTokens },
    chatTokens: { input: chatInputTokens, output: chatOutputTokens },
  }
}

export async function recordCost(
  supabase: SupabaseClient,
  record: CostRecord
): Promise<void> {
  try {
    await supabase.from('api_costs').insert({
      ...record,
      created_at: new Date().toISOString(),
    })

    logger.info('cost.recorded', {
      userTier: record.user_tier,
      totalCost: record.total_cost_usd.toFixed(4),
      chatCost: record.chat_cost_usd.toFixed(4),
      extractCost: record.extract_cost_usd.toFixed(4),
      briefLength: record.brief_length,
      durationMs: record.duration_ms,
    })
  } catch (err) {
    // Cost tracking should never break the main flow
    logger.error('cost.record_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

interface BudgetCheck {
  allowed: boolean
  reason?: string
  dailySpend: number
  monthlySpend: number
  dailyLimit: number
  monthlyLimit: number
}

export async function checkBudget(
  supabase: SupabaseClient,
  userTier: UserTier
): Promise<BudgetCheck> {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Daily spend check
    const { data: dailyData } = await supabase
      .from('api_costs')
      .select('total_cost_usd')
      .gte('created_at', todayStart)

    const dailySpend = (dailyData ?? []).reduce(
      (sum: number, row: { total_cost_usd: number }) => sum + (row.total_cost_usd ?? 0), 0
    )

    // Monthly spend check
    const { data: monthlyData } = await supabase
      .from('api_costs')
      .select('total_cost_usd')
      .gte('created_at', monthStart)

    const monthlySpend = (monthlyData ?? []).reduce(
      (sum: number, row: { total_cost_usd: number }) => sum + (row.total_cost_usd ?? 0), 0
    )

    // Free/guest tier gets tighter daily caps
    const isFreeTier = userTier === 'guest' || userTier === 'free'
    const effectiveDailyLimit = isFreeTier ? DAILY_FREE_BUDGET_USD : DAILY_BUDGET_USD

    if (dailySpend >= effectiveDailyLimit) {
      logger.warn('budget.daily_exceeded', {
        userTier,
        dailySpend: dailySpend.toFixed(2),
        limit: effectiveDailyLimit.toFixed(2),
      })
      return {
        allowed: false,
        reason: isFreeTier
          ? 'Free analysis temporarily unavailable. Please try again later or sign up for a paid plan.'
          : 'Daily API budget reached. Service will resume tomorrow.',
        dailySpend,
        monthlySpend,
        dailyLimit: effectiveDailyLimit,
        monthlyLimit: MONTHLY_BUDGET_USD,
      }
    }

    if (monthlySpend >= MONTHLY_BUDGET_USD) {
      logger.warn('budget.monthly_exceeded', {
        userTier,
        monthlySpend: monthlySpend.toFixed(2),
        limit: MONTHLY_BUDGET_USD.toFixed(2),
      })
      return {
        allowed: false,
        reason: 'Monthly API budget reached. Please contact support.',
        dailySpend,
        monthlySpend,
        dailyLimit: effectiveDailyLimit,
        monthlyLimit: MONTHLY_BUDGET_USD,
      }
    }

    return {
      allowed: true,
      dailySpend,
      monthlySpend,
      dailyLimit: effectiveDailyLimit,
      monthlyLimit: MONTHLY_BUDGET_USD,
    }
  } catch (err) {
    // If budget check fails, allow the request but log the error
    logger.error('budget.check_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return {
      allowed: true,
      dailySpend: 0,
      monthlySpend: 0,
      dailyLimit: DAILY_BUDGET_USD,
      monthlyLimit: MONTHLY_BUDGET_USD,
    }
  }
}
