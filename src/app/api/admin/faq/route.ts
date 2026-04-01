import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAllFaqItems } from '@/lib/data/faq'
import { faqItemSchema } from '@/lib/validations'

/**
 * GET /api/admin/faq — all FAQ items.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const items = await getAllFaqItems(auth.tenantId)
  return NextResponse.json({ items })
}

/**
 * POST /api/admin/faq — create FAQ item.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = faqItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('faq_items')
    .insert({ tenant_id: auth.tenantId, ...parsed.data })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data!.id }, { status: 201 })
}

/**
 * PATCH /api/admin/faq — update FAQ item.
 * Body: { id, ...fields }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { id, ...fields } = body as { id?: string; [key: string]: unknown }
  if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })

  const parsed = faqItemSchema.partial().safeParse(fields)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('faq_items').update(parsed.data).eq('id', id).eq('tenant_id', auth.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/admin/faq — delete FAQ item.
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('faq_items').delete().eq('id', id).eq('tenant_id', auth.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
