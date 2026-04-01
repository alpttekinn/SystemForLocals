import { headers } from 'next/headers'
import { resolveTenantConfig } from '@/lib/tenant'
import type { Metadata } from 'next'

/**
 * Build Next.js Metadata from tenant SEO + branding config.
 * Usage: export async function generateMetadata() { return tenantMetadata('Menu') }
 */
export async function tenantMetadata(pageTitle?: string): Promise<Metadata> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) return {}

  const config = await resolveTenantConfig(slug)
  if (!config) return {}

  const { seo, branding, contact } = config
  const template = seo.meta_title_template || '{page} | ' + config.tenant.name
  const title = pageTitle
    ? template.replace('{page}', pageTitle).replace('%s', pageTitle)
    : config.tenant.name

  const description = seo.meta_description || branding.short_description || ''
  const ogTitle = pageTitle || seo.og_title || config.tenant.name
  const ogDescription = seo.og_description || description

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      ...(branding.og_image_url && { images: [{ url: branding.og_image_url }] }),
      ...(seo.canonical_base_url && { url: seo.canonical_base_url }),
    },
    ...(seo.canonical_base_url && {
      alternates: { canonical: seo.canonical_base_url },
    }),
    other: {
      ...(contact.address && { 'geo.placename': `${contact.district || ''}, ${contact.city || ''}` }),
    },
  }
}

/**
 * JSON-LD structured data for Restaurant schema.
 * Render via <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />
 */
export function buildRestaurantJsonLd(config: {
  name: string
  description?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  district?: string | null
  cuisines?: string[]
  priceRange?: string
  url?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: config.name,
    ...(config.description && { description: config.description }),
    ...(config.phone && { telephone: config.phone }),
    ...(config.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: config.address,
        ...(config.district && { addressLocality: config.district }),
        ...(config.city && { addressRegion: config.city }),
        addressCountry: 'TR',
      },
    }),
    ...(config.cuisines?.length && { servesCuisine: config.cuisines }),
    ...(config.priceRange && { priceRange: config.priceRange }),
    ...(config.url && { url: config.url }),
  }
}
