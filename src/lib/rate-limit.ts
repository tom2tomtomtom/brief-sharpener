import { createAdminClient } from '@/lib/supabase/admin'

const WINDOW_SECONDS = 60
const MAX_REQUESTS = 10

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createAdminClient()
  const now = new Date()

  // Fetch existing record for this IP
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('ip', ip)
    .single()

  if (!existing) {
    // First request from this IP - insert and allow
    await supabase.from('rate_limits').upsert({
      ip,
      request_count: 1,
      window_start: now.toISOString(),
    })
    return { allowed: true }
  }

  const windowStart = new Date(existing.window_start)
  const elapsedSeconds = (now.getTime() - windowStart.getTime()) / 1000

  if (elapsedSeconds >= WINDOW_SECONDS) {
    // Window expired - reset counter
    await supabase
      .from('rate_limits')
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq('ip', ip)
    return { allowed: true }
  }

  if (existing.request_count >= MAX_REQUESTS) {
    // Over limit - return retry info
    const retryAfter = Math.ceil(WINDOW_SECONDS - elapsedSeconds)
    return { allowed: false, retryAfter }
  }

  // Under limit - increment
  await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('ip', ip)

  return { allowed: true }
}
