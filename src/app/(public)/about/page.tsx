'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, CalendarCheck, ArrowRight } from 'lucide-react'
import { useReveal } from '@/hooks/use-reveal'

export default function AboutPage() {
  const tenant = useTenant()
  const { branding, contact, features } = tenant
  const businessName = tenant.tenant.name

  useReveal()

  return (
    <>
      {/* Hero banner */}
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">Hakkımızda</h1>
          {branding.tagline && (
            <p className="text-body-lg text-white/70 max-w-xl mx-auto">{branding.tagline}</p>
          )}
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      <Section className="bg-brand-gradient-subtle">
        <Container size="narrow">
          {/* Hero image */}
          {branding.hero_image_url && (
            <div className="aspect-video relative rounded-card overflow-hidden mb-10 shadow-card reveal">
              <Image
                src={branding.hero_image_url}
                alt={businessName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          {/* Short description */}
          {branding.short_description && (
            <div className="text-center mb-10 reveal">
              <p className="text-lg text-brand-text leading-relaxed max-w-2xl mx-auto">
                {branding.short_description}
              </p>
            </div>
          )}

          {/* About story — admin-configurable long-form text */}
          {branding.about_story && (
            <div className="mb-12 reveal">
              <div className="prose prose-sm max-w-none text-brand-text leading-relaxed whitespace-pre-line">
                {branding.about_story}
              </div>
            </div>
          )}

          {/* Contact CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 reveal-stagger">
            {contact.address && (
              <Card className="flex items-start gap-3 reveal">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text text-sm mb-1">Adres</h3>
                  <p className="text-sm text-brand-text-muted">{contact.address}</p>
                  {contact.district && contact.city && (
                    <p className="text-xs text-brand-text-muted mt-0.5">{contact.district}, {contact.city}</p>
                  )}
                </div>
              </Card>
            )}
            {contact.phone && (
              <Card className="flex items-start gap-3 reveal">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text text-sm mb-1">Telefon</h3>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-sm text-brand-text-muted hover:text-brand-primary transition-colors">
                    {contact.phone}
                  </a>
                </div>
              </Card>
            )}
          </div>

          {/* Action CTA */}
          <div className="text-center reveal">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {features.reservations_enabled && (
                <Link href="/reservation">
                  <Button variant="primary" size="lg">
                    <CalendarCheck size={18} className="mr-2" />
                    Rezervasyon Yap
                  </Button>
                </Link>
              )}
              <Link href="/contact">
                <Button variant="secondary" size="lg">
                  İletişime Geçin
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Map embed */}
          {contact.maps_embed_url && (
            <div className="aspect-video rounded-card overflow-hidden mt-10 shadow-card reveal">
              <iframe
                src={contact.maps_embed_url}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Harita"
              />
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
