/**
 * Verify full database setup: tables, columns, seed data, RLS, functions.
 * Run: node scripts/verify-setup.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq), v = t.slice(eq + 1)
    if (!process.env[k]) process.env[k] = v
  }
} catch {}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// 1. Branding extension columns
const cols = await client.query(
  `SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'tenant_branding' 
   AND column_name IN ('announcement_bar_text','about_story','venue_highlights','trust_stats') 
   ORDER BY column_name`
)
console.log('=== Branding Extension Columns ===')
cols.rows.forEach(r => console.log('  ✅ ' + r.column_name))
if (cols.rows.length < 4) console.log('  ❌ MISSING COLUMNS — expected 4, got ' + cols.rows.length)

// 2. site_events table
const se = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'site_events' ORDER BY ordinal_position`
)
console.log('\n=== site_events Table ===')
if (se.rows.length > 0) {
  se.rows.forEach(r => console.log('  ✅ ' + r.column_name + ' (' + r.data_type + ')'))
} else {
  console.log('  ❌ TABLE MISSING')
}

// 3. Tenants
const tenants = await client.query('SELECT slug, name, status, plan FROM tenants ORDER BY slug')
console.log('\n=== Tenants ===')
tenants.rows.forEach(r => console.log(`  ✅ ${r.slug} | ${r.name} | ${r.status} | ${r.plan}`))

// 4. Yesilcam config verification
const tid = '00000000-0000-0000-0000-000000000001'
const checks = [
  { name: 'branding', q: `SELECT theme_preset, tagline FROM tenant_branding WHERE tenant_id = '${tid}'` },
  { name: 'contact', q: `SELECT phone, city FROM tenant_contact WHERE tenant_id = '${tid}'` },
  { name: 'features', q: `SELECT reservations_enabled FROM tenant_features WHERE tenant_id = '${tid}'` },
  { name: 'rules', q: `SELECT slot_duration_minutes, default_slot_capacity FROM reservation_rules WHERE tenant_id = '${tid}'` },
  { name: 'seo', q: `SELECT meta_title_template FROM tenant_seo WHERE tenant_id = '${tid}'` },
]
console.log('\n=== Yeşilçam Çekmeköy Config ===')
for (const c of checks) {
  const r = await client.query(c.q)
  console.log(`  ${r.rows.length > 0 ? '✅' : '❌'} ${c.name}: ${r.rows.length > 0 ? JSON.stringify(r.rows[0]) : 'MISSING'}`)
}

// 5. Content counts
const counts = [
  { name: 'business_hours', q: `SELECT count(*)::int as c FROM business_hours WHERE tenant_id = '${tid}'` },
  { name: 'menu_items', q: `SELECT count(*)::int as c FROM menu_items WHERE tenant_id = '${tid}'` },
  { name: 'gallery_items', q: `SELECT count(*)::int as c FROM gallery_items WHERE tenant_id = '${tid}'` },
  { name: 'faq_items', q: `SELECT count(*)::int as c FROM faq_items WHERE tenant_id = '${tid}'` },
  { name: 'testimonials', q: `SELECT count(*)::int as c FROM testimonials WHERE tenant_id = '${tid}'` },
  { name: 'campaigns', q: `SELECT count(*)::int as c FROM campaigns WHERE tenant_id = '${tid}'` },
]
console.log('\n=== Content Counts ===')
for (const c of counts) {
  const r = await client.query(c.q)
  const count = r.rows[0].c
  console.log(`  ${count > 0 ? '✅' : '⚠️'} ${c.name}: ${count} rows`)
}

// 6. RLS
const rls = await client.query(
  `SELECT count(*)::int as c FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true`
)
console.log('\n=== RLS ===')
console.log(`  ${rls.rows[0].c >= 20 ? '✅' : '⚠️'} ${rls.rows[0].c} tables with RLS enabled`)

// 7. Functions
const fns = await client.query(
  `SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' ORDER BY proname`
)
console.log('\n=== PostgreSQL Functions ===')
fns.rows.forEach(r => console.log('  ✅ ' + r.proname))

// 8. Check storage bucket via Supabase API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (supabaseUrl && serviceKey) {
  console.log('\n=== Storage Buckets ===')
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
    })
    if (res.ok) {
      const buckets = await res.json()
      if (buckets.length === 0) {
        console.log('  ⚠️  No buckets found')
      } else {
        buckets.forEach(b => {
          const match = b.name === 'tenant-assets' ? '✅' : 'ℹ️'
          console.log(`  ${match} ${b.name} (public: ${b.public})`)
        })
        if (!buckets.find(b => b.name === 'tenant-assets')) {
          console.log('  ❌ tenant-assets bucket NOT FOUND — needs to be created')
        }
      }
    } else {
      console.log('  ⚠️  Could not list buckets: HTTP ' + res.status)
    }
  } catch (err) {
    console.log('  ⚠️  Bucket check failed: ' + err.message)
  }
} else {
  console.log('\n=== Storage ===')
  console.log('  ⚠️  Cannot check — missing SUPABASE_URL or SERVICE_ROLE_KEY')
}

// 9. Try to create tenant-assets bucket if missing
if (supabaseUrl && serviceKey) {
  try {
    const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
    })
    const buckets = await listRes.json()
    if (!buckets.find(b => b.name === 'tenant-assets')) {
      console.log('\n=== Creating tenant-assets bucket ===')
      const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'tenant-assets',
          name: 'tenant-assets',
          public: true,
          file_size_limit: 5242880, // 5MB
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      })
      if (createRes.ok) {
        console.log('  ✅ tenant-assets bucket CREATED (public, 5MB limit)')
      } else {
        const err = await createRes.text()
        console.log('  ❌ Failed to create bucket: ' + err)
      }
    } else {
      console.log('\n  ✅ tenant-assets bucket already exists')
    }
  } catch (err) {
    console.log('  ⚠️  Bucket creation failed: ' + err.message)
  }
}

console.log('\n=== VERIFICATION COMPLETE ===')
await client.end()
