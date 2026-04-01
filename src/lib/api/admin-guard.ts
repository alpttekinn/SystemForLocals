import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireTenantId } from '@/lib/data/tenant'
import type { MemberRole } from '@/types'

interface AdminAuth {
  tenantId: string
  userId: string
  role: MemberRole
}

/**
 * Shared admin route helper.
 * Verifies:
 *   1. Tenant slug header exists and resolves to a valid tenant
 *   2. User has a valid Supabase Auth session
 *   3. User has an active membership in this tenant (owner/admin/staff)
 *
 * Returns { tenantId, userId, role } or a NextResponse error.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuth | NextResponse> {
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  const tenantId = await requireTenantId(slug)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  // Verify tenant membership
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single<{ role: MemberRole }>()

  if (!membership) {
    return NextResponse.json({ error: 'Bu işletmeye erişim yetkiniz yok' }, { status: 403 })
  }

  return { tenantId, userId: user.id, role: membership.role }
}

/**
 * Type guard: checks if requireAdmin returned an error response.
 */
export function isAdminError(
  result: AdminAuth | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse
}
