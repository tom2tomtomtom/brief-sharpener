import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    await supabase.from('leads').upsert(
      { email, source: 'homepage_checklist', created_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Log the error server-side so we can diagnose Supabase/table issues
    console.error('Failed to save lead:', error)
    // Still return 200 to the user — email capture should degrade gracefully
    // rather than showing an error for what feels like a simple signup action
    return NextResponse.json({ ok: true })
  }
}
