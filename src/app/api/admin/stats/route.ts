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

  // Run all queries in parallel
  const [
    todayResResult,
    pendingResResult,
    totalResResult,
    newEventsResult,
    contactsResult,
    menuResult,
    galleryResult,
    campaignsResult,
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
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    // New event inquiries
    admin.from('event_inquiries')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'new'),
    // Contact form submissions (last 30 days)
    admin.from('contact_submissions')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
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
  ])

  const todayGuests = (todayResResult.data || []).reduce(
    (sum: number, r: { party_size: number }) => sum + (r.party_size || 0), 0
  )

  return NextResponse.json({
    todayReservations: todayResResult.count ?? 0,
    todayGuests,
    pendingReservations: pendingResResult.count ?? 0,
    totalReservations30d: totalResResult.count ?? 0,
    newEvents: newEventsResult.count ?? 0,
    contacts30d: contactsResult.count ?? 0,
    menuItems: menuResult.count ?? 0,
    galleryItems: galleryResult.count ?? 0,
    activeCampaigns: campaignsResult.count ?? 0,
  })
}
