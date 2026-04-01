import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getMenuWithItems } from '@/lib/data/menu'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { tenantMetadata } from '@/lib/seo'

export async function generateMetadata() {
  return tenantMetadata('Menü')
}
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatPrice } from '@/lib/utils'
import { RevealProvider } from '@/components/reveal-provider'

export default async function MenuPage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) notFound()

  const tenantId = await requireTenantId(slug)
  if (!tenantId) notFound()

  const categories = await getMenuWithItems(tenantId)

  return (
    <>
      <RevealProvider />
      {/* Hero banner */}
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">Menümüz</h1>
          <p className="text-body-lg text-white/70 max-w-xl mx-auto">Özenle hazırlanan lezzetlerimizi keşfedin</p>
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      <Section className="bg-brand-gradient-subtle">
        <Container>
          {categories.length === 0 ? (
            <EmptyState
              title="Menü hazırlanıyor"
              description="Lezzetli menümüz çok yakında burada olacak."
            />
          ) : (
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category.id} id={category.slug}>
                  <div className="text-center mb-8">
                    <h2 className="font-serif text-2xl font-semibold text-brand-text">
                      {category.name}
                    </h2>
                    <div className="gold-divider mt-3" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto reveal-stagger">
                    {category.items.map((item) => (
                      <Card key={item.id} hover className="flex gap-4 reveal">
                        {item.image_url && (
                          <div className="w-20 h-20 rounded-card overflow-hidden relative shrink-0">
                            <Image
                              src={item.image_url}
                              alt={item.image_alt || item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-serif text-base font-semibold text-brand-text leading-tight">
                                {item.name}
                              </h3>
                              {item.is_featured && (
                                <Badge variant="gold" className="mt-1">Öne Çıkan</Badge>
                              )}
                            </div>
                            <span className="text-sm font-bold text-brand-primary whitespace-nowrap px-2 py-0.5 rounded-full bg-brand-surface-alt">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
