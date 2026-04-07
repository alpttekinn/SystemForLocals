/**
 * Debug: check tenant_memberships table for our admin user
 */
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

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SK = env.SUPABASE_SERVICE_ROLE_KEY
const AK = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const USER_ID = '339c1204-5e48-480d-9e0d-174a1e374c3d'
const TENANT_ID = '00000000-0000-0000-0000-000000000001'

// 1. Check membership with service key (bypass RLS)
console.log('1. Membership via service_role:')
const r1 = await fetch(`${URL}/rest/v1/tenant_memberships?user_id=eq.${USER_ID}&select=*`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
})
console.log(`   Status: ${r1.status}`)
const d1 = await r1.json()
console.log(`   Data:`, JSON.stringify(d1, null, 2))

// 2. Login to get access token
console.log('\n2. Login...')
const authRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: AK, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@yesilcamcekmekoy.com', password: 'CafePanel2026!' }),
})
const session = await authRes.json()
console.log(`   User ID: ${session.user?.id}`)
const token = session.access_token

// 3. Check membership with user token
console.log('\n3. Membership via user token:')
const r2 = await fetch(`${URL}/rest/v1/tenant_memberships?user_id=eq.${USER_ID}&tenant_id=eq.${TENANT_ID}&select=role,status`, {
  headers: { apikey: AK, Authorization: `Bearer ${token}` }
})
console.log(`   Status: ${r2.status}`)
const body2 = await r2.text()
console.log(`   Body: ${body2}`)

// 4. Check RLS policies
console.log('\n4. RLS policies on tenant_memberships:')
const r3 = await fetch(`${URL}/rest/v1/rpc/`, {
  method: 'POST',
  headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})

// Just try a raw SQL query via service key to check policies
const DATABASE_URL = env.DATABASE_URL
if (DATABASE_URL) {
  console.log('   (Would need psql to check policies directly)')
}

// 5: Try querying without the tenant_id filter — maybe that's the issue
console.log('\n5. Membership query with only user_id:')
const r5 = await fetch(`${URL}/rest/v1/tenant_memberships?user_id=eq.${USER_ID}&select=role,status,tenant_id`, {
  headers: { apikey: AK, Authorization: `Bearer ${token}` }
})
console.log(`   Status: ${r5.status}`)
const body5 = await r5.text()
console.log(`   Body: ${body5}`)

// 6: Maybe the column structure is different — check schema
console.log('\n6. Table columns (via service key):')
const r6 = await fetch(`${URL}/rest/v1/tenant_memberships?select=*&limit=0`, {
  headers: { 
    apikey: SK, 
    Authorization: `Bearer ${SK}`,
    Prefer: 'count=exact'
  }
})
console.log(`   Status: ${r6.status}`)
console.log(`   Content-Range: ${r6.headers.get('content-range')}`)

// Check all records
console.log('\n7. All membership records (service key):')
const r7 = await fetch(`${URL}/rest/v1/tenant_memberships?select=*`, {
  headers: { apikey: SK, Authorization: `Bearer ${SK}` }
})
console.log(`   Status: ${r7.status}`)
const d7 = await r7.json()
console.log(`   Records: ${d7.length}`)
d7.forEach(m => console.log(`   - user=${m.user_id} tenant=${m.tenant_id} role=${m.role} status=${m.status}`))
