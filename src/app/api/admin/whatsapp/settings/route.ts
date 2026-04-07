import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWhatsAppSettings } from '@/lib/data/whatsapp'
import { z } from 'zod'

const updateWhatsAppSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  phone_number: z.string().max(20).optional().nullable(),
  cta_label: z.string().max(100).optional(),
  ai_enabled: z.boolean().optional(),
  ai_business_tone: z.string().max(500).optional(),
  ai_allowed_topics: z.array(z.string()).optional(),
  ai_fallback_text: z.string().max(500).optional(),
  ai_escalation_text: z.string().max(500).optional(),
})

/**
 * GET /api/admin/whatsapp/settings — get WhatsApp settings for tenant.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const settings = await getWhatsAppSettings(auth.tenantId)
  return NextResponse.json({ settings })
}

/**
 * PATCH /api/admin/whatsapp/settings — update WhatsApp settings.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = updateWhatsAppSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = createAdminClient()

  // Upsert: create if not exists, update if exists
  const existing = await getWhatsAppSettings(auth.tenantId)
  if (existing) {
    const { error } = await supabase
      .from('whatsapp_settings')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('tenant_id', auth.tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('whatsapp_settings')
      .insert({ tenant_id: auth.tenantId, ...parsed.data })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also sync whatsapp_enabled in tenant_features
  if (parsed.data.enabled !== undefined) {
    await supabase
      .from('tenant_features')
      .update({ whatsapp_enabled: parsed.data.enabled, updated_at: new Date().toISOString() })
      .eq('tenant_id', auth.tenantId)
  }

  return NextResponse.json({ success: true })
}
