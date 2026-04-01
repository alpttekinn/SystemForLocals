import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Reservation, ReservationStatusHistory, DayAvailability, TimeSlot,
  BusinessHours, ReservationRules, SpecialDate, BlockedSlot,
} from '@/types'
import { getDayOfWeek, generateTimeSlots, timeToMinutes, toISODateString } from '@/lib/utils'

// =============================================================================
// Availability — computes available time slots for a given date
// =============================================================================

/**
 * Get available time slots for a tenant on a specific date.
 *
 * MIDNIGHT CONVENTION:
 * close_time = '00:00' means end of business day (midnight).
 * The generateTimeSlots() utility handles this by treating 00:00 as 1440 minutes.
 *
 * Steps:
 * 1. Load business_hours for that day-of-week
 * 2. Check special_dates → if closed, return empty
 * 3. Override hours from special_dates if present
 * 4. Generate time slots from open→close per slot_duration
 * 5. For each slot:
 *    a. Check blocked_slots → if full_day or matching time_range → skip
 *    b. Check capacity_override → use override if exists
 *    c. Sum occupancy from current reservations (pending+confirmed)
 *    d. Calculate remaining capacity
 * 6. Filter by lead_time (slots too soon are hidden)
 * 7. Return full DayAvailability
 */
export async function getDayAvailability(
  tenantId: string,
  dateStr: string,
): Promise<DayAvailability> {
  const supabase = createAdminClient()
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = getDayOfWeek(date)

  // Load all needed data in parallel
  const [hoursRes, rulesRes, specialRes, blockedRes, occupancyRes] = await Promise.all([
    supabase.from('business_hours').select('*')
      .eq('tenant_id', tenantId).eq('day_of_week', dayOfWeek).single<BusinessHours>(),
    supabase.from('reservation_rules').select('*')
      .eq('tenant_id', tenantId).single<ReservationRules>(),
    supabase.from('special_dates').select('*')
      .eq('tenant_id', tenantId).eq('date', dateStr).single<SpecialDate>(),
    supabase.from('blocked_slots').select('*')
      .eq('tenant_id', tenantId).eq('date', dateStr),
    supabase.from('reservations').select('reservation_time, party_size')
      .eq('tenant_id', tenantId)
      .eq('reservation_date', dateStr)
      .in('status', ['pending', 'confirmed']),
  ])

  const hours = hoursRes.data
  const rules = rulesRes.data
  const special = specialRes.data
  const blocked = (blockedRes.data as BlockedSlot[]) || []
  const occupancy = (occupancyRes.data as { reservation_time: string; party_size: number }[]) || []

  // Default rules if none configured
  const slotDuration = rules?.slot_duration_minutes ?? 60
  const defaultCapacity = rules?.default_slot_capacity ?? 20
  const leadTimeHours = rules?.lead_time_hours ?? 2

  // Check if closed: special date override or no business hours
  if (special?.is_closed) {
    return { date: dateStr, is_open: false, reason: special.reason || 'Kapalı', slots: [] }
  }
  if (!hours || !hours.is_open) {
    return { date: dateStr, is_open: false, reason: 'Kapalı', slots: [] }
  }

  // Check if entire day is blocked
  const fullDayBlock = blocked.find(b => b.block_type === 'full_day')
  if (fullDayBlock) {
    return { date: dateStr, is_open: false, reason: fullDayBlock.reason || 'Bloke edildi', slots: [] }
  }

  // Determine open/close times (special date can override)
  const openTime = special?.open_time || hours.open_time
  const closeTime = special?.close_time || hours.close_time

  // Generate all possible time slots
  const slotTimes = generateTimeSlots(
    openTime, closeTime, slotDuration,
    hours.break_start, hours.break_end,
  )

  // Build occupancy map: time → total party_size
  const occupancyMap = new Map<string, number>()
  for (const row of occupancy) {
    const time = row.reservation_time.slice(0, 5)
    occupancyMap.set(time, (occupancyMap.get(time) ?? 0) + row.party_size)
  }

  // Time-range blocked set for quick lookup
  const timeRangeBlocks = blocked.filter(b => b.block_type === 'time_range')
  const capacityOverrides = blocked.filter(b => b.block_type === 'capacity_override')

  // Lead time cutoff: slots before (now + leadTimeHours) are hidden
  const now = new Date()
  const today = toISODateString(now)
  const isToday = dateStr === today
  const leadTimeCutoffMin = isToday
    ? now.getHours() * 60 + now.getMinutes() + leadTimeHours * 60
    : 0

  const slots: TimeSlot[] = []

  for (const time of slotTimes) {
    const timeMin = timeToMinutes(time)

    // Lead time check
    if (isToday && timeMin < leadTimeCutoffMin) continue

    // Time-range block check
    const isBlocked = timeRangeBlocks.some(b => {
      const start = timeToMinutes(b.start_time!)
      const end = timeToMinutes(b.end_time!)
      return timeMin >= start && timeMin < end
    })
    if (isBlocked) continue

    // Capacity: check for override
    const override = capacityOverrides.find(b => {
      const start = timeToMinutes(b.start_time!)
      const end = timeToMinutes(b.end_time!)
      return timeMin >= start && timeMin < end
    })
    const capacity = override?.override_capacity ?? defaultCapacity

    const occupied = occupancyMap.get(time) ?? 0
    const remaining = Math.max(0, capacity - occupied)

    slots.push({
      time,
      capacity,
      occupied,
      remaining,
      available: remaining > 0,
    })
  }

  return { date: dateStr, is_open: true, slots }
}

