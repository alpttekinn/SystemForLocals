'use client'

import Image from 'next/image'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { Card } from '@/components/ui/card'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useReveal } from '@/hooks/use-reveal'

export default function AboutPage() {
  const tenant = useTenant()
  const { branding, contact } = tenant
  const businessName = tenant.tenant.name

  useReveal()

  return (
    <Section className="bg-brand-surface pt-24">
      <Container size="narrow">
        <SectionHeader title="Hakkımızda" />

        {/* Hero image */}
        {branding.hero_image_url && (
          <div className="aspect-video relative rounded-card overflow-hidden mb-8">
            <Image
              src={branding.hero_image_url}
              alt={businessName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
              priority
            />
          </div>
        )}

        {/* Tagline + description */}
        {branding.tagline && (
          <h2 className="font-serif text-2xl font-semibold text-charcoal-900 mb-4 text-center">
            {branding.tagline}
          </h2>
        )}

        {branding.short_description && (
          <p className="text-base text-charcoal-600 leading-relaxed mb-8 text-center max-w-2xl mx-auto">
            {branding.short_description}
          </p>
        )}

        {/* Contact info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 reveal-stagger">
          {contact.address && (
            <Card className="flex items-start gap-3 reveal">
              <MapPin size={20} className="text-brand-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-charcoal-900 text-sm mb-1">Adres</h3>
                <p className="text-sm text-charcoal-600">{contact.address}</p>
                {contact.district && contact.city && (
                  <p className="text-xs text-charcoal-500">{contact.district}, {contact.city}</p>
                )}
              </div>
            </Card>
          )}
          {contact.phone && (
            <Card className="flex items-start gap-3 reveal">
              <Phone size={20} className="text-brand-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-charcoal-900 text-sm mb-1">Telefon</h3>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-sm text-charcoal-600 hover:text-brand-primary">
                  {contact.phone}
                </a>
              </div>
            </Card>
          )}
          {contact.email && (
            <Card className="flex items-start gap-3 reveal">
              <Mail size={20} className="text-brand-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-charcoal-900 text-sm mb-1">E-posta</h3>
                <a href={`mailto:${contact.email}`} className="text-sm text-charcoal-600 hover:text-brand-primary">
                  {contact.email}
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Map embed */}
        {contact.maps_embed_url && (
          <div className="aspect-video rounded-card overflow-hidden border border-brand-border mt-8">
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
  )
}
