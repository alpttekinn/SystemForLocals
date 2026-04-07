/**
 * One-time setup: configure WhatsApp for 'yesilcam-cekmekoy' tenant.
 * Run: node scripts/_setup-whatsapp-db.mjs
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

const PHONE = '905394380128'
const SLUG = 'yesilcam-cekmekoy'

const client = new pg.Client({ connectionString: databaseUrl })
await client.connect()
console.log('✅ Connected!\n')

// 1. Get tenant
const { rows: [tenant] } = await client.query(
  "SELECT id, name FROM tenants WHERE slug = $1 LIMIT 1",
  [SLUG]
)
if (!tenant) { console.error(`❌ Tenant '${SLUG}' not found`); process.exit(1) }
console.log(`📋 Tenant: ${tenant.name} (${tenant.id})`)

// 2. Update tenant_contact — set whatsapp field
const { rows: contacts } = await client.query(
  'SELECT id FROM tenant_contact WHERE tenant_id = $1 LIMIT 1',
  [tenant.id]
)
if (contacts.length > 0) {
  await client.query(
    'UPDATE tenant_contact SET whatsapp = $1, updated_at = NOW() WHERE tenant_id = $2',
    [PHONE, tenant.id]
  )
  console.log(`✅ tenant_contact.whatsapp → ${PHONE}`)
} else {
  console.log('⚠️  No tenant_contact row found — skipping contact update')
}

// 3. Upsert whatsapp_settings
const { rows: existing } = await client.query(
  'SELECT id FROM whatsapp_settings WHERE tenant_id = $1 LIMIT 1',
  [tenant.id]
)

if (existing.length > 0) {
  await client.query(`
    UPDATE whatsapp_settings SET
      enabled = true,
      phone_number = $1,
      cta_label = 'WhatsApp ile Yazın',
      ai_enabled = true,
      ai_business_tone = 'Samimi ve profesyonel bir kafe/restoran asistanı',
      ai_allowed_topics = ARRAY['opening_hours','address','menu_categories','reservation_guidance','event_inquiry','contact_info','campaign_summary'],
      ai_fallback_text = 'Detaylı bilgi için sizi yetkilimize yönlendiriyorum. Kısa süre içinde size dönüş yapılacaktır.',
      ai_escalation_text = 'Bu konuda size daha iyi yardımcı olabilmemiz için yetkilimiz en kısa sürede sizinle iletişime geçecektir.',
      updated_at = NOW()
    WHERE tenant_id = $2
  `, [PHONE, tenant.id])
  console.log(`✅ whatsapp_settings updated — enabled=true, ai_enabled=true, phone=${PHONE}`)
} else {
  await client.query(`
    INSERT INTO whatsapp_settings (
      tenant_id, enabled, phone_number, cta_label,
      ai_enabled, ai_business_tone, ai_allowed_topics,
      ai_fallback_text, ai_escalation_text
    ) VALUES ($1, true, $2, 'WhatsApp ile Yazın', true,
      'Samimi ve profesyonel bir kafe/restoran asistanı',
      ARRAY['opening_hours','address','menu_categories','reservation_guidance','event_inquiry','contact_info','campaign_summary'],
      'Detaylı bilgi için sizi yetkilimize yönlendiriyorum. Kısa süre içinde size dönüş yapılacaktır.',
      'Bu konuda size daha iyi yardımcı olabilmemiz için yetkilimiz en kısa sürede sizinle iletişime geçecektir.'
    )
  `, [tenant.id, PHONE])
  console.log(`✅ whatsapp_settings inserted — enabled=true, ai_enabled=true, phone=${PHONE}`)
}

// 4. Enable whatsapp feature in tenant_features
const { rows: features } = await client.query(
  'SELECT id FROM tenant_features WHERE tenant_id = $1 LIMIT 1',
  [tenant.id]
)
if (features.length > 0) {
  await client.query(
    'UPDATE tenant_features SET whatsapp_enabled = true, updated_at = NOW() WHERE tenant_id = $1',
    [tenant.id]
  )
  console.log('✅ tenant_features.whatsapp_enabled = true')
} else {
  console.log('⚠️  No tenant_features row — skipping (will be enabled via admin panel)')
}

// 5. Summary
const { rows: [finalSettings] } = await client.query(
  'SELECT enabled, phone_number, ai_enabled FROM whatsapp_settings WHERE tenant_id = $1',
  [tenant.id]
)
const { rows: [finalContact] } = await client.query(
  'SELECT whatsapp FROM tenant_contact WHERE tenant_id = $1',
  [tenant.id]
)
console.log('\n📊 Final state:')
console.log('  whatsapp_settings:', JSON.stringify(finalSettings))
console.log('  tenant_contacts.whatsapp:', finalContact?.whatsapp)

await client.end()
console.log('\n✅ Done!')
