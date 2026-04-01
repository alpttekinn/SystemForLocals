import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { menuCategorySchema, menuItemSchema } from '@/lib/validations'

/**
 * GET /api/admin/menu — get all categories with items.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  // For admin we want ALL items including hidden
  const supabase = createAdminClient()
  const [catRes, itemRes] = await Promise.all([
    supabase.from('menu_categories').select('*').eq('tenant_id', auth.tenantId).order('sort_order'),
    supabase.from('menu_items').select('*').eq('tenant_id', auth.tenantId).order('sort_order'),
  ])

  return NextResponse.json({
    categories: catRes.data || [],
    items: itemRes.data || [],
  })
}

/**
 * POST /api/admin/menu — create category or item.
 * Body: { type: 'category' | 'item', data: {...} }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { type, data } = body as { type?: string; data?: unknown }
  if (!type || !data) {
    return NextResponse.json({ error: 'type ve data gereklidir' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (type === 'category') {
    const parsed = menuCategorySchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
    }
    const { data: created, error } = await supabase
      .from('menu_categories')
      .insert({ tenant_id: auth.tenantId, ...parsed.data })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created!.id }, { status: 201 })
  }

  if (type === 'item') {
    const parsed = menuItemSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
    }
    const { data: created, error } = await supabase
      .from('menu_items')
      .insert({ tenant_id: auth.tenantId, ...parsed.data })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created!.id }, { status: 201 })
  }

  return NextResponse.json({ error: 'Geçersiz tür' }, { status: 400 })
}

/**
 * PATCH /api/admin/menu — update category or item.
 * Body: { type: 'category' | 'item', id: string, data: {...} }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { type, id, data } = body as { type?: string; id?: string; data?: unknown }
  if (!type || !id || !data) {
    return NextResponse.json({ error: 'type, id ve data gereklidir' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const table = type === 'category' ? 'menu_categories' : 'menu_items'
  const schema = type === 'category' ? menuCategorySchema : menuItemSchema

  const parsed = schema.partial().safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { error } = await supabase
    .from(table)
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/admin/menu — delete category or item.
 * Body: { type: 'category' | 'item', id: string }
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { type, id } = body as { type?: string; id?: string }
  if (!type || !id) {
    return NextResponse.json({ error: 'type ve id gereklidir' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const table = type === 'category' ? 'menu_categories' : 'menu_items'

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
