import { NextRequest, NextResponse } from 'next/server'
import { cancelReservationByToken } from '@/lib/data/reservations'

/**
 * POST /api/reservations/cancel/[token] — guest self-cancellation.
 * No auth required — the cancel token acts as proof of ownership.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Geçersiz iptal tokeni' }, { status: 400 })
  }

  const result = await cancelReservationByToken(token)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: 'Rezervasyonunuz iptal edildi.' })
}
