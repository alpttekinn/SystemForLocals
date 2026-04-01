import { createAdminClient } from '@/lib/supabase/admin'
import type { Campaign } from '@/types'

export async function getActiveCampaigns(tenantId: string): Promise<Campaign[]> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })
  return (data as Campaign[]) || []
}

export async function getCampaignBySlug(tenantId: string, slug: string): Promise<Campaign | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('is_active', true)
    .single<Campaign>()
  return data
}

export async function getAllCampaigns(tenantId: string): Promise<Campaign[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  return (data as Campaign[]) || []
}
