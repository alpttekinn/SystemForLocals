import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireTenantId } from '@/lib/data/tenant'
import { getGalleryItems } from '@/lib/data/gallery'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { EmptyState } from '@/components/ui/empty-state'
import { RevealProvider } from '@/components/reveal-provider'
import { tenantMetadata } from '@/lib/seo'
import { GalleryGrid } from './gallery-grid'

export async function generateMetadata() {
  return tenantMetadata('Galeri')
}

export default async function GalleryPage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) notFound()

  const tenantId = await requireTenantId(slug)
  if (!tenantId) notFound()

  const items = await getGalleryItems(tenantId)

  return (
    <>
    <RevealProvider />
    {/* Hero banner */}
    <section className="bg-brand-gradient text-white pt-28 pb-12">
      <Container className="text-center">
        <h1 className="text-heading text-white mb-3">Galeri</h1>
        <p className="text-body-lg text-white/70 max-w-xl mx-auto">Mekanımızdan kareler ve atmosferimiz</p>
        <div className="gold-divider mt-6" />
      </Container>
    </section>

    <Section className="bg-brand-gradient-subtle">
      <Container>
        {items.length === 0 ? (
          <EmptyState
            title="Galeri hazırlanıyor"
            description="Mekanımızın en güzel kareleri çok yakında burada olacak."
          />
        ) : (
          <GalleryGrid items={items.map(item => ({
            id: item.id,
            image_url: item.image_url,
            thumbnail_url: item.thumbnail_url,
            alt_text: item.alt_text,
            caption: item.caption,
          }))} />
        )}
      </Container>
    </Section>
    </>
  )
}
