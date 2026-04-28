import { NextRequest, NextResponse } from 'next/server'
import { sendChecklistEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

// Basic RFC-5322-ish shape check. We don't do MX-lookup here; upstream is
// just a waitlist insert + transactional email, and bounces are the worst
// case. The real job of this regex is to reject obviously-malformed input
// before we hand it to the email provider.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  // Per-IP rate limit. This endpoint (a) upserts to a public `leads` table
  // and (b) fires a transactional email via Resend for each call. Without
  // a limit, any attacker can flood arbitrary emails into our DB AND have
  // us send checklist PDFs to them, a classic email-bombing / reputation
  // damage vector that also burns our Resend quota.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, retryAfter } = await checkRateLimit(`subscribe:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter ?? 60) } }
    )
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('leads').upsert(
      { email, source: 'homepage_checklist', created_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    if (error) {
      throw error
    }
    await sendChecklistEmail(email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save lead:', error)
    return NextResponse.json({ error: 'Unable to save email right now. Please try again.' }, { status: 500 })
  }
}
