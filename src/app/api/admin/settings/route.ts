import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateBrandingSchema, updateContactSchema, updateSeoSchema } from '@/lib/validations'
import { getTenantBranding, getTenantContact, getTenantSeo, getTenantFeatures } from '@/lib/data/tenant'

/**
 * GET /api/admin/settings — get all tenant settings.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const [branding, contact, seo, features] = await Promise.all([
    getTenantBranding(auth.tenantId),
    getTenantContact(auth.tenantId),
    getTenantSeo(auth.tenantId),
    getTenantFeatures(auth.tenantId),
  ])

  return NextResponse.json({ branding, contact, seo, features })
}

/**
 * PATCH /api/admin/settings — update tenant settings.
 * Body: { section: 'branding' | 'contact' | 'seo' | 'features', data: {...} }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { section, data } = body as { section?: string; data?: unknown }
  if (!section || !data || typeof data !== 'object') {
    return NextResponse.json({ error: 'section ve data gereklidir' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (section) {
    case 'branding': {
      const parsed = updateBrandingSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('tenant_branding')
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'contact': {
      const parsed = updateContactSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('tenant_contact')
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'seo': {
      const parsed = updateSeoSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('tenant_seo')
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'features': {
      const { error } = await supabase
        .from('tenant_features')
        .update({ ...(data as Record<string, unknown>), updated_at: new Date().toISOString() })
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    default:
      return NextResponse.json({ error: 'Geçersiz bölüm' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
