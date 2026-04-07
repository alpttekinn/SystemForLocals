/**
 * Run ONLY migration 00005_whatsapp_ai.sql against the database.
 * 
 * Usage: node scripts/run-whatsapp-migration.mjs
 */
import pg from 'pg'
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

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
if (!databaseUrl) { console.error('❌ DATABASE_URL not found'); process.exit(1) }

const client = new pg.Client({ connectionString: databaseUrl })

try {
  console.log('🔌 Connecting...')
  await client.connect()
  console.log('✅ Connected!\n')

  const sql = readFileSync(join(root, 'supabase/migrations/00005_whatsapp_ai.sql'), 'utf8')
  console.log('📄 Running 00005_whatsapp_ai.sql as single transaction...')
  try {
    await client.query(sql)
    console.log('✅ Migration applied in one go!')
  } catch (err) {
    console.log(`⚠ Full-file run failed: ${err.message}`)
    console.log('   Trying statement by statement...')
    
    // Split on semicolons, respecting $$ blocks
    const statements = []
    let current = ''
    let inDollar = false
    for (const line of sql.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('--') && !inDollar) {
        continue
      }
      current += line + '\n'
      if (trimmed.includes('$$')) {
        inDollar = !inDollar
      }
      if (!inDollar && trimmed.endsWith(';')) {
        statements.push(current.trim())
        current = ''
      }
    }
    if (current.trim()) statements.push(current.trim())
    
    let ok = 0, failed = 0
    for (const stmt of statements) {
      if (!stmt || stmt.startsWith('--')) continue
      try {
        await client.query(stmt)
        ok++
      } catch (e) {
        failed++
        const preview = stmt.slice(0, 80).replace(/\n/g, ' ')
        console.log(`   ⚠ ${e.message}\n       → ${preview}...`)
      }
    }
    console.log(`   ✅ ${ok} OK, ${failed} failed`)
  }

  // Verify
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('whatsapp_settings', 'whatsapp_conversations', 'whatsapp_messages')
    ORDER BY table_name
  `)
  console.log(`\n📋 Verified tables: ${tables.rows.map(r => r.table_name).join(', ')}`)

  // Check whatsapp_enabled column
  const col = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'tenant_features' AND column_name = 'whatsapp_enabled'
  `)
  console.log(`📋 whatsapp_enabled column: ${col.rows.length > 0 ? '✅ exists' : '❌ missing'}`)

  // Check seed data
  const settings = await client.query(`SELECT tenant_id FROM whatsapp_settings`)
  console.log(`📋 WhatsApp settings rows: ${settings.rows.length}`)

} catch (err) {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
