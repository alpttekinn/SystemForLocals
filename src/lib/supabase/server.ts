import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for Server Components and Route Handlers.
 * Uses the anon key — respects RLS policies.
 * Must be called inside a server context (RSC, Route Handler, Server Action).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never),
            )
          } catch {
            // setAll can fail in Server Components (read-only cookies).
            // This is expected — the middleware handles session refresh.
          }
        },
      },
    },
  )
}
