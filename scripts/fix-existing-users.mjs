/**
 * Fix: ensure ALL existing auth users have profiles + memberships.
 * Run: node scripts/fix-existing-users.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const env = {}
try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq)] = t.slice(eq + 1)
  }
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const headers = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
}

// Get all auth users
const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers })
const data = await res.json()
const users = data.users || []

const client = new pg.Client({ connectionString: env.DATABASE_URL })
await client.connect()

for (const user of users) {
  console.log(`\nProcessing: ${user.email} (${user.id})`)
  
  // Profile
  const profileRes = await client.query('SELECT id FROM profiles WHERE id = $1', [user.id])
  if (profileRes.rows.length === 0) {
    const name = user.user_metadata?.full_name || user.email.split('@')[0]
    await client.query('INSERT INTO profiles (id, full_name) VALUES ($1, $2)', [user.id, name])
    console.log(`  ✅ Profile CREATED (name: ${name})`)
  } else {
    console.log(`  ✅ Profile exists`)
  }

  // Membership
  const memRes = await client.query(
    'SELECT role FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2',
    [TENANT_ID, user.id]
  )
  if (memRes.rows.length === 0) {
    await client.query(
      'INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES ($1, $2, $3)',
      [TENANT_ID, user.id, 'owner']
    )
    console.log(`  ✅ Membership CREATED (owner of yesilcam-cekmekoy)`)
  } else {
    console.log(`  ✅ Membership exists (role: ${memRes.rows[0].role})`)
  }
}

// Final state
console.log('\n=== Final User State ===')
const allProfiles = await client.query('SELECT p.id, p.full_name, m.role, m.tenant_id FROM profiles p LEFT JOIN tenant_memberships m ON p.id = m.user_id')
for (const row of allProfiles.rows) {
  console.log(`  ✅ ${row.full_name} | role: ${row.role} | tenant: ${row.tenant_id}`)
}

await client.end()
console.log('\n✅ All users fixed!')
