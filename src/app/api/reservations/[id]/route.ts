import { NextRequest, NextResponse } from 'next/server'
import { updateReservationStatus, getReservationById } from '@/lib/data/reservations'
import { updateReservationStatusSchema } from '@/lib/validations'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import {
  notifyReservationConfirmed,
  notifyReservationCancelled,
  notifyReservationRejected,
} from '@/lib/notifications'

/**
 * PATCH /api/reservations/[id] — update reservation status (admin).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = updateReservationStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Get reservation before update for notification context
  const reservation = await getReservationById(id)
  if (!reservation) {
    return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
  }

  const result = await updateReservationStatus(
    id,
    parsed.data.status,
    auth.userId,
    parsed.data.reason,
    parsed.data.admin_notes,
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Fire-and-forget notifications based on new status
  const slug = request.headers.get('x-tenant-slug') || ''
  const businessName = slug // Will be resolved from tenant data inside notifiers if needed
  const updatedReservation = { ...reservation, status: parsed.data.status }

  if (parsed.data.status === 'confirmed') {
    notifyReservationConfirmed(auth.tenantId, updatedReservation, businessName).catch(() => {})
  } else if (parsed.data.status === 'cancelled') {
    notifyReservationCancelled(auth.tenantId, updatedReservation, businessName, parsed.data.reason).catch(() => {})
  } else if (parsed.data.status === 'rejected') {
    notifyReservationRejected(auth.tenantId, updatedReservation, businessName, parsed.data.reason).catch(() => {})
  }

  return NextResponse.json({ success: true })
}

/**
 * GET /api/reservations/[id] — get single reservation (admin).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth
  const { id } = await params

  const reservation = await getReservationById(id)
  if (!reservation) {
    return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(reservation)
}
