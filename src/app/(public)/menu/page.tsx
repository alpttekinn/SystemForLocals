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
  return tenantMetadata('Menu')
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
      <Section className="bg-brand-surface pt-24">
        <Container>
          <SectionHeader
            title="Menümüz"
            subtitle="Özenle hazırlanan lezzetlerimizi keşfedin"
          />

          {categories.length === 0 ? (
            <EmptyState title="Menü henüz eklenmedi." />
          ) : (
            <div className="space-y-12">
              {categories.map((category) => (
                <div key={category.id} id={category.slug}>
                  <h2 className="font-serif text-2xl font-semibold text-charcoal-900 mb-6 text-center">
                    {category.name}
                  </h2>
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
                              <h3 className="font-serif text-base font-semibold text-charcoal-900 leading-tight">
                                {item.name}
                              </h3>
                              {item.is_featured && (
                                <Badge variant="gold" className="mt-1">Öne Çıkan</Badge>
                              )}
                            </div>
                            <span className="text-sm font-medium text-brand-primary whitespace-nowrap">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-charcoal-500 mt-1 line-clamp-2">{item.description}</p>
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
