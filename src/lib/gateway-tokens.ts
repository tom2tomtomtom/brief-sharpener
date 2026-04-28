const GATEWAY_URL = process.env.GATEWAY_URL || 'https://www.aiden.services'
const SERVICE_KEY = process.env.AIDEN_SERVICE_KEY

interface CheckResult {
  allowed: boolean
  required: number
  balance: number
}

interface DeductResult {
  success: boolean
  remaining?: number
  error?: string
  required?: number
  balance?: number
  transactionId?: string
}

interface RefundResult {
  success: boolean
  newBalance?: number
  transactionId?: string
  error?: string
  gatewayUnavailable?: boolean
}

interface BalanceResult {
  balance: number
  plan: string
  lifetime_purchased: number
  lifetime_used: number
}

function getHeaders(userId: string): Record<string, string> {
  if (!SERVICE_KEY) {
    throw new Error('AIDEN_SERVICE_KEY is not configured')
  }
  return {
    'Content-Type': 'application/json',
    'X-Service-Key': SERVICE_KEY,
    'X-User-Id': userId,
  }
}

export async function checkTokens(
  userId: string,
  operation: string
): Promise<CheckResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/tokens/check`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ product: 'brief_sharpener', operation }),
    })

    if (!res.ok) {
      console.error(`[gateway-tokens] Check failed: ${res.status}`)
      // Fail closed: don't grant access on Gateway error.
      return { allowed: false, required: 0, balance: 0 }
    }

    return res.json()
  } catch (err) {
    console.error('[gateway-tokens] Check threw:', err)
    return { allowed: false, required: 0, balance: 0 }
  }
}

export async function deductTokens(
  userId: string,
  operation: string
): Promise<DeductResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/tokens/deduct`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ product: 'brief_sharpener', operation }),
    })

    if (!res.ok && res.status === 402) {
      return res.json()
    }

    if (!res.ok) {
      console.error(`[gateway-tokens] Deduct failed: ${res.status}`)
      // Fail closed: signal failure so caller can decide whether to refund the
      // upstream operation. Pretending the deduct succeeded silently leaks tokens.
      return { success: false, error: `gateway_error_${res.status}` }
    }

    const data = await res.json() as { success?: boolean; remaining?: number; transactionId?: string }
    return {
      success: data.success !== false,
      remaining: data.remaining,
      transactionId: data.transactionId,
    }
  } catch (err) {
    console.error('[gateway-tokens] Deduct threw:', err)
    return { success: false, error: 'gateway_unreachable' }
  }
}

/**
 * Refund tokens to a user after a cancel within the 5-second grace window.
 *
 * Best-effort: never awaited on the critical path. If Gateway is unreachable,
 * the refund is lost and the user may raise a support ticket. Uses x-aiden-service-key
 * auth as required by POST /api/tokens/refund.
 */
export async function refundTokens(
  userId: string,
  amount: number,
  originalTransactionId?: string,
): Promise<RefundResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)

    const body: Record<string, unknown> = {
      userId,
      amount,
      reason: 'user_cancelled_within_grace_window',
    }
    if (originalTransactionId) {
      body.originalTransactionId = originalTransactionId
    }

    const res = await fetch(`${GATEWAY_URL}/api/tokens/refund`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.error(`[gateway-tokens] Refund failed: ${res.status}`)
      return { success: false, error: 'refund_failed', gatewayUnavailable: res.status >= 500 }
    }

    const data = await res.json() as { ok?: boolean; newBalance?: number; transactionId?: string }
    return { success: data.ok === true, newBalance: data.newBalance, transactionId: data.transactionId }
  } catch (err) {
    console.error('[gateway-tokens] Refund threw:', err)
    return { success: false, error: 'gateway_unreachable', gatewayUnavailable: true }
  }
}

export async function getBalance(userId: string): Promise<BalanceResult | null> {
  const res = await fetch(`${GATEWAY_URL}/api/tokens/balance`, {
    method: 'GET',
    headers: getHeaders(userId),
  })

  if (!res.ok) {
    console.error(`[gateway-tokens] Balance fetch failed: ${res.status}`)
    return null
  }

  return res.json()
}
