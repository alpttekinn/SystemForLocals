import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getGalleryItems } from '@/lib/data/gallery'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { EmptyState } from '@/components/ui/empty-state'
import { RevealProvider } from '@/components/reveal-provider'
import { tenantMetadata } from '@/lib/seo'

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
    <Section className="bg-brand-surface pt-24">
      <Container>
        <SectionHeader
          title="Galeri"
          subtitle="Mekanımızdan kareler"
        />

        {items.length === 0 ? (
          <EmptyState title="Galeri henüz eklenmedi." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 reveal-stagger">
            {items.map((item) => (
              <div key={item.id} className="group relative aspect-square rounded-card overflow-hidden reveal">
                <Image
                  src={item.thumbnail_url || item.image_url}
                  alt={item.alt_text || item.caption || 'Galeri'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-sm text-white">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
    </>
  )
}
