import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/stats — dashboard statistics (admin, requires auth).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const { tenantId } = auth
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  // Run all queries in parallel
  const [
    todayResResult,
    pendingResResult,
    totalResResult,
    weekResResult,
    newEventsResult,
    contactsResult,
    menuResult,
    galleryResult,
    campaignsResult,
    popularTimesResult,
    ctaEventsResult,
  ] = await Promise.all([
    // Today's reservations
    admin.from('reservations')
      .select('party_size', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('reservation_date', today),
    // Pending reservations
    admin.from('reservations')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending'),
    // Total reservations (last 30 days)
    admin.from('reservations')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', monthAgo),
    // This week reservations
    admin.from('reservations')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', weekAgo),
    // New event inquiries
    admin.from('event_inquiries')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'new'),
    // Contact form submissions (last 30 days)
    admin.from('contact_submissions')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', monthAgo),
    // Menu item count
    admin.from('menu_items')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    // Gallery count
    admin.from('gallery_items')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId),
    // Active campaigns
    admin.from('campaigns')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    // Popular reservation times (last 30 days)
    admin.from('reservations')
      .select('reservation_time')
      .eq('tenant_id', tenantId)
      .gte('created_at', monthAgo)
      .not('reservation_time', 'is', null),
    // CTA events (last 30 days) — may not exist yet if migration 00004 not applied
    admin.from('site_events')
      .select('event_type')
      .eq('tenant_id', tenantId)
      .gte('created_at', monthAgo)
      .then(res => res.error ? { data: [], error: null } : res),
  ])

  const todayGuests = (todayResResult.data || []).reduce(
    (sum: number, r: { party_size: number }) => sum + (r.party_size || 0), 0
  )

  // Aggregate popular time slots
  const timeCounts: Record<string, number> = {}
  for (const r of popularTimesResult.data || []) {
    const hour = (r as { reservation_time: string }).reservation_time?.slice(0, 5)
    if (hour) timeCounts[hour] = (timeCounts[hour] || 0) + 1
  }
  const popularTimes = Object.entries(timeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([time, count]) => ({ time, count }))

  // Aggregate CTA events
  const ctaCounts: Record<string, number> = {}
  for (const e of ctaEventsResult.data || []) {
    const type = (e as { event_type: string }).event_type
    if (type) ctaCounts[type] = (ctaCounts[type] || 0) + 1
  }

  return NextResponse.json({
    todayReservations: todayResResult.count ?? 0,
    todayGuests,
    pendingReservations: pendingResResult.count ?? 0,
    totalReservations30d: totalResResult.count ?? 0,
    weekReservations: weekResResult.count ?? 0,
    newEvents: newEventsResult.count ?? 0,
    contacts30d: contactsResult.count ?? 0,
    menuItems: menuResult.count ?? 0,
    galleryItems: galleryResult.count ?? 0,
    activeCampaigns: campaignsResult.count ?? 0,
    popularTimes,
    ctaEvents: ctaCounts,
  })
}
