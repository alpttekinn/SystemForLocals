import { createAdminClient } from '@/lib/supabase/admin'
import type { GalleryItem } from '@/types'

export async function getGalleryItems(tenantId: string, visibleOnly = true): Promise<GalleryItem[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('gallery_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
  if (visibleOnly) {
    query = query.eq('is_visible', true)
  }
  const { data } = await query
  return (data as GalleryItem[]) || []
}

export async function getCoverImage(tenantId: string): Promise<GalleryItem | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_visible', true)
    .eq('is_cover', true)
    .limit(1)
    .single<GalleryItem>()
  return data
}
