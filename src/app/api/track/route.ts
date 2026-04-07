import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireTenantId } from '@/lib/data/tenant'

const VALID_EVENTS = [
  'reservation_cta', 'phone_click', 'whatsapp_click',
  'directions_click', 'event_inquiry_submit', 'contact_form_submit',
  'page_view',
] as const

/**
 * POST /api/track — lightweight CTA / interaction tracking.
 * Public (no auth), but tenant-scoped via x-tenant-slug header.
 * Rate-limited by nature (single event per call, no batch).
 */
export async function POST(request: NextRequest) {
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  const tenantId = await requireTenantId(slug)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  let body: { event: string; path?: string; metadata?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  if (!body.event || !VALID_EVENTS.includes(body.event as typeof VALID_EVENTS[number])) {
    return NextResponse.json({ error: 'Geçersiz event türü' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fire-and-forget insert — don't block on analytics
  await supabase.from('site_events').insert({
    tenant_id: tenantId,
    event_type: body.event,
    page_path: body.path || null,
    metadata: body.metadata || {},
  })

  return NextResponse.json({ ok: true })
}
