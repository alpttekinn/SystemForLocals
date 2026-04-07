/**
 * Test actual admin login flow end-to-end.
 * 
 * Run: node scripts/test-admin-login.mjs
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const EMAIL = 'admin@yesilcamcekmekoy.com'
const PASSWORD = 'CafePanel2026!'
const TENANT_SLUG = env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG

console.log('=== Admin Login Test ===')
console.log(`  Email: ${EMAIL}`)
console.log(`  Tenant: ${TENANT_SLUG}`)
console.log()

// Step 1: Authenticate via Supabase Auth
console.log('1. Authenticating via Supabase Auth...')
const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    apikey: ANON_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})

if (!authRes.ok) {
  const err = await authRes.json()
  console.log(`   ❌ Auth FAILED: ${authRes.status} - ${err.error_description || err.msg || JSON.stringify(err)}`)
  process.exit(1)
}

const session = await authRes.json()
console.log(`   ✅ Login successful`)
console.log(`   User ID: ${session.user.id}`)
console.log(`   Email: ${session.user.email}`)
console.log(`   Access token: ${session.access_token.slice(0, 30)}...`)
console.log()

// Step 2: Resolve tenant slug → tenant_id
console.log('2. Resolving tenant...')
const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?slug=eq.${TENANT_SLUG}&select=id,name,slug,status`, {
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
  }
})

if (!tenantRes.ok) {
  console.log(`   ❌ Tenant query failed: ${tenantRes.status}`)
  const body = await tenantRes.text()
  console.log(`   ${body.slice(0, 200)}`)
  process.exit(1)
}

const tenants = await tenantRes.json()
if (tenants.length === 0) {
  console.log(`   ❌ No tenant found with slug: ${TENANT_SLUG}`)
  // Try with service key to bypass RLS
  console.log('   Trying with service_role key...')
  const tenantRes2 = await fetch(`${SUPABASE_URL}/rest/v1/tenants?slug=eq.${TENANT_SLUG}&select=id,name,slug,status`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    }
  })
  const tenants2 = await tenantRes2.json()
  if (tenants2.length > 0) {
    console.log(`   ⚠️  Tenant exists but RLS blocks user access. Tenant: ${tenants2[0].name} (${tenants2[0].id})`)
    console.log(`   This means the user's JWT might not pass RLS policy on tenants table.`)
  } else {
    console.log(`   ❌ Tenant truly does not exist with slug: ${TENANT_SLUG}`)
  }
  process.exit(1)
}

const tenant = tenants[0]
console.log(`   ✅ Tenant: ${tenant.name} (${tenant.id}) [${tenant.status}]`)
console.log()

// Step 3: Check tenant_memberships
console.log('3. Checking membership...')
// Admin guard uses service_role key (createAdminClient), so query with service key
const memRes = await fetch(
  `${SUPABASE_URL}/rest/v1/tenant_memberships?user_id=eq.${session.user.id}&tenant_id=eq.${tenant.id}&select=role`, {
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  }
})

const mems = await memRes.json()
if (!memRes.ok || mems.length === 0) {
  console.log(`   ❌ No membership found. Status: ${memRes.status}`)
  console.log(`   Body: ${JSON.stringify(mems)}`)
  process.exit(1)
}
console.log(`   ✅ Membership: role=${mems[0].role}`)
console.log()

// Step 4: Test admin guard logic (simulate what the API does)
console.log('4. Simulating admin guard check...')
const isOwnerOrAdmin = ['owner', 'admin'].includes(mems[0].role)
if (isOwnerOrAdmin) {
  console.log(`   ✅ User passes admin guard (role: ${mems[0].role})`)
} else {
  console.log(`   ❌ User has membership but role insufficient: ${mems[0].role}`)
}
console.log()

// Summary
console.log('=== RESULT ===')
const allGood = session && tenants.length > 0 && isOwnerOrAdmin
if (allGood) {
  console.log('  ✅ Admin login will succeed end-to-end')
  console.log('  ✅ Auth → Tenant resolution → Membership → Admin guard: ALL PASS')
  console.log()
  console.log(`  Login URL: ${env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'}/admin/login`)
  console.log(`  Credentials: ${EMAIL} / ${PASSWORD}`)
} else {
  console.log('  ❌ Admin login has issues — see above for details')
}
