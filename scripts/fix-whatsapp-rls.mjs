import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const env = {}
try {
  readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach(l => {
    const t = l.trim(); if (!t || t.startsWith('#')) return
    const eq = t.indexOf('='); if (eq === -1) return
    env[t.slice(0, eq)] = t.slice(eq + 1)
  })
} catch {}

const c = new pg.Client({ connectionString: env.DATABASE_URL })
await c.connect()

// Check function signatures
const r = await c.query(`
  SELECT p.proname, pg_get_function_arguments(p.oid) as args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_user_tenant_ids'
`)
console.log('get_user_tenant_ids signatures:', r.rows)

// Check auth.uid function
const r2 = await c.query(`
  SELECT p.proname, pg_get_function_result(p.oid) as result_type
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'auth' AND p.proname = 'uid'
`)
console.log('auth.uid result type:', r2.rows)

// Try to create the policy manually
try {
  await c.query(`
    CREATE POLICY "wa_settings_tenant_read" ON whatsapp_settings
    FOR SELECT USING (
      tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
    )
  `)
  console.log('✅ wa_settings_tenant_read policy created')
} catch (e) {
  console.log('❌ Policy creation failed:', e.message)
}

try {
  await c.query(`
    CREATE POLICY "wa_conversations_tenant_read" ON whatsapp_conversations
    FOR SELECT USING (
      tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
    )
  `)
  console.log('✅ wa_conversations_tenant_read policy created')
} catch (e) {
  console.log('❌ Policy creation failed:', e.message)
}

try {
  await c.query(`
    CREATE POLICY "wa_messages_tenant_read" ON whatsapp_messages
    FOR SELECT USING (
      tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))
    )
  `)
  console.log('✅ wa_messages_tenant_read policy created')
} catch (e) {
  console.log('❌ Policy creation failed:', e.message)
}

await c.end()
