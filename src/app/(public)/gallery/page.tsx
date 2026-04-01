import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getGalleryItems } from '@/lib/data/gallery'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
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
          <>
            <div className="text-center mb-2">
              <p className="text-sm text-brand-text-muted">{items.length} fotoğraf</p>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 reveal-stagger">
              {items.map((item, i) => (
                <div key={item.id} className="group relative break-inside-avoid rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 reveal">
                  <div className={i % 3 === 0 ? 'aspect-[4/5]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[5/4]'}>
                    <Image
                      src={item.thumbnail_url || item.image_url}
                      alt={item.alt_text || item.caption || 'Galeri'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-sm text-white font-medium drop-shadow-lg">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
    </>
  )
}
