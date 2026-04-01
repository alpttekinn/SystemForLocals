import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessHours, getReservationRules, getSpecialDates, getBlockedSlots } from '@/lib/data/tenant'
import { updateBusinessHoursSchema, updateReservationRulesSchema, createBlockedSlotSchema, specialDateSchema } from '@/lib/validations'

/**
 * GET /api/admin/hours — get business hours, rules, special dates, blocked slots.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const [hours, rules, specialDates, blockedSlots] = await Promise.all([
    getBusinessHours(auth.tenantId),
    getReservationRules(auth.tenantId),
    getSpecialDates(auth.tenantId),
    getBlockedSlots(auth.tenantId),
  ])

  return NextResponse.json({ hours, rules, specialDates, blockedSlots })
}

/**
 * PATCH /api/admin/hours — update hours/rules.
 * Body: { action, data }
 *   action: 'update_hours' | 'update_rules' | 'add_special_date' | 'delete_special_date' | 'add_blocked_slot' | 'delete_blocked_slot'
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

  const { action, data } = body as { action?: string; data?: unknown }
  if (!action || !data) {
    return NextResponse.json({ error: 'action ve data gereklidir' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (action) {
    case 'update_hours': {
      const parsed = updateBusinessHoursSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('business_hours')
        .upsert({
          tenant_id: auth.tenantId,
          ...parsed.data,
        }, { onConflict: 'tenant_id,day_of_week' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'update_rules': {
      const parsed = updateReservationRulesSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('reservation_rules')
        .upsert({
          tenant_id: auth.tenantId,
          ...parsed.data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'add_special_date': {
      const parsed = specialDateSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('special_dates')
        .upsert({
          tenant_id: auth.tenantId,
          ...parsed.data,
        }, { onConflict: 'tenant_id,date' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'delete_special_date': {
      const { id } = data as { id?: string }
      if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
      const { error } = await supabase
        .from('special_dates')
        .delete()
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'add_blocked_slot': {
      const parsed = createBlockedSlotSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors }, { status: 422 })
      }
      const { error } = await supabase
        .from('blocked_slots')
        .insert({
          tenant_id: auth.tenantId,
          ...parsed.data,
        })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'delete_blocked_slot': {
      const { id } = data as { id?: string }
      if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    default:
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
