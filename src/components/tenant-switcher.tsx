'use client'

import { useState, useEffect, useRef } from 'react'
import { useTenant } from '@/lib/tenant'

const DEMO_TENANTS = [
  { slug: 'yesilcam-cekmekoy', name: 'Yesilcam Cekmekoy', emoji: '🎬' },
  { slug: 'mavi-deniz-cafe', name: 'Mavi Deniz Cafe', emoji: '🌊' },
]

/**
 * Floating tenant switcher for demo / development purposes.
 * Navigates between tenant sites via ?tenant=slug query param.
 */
export function TenantSwitcher() {
  const tenant = useTenant()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchTenant(slug: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('tenant', slug)
    window.location.href = url.toString()
  }

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen(!open)}
        className="bg-charcoal-900 text-white px-3 py-2 rounded-full shadow-lg text-xs font-medium hover:bg-charcoal-800 transition-colors"
        aria-label="Tenant degistir"
      >
        {DEMO_TENANTS.find(t => t.slug === tenant.tenant.slug)?.emoji || '🏠'} {tenant.tenant.name}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-charcoal-100 overflow-hidden min-w-[200px]">
          <div className="px-3 py-2 border-b border-charcoal-100 text-[10px] uppercase tracking-wider text-charcoal-400">
            Tenant Degistir
          </div>
          {DEMO_TENANTS.map((t) => (
            <button
              key={t.slug}
              onClick={() => switchTenant(t.slug)}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-charcoal-50 transition-colors flex items-center gap-2 ${
                t.slug === tenant.tenant.slug ? 'bg-charcoal-50 font-medium' : ''
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.name}</span>
              {t.slug === tenant.tenant.slug && <span className="ml-auto text-xs text-green-600">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
