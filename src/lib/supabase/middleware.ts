import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname, searchParams } = request.nextUrl

  // Supabase sometimes sends the OAuth code to Site URL (/) instead of /auth/callback.
  // Intercept it early and redirect before getUser() so the session exchange works.
  if (pathname === '/' && searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  const { data: { user } } = await supabase.auth.getUser()
  const publicPaths = ['/', '/login', '/auth/callback']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/auth/'))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
