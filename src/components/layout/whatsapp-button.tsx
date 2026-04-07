'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTenant } from '@/lib/tenant'
import { useTrack } from '@/hooks/use-track'

/**
 * Floating WhatsApp CTA button for the public site.
 *
 * Rendered only when:
 * - whatsapp_enabled is true in tenant features
 * - a WhatsApp number exists in tenant contact
 *
 * Supports:
 * - Custom CTA label from whatsapp_settings (loaded via tenant API)
 * - Click tracking via site_events
 * - Responsive: hides on mobile when MobileCTABar is showing
 * - Polished animation + hover state
 */
export function WhatsAppButton() {
  const tenant = useTenant()
  const { track } = useTrack()
  const { contact, features } = tenant
  const [expanded, setExpanded] = useState(false)
  const [ctaLabel, setCtaLabel] = useState('WhatsApp ile Yazın')
  const [dismissed, setDismissed] = useState(false)

  // Only show if WhatsApp is enabled and has a number
  const whatsappNumber = contact.whatsapp
  const isEnabled = features.whatsapp_enabled && whatsappNumber

  // Load CTA label from WhatsApp settings (lightweight)
  useEffect(() => {
    if (!isEnabled) return
    fetch('/api/whatsapp/config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (cfg?.cta_label) setCtaLabel(cfg.cta_label)
      })
      .catch(() => {})
  }, [isEnabled])

  // Auto-expand after 3 seconds for first-time visitors
  useEffect(() => {
    if (!isEnabled) return
    const timer = setTimeout(() => setExpanded(true), 3000)
    const hideTimer = setTimeout(() => setExpanded(false), 8000)
    return () => { clearTimeout(timer); clearTimeout(hideTimer) }
  }, [isEnabled])

  if (!isEnabled || dismissed) return null

  const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`

  function handleClick() {
    track('whatsapp_click', { source: 'floating_button' })
    // Log a lead conversation (fire and forget)
    try {
      const payload = JSON.stringify({
        event: 'whatsapp_click',
        path: window.location.pathname,
        metadata: { source: 'floating_button' },
      })
      if (typeof navigator?.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
      }
    } catch {}
  }

  return (
    <>
      {/* Desktop floating button - bottom right, above mobile CTA bar area */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end gap-2">
        {/* Expanded tooltip */}
        {expanded && !dismissed && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-charcoal-200 px-4 py-2.5 max-w-60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-charcoal-800">{ctaLabel}</p>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="group relative w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          aria-label="WhatsApp ile iletişime geçin"
        >
          <MessageCircle size={26} className="fill-white stroke-[#25D366] group-hover:scale-110 transition-transform" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        </a>
      </div>

      {/* Mobile: small floating button above the CTA bar */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg"
          aria-label="WhatsApp ile iletişime geçin"
        >
          <MessageCircle size={22} className="fill-white stroke-[#25D366]" />
        </a>
      </div>
    </>
  )
}
