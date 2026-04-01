import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using the service_role key.
 * BYPASSES RLS — use only in trusted server-side code (Route Handlers, Server Actions).
 * Never expose this client or the service_role key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