// =============================================================================
// Reservations — CRUD
// =============================================================================

export async function getReservations(
  tenantId: string,
  filters?: {
    date?: string
    status?: string
    limit?: number
    offset?: number
  },
): Promise<{ data: Reservation[]; count: number }> {
  const supabase = createAdminClient()
  let query = supabase
    .from('reservations')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('reservation_date', { ascending: false })
    .order('reservation_time', { ascending: false })

  if (filters?.date) query = query.eq('reservation_date', filters.date)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1)

  const { data, count } = await query
  return { data: (data as Reservation[]) || [], count: count ?? 0 }
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single<Reservation>()
  return data
}

export async function getReservationByToken(token: string): Promise<Reservation | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('cancel_token', token)
    .single<Reservation>()
  return data
}

export async function getReservationHistory(reservationId: string): Promise<ReservationStatusHistory[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reservation_status_history')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('created_at')
  return (data as ReservationStatusHistory[]) || []
}

/**
 * Create a reservation using the atomic PG function.
 * Returns the new reservation ID.
 */
export async function createReservation(params: {
  tenantId: string
  guestName: string
  guestPhone: string
  guestEmail: string
  partySize: number
  date: string
  time: string
  specialRequests?: string | null
}): Promise<{ id: string } | { error: string; code: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('create_reservation', {
    p_tenant_id: params.tenantId,
    p_guest_name: params.guestName,
    p_guest_phone: params.guestPhone,
    p_guest_email: params.guestEmail,
    p_party_size: params.partySize,
    p_date: params.date,
    p_time: params.time,
    p_special_requests: params.specialRequests || null,
  })

  if (error) {
    // Parse PG exception messages
    const msg = error.message || ''
    if (msg.includes('SLOT_BLOCKED')) {
      return { error: 'Bu zaman dilimi müsait değil.', code: 'SLOT_BLOCKED' }
    }
    if (msg.includes('SLOT_FULL')) {
      return { error: 'Bu zaman dilimi için yeterli kapasite yok.', code: 'SLOT_FULL' }
    }
    return { error: 'Rezervasyon oluşturulurken bir hata oluştu.', code: 'UNKNOWN' }
  }

  return { id: data as string }
}

/**
 * Update reservation status with history tracking.
 */
export async function updateReservationStatus(
  reservationId: string,
  newStatus: string,
  changedBy?: string,
  reason?: string,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Get current status
  const { data: current } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single<{ status: string }>()

  if (!current) return { success: false, error: 'Rezervasyon bulunamadı.' }

  // Update status
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }
  if (adminNotes !== undefined) updateData.admin_notes = adminNotes

  const { error: updateErr } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', reservationId)

  if (updateErr) return { success: false, error: updateErr.message }

  // Log history
  await supabase.from('reservation_status_history').insert({
    reservation_id: reservationId,
    old_status: current.status,
    new_status: newStatus,
    changed_by: changedBy || null,
    reason: reason || null,
  })

  return { success: true }
}

/**
 * Cancel reservation by token (guest self-cancel).
 */
export async function cancelReservationByToken(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const reservation = await getReservationByToken(token)
  if (!reservation) return { success: false, error: 'Rezervasyon bulunamadı.' }

  if (reservation.status === 'cancelled') {
    return { success: false, error: 'Bu rezervasyon zaten iptal edilmiş.' }
  }
  if (reservation.status === 'completed' || reservation.status === 'no_show') {
    return { success: false, error: 'Tamamlanmış rezervasyonlar iptal edilemez.' }
  }

  return updateReservationStatus(
    reservation.id,
    'cancelled',
    undefined,
    'Misafir tarafından iptal edildi',
  )
}
