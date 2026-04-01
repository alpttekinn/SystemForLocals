import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveTenantSlug } from '@/lib/tenant/resolver'

/**
 * Middleware responsibilities:
 * 1. Resolve active tenant from request (header / query / subdomain / env default)
 * 2. Inject x-tenant-slug header for downstream server components / route handlers
 * 3. Refresh Supabase auth session on every request
 *
 * Custom domain resolution (DB lookup) is NOT done here to avoid DB calls
 * in middleware on every request. Custom domains are resolved in the layout
 * server component when the slug-based strategies return null.
 */
export async function middleware(request: NextRequest) {
  // --- Tenant Resolution ---
  const tenantSlug = resolveTenantSlug(request)
    || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG
    || null

  // Clone request headers and inject resolved tenant slug
  const requestHeaders = new Headers(request.headers)
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug)
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // --- Supabase Session Refresh ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Pass tenant slug to response headers (accessible by server components via headers())
  if (tenantSlug) {
    supabaseResponse.headers.set('x-tenant-slug', tenantSlug)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
