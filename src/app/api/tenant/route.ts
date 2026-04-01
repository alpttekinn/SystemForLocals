import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantConfig } from '@/lib/tenant'

/**
 * GET /api/tenant — returns the resolved tenant config for the current request.
 * Used by client-side layouts (e.g., admin panel) to load tenant context.
 */
export async function GET(request: NextRequest) {
  const slug = request.headers.get('x-tenant-slug')

  if (!slug) {
    return NextResponse.json(
      { error: 'Tenant not resolved' },
      { status: 400 },
    )
  }

  const config = await resolveTenantConfig(slug)

  if (!config) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 },
    )
  }

  return NextResponse.json(config)
}
