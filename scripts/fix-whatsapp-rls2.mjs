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

// The function get_user_tenant_ids() takes NO args — it uses auth.uid() internally
const policies = [
  [`wa_settings_tenant_read`, `whatsapp_settings`],
  [`wa_conversations_tenant_read`, `whatsapp_conversations`],
  [`wa_messages_tenant_read`, `whatsapp_messages`],
]

for (const [name, table] of policies) {
  try {
    await c.query(`
      CREATE POLICY "${name}" ON ${table}
      FOR SELECT USING (
        tenant_id = ANY(get_user_tenant_ids())
      )
    `)
    console.log(`✅ ${name} on ${table}`)
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`)
  }
}

await c.end()
