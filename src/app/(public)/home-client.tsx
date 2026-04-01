'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Star, Clock, Users, CalendarCheck, ChefHat, Coffee, Sparkles } from 'lucide-react'
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
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {branding.hero_image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${branding.hero_image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-brand-gradient-hero" />
        )}
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }} />

        <Container className="relative z-10 text-center">
          {branding.tagline && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-6 animate-fade-up">
              <Sparkles size={14} className="text-brand-accent-light" />
              <span className="text-xs font-medium text-white/90 tracking-wide uppercase">{branding.tagline}</span>
            </div>
          )}

          <h1 className="text-display text-white mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {branding.hero_title || businessName}
          </h1>

          {branding.hero_subtitle && (
            <p className="text-body-lg text-white/80 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {branding.hero_subtitle}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.35s' }}>
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

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors text-sm">
                <Phone size={14} />
                <span>{contact.phone}</span>
              </a>
            )}
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Clock size={14} />
              <span>Her gün açık</span>
            </div>
            {contact.district && contact.city && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={14} />
                <span>{contact.district}, {contact.city}</span>
              </div>
            )}
          </div>
        </Container>
      </section>

      <div className="film-strip-divider" aria-hidden="true" />

      {/* ===== CONCEPT / VALUE PROPOSITION ===== */}
      <Section className="bg-brand-gradient-subtle">
        <Container>
          <SectionHeader
            title={branding.tagline || businessName}
            subtitle={branding.short_description || ''}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto reveal-stagger">
            {CONCEPT_CARDS.map((card) => (
              <Card key={card.title} hover className="text-center reveal group">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-brand-gradient text-white group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="font-serif text-lg font-semibold text-brand-text mb-2">{card.title}</h3>
                <p className="text-sm text-brand-text-muted">{card.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== FEATURED MENU ===== */}
      {featuredItems.length > 0 && (
      <Section className="bg-brand-gradient-section">
        <Container>
          <SectionHeader
            title="Öne Çıkan Lezzetler"
            subtitle="Şefimizin özenle hazırladığı en sevilen tatlarımız"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {featuredItems.map((item) => (
              <Card key={item.id} hover padding="none" className="overflow-hidden reveal group">
                {item.image_url ? (
                  <div className="aspect-menu-item relative overflow-hidden">
                    <Image
                      src={item.image_url}
                      alt={item.image_alt || item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="aspect-menu-item bg-brand-gradient flex items-center justify-center">
                    <ChefHat size={48} className="text-white/40" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-semibold text-brand-text">{item.name}</h3>
                    <span className="text-sm font-bold text-brand-primary whitespace-nowrap ml-2 px-2 py-0.5 rounded-full bg-brand-surface-alt">{formatPrice(item.price)}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-brand-text-muted mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/menu">
              <Button variant="secondary">Tüm Menüyü Gör</Button>
            </Link>
          </div>
        </Container>
      </Section>
      )}

      {/* ===== GALLERY STRIP ===== */}
      {features.gallery_enabled && (
      <Section className="bg-brand-gradient text-white">
        <Container>
          <SectionHeader
            title="Atmosferimiz"
            subtitle="Mekanımızın sıcaklığını hissedin"
          />
          {galleryItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 reveal-stagger">
              {galleryItems.slice(0, 4).map((item) => (
                <div key={item.id} className="aspect-gallery rounded-card overflow-hidden relative group reveal">
                  <Image
                    src={item.image_url}
                    alt={item.alt_text || item.caption || 'Galeri'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/50 text-sm">Galeri yakında güncellenecek.</p>
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

      {/* ===== TRUST SIGNALS BAND ===== */}
      <Section compact className="bg-brand-surface-alt">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center reveal-stagger">
            {TRUST_SIGNALS.map((signal) => (
              <div key={signal.label} className="reveal">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center bg-brand-primary/10 text-brand-primary">
                  {signal.icon}
                </div>
                <p className="text-2xl font-serif font-bold text-brand-text">{signal.value}</p>
                <p className="text-xs text-brand-text-muted mt-1">{signal.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <Section className="bg-brand-gradient-subtle">
          <Container>
            <SectionHeader title="Misafir Yorumları" subtitle="Misafirlerimiz ne diyor?" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto reveal-stagger">
              {testimonials.slice(0, 3).map((t) => (
                <Card key={t.id} className="text-center reveal relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
                  <div className="pt-4">
                    {t.rating && (
                      <div className="flex justify-center gap-0.5 mb-3">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} size={16} className="fill-brand-accent text-brand-accent" />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-brand-text-muted italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                    <div className="border-t border-brand-surface-alt pt-3">
                      <p className="text-sm font-semibold text-brand-text">{t.reviewer_name}</p>
                      {t.source && (
                        <p className="text-xs text-brand-text-muted mt-0.5">{t.source}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ===== ACTIVE CAMPAIGNS ===== */}
      {activeCampaigns.length > 0 && features.campaigns_enabled && (
        <Section className="bg-brand-gradient-section">
          <Container>
            <SectionHeader title="Kampanyalar" subtitle="Fırsatları kaçırmayın" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto reveal-stagger">
              {activeCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.slug}`} className="reveal">
                  <Card hover className="h-full overflow-hidden" padding="none">
                    {c.image_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <Image src={c.image_url} alt={c.image_alt || c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-semibold text-brand-text">{c.title}</h3>
                      {c.description && <p className="text-sm text-brand-text-muted mt-2 line-clamp-2">{c.description}</p>}
                    </div>
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
                <span className="text-sm">{contact.address}{contact.district ? `, ${contact.district}` : ''}</span>
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
      <Section className="bg-brand-gradient text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <Container size="narrow" className="text-center relative z-10 reveal">
          <h2 className="text-section-heading text-white mb-4">
            Unutulmaz Bir Deneyim İçin
          </h2>
          <p className="text-body text-white/70 mb-8 max-w-md mx-auto">
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

const CONCEPT_CARDS = [
  {
    icon: <ChefHat size={24} />,
    title: 'Özenli Lezzetler',
    description: 'Taze malzemeler ve özenli hazırlıkla unutulmaz bir mutfak deneyimi.',
  },
  {
    icon: <Coffee size={24} />,
    title: 'Sıcak Atmosfer',
    description: 'Her ziyaretinizde kendinizi evinizde hissedeceğiniz benzersiz bir ortam.',
  },
  {
    icon: <Users size={24} />,
    title: 'Özel Anlar',
    description: 'Doğum günleri, buluşmalar ve kutlamalar için mükemmel bir mekan.',
  },
]

const TRUST_SIGNALS = [
  { icon: <Star size={20} />, value: '4.8', label: 'Ortalama Puan' },
  { icon: <Users size={20} />, value: '2000+', label: 'Mutlu Misafir' },
  { icon: <CalendarCheck size={20} />, value: '500+', label: 'Başarılı Etkinlik' },
  { icon: <ChefHat size={20} />, value: '50+', label: 'Özel Tarif' },
]
