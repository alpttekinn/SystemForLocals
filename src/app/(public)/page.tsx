import { headers } from 'next/headers'
import { requireTenantId } from '@/lib/data/tenant'
import { getFeaturedMenuItems } from '@/lib/data/menu'
import { getGalleryItems } from '@/lib/data/gallery'
import { getFeaturedTestimonials } from '@/lib/data/testimonials'
import { getActiveCampaigns } from '@/lib/data/campaigns'
import { tenantMetadata } from '@/lib/seo'
import { HomePageClient } from './home-client'

export async function generateMetadata() {
  return tenantMetadata()
}

export default async function HomePage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')

  if (!slug) return <HomePageClient featuredItems={[]} galleryItems={[]} testimonials={[]} activeCampaigns={[]} />

  const tenantId = await requireTenantId(slug)
  if (!tenantId) return <HomePageClient featuredItems={[]} galleryItems={[]} testimonials={[]} activeCampaigns={[]} />

  const [featuredItems, galleryItems, testimonials, activeCampaigns] = await Promise.all([
    getFeaturedMenuItems(tenantId),
    getGalleryItems(tenantId),
    getFeaturedTestimonials(tenantId),
    getActiveCampaigns(tenantId),
  ])

  return (
    <HomePageClient
      featuredItems={featuredItems}
      galleryItems={galleryItems}
      testimonials={testimonials}
      activeCampaigns={activeCampaigns}
    />
  )
}
