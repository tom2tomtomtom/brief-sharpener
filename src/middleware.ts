import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyGatewayJWT, GW_COOKIE_NAME } from '@/lib/gateway-jwt'

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://www.aiden.services'
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.aiden.services' : undefined

function getPublicUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}${request.nextUrl.search}`
  }
  return request.nextUrl.href
}

async function refreshFromGateway(request: NextRequest): Promise<NextResponse | null> {
  try {
    const cookieHeader = request.cookies
      .getAll()
      .filter((c) => c.name.startsWith('sb-'))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')

    const res = await fetch(`${GATEWAY_URL}/api/auth/session`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    })

    if (!res.ok) return null

    const data = await res.json()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-middleware-auth-verified', '1')
    const response = NextResponse.next({ request: { headers: requestHeaders } })

    if (data.jwt) {
      response.cookies.set(GW_COOKIE_NAME, data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: COOKIE_DOMAIN,
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 60,
      })
    }

    if (data.cookies) {
      for (const { name, value, options } of data.cookies) {
        response.cookies.set(name, value, {
          ...options,
          domain: COOKIE_DOMAIN,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
    }

    return response
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')

  if (!isProtected && !isAuthPage) return response

  // Tier 1: Gateway JWT (fast, local verify)
  const gwToken = request.cookies.get(GW_COOKIE_NAME)?.value
  if (gwToken) {
    const payload = await verifyGatewayJWT(gwToken)
    if (payload) {
      if (isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-middleware-auth-verified', '1')
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }

  // Tier 2: Refresh from Gateway
  const refreshResult = await refreshFromGateway(request)
  if (refreshResult) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return refreshResult
  }

  // Tier 3: Supabase session fallback
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN }),
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtected) {
    const publicUrl = getPublicUrl(request)
    return NextResponse.redirect(`${GATEWAY_URL}/login?next=${encodeURIComponent(publicUrl)}`)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|sitemap.xml|robots.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
