import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const env = {}
try {
  readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach(l => {
    const t = l.trim(); if (!t || t.startsWith('#')) return
    const eq = t.indexOf('='); if (eq === -1) return
    env[t.slice(0, eq)] = t.slice(eq + 1)
  })
} catch {}

const c = new pg.Client({ connectionString: env.DATABASE_URL })
await c.connect()
const r = await c.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name")
console.log('Functions:', r.rows.map(x => x.routine_name).join(', '))
await c.end()
