import { NextRequest, NextResponse } from 'next/server'
import { getDayAvailability } from '@/lib/data/reservations'
import { requireTenantId, getReservationRules } from '@/lib/data/tenant'

/**
 * GET /api/reservations/availability?date=2025-01-15
 * 
 * Returns available time slots for a given date.
 * Public endpoint: no auth required.
 * 
 * Enforces: past date, max_days_ahead, business_hours, special_dates,
 * blocked_slots, capacity, lead_time (inside getDayAvailability).
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

  const dateStr = request.nextUrl.searchParams.get('date')
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: 'Geçerli bir tarih giriniz (YYYY-MM-DD)' },
      { status: 400 },
    )
  }

  // Validate date is not in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const requestedDate = new Date(dateStr + 'T00:00:00')
  if (requestedDate < today) {
    return NextResponse.json(
      { error: 'Geçmiş tarihlere rezervasyon yapılamaz.' },
      { status: 400 },
    )
  }

  // Validate max_days_ahead
  const rules = await getReservationRules(tenantId)
  const maxDays = rules?.max_days_ahead ?? 30
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + maxDays)
  if (requestedDate > maxDate) {
    return NextResponse.json(
      { error: `En fazla ${maxDays} gün sonrasına rezervasyon yapılabilir.` },
      { status: 400 },
    )
  }

  const availability = await getDayAvailability(tenantId, dateStr)
  return NextResponse.json({
    ...availability,
    rules: {
      max_days_ahead: maxDays,
      min_party_size: rules?.min_party_size ?? 1,
      max_party_size: rules?.max_party_size ?? 50,
      group_inquiry_threshold: rules?.group_inquiry_threshold ?? 8,
      auto_confirm: rules?.auto_confirm ?? false,
    },
  })
}
