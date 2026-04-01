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
} catch {}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const res = await client.query(`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'extensions', 'graphql', 'graphql_public', 'realtime', 'supabase_migrations', 'supabase_functions', 'vault', 'pgsodium', 'pgsodium_masks', '_analytics', 'pgtle', 'net', 'cron', '_realtime')
  ORDER BY table_schema, table_name
`)

console.log('Tables found:')
for (const row of res.rows) {
  console.log(`  ${row.table_schema}.${row.table_name}`)
}

await client.end()
