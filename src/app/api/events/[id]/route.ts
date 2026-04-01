import { NextRequest, NextResponse } from 'next/server'
import { updateEventInquiryStatus, getEventInquiryById } from '@/lib/data/events'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/events/[id] — update event inquiry status (admin).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { status, admin_notes } = body as { status?: string; admin_notes?: string }

  const validStatuses = ['new', 'contacted', 'confirmed', 'completed', 'declined']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Geçerli bir durum seçiniz', valid: validStatuses },
      { status: 422 },
    )
  }

  const result = await updateEventInquiryStatus(id, status, admin_notes)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

/**
 * GET /api/events/[id] — get single event inquiry (admin).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const inquiry = await getEventInquiryById(id)
  if (!inquiry) {
    return NextResponse.json({ error: 'Etkinlik talebi bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(inquiry)
}
