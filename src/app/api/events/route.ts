import { NextRequest, NextResponse } from 'next/server'
import { createEventInquiry, getEventInquiries } from '@/lib/data/events'
import { requireTenantId, getTenantBySlug } from '@/lib/data/tenant'
import { createEventInquirySchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/api/rate-limit'
import { notifyEventInquiryCreated } from '@/lib/notifications'

/**
 * POST /api/events — submit an event inquiry (public, no auth).
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'events', 5, 60_000)
  if (limited) return limited

  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  const tenantId = await requireTenantId(slug)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = createEventInquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const d = parsed.data
  const result = await createEventInquiry({
    tenantId,
    guestName: d.guest_name,
    guestPhone: d.guest_phone,
    guestEmail: d.guest_email,
    eventType: d.event_type,
    estimatedGuests: d.estimated_guests,
    preferredDate: d.preferred_date,
    preferredTime: d.preferred_time,
    alternativeDate: d.alternative_date,
    message: d.message,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Fire-and-forget: send guest acknowledgment + admin alert
  const tenant = await getTenantBySlug(slug!)
  if (tenant) {
    const inquiry = {
      id: result.id,
      guest_name: d.guest_name,
      guest_phone: d.guest_phone,
      guest_email: d.guest_email,
      event_type: d.event_type,
      estimated_guests: d.estimated_guests,
      preferred_date: d.preferred_date || null,
      preferred_time: d.preferred_time || null,
      alternative_date: d.alternative_date || null,
      message: d.message || null,
      status: 'new' as const,
      admin_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId!,
    }
    notifyEventInquiryCreated(tenantId!, inquiry, tenant.name).catch(() => {})
  }

  return NextResponse.json({ id: result.id }, { status: 201 })
}

/**
 * GET /api/events — list event inquiries (admin, requires auth).
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const result = await getEventInquiries(tenantId, {
    status: sp.get('status') || undefined,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!) : 20,
    offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0,
  })

  return NextResponse.json(result)
}
