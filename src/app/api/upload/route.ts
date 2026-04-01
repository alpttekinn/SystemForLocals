import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAdminError } from '@/lib/api/admin-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantStoragePath, STORAGE_BUCKETS } from '@/lib/constants'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/upload — upload an image to tenant storage.
 * Expects multipart/form-data with a single "file" field.
 * Optional "folder" field: 'menu' | 'gallery' | 'branding' | 'general'
 *
 * Returns { url: string } — the public URL of the uploaded image.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (isAdminError(auth)) return auth

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'general'

  if (!file) {
    return NextResponse.json({ error: 'Dosya gereklidir' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Yalnızca JPEG, PNG, WebP ve GIF dosyaları kabul edilir.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Dosya boyutu 5MB\'ı geçemez.' },
      { status: 400 },
    )
  }

  // Generate unique path: {tenantSlug}/{category}/{timestamp}-{name}
  const safeName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 50)
  const timestamp = Date.now()
  const category = (['brand', 'hero', 'gallery', 'menu', 'campaigns'].includes(folder) ? folder : 'gallery') as 'brand' | 'hero' | 'gallery' | 'menu' | 'campaigns'
  const storagePath = `${getTenantStoragePath(auth.tenantId, category)}/${timestamp}-${safeName}`

  const supabase = createAdminClient()
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.TENANT_ASSETS)
    .upload(storagePath, buf, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.TENANT_ASSETS)
    .getPublicUrl(storagePath)

  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
