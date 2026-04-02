'use client'

import { Phone, MapPin, MessageCircle, CalendarCheck } from 'lucide-react'
import { useTenant } from '@/lib/tenant'

export function MobileCTABar() {
  const tenant = useTenant()
  const { contact, features } = tenant

  const actions = [
    contact.phone && {
      label: 'Ara',
      icon: Phone,
      href: `tel:${contact.phone.replace(/\s/g, '')}`,
      className: 'text-green-400',
    },
    contact.maps_url && {
      label: 'Yol Tarifi',
      icon: MapPin,
      href: contact.maps_url,
      target: '_blank',
      className: 'text-blue-400',
    },
    contact.whatsapp && {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`,
      target: '_blank',
      className: 'text-emerald-400',
    },
    features.reservations_enabled && {
      label: 'Rezervasyon',
      icon: CalendarCheck,
      href: '/reservation',
      className: 'text-brand-secondary',
    },
  ].filter(Boolean) as {
    label: string
    icon: typeof Phone
    href: string
    target?: string
    className: string
  }[]

  if (actions.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-brand-primary-dark/95 backdrop-blur-md border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.target}
              rel={action.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors min-w-[60px]"
            >
              <action.icon size={20} className={action.className} />
              <span className="text-[10px] font-medium text-white/80">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
