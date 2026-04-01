import { createAdminClient } from '@/lib/supabase/admin'
import type { MenuCategory, MenuItem, MenuCategoryWithItems } from '@/types'

export async function getMenuCategories(tenantId: string, visibleOnly = true): Promise<MenuCategory[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('menu_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
  if (visibleOnly) {
    query = query.eq('is_visible', true)
  }
  const { data } = await query
  return (data as MenuCategory[]) || []
}

export async function getMenuItems(tenantId: string, visibleOnly = true): Promise<MenuItem[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
  if (visibleOnly) {
    query = query.eq('is_visible', true)
  }
  const { data } = await query
  return (data as MenuItem[]) || []
}

export async function getMenuWithItems(tenantId: string, visibleOnly = true): Promise<MenuCategoryWithItems[]> {
  const [categories, items] = await Promise.all([
    getMenuCategories(tenantId, visibleOnly),
    getMenuItems(tenantId, visibleOnly),
  ])

  return categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id),
  }))
}

export async function getFeaturedMenuItems(tenantId: string): Promise<MenuItem[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_visible', true)
    .eq('is_featured', true)
    .order('sort_order')
    .limit(6)
  return (data as MenuItem[]) || []
}
