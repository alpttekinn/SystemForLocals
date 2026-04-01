import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Load .env.local
try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) process.env[key] = value
  }
} catch { /* no .env.local */ }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) { console.error('❌ DATABASE_URL not found'); process.exit(1) }

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

try {
  console.log('🔌 Connecting...')
  await client.connect()
  console.log('✅ Connected!\n')

  // Step 1: Nuke all existing tenant/app tables so migrations are idempotent
  console.log('🗑️  Dropping existing tables...')
  await client.query(`
    DROP TABLE IF EXISTS
      contact_submissions, notification_log, event_inquiries,
      reservation_status_history, reservations, faq_items, campaigns,
      gallery_items, menu_items, menu_categories, blocked_slots,
      reservation_rules, special_dates, business_hours,
      tenant_seo, tenant_features, tenant_contact, tenant_branding,
      tenant_domains, tenant_memberships, tenants,
      settings, admin_users, profiles, testimonials
    CASCADE;
    DROP FUNCTION IF EXISTS create_reservation(TEXT,TEXT,TEXT,INT,DATE,TIME,TEXT) CASCADE;
    DROP FUNCTION IF EXISTS create_reservation(UUID,TEXT,TEXT,TEXT,INT,DATE,TIME,TEXT) CASCADE;
    DROP FUNCTION IF EXISTS is_admin() CASCADE;
    DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
    DROP FUNCTION IF EXISTS get_user_tenant_ids() CASCADE;
    DROP FUNCTION IF EXISTS is_tenant_member(UUID) CASCADE;
    DROP FUNCTION IF EXISTS is_tenant_admin(UUID) CASCADE;
  `)
  console.log('   ✅ Dropped\n')

  // Step 2: Run migrations + seed as whole files
  const files = [
    'supabase/migrations/00001_initial_schema.sql',
    'supabase/migrations/00002_saas_multi_tenant.sql',
    'supabase/seed.sql',
  ]

  for (const file of files) {
    const name = file.split('/').pop()
    console.log(`📄 Running ${name}...`)
    const sql = readFileSync(join(root, file), 'utf8')
    try {
      await client.query(sql)
      console.log(`   ✅ ${name} — OK\n`)
    } catch (err) {
      console.error(`   ❌ ${name} failed:\n   ${err.message.slice(0, 200)}\n`)
      process.exit(1)
    }
  }

  console.log('🎉 Schema + seed complete!')
} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
