import { NextRequest, NextResponse } from 'next/server'
import { createContactSubmission } from '@/lib/data/contact'
import { requireTenantId, getTenantBySlug } from '@/lib/data/tenant'
import { contactFormSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/api/rate-limit'
import { notifyContactSubmission } from '@/lib/notifications'

/**
 * POST /api/contact — submit contact form (public, no auth).
 */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'contact', 5, 60_000)
  if (limited) return limited

  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
  }

  const tenantId = await requireTenantId(slug)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const parsed = contactFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Doğrulama hatası', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const d = parsed.data
  const result = await createContactSubmission({
    tenantId,
    name: d.name,
    email: d.email,
    phone: d.phone,
    message: d.message,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Fire-and-forget: admin email alert
  const tenant = await getTenantBySlug(slug!)
  if (tenant) {
    notifyContactSubmission(tenantId!, { name: d.name, email: d.email, phone: d.phone, message: d.message }, tenant.name).catch(() => {})
  }

  return NextResponse.json({ id: result.id, message: 'Mesajınız alındı. Teşekkürler!' }, { status: 201 })
}
