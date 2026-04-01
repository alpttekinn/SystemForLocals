/**
 * Clean re-run: drops all public schema objects, then runs migrations.
 * Usage: node scripts/migrate-clean.mjs
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
} catch {}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl })

try {
  console.log('🔌 Connecting...')
  await client.connect()
  console.log('✅ Connected!\n')

  // Step 1: Drop ALL public tables, functions, types
  console.log('🗑️  Dropping all public schema objects...')
  await client.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      -- Drop all policies first
      FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
      ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
      END LOOP;

      -- Drop all tables
      FOR r IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ) LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
      END LOOP;

      -- Drop all functions
      FOR r IN (
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
      ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.args);
      END LOOP;
    END $$;
  `)
  console.log('   ✅ Clean slate!\n')

  // Step 2: Run each migration as a WHOLE file (PostgreSQL handles $$ natively)
  const migrations = [
    'supabase/migrations/00001_initial_schema.sql',
    'supabase/migrations/00002_saas_multi_tenant.sql',
    'supabase/seed.sql',
  ]

  for (const file of migrations) {
    const filePath = join(root, file)
    const sql = readFileSync(filePath, 'utf8')
    const name = file.split('/').pop()

    console.log(`📄 Running ${name}...`)
    try {
      await client.query(sql)
      console.log(`   ✅ ${name} — OK\n`)
    } catch (err) {
      console.error(`   ❌ ${name} — FAILED`)
      console.error(`   ${err.message}\n`)
      // Don't stop — continue with next file
    }
  }

  // Step 3: Verify
  const res = await client.query(`
    SELECT count(*) as table_count FROM pg_tables WHERE schemaname = 'public'
  `)
  const fnRes = await client.query(`
    SELECT count(*) as fn_count
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
  `)
  console.log(`📊 Result: ${res.rows[0].table_count} tables, ${fnRes.rows[0].fn_count} functions`)

  // Check seed
  const tenantRes = await client.query(`SELECT slug, name FROM tenants LIMIT 5`)
  if (tenantRes.rows.length > 0) {
    console.log(`🏪 Tenants:`)
    for (const t of tenantRes.rows) {
      console.log(`   - ${t.slug} (${t.name})`)
    }
  } else {
    console.log('⚠️  No tenants found — seed may have failed')
  }

  console.log('\n🎉 Done!')
} catch (err) {
  console.error('❌ Fatal:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
