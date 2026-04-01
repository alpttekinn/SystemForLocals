'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Star } from 'lucide-react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReveal } from '@/hooks/use-reveal'
import type { MenuItem, GalleryItem, Testimonial, Campaign } from '@/types'
import { formatPrice } from '@/lib/utils'

interface HomePageClientProps {
  featuredItems: MenuItem[]
  galleryItems: GalleryItem[]
  testimonials: Testimonial[]
  activeCampaigns: Campaign[]
}

/**
 * Client-side homepage shell.
 * Receives pre-fetched data from the server wrapper.
 */
export function HomePageClient({
  featuredItems,
  galleryItems,
  testimonials,
  activeCampaigns,
}: HomePageClientProps) {
  const tenant = useTenant()
  const { branding, contact, features } = tenant
  const businessName = tenant.tenant.name
  const ctaText = branding.hero_cta_text || 'Rezervasyon Yap'

  useReveal()

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background — placeholder gradient until hero image is provided */}
        {branding.hero_image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${branding.hero_image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-primary-dark" />
        )}
        {/* Cinematic overlay */}
        <div className="absolute inset-0 hero-overlay" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }} />

        <Container className="relative z-10 text-center">
          <h1 className="text-display text-white mb-4 animate-fade-up">
            {branding.hero_title || businessName}
          </h1>

          {branding.hero_subtitle && (
            <p className="text-body-lg text-white/80 max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              {branding.hero_subtitle}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {features.reservations_enabled && (
              <Link href="/reservation">
                <Button variant="cta" size="lg">
                  {ctaText}
                </Button>
              </Link>
            )}
            <Link href="/menu">
              <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Menüyü İncele
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* ===== FILM STRIP DIVIDER ===== */}
      <div className="film-strip-divider" aria-hidden="true" />

      {/* ===== CONCEPT SECTION ===== */}
      <Section className="bg-brand-surface">
        <Container>
          <SectionHeader
            title={branding.tagline || businessName}
            subtitle={branding.short_description || ''}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto reveal-stagger">
            {CONCEPT_CARDS.map((card) => (
              <Card key={card.title} hover className="text-center reveal">
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="font-serif text-lg font-semibold text-charcoal-900 mb-2">{card.title}</h3>
                <p className="text-sm text-charcoal-600">{card.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== FEATURED MENU ===== */}
      <Section className="bg-brand-surface-alt">
        <Container>
          <SectionHeader
            title="Öne Çıkan Lezzetler"
            subtitle="Şefimizin özenle hazırladığı en sevilen tatlarımız"
          />
          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
              {featuredItems.map((item) => (
                <Card key={item.id} hover padding="none" className="overflow-hidden reveal">
                  {item.image_url ? (
                    <div className="aspect-menu-item relative">
                      <Image
                        src={item.image_url}
                        alt={item.image_alt || item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-menu-item bg-gradient-to-br from-forest-100 to-cream-200 flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-base font-semibold text-charcoal-900">{item.name}</h3>
                      <span className="text-sm font-medium text-brand-primary">{formatPrice(item.price)}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-charcoal-500 mt-1">{item.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal-500">Yakında burada lezzetler olacak.</p>
          )}
          <div className="text-center mt-8">
            <Link href="/menu">
              <Button variant="secondary">Tüm Menüyü Gör</Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* ===== GALLERY STRIP ===== */}
      {features.gallery_enabled && (
      <Section className="bg-brand-primary-dark text-white">
        <Container>
          <SectionHeader
            title="Atmosferimiz"
            subtitle="Mekanımızın sıcaklığını hissedin"
          />
          {galleryItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 reveal-stagger">
              {galleryItems.slice(0, 4).map((item) => (
                <div key={item.id} className="aspect-gallery rounded-card overflow-hidden relative reveal">
                  <Image
                    src={item.image_url}
                    alt={item.alt_text || item.caption || 'Galeri'}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-gallery rounded-card bg-white/10 flex items-center justify-center">
                  <span className="text-white/20 text-sm">Fotoğraf {i + 1}</span>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/gallery">
              <Button variant="secondary" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Galeriyi Keşfet
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <Section className="bg-brand-surface-alt">
          <Container>
            <SectionHeader title="Misafir Yorumları" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto reveal-stagger">
              {testimonials.slice(0, 3).map((t) => (
                <Card key={t.id} className="text-center reveal">
                  {t.rating && (
                    <div className="flex justify-center gap-0.5 mb-2">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={14} className="fill-brand-accent text-brand-accent" />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-charcoal-600 italic mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-xs font-semibold text-charcoal-900">{t.reviewer_name}</p>
                  {t.source && <p className="text-xs text-charcoal-400">{t.source}</p>}
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ===== ACTIVE CAMPAIGNS ===== */}
      {activeCampaigns.length > 0 && features.campaigns_enabled && (
        <Section>
          <Container>
            <SectionHeader title="Kampanyalar" subtitle="Fırsatları kaçırmayın" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto reveal-stagger">
              {activeCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.slug}`} className="reveal">
                  <Card hover className="h-full">
                    {c.image_url && (
                      <div className="aspect-video relative rounded-card overflow-hidden mb-3">
                        <Image src={c.image_url} alt={c.image_alt || c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                      </div>
                    )}
                    <h3 className="font-serif text-lg font-semibold text-charcoal-900">{c.title}</h3>
                    {c.description && <p className="text-sm text-charcoal-500 mt-1">{c.description}</p>}
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ===== LOCATION BAND ===== */}
      <Section compact className="bg-brand-surface">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">
            {contact.address && (
              <div className="flex items-center gap-2 text-brand-text-muted">
                <MapPin size={18} className="text-brand-primary shrink-0" />
                <span className="text-sm">{contact.address}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-brand-text-muted">
                <Phone size={18} className="text-brand-primary shrink-0" />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-sm hover:text-brand-primary transition-colors">
                  {contact.phone}
                </a>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* ===== CTA BANNER ===== */}
      {features.reservations_enabled && (
      <Section className="bg-brand-secondary text-white">
        <Container size="narrow" className="text-center reveal">
          <h2 className="text-section-heading text-white mb-3">
            Unutulmaz Bir Deneyim İçin
          </h2>
          <p className="text-body text-white/70 mb-6">
            Yerinizi ayırtın, {businessName} deneyimini yaşayın.
          </p>
          <Link href="/reservation">
            <Button variant="cta" size="lg">
              {ctaText}
            </Button>
          </Link>
        </Container>
      </Section>
      )}

      {/* ===== JSON-LD Structured Data ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            name: businessName,
            description: branding.short_description || '',
            telephone: contact.phone || undefined,
            address: contact.address ? {
              '@type': 'PostalAddress',
              streetAddress: contact.address,
              addressLocality: contact.district || '',
              addressRegion: contact.city || '',
              addressCountry: contact.country || 'TR',
            } : undefined,
          }),
        }}
      />
    </>
  )
}

// --- Static data for concept cards ---

const CONCEPT_CARDS = [
  {
    emoji: '🍽️',
    title: 'Özenli Lezzetler',
    description: 'Özenle hazırlanan zengin menümüzle unutulmaz bir deneyim.',
  },
  {
    emoji: '☕',
    title: 'Sıcak Atmosfer',
    description: 'Her ziyaretinizde kendinizi evinizde hissedeceğiniz bir mekan.',
  },
  {
    emoji: '🌟',
    title: 'Özel Anlar',
    description: 'Doğum günleri, buluşmalar ve özel geceler için mükemmel bir ortam.',
  },
]
