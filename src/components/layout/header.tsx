'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PUBLIC_NAV_LINKS, getActiveNavLinks } from '@/lib/constants'
import { useTenant } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const tenant = useTenant()

  const navLinks = getActiveNavLinks(
    PUBLIC_NAV_LINKS,
    tenant.features as unknown as Record<string, boolean>,
  )
  const businessName = tenant.tenant.name
  const ctaText = tenant.branding.hero_cta_text || 'Rezervasyon Yap'
  const showReservations = tenant.features.reservations_enabled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
    {/* Announcement bar */}
    <div className="bg-brand-secondary text-white text-center py-1.5 text-xs font-medium tracking-wide">
      <Container className="flex items-center justify-center gap-3">
        {tenant.contact.phone && (
          <a href={`tel:${tenant.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Phone size={12} />
            <span>{tenant.contact.phone}</span>
          </a>
        )}
        <span className="hidden sm:inline opacity-60">|</span>
        <span className="hidden sm:inline">Her gün açık — Haftanın 7 günü hizmetinizdeyiz</span>
      </Container>
    </div>

    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-brand-primary-dark shadow-nav'
        : 'bg-brand-primary-dark',
    )}>
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            {tenant.branding.logo_url ? (
              <Image
                src={tenant.branding.logo_url}
                alt={tenant.branding.logo_alt || businessName}
                width={160}
                height={40}
                className="h-8 md:h-10 w-auto"
                priority
              />
            ) : (
              <span className="font-serif text-xl md:text-2xl font-bold text-brand-secondary tracking-tight">
                {businessName}
              </span>
            )}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Ana menü">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 text-sm font-sans font-medium rounded-button transition-colors duration-200',
                    isActive
                      ? 'text-brand-secondary bg-white/10'
                      : 'text-white hover:text-brand-secondary hover:bg-white/5',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            {showReservations && (
              <Link href="/reservation" className="hidden sm:block">
                <Button variant="cta" size="sm">
                  {ctaText}
                </Button>
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-white hover:text-brand-secondary transition-colors rounded-button"
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile navigation */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 bg-brand-primary-dark border-t border-white/10',
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <Container>
          <nav className="flex flex-col py-4 gap-1" aria-label="Mobil menü">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-3 text-base font-sans font-medium rounded-button transition-colors',
                    isActive
                      ? 'text-brand-secondary bg-white/10'
                      : 'text-white hover:text-brand-secondary hover:bg-white/5',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            {showReservations && (
              <div className="pt-3 mt-3 border-t border-white/10">
                <Link href="/reservation" onClick={() => setMobileOpen(false)}>
                  <Button variant="cta" fullWidth>
                    {ctaText}
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </Container>
      </div>
    </header>
    </>
  )
}
