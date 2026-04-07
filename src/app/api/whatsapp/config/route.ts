import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/data/tenant'
import { getWhatsAppSettings } from '@/lib/data/whatsapp'

/**
 * GET /api/whatsapp/config — public-facing WhatsApp config.
 * Returns only the CTA label and enabled state (no sensitive settings).
 */
export async function GET(request: NextRequest) {
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  const tenantId = await requireTenantId(slug)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  const settings = await getWhatsAppSettings(tenantId)
  if (!settings || !settings.enabled) {
    return NextResponse.json({ enabled: false })
  }

  return NextResponse.json({
    enabled: true,
    cta_label: settings.cta_label,
  })
}
