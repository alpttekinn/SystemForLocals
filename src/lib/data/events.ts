import { createAdminClient } from '@/lib/supabase/admin'
import type { EventInquiry } from '@/types'

export async function getEventInquiries(
  tenantId: string,
  filters?: {
    status?: string
    limit?: number
    offset?: number
  },
): Promise<{ data: EventInquiry[]; count: number }> {
  const supabase = createAdminClient()
  let query = supabase
    .from('event_inquiries')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1)

  const { data, count } = await query
  return { data: (data as EventInquiry[]) || [], count: count ?? 0 }
}

export async function getEventInquiryById(id: string): Promise<EventInquiry | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('event_inquiries')
    .select('*')
    .eq('id', id)
    .single<EventInquiry>()
  return data
}

export async function createEventInquiry(params: {
  tenantId: string
  guestName: string
  guestPhone: string
  guestEmail: string
  eventType: string
  estimatedGuests: number
  preferredDate?: string | null
  preferredTime?: string | null
  alternativeDate?: string | null
  message?: string | null
}): Promise<{ id: string } | { error: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('event_inquiries')
    .insert({
      tenant_id: params.tenantId,
      guest_name: params.guestName,
      guest_phone: params.guestPhone,
      guest_email: params.guestEmail,
      event_type: params.eventType,
      estimated_guests: params.estimatedGuests,
      preferred_date: params.preferredDate || null,
      preferred_time: params.preferredTime || null,
      alternative_date: params.alternativeDate || null,
      message: params.message || null,
      status: 'new',
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }
  return { id: data!.id }
}

export async function updateEventInquiryStatus(
  id: string,
  status: string,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (adminNotes !== undefined) updateData.admin_notes = adminNotes

  const { error } = await supabase
    .from('event_inquiries')
    .update(updateData)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
