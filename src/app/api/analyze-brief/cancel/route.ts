import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { refundTokens } from '@/lib/gateway-tokens'

// Analyse costs 20 tokens. Refund the same amount on cancel within grace window.
const ANALYSE_TOKEN_COST = 20

// Grace window: 5 seconds from deduct timestamp.
const GRACE_WINDOW_MS = 5_000

const CancelSchema = z.object({
  generationId: z.string().uuid(),
  deductedAt: z.string().datetime(),
  deductTransactionId: z.string().uuid().optional(),
})

/**
 * POST /api/analyze-brief/cancel
 *
 * Cancels an analysis and refunds tokens if within the 5-second grace window.
 * After 5s, the cancel is acknowledged but no refund is issued.
 *
 * Mirrors the pattern from Synthetic Research (BUG-SR-002).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth()
  if (!auth.success) return auth.response

  const text = await request.text().catch(() => null)
  if (text == null || text.length > 4 * 1024) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let rawBody: unknown
  try {
    rawBody = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CancelSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json({ error: firstIssue?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const { generationId, deductedAt, deductTransactionId } = parsed.data
  const userId = auth.user.id

  // Verify ownership: generation must belong to this user.
  const adminClient = createAdminClient()
  const { data: generation, error: genError } = await adminClient
    .from('generations')
    .select('id, user_id')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single()

  if (genError || !generation) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const deductMs = new Date(deductedAt).getTime()
  const elapsedMs = Date.now() - deductMs
  const withinGrace = elapsedMs < GRACE_WINDOW_MS

  if (!withinGrace) {
    // Cancel acknowledged, no refund.
    return NextResponse.json({ cancelled: true, refunded: false })
  }

  // Best-effort refund. Errors are logged but don't affect the response.
  const refund = await refundTokens(userId, ANALYSE_TOKEN_COST, deductTransactionId)
  if (!refund.success) {
    console.warn(
      `[cancel] Token refund failed for generation ${generationId}:`,
      refund.error,
    )
  }

  return NextResponse.json({
    cancelled: true,
    refunded: refund.success,
    newBalance: refund.newBalance,
  })
}
