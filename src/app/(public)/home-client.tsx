'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Users, CalendarCheck, ChefHat, Sparkles, ArrowRight, MessageCircle, Navigation, Car, Wifi, Baby, Music, TreePine, Utensils, Heart, Shield, Umbrella, Wind, Package, Truck, Star } from 'lucide-react'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReveal } from '@/hooks/use-reveal'
import { useTrack } from '@/hooks/use-track'
import type { MenuItem, GalleryItem, Testimonial, Campaign } from '@/types'
import { formatPrice } from '@/lib/utils'
import { ALL_VENUE_BADGE_OPTIONS } from '@/lib/constants'

interface HomePageClientProps {
  featuredItems: MenuItem[]
  galleryItems: GalleryItem[]
  testimonials: Testimonial[]
  activeCampaigns: Campaign[]
}

// Icon map for venue badge keys — only covers icons available in lucide-react
const VENUE_BADGE_ICON_MAP: Record<string, React.ReactNode> = {
  parking:               <Car size={16} />,
  wifi:                  <Wifi size={16} />,
  family:                <Baby size={16} />,
  live_music:            <Music size={16} />,
  outdoor:               <TreePine size={16} />,
  events:                <Users size={16} />,
  terrace:               <Umbrella size={16} />,
  air_conditioning:      <Wind size={16} />,
  pet_friendly:          <Heart size={16} />,
  disabled_access:       <Shield size={16} />,
  takeaway:              <Package size={16} />,
  delivery:              <Truck size={16} />,
  valet:                 <Car size={16} />,
  reservations_required: <CalendarCheck size={16} />,
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
  const { track } = useTrack()

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
                <Button variant="cta" size="lg" onClick={() => track('reservation_cta')}>
                  <CalendarCheck size={18} className="mr-2" />
                  {ctaText}
                </Button>
              </Link>
            )}
            <Link href="/menu">
              <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Utensils size={18} className="mr-2" />
                Menüyü İncele
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-12 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm group" onClick={() => track('phone_click')}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone size={14} />
                </div>
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm group" onClick={() => track('whatsapp_click')}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <MessageCircle size={14} />
                </div>
                <span>WhatsApp</span>
              </a>
            )}
            {contact.maps_url && (
              <a href={contact.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm group" onClick={() => track('directions_click')}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Navigation size={14} />
                </div>
                <span>Yol Tarifi</span>
              </a>
            )}
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

      {/* ===== VENUE BADGES ===== */}
      {(branding.venue_highlights?.length ?? 0) > 0 && (
      <Section compact className="bg-brand-surface">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 reveal-stagger">
            {branding.venue_highlights!.map((key) => {
              const option = ALL_VENUE_BADGE_OPTIONS.find((o) => o.key === key)
              if (!option) return null
              return (
                <div key={key} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-primary/10 shadow-sm reveal">
                  <span className="text-brand-primary">{VENUE_BADGE_ICON_MAP[key] ?? <Sparkles size={16} />}</span>
                  <span className="text-xs font-medium text-brand-text">{option.label}</span>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>
      )}

      {/* ===== CONCEPT / VALUE PROPOSITION ===== */}
      {(branding.tagline || branding.short_description) && (
      <Section className="bg-brand-gradient-subtle">
        <Container>
          <div className="max-w-2xl mx-auto text-center reveal">
            {branding.tagline && (
              <h2 className="text-section-heading text-brand-text mb-6">{branding.tagline}</h2>
            )}
            {branding.short_description && (
              <p className="text-body-lg text-brand-text-muted leading-relaxed">{branding.short_description}</p>
            )}
          </div>
        </Container>
      </Section>
      )}

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
                    <span className="absolute bottom-3 right-3 bg-brand-secondary text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">{formatPrice(item.price)}</span>
                  </div>
                ) : (
                  <div className="aspect-menu-item bg-brand-gradient flex items-center justify-center">
                    <ChefHat size={48} className="text-white/40" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-semibold text-brand-text">{item.name}</h3>
                    {item.is_featured && (
                      <span className="text-[10px] font-bold uppercase text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded-full">★ Favori</span>
                    )}
                  </div>
                  {!item.image_url && (
                    <span className="text-sm font-bold text-brand-primary">{formatPrice(item.price)}</span>
                  )}
                  {item.description && (
                    <p className="text-xs text-brand-text-muted mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/menu">
              <Button variant="secondary">
                Tüm Menüyü Gör
                <ArrowRight size={16} className="ml-2" />
              </Button>
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
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-xs text-white font-medium drop-shadow-lg">{item.caption}</p>
                    </div>
                  )}
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
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
      )}

      {/* ===== TRUST SIGNALS BAND ===== */}
      {(branding.trust_stats?.length ?? 0) > 0 && (
        <Section compact className="bg-brand-surface-alt">
          <Container>
            <div className={`grid grid-cols-2 gap-6 text-center reveal-stagger ${branding.trust_stats!.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-2 max-w-md mx-auto'}`}>
              {branding.trust_stats!.map((signal) => (
                <div key={signal.label} className="reveal">
                  <p className="text-2xl font-serif font-bold text-brand-text">{signal.value}</p>
                  <p className="text-xs text-brand-text-muted mt-1">{signal.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <Section className="bg-brand-gradient-subtle">
          <Container>
            <SectionHeader title="Misafir Deneyimleri" subtitle="Misafirlerimizin gözünden" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto reveal-stagger">
              {testimonials.slice(0, 3).map((t) => (
                <Card key={t.id} className="reveal relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
                  <div className="pt-4">
                    {t.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < t.rating! ? 'fill-brand-accent text-brand-accent' : 'text-brand-text-muted/20'} />
                        ))}
                        <span className="text-xs font-bold text-brand-text ml-1">{t.rating}.0</span>
                      </div>
                    )}
                    <p className="text-sm text-brand-text leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 border-t border-brand-surface-alt pt-3">
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-serif font-bold text-sm shrink-0">
                        {t.reviewer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-text">{t.reviewer_name}</p>
                        {t.source && (
                          <p className="text-xs text-brand-text-muted">{t.source}</p>
                        )}
                      </div>
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
            <SectionHeader title="Güncel Kampanyalar" subtitle="Fırsatları kaçırmayın" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto reveal-stagger">
              {activeCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.slug}`} className="reveal group">
                  <Card hover className="h-full overflow-hidden" padding="none">
                    {c.image_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <Image src={c.image_url} alt={c.image_alt || c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {c.end_date && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Sınırlı Süre</span>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors">{c.title}</h3>
                      {c.description && <p className="text-sm text-brand-text-muted mt-2 line-clamp-2">{c.description}</p>}
                      <span className="inline-flex items-center text-sm font-medium text-brand-primary mt-3">
                        Detayları Gör <ArrowRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ===== EVENTS TEASER ===== */}
      {features.events_enabled && (
        <Section className="bg-brand-surface">
          <Container size="narrow" className="text-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={14} />
                Özel Etkinlikler
              </div>
              <h2 className="text-section-heading text-brand-text mb-4">Özel Günlerinizi Birlikte Kutlayalım</h2>
              <p className="text-body text-brand-text-muted mb-8 max-w-lg mx-auto">
                Doğum günleri, kurumsal toplantılar, nişan-düğün ve grup organizasyonları için mekanımız ve özel menülerimiz hizmetinizde.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-md mx-auto">
                {[
                  { icon: '🎂', label: 'Doğum Günü' },
                  { icon: '🏢', label: 'Kurumsal' },
                  { icon: '💍', label: 'Nişan/Düğün' },
                  { icon: '👥', label: 'Grup' },
                ].map((e) => (
                  <div key={e.label} className="flex flex-col items-center gap-2 p-3 rounded-card bg-white border border-brand-primary/5 shadow-sm">
                    <span className="text-2xl">{e.icon}</span>
                    <span className="text-xs font-medium text-brand-text">{e.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/events">
                <Button variant="primary" size="lg">
                  Etkinlik Talebi Oluştur
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* ===== LOCATION BAND ===== */}
      <Section compact className="bg-brand-surface-alt">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">
            {contact.address && (
              <a href={contact.maps_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-text-muted hover:text-brand-primary transition-colors">
                <MapPin size={18} className="text-brand-primary shrink-0" />
                <span className="text-sm">{contact.address}{contact.district ? `, ${contact.district}` : ''}</span>
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-brand-text-muted hover:text-brand-primary transition-colors">
                <Phone size={18} className="text-brand-primary shrink-0" />
                <span className="text-sm">{contact.phone}</span>
              </a>
            )}
            {contact.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-text-muted hover:text-emerald-600 transition-colors">
                <MessageCircle size={18} className="text-emerald-600 shrink-0" />
                <span className="text-sm">WhatsApp ile Yazın</span>
              </a>
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
              <CalendarCheck size={18} className="mr-2" />
              {ctaText}
            </Button>
          </Link>
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Phone size={18} className="mr-2" />
                Hemen Arayın
              </Button>
            </a>
          )}
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
