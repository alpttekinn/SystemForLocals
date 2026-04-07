/**
 * Run all SQL migrations against Supabase Postgres.
 * 
 * Usage:
 *   node scripts/migrate.mjs
 * 
 * Requires DATABASE_URL in .env.local or as env var.
 * Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 */

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
} catch { /* no .env.local, rely on env vars */ }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found. Add it to .env.local:')
  console.error('   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres')
  process.exit(1)
}

const migrations = [
  'supabase/migrations/00001_initial_schema.sql',
  'supabase/migrations/00002_saas_multi_tenant.sql',
  'supabase/migrations/00003_branding_extensions.sql',
  'supabase/migrations/00004_site_events.sql',
  'supabase/migrations/00005_whatsapp_ai.sql',
  'supabase/seed.sql',
]

const client = new pg.Client({ connectionString: databaseUrl })

try {
  console.log('🔌 Connecting to Supabase Postgres...')
  await client.connect()
  console.log('✅ Connected!\n')

  for (const file of migrations) {
    const filePath = join(root, file)
    const sql = readFileSync(filePath, 'utf8')
    const name = file.split('/').pop()
    
    console.log(`📄 Running ${name}...`)
    
    // Split by semicolons at end of statements, handling $$ blocks
    const statements = splitStatements(sql)
    let ok = 0
    let failed = 0
    
    for (const stmt of statements) {
      const trimmed = stmt.trim()
      if (!trimmed || trimmed.startsWith('--')) continue
      try {
        await client.query(trimmed)
        ok++
      } catch (err) {
        failed++
        // Show first 80 chars of the failing statement for context
        const preview = trimmed.replace(/\s+/g, ' ').slice(0, 80)
        console.error(`   ⚠️  ${err.message.split('\n')[0]}`)
        console.error(`       → ${preview}...`)
      }
    }
    console.log(`   ✅ ${name} — ${ok} OK, ${failed} failed`)
    console.log()
  }

  console.log('🎉 All migrations complete!')
} catch (err) {
  console.error('❌ Connection failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}

/**
 * Split SQL into individual statements, respecting $$ blocks and quoted strings.
 */
function splitStatements(sql) {
  const results = []
  let current = ''
  let inDollarQuote = false
  
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    
    // Handle $$ dollar-quoting
    if (ch === '$' && sql[i + 1] === '$') {
      inDollarQuote = !inDollarQuote
      current += '$$'
      i++
      continue
    }
    
    if (ch === ';' && !inDollarQuote) {
      if (current.trim()) results.push(current.trim())
      current = ''
      continue
    }
    
    current += ch
  }
  
  if (current.trim()) results.push(current.trim())
  return results
}
