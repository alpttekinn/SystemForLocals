/**
 * Attempt to read/configure Auth settings via Supabase Management API.
 * Tries service_role key first (may not have permission for management endpoints).
 * 
 * Run: node scripts/check-auth-config.mjs
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

console.log(`Project ref: ${PROJECT_REF}`)
console.log(`Platform URL: ${env.NEXT_PUBLIC_PLATFORM_URL || 'NOT SET'}`)

// Try Management API v1 - get auth config
// Note: Management API is at api.supabase.com, NOT the project URL
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

console.log('\n=== Attempting Management API (service_role key) ===')
try {
  const res = await fetch(MGMT_URL, {
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    }
  })
  console.log(`  HTTP ${res.status}`)
  if (res.ok) {
    const config = await res.json()
    console.log(`  ✅ Site URL: ${config.SITE_URL || 'NOT SET'}`)
    console.log(`  ✅ Redirect URLs: ${config.URI_ALLOW_LIST || 'NOT SET'}`)
  } else {
    const body = await res.text()
    console.log(`  ❌ Cannot access Management API with service_role key`)
    console.log(`     ${body.slice(0, 200)}`)
    console.log(`\n  ℹ️  This is expected — service_role key only works for the project's own APIs,`)
    console.log(`     not the Supabase Management API which requires a personal access token.`)
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`)
}

// Try via GoTrue /settings endpoint (project-level, may expose some config)
console.log('\n=== GoTrue Settings (project API) ===')
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  })
  if (res.ok) {
    const settings = await res.json()
    console.log(`  External providers: ${JSON.stringify(Object.keys(settings.external || {}).filter(k => settings.external[k]))}`)
    console.log(`  Mailer autoconfirm: ${settings.mailer_autoconfirm}`)
    console.log(`  SMS autoconfirm: ${settings.sms_autoconfirm}`)
    console.log(`  ℹ️  GoTrue /settings does NOT expose Site URL or redirect URLs`)
  } else {
    console.log(`  HTTP ${res.status}`)
  }
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`)
}

// Summary
console.log('\n=== Auth Config Summary ===')
console.log('  ❌ Cannot programmatically set Auth URL config from this environment.')
console.log('  ❌ Requires: Supabase Dashboard → Authentication → URL Configuration')
console.log('')
console.log('  You must manually set:')
const platformUrl = env.NEXT_PUBLIC_PLATFORM_URL || 'https://YOUR_DOMAIN'
console.log(`  ┌─────────────────────────────────────────────────┐`)
console.log(`  │ Site URL:      ${platformUrl.padEnd(34)}│`)
console.log(`  │ Redirect URLs: ${(platformUrl + '/admin/reset-password').padEnd(34)}│`)
console.log(`  │                ${(platformUrl + '/**').padEnd(34)}│`)
console.log(`  └─────────────────────────────────────────────────┘`)
console.log('')
console.log(`  Dashboard URL: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`)
