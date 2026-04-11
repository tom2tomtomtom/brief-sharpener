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
    const { error } = await supabase.from('leads').upsert(
      { email, source: 'homepage_checklist', created_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    if (error) {
      throw error
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save lead:', error)
    return NextResponse.json({ error: 'Unable to save email right now. Please try again.' }, { status: 500 })
  }
}
