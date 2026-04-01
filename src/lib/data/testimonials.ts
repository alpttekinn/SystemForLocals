import { createAdminClient } from '@/lib/supabase/admin'
import type { Testimonial } from '@/types'

export async function getPublishedTestimonials(tenantId: string): Promise<Testimonial[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_published', true)
    .order('sort_order')
  return (data as Testimonial[]) || []
}

export async function getFeaturedTestimonials(tenantId: string): Promise<Testimonial[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order')
    .limit(4)
  return (data as Testimonial[]) || []
}

export async function getAllTestimonials(tenantId: string): Promise<Testimonial[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
  return (data as Testimonial[]) || []
}
