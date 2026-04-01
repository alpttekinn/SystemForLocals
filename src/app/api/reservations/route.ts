import { NextRequest, NextResponse } from 'next/server'
import { createReservation, getReservations, getReservationById } from '@/lib/data/reservations'
import { requireTenantId, getTenantBySlug, getReservationRules } from '@/lib/data/tenant'
import { createReservationSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/api/rate-limit'
import { notifyReservationCreated } from '@/lib/notifications'

/**
 * POST /api/reservations — create a new reservation (public, no auth).
 * Uses the atomic create_reservation() RPC which handles:
 *   - Tenant-scoped advisory lock
 *   - Blocked slot check
 *   - Capacity check
 *   - Auto-confirm logic
 *   - Cancel token generation
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'reservations', 5, 60_000)
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

  const parsed = createReservationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const d = parsed.data

  // Enforce tenant-specific party size and group threshold rules
  const rules = await getReservationRules(tenantId!)
  if (rules) {
    const min = rules.min_party_size ?? 1
    const max = rules.max_party_size ?? 50
    if (d.party_size < min) {
      return NextResponse.json({ error: `En az ${min} kişi olmalıdır.` }, { status: 422 })
    }
    if (d.party_size > max) {
      return NextResponse.json({ error: `En fazla ${max} kişi olabilir.` }, { status: 422 })
    }
    const threshold = rules.group_inquiry_threshold ?? 8
    if (d.party_size >= threshold) {
      return NextResponse.json(
        { error: `${threshold} ve üzeri kişi için lütfen etkinlik talebi oluşturun.`, code: 'GROUP_REDIRECT' },
        { status: 422 },
      )
    }
  }

  const result = await createReservation({
    tenantId,
    guestName: d.guest_name,
    guestPhone: d.guest_phone,
    guestEmail: d.guest_email,
    partySize: d.party_size,
    date: d.reservation_date,
    time: d.reservation_time,
    specialRequests: d.special_requests,
  })

  if ('error' in result) {
    const statusCode = result.code === 'SLOT_BLOCKED' || result.code === 'SLOT_FULL' ? 409 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status: statusCode })
  }

  // Fire-and-forget: send guest confirmation + admin alert emails
  const tenant = await getTenantBySlug(slug!)
  const reservation = await getReservationById(result.id)
  if (tenant && reservation) {
    notifyReservationCreated(tenantId!, reservation, tenant.name).catch(() => {})
  }

  return NextResponse.json({ id: result.id }, { status: 201 })
}

/**
 * GET /api/reservations — list reservations (admin, requires auth).
 * Params: ?date=YYYY-MM-DD&status=pending&limit=20&offset=0
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

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const result = await getReservations(tenantId, {
    date: sp.get('date') || undefined,
    status: sp.get('status') || undefined,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!) : 20,
    offset: sp.get('offset') ? parseInt(sp.get('offset')!) : 0,
  })

  return NextResponse.json(result)
}
