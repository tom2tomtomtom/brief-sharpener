import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { ADMIN_SESSION_COOKIE, adminSessionToken } from '@/lib/admin-session'
import { checkRateLimit } from '@/lib/rate-limit'

const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? ''

// Constant-time string compare. A plain `!==` leaks bytes of the admin
// secret via response-timing on every failed attempt, which combined with
// the lack of a rate limit on this endpoint makes brute-force realistic.
function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  try {
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit login attempts per IP. Without this, an attacker can
  // brute force ADMIN_API_SECRET. Nothing else gated the attempt rate,
  // and the previous body.secret !== ADMIN_SECRET compare was also
  // timing-leaky on top of that.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = await checkRateLimit(`admin-session:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter ?? 60) } }
    )
  }

  let body: { secret?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  // Cap the attempted secret length before we pass it to the constant-time
  // compare. Without this, an attacker can ship a multi-megabyte "secret"
  // and push our event loop building the comparison buffer each request.
  if (
    typeof body.secret !== 'string' ||
    body.secret.length > 1024 ||
    !constantTimeEquals(body.secret, ADMIN_SECRET)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionToken(ADMIN_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
