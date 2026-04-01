import { createAdminClient } from '@/lib/supabase/admin'
import type { ContactSubmission } from '@/types'

export async function getContactSubmissions(
  tenantId: string,
  filters?: {
    status?: string
    limit?: number
    offset?: number
  },
): Promise<{ data: ContactSubmission[]; count: number }> {
  const supabase = createAdminClient()
  let query = supabase
    .from('contact_submissions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1)

  const { data, count } = await query
  return { data: (data as ContactSubmission[]) || [], count: count ?? 0 }
}

export async function createContactSubmission(params: {
  tenantId: string
  name: string
  email: string
  phone?: string | null
  message: string
}): Promise<{ id: string } | { error: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      tenant_id: params.tenantId,
      name: params.name,
      email: params.email,
      phone: params.phone || null,
      message: params.message,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) return { error: error.message }
  return { id: data!.id }
}

export async function markContactRead(
  id: string,
  isRead: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_read: isRead })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
