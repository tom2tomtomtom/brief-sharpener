import { sendWelcomeEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'

  // Validate redirect path: only allow relative paths within the app
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.email) {
          const adminSupabase = createAdminClient()
          const { count } = await adminSupabase
            .from('generations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if ((count ?? 0) === 0) {
            void sendWelcomeEmail(user.email)
          }
        }
      } catch {
        // best-effort only, never affect auth redirect
      }

      return NextResponse.redirect(new URL(safePath, url.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', url.origin))
}
