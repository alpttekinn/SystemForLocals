import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getMenuWithItems } from '@/lib/data/menu'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { tenantMetadata } from '@/lib/seo'

export async function generateMetadata() {
  return tenantMetadata('Menü')
}
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

  // Collect featured items across categories
  const featuredItems = categories.flatMap(c => c.items.filter(i => i.is_featured).map(i => ({ ...i, categoryName: c.name })))

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

      {/* Category quick-nav */}
      {categories.length > 0 && (
        <div className="sticky top-16 md:top-20 z-30 bg-brand-surface/95 backdrop-blur-md border-b border-brand-primary/10 shadow-sm">
          <Container>
            <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide" aria-label="Menü kategorileri">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.slug}`}
                  className="shrink-0 px-4 py-2 text-sm font-medium rounded-full border border-brand-primary/20 text-brand-text hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200"
                >
                  {cat.name}
                </a>
              ))}
            </nav>
          </Container>
        </div>
      )}

      {/* Featured items showcase */}
      {featuredItems.length > 0 && (
        <Section compact className="bg-brand-surface-alt">
          <Container>
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 text-brand-secondary font-semibold text-sm uppercase tracking-wider">
                ★ Şefin Önerileri ★
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {featuredItems.slice(0, 6).map((item) => (
                <div key={item.id} className="group bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 reveal">
                  {item.image_url ? (
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={item.image_url}
                        alt={item.image_alt || item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute bottom-3 right-3 bg-brand-secondary text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ) : (
                    <div className="relative h-40 bg-brand-gradient flex items-center justify-center">
                      <span className="text-white/30 text-5xl font-serif">{item.name.charAt(0)}</span>
                      <span className="absolute bottom-3 right-3 bg-white/20 backdrop-blur text-white text-sm font-bold px-3 py-1 rounded-full">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-base font-semibold text-brand-text">{item.name}</h3>
                    <p className="text-xs text-brand-text-muted mt-1">{item.categoryName}</p>
                    {item.description && (
                      <p className="text-sm text-brand-text-muted mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Full menu */}
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
                <div key={category.id} id={category.slug} className="scroll-mt-32">
                  <div className="text-center mb-8">
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-brand-text">
                      {category.name}
                    </h2>
                    <div className="gold-divider mt-3" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto reveal-stagger">
                    {category.items.map((item) => (
                      <div key={item.id} className={`flex gap-4 p-4 rounded-card bg-white/80 border transition-all duration-200 hover:shadow-card reveal ${item.is_featured ? 'border-brand-secondary/30 ring-1 ring-brand-secondary/10' : 'border-brand-primary/5'}`}>
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
                            <h3 className="font-serif text-base font-semibold text-brand-text leading-tight">
                              {item.name}
                            </h3>
                            <span className="text-sm font-bold text-brand-primary whitespace-nowrap px-2 py-0.5 rounded-full bg-brand-surface-alt">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-brand-text-muted mt-1.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
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
