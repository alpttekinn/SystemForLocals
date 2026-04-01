import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Tenant, TenantBranding, TenantContact, TenantSeo, TenantFeatures,
  BusinessHours, ReservationRules, SpecialDate, BlockedSlot,
} from '@/types'

/**
 * Resolve tenant ID from slug. Uses service_role for guaranteed access.
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single<Tenant>()
  return data
}

/**
 * Get a tenant's ID from the x-tenant-slug header.
 * Throws if tenant not found.
 */
export async function requireTenantId(slug: string): Promise<string> {
  const tenant = await getTenantBySlug(slug)
  if (!tenant) throw new Error(`Tenant not found: ${slug}`)
  return tenant.id
}

// --- Config ---

export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<TenantBranding>()
  return data
}

export async function getTenantContact(tenantId: string): Promise<TenantContact | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenant_contact')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<TenantContact>()
  return data
}

export async function getTenantSeo(tenantId: string): Promise<TenantSeo | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenant_seo')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<TenantSeo>()
  return data
}

export async function getTenantFeatures(tenantId: string): Promise<TenantFeatures | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tenant_features')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<TenantFeatures>()
  return data
}

// --- Operations ---

export async function getBusinessHours(tenantId: string): Promise<BusinessHours[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('business_hours')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('day_of_week')
  return (data as BusinessHours[]) || []
}

export async function getReservationRules(tenantId: string): Promise<ReservationRules | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reservation_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .single<ReservationRules>()
  return data
}

export async function getSpecialDates(tenantId: string, fromDate?: string): Promise<SpecialDate[]> {
  const supabase = createAdminClient()
  let query = supabase.from('special_dates').select('*').eq('tenant_id', tenantId)
  if (fromDate) {
    query = query.gte('date', fromDate)
  }
  const { data } = await query.order('date')
  return (data as SpecialDate[]) || []
}

export async function getBlockedSlots(tenantId: string, date?: string): Promise<BlockedSlot[]> {
  const supabase = createAdminClient()
  let query = supabase.from('blocked_slots').select('*').eq('tenant_id', tenantId)
  if (date) {
    query = query.eq('date', date)
  }
  const { data } = await query.order('date')
  return (data as BlockedSlot[]) || []
}
