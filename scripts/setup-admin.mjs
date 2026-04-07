/**
 * Setup admin user + verify auth config via Supabase Auth Admin API.
 * Uses SERVICE_ROLE_KEY for admin operations.
 * 
 * Run: node scripts/setup-admin.mjs
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Load .env.local
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
}

// =============================================
// 1. LIST EXISTING AUTH USERS
// =============================================
console.log('=== Existing Auth Users ===')
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers })
  if (res.ok) {
    const data = await res.json()
    const users = data.users || []
    if (users.length === 0) {
      console.log('  ⚠️  No users exist yet')
    } else {
      users.forEach(u => {
        console.log(`  ✅ ${u.email} (id: ${u.id}, confirmed: ${!!u.email_confirmed_at})`)
      })
    }
  } else {
    console.log('  ❌ Failed to list users: HTTP ' + res.status)
    const body = await res.text()
    console.log('     ' + body.slice(0, 200))
  }
} catch (err) {
  console.log('  ❌ Error: ' + err.message)
}

// =============================================
// 2. CREATE ADMIN USER (if none exists)
// =============================================
console.log('\n=== Admin User Creation ===')

const ADMIN_EMAIL = 'admin@yesilcamcekmekoy.com'
const ADMIN_PASSWORD = 'CafePanel2026!'
const ADMIN_NAME = 'Admin'

try {
  // Check if user already exists
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers })
  const listData = await listRes.json()
  const existingUsers = listData.users || []
  const existing = existingUsers.find(u => u.email === ADMIN_EMAIL)

  let userId
  if (existing) {
    console.log(`  ℹ️  User ${ADMIN_EMAIL} already exists (id: ${existing.id})`)
    userId = existing.id
  } else {
    // Create user via Auth Admin API
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME },
      }),
    })

    if (createRes.ok) {
      const user = await createRes.json()
      userId = user.id
      console.log(`  ✅ User CREATED: ${ADMIN_EMAIL} (id: ${userId})`)
      console.log(`     Password: ${ADMIN_PASSWORD}`)
      console.log(`     ⚠️  CHANGE THIS PASSWORD after first login!`)
    } else {
      const err = await createRes.text()
      console.log(`  ❌ Failed to create user: HTTP ${createRes.status}`)
      console.log(`     ${err.slice(0, 300)}`)
    }
  }

  if (userId) {
    // =============================================
    // 3. CREATE PROFILE + MEMBERSHIP via DATABASE
    // =============================================
    console.log('\n=== Profile + Membership ===')
    
    // Use pg for DB operations
    const pg = await import('pg')
    const dbUrl = env.DATABASE_URL
    if (!dbUrl) {
      console.log('  ⚠️  DATABASE_URL not found — cannot create profile/membership')
    } else {
      const client = new pg.default.Client({ connectionString: dbUrl })
      await client.connect()

      // Profile
      try {
        await client.query(
          `INSERT INTO profiles (id, full_name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET full_name = $2`,
          [userId, ADMIN_NAME]
        )
        console.log(`  ✅ Profile created/updated for ${userId}`)
      } catch (err) {
        console.log(`  ❌ Profile insert failed: ${err.message}`)
      }

      // Membership
      try {
        await client.query(
          `INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner'`,
          [TENANT_ID, userId]
        )
        console.log(`  ✅ Membership created/updated: owner of ${TENANT_ID}`)
      } catch (err) {
        console.log(`  ❌ Membership insert failed: ${err.message}`)
      }

      // Verify
      const profileCheck = await client.query('SELECT id, full_name FROM profiles WHERE id = $1', [userId])
      const memberCheck = await client.query('SELECT tenant_id, user_id, role FROM tenant_memberships WHERE user_id = $1', [userId])
      
      console.log('\n=== Verification ===')
      console.log(`  Profile: ${profileCheck.rows.length > 0 ? '✅ ' + JSON.stringify(profileCheck.rows[0]) : '❌ MISSING'}`)
      console.log(`  Membership: ${memberCheck.rows.length > 0 ? '✅ ' + JSON.stringify(memberCheck.rows[0]) : '❌ MISSING'}`)

      await client.end()
    }
  }

} catch (err) {
  console.log(`  ❌ Error: ${err.message}`)
}

// =============================================
// 4. CHECK AUTH CONFIG (Site URL, Redirect URLs)
// =============================================
console.log('\n=== Auth Configuration Check ===')
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
console.log(`  Project ref: ${projectRef}`)
console.log(`  ℹ️  Auth URL configuration requires Supabase Dashboard access.`)
console.log(`     The service_role key cannot read or modify Auth → URL Configuration.`)
console.log('')
console.log('  MANUAL STEPS REQUIRED in Supabase Dashboard:')
console.log('  ─────────────────────────────────────────────')
const platformUrl = env.NEXT_PUBLIC_PLATFORM_URL || 'https://YOUR_DOMAIN'
console.log(`  1. Auth → URL Configuration → Site URL:`)
console.log(`     Set to: ${platformUrl}`)
console.log(`  2. Auth → URL Configuration → Redirect URLs → Add:`)
console.log(`     ${platformUrl}/admin/reset-password`)
console.log(`     ${platformUrl}/**`)
console.log('')

// =============================================
// 5. CHECK EMAIL CONFIG
// =============================================
console.log('=== Email Configuration ===')
const resendKey = env.RESEND_API_KEY
const fromEmail = env.FROM_EMAIL
const adminEmail = env.ADMIN_NOTIFICATION_EMAIL
console.log(`  RESEND_API_KEY: ${resendKey ? '✅ Set' : '❌ EMPTY — emails will not send'}`)
console.log(`  FROM_EMAIL: ${fromEmail || '❌ EMPTY'}`)
console.log(`  ADMIN_NOTIFICATION_EMAIL: ${adminEmail || '❌ EMPTY — admin alerts disabled'}`)
if (!resendKey) {
  console.log('')
  console.log('  To enable email notifications:')
  console.log('  1. Sign up at https://resend.com')
  console.log('  2. Verify your sending domain')
  console.log('  3. Get API key → set RESEND_API_KEY in Vercel env vars')
  console.log('  4. Set FROM_EMAIL to noreply@yourdomain.com')
  console.log('  5. Set ADMIN_NOTIFICATION_EMAIL to the owner email')
}

// =============================================
// 6. ADMIN LOGIN READINESS
// =============================================
console.log('\n=== Admin Login Readiness ===')
const checks = []
// Check user exists
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers })
  const data = await res.json()
  const hasUser = (data.users || []).length > 0
  checks.push({ name: 'Auth user exists', ok: hasUser })
} catch { checks.push({ name: 'Auth user exists', ok: false }) }

// Check default tenant slug
checks.push({ name: 'DEFAULT_TENANT_SLUG set', ok: !!env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG })
checks.push({ name: 'Supabase URL set', ok: !!SUPABASE_URL })
checks.push({ name: 'Supabase anon key set', ok: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY })
checks.push({ name: 'Service role key set', ok: !!SERVICE_KEY })

for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '❌'} ${c.name}`)
}

console.log('\n=== SETUP COMPLETE ===')
