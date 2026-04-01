'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Instagram } from 'lucide-react'
import { PUBLIC_NAV_LINKS, getActiveNavLinks } from '@/lib/constants'
import { useTenant } from '@/lib/tenant'
import { Container } from '@/components/ui/container'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const tenant = useTenant()
  const { branding, contact, features } = tenant
  const businessName = tenant.tenant.name
  const navLinks = getActiveNavLinks(
    PUBLIC_NAV_LINKS,
    features as unknown as Record<string, boolean>,
  )

  return (
    <footer className="bg-brand-primary-dark text-white/80">
      {/* Main footer content */}
      <div className="section-padding-sm">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-4">
                {branding.logo_url ? (
                  <Image
                    src={branding.logo_dark_url || branding.logo_url}
                    alt={branding.logo_alt || businessName}
                    width={160}
                    height={40}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold text-white">{businessName}</span>
                )}
              </Link>
              {branding.short_description && (
                <p className="text-sm leading-relaxed text-white/60">
                  {branding.short_description}
                </p>
              )}
            </div>

            {/* Quick links */}
            <div>
              <h3 className="font-serif text-base font-semibold text-white mb-4">Keşfet</h3>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {features.events_enabled && (
                  <li>
                    <Link
                      href="/events"
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      Özel Etkinlikler
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h3 className="font-serif text-base font-semibold text-white mb-4">İletişim</h3>
              <ul className="space-y-3">
                {contact.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-brand-accent" />
                    <span className="text-sm">{contact.address}</span>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone size={16} className="shrink-0 text-brand-accent" />
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Social + reservation CTA */}
            <div>
              {contact.instagram_url && (
                <>
                  <h3 className="font-serif text-base font-semibold text-white mb-4">Bizi Takip Edin</h3>
                  <a
                    href={contact.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors mb-6"
                  >
                    <Instagram size={18} />
                    Instagram
                  </a>
                </>
              )}

              {features.reservations_enabled && (
                <div className={contact.instagram_url ? 'mt-4' : ''}>
                  <Link
                    href="/reservation"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-button bg-brand-secondary text-white font-semibold text-sm hover:bg-brand-secondary-light transition-colors"
                  >
                    {branding.hero_cta_text || 'Rezervasyon Yap'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-primary/50">
        <Container>
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <p>&copy; {currentYear} {businessName}. Tüm hakları saklıdır.</p>
            {branding.footer_text && <p>{branding.footer_text}</p>}
          </div>
        </Container>
      </div>
    </footer>
  )
}
