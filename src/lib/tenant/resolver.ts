import type { TenantConfig, Tenant, TenantBranding, TenantContact, TenantSeo, TenantFeatures } from '@/types'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Tenant Resolution Strategy
 * ──────────────────────────
 *
 * Resolution order (first match wins):
 *
 * 1. x-tenant-slug header (local dev / testing)
 * 2. ?tenant=slug query parameter (Vercel previews / dev)
 * 3. Subdomain extraction from Host header (production: slug.platform.com)
 * 4. Custom domain lookup in tenant_domains table
 * 5. NEXT_PUBLIC_DEFAULT_TENANT_SLUG env fallback (single-tenant mode / demo)
 *
 * In production:
 *   - Each tenant gets slug.yoursaas.com automatically
 *   - Custom domains are supported via tenant_domains table
 *   - Vercel handles DNS; domain verification is managed in admin
 *
 * In local development:
 *   - Set NEXT_PUBLIC_DEFAULT_TENANT_SLUG=yesilcam-cekmekoy in .env.local
 *   - Or use x-tenant-slug header from middleware/fetch
 *   - Or use ?tenant=slug query parameter
 */

const PLATFORM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'vercel.app',
  // Add your production platform domain here, e.g.:
  // 'cafepanel.com',
  ...(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ? [process.env.NEXT_PUBLIC_PLATFORM_DOMAIN] : []),
]

/**
 * Resolve tenant slug from a request.
 * Used in middleware to determine the active tenant for each request.
 */
export function resolveTenantSlug(request: {
  headers: { get(name: string): string | null }
  url: string
}): string | null {
  // 1. Explicit header (dev/testing)
  const headerSlug = request.headers.get('x-tenant-slug')
  if (headerSlug) return headerSlug

  // 2. Query parameter (previews/dev)
  try {
    const url = new URL(request.url)
    const querySlug = url.searchParams.get('tenant')
    if (querySlug) return querySlug
  } catch {
    // URL parsing failed, continue
  }

  // 3. Subdomain extraction
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0] // strip port

  // Check if it's a platform domain with subdomain
  for (const platformDomain of PLATFORM_DOMAINS) {
    if (hostname.endsWith(platformDomain)) {
      const subdomain = hostname.replace(`.${platformDomain}`, '')
      // Must be a valid slug (not empty, not the hostname itself)
      if (subdomain && subdomain !== hostname && !subdomain.includes('.')) {
        return subdomain
      }
      break // It's a platform domain but no subdomain
    }
  }

  // 4. Custom domain — needs DB lookup (handled in resolveTenantFromDomain)
  // Return null here; caller should try domain-based resolution
  return null
}

/**
 * Resolve a full TenantConfig from a slug.
 * Uses service_role client to bypass RLS (server-side only).
 */
export async function resolveTenantConfig(slug: string): Promise<TenantConfig | null> {
  const supabase = createAdminClient()

  // Load tenant by slug
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single<Tenant>()

  if (tenantErr || !tenant) return null

  // Load all config tables in parallel
  const [brandingRes, contactRes, seoRes, featuresRes] = await Promise.all([
    supabase.from('tenant_branding').select('*').eq('tenant_id', tenant.id).single<TenantBranding>(),
    supabase.from('tenant_contact').select('*').eq('tenant_id', tenant.id).single<TenantContact>(),
    supabase.from('tenant_seo').select('*').eq('tenant_id', tenant.id).single<TenantSeo>(),
    supabase.from('tenant_features').select('*').eq('tenant_id', tenant.id).single<TenantFeatures>(),
  ])

  // All config rows should exist (created on tenant setup)
  if (!brandingRes.data || !contactRes.data || !seoRes.data || !featuresRes.data) {
    return null
  }

  return {
    tenant,
    branding: brandingRes.data,
    contact: contactRes.data,
    seo: seoRes.data,
    features: featuresRes.data,
  }
}

/**
 * Resolve tenant from a custom domain (non-platform domain).
 * Looks up tenant_domains table.
 */
export async function resolveTenantFromDomain(domain: string): Promise<string | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('tenant_domains')
    .select('tenants!inner(slug)')
    .eq('domain', domain)
    .eq('is_verified', true)
    .single<{ tenants: { slug: string } }>()

  return data?.tenants?.slug ?? null
}

/**
 * Get tenant slug with full fallback chain.
 * Returns slug or null.
 */
export async function getFullTenantSlug(request: {
  headers: { get(name: string): string | null }
  url: string
}): Promise<string | null> {
  // Try header/query/subdomain first
  const slug = resolveTenantSlug(request)
  if (slug) return slug

  // Try custom domain lookup
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]
  const isPlatformDomain = PLATFORM_DOMAINS.some(d => hostname.endsWith(d))

  if (!isPlatformDomain && hostname) {
    const domainSlug = await resolveTenantFromDomain(hostname)
    if (domainSlug) return domainSlug
  }

  // Fallback to default tenant
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || null
}
