import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10)}...)` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}...)` : 'MISSING',
    NEXT_PUBLIC_DEFAULT_TENANT_SLUG: process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'MISSING',
    NEXT_PUBLIC_PLATFORM_URL: process.env.NEXT_PUBLIC_PLATFORM_URL || 'MISSING',
  }

  // Try Supabase connection
  let dbTest = 'not tested'
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data, error } = await supabase.from('tenants').select('slug, name').limit(5)
    if (error) {
      dbTest = `ERROR: ${error.message}`
    } else {
      dbTest = `OK: ${JSON.stringify(data)}`
    }
  } catch (e: unknown) {
    dbTest = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json({ env, dbTest, timestamp: new Date().toISOString() })
}
