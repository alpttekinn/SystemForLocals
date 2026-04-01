import { createAdminClient } from '@/lib/supabase/admin'
import type { FaqItem } from '@/types'

export async function getVisibleFaqItems(tenantId: string): Promise<FaqItem[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('faq_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_visible', true)
    .order('sort_order')
  return (data as FaqItem[]) || []
}

export async function getAllFaqItems(tenantId: string): Promise<FaqItem[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('faq_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
  return (data as FaqItem[]) || []
}
