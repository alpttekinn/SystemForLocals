import { useCallback } from 'react'

export type TrackableEvent =
  | 'reservation_cta'
  | 'phone_click'
  | 'whatsapp_click'
  | 'directions_click'
  | 'event_inquiry_submit'
  | 'contact_form_submit'

/**
 * Lightweight CTA tracking hook.
 * Fires a non-blocking POST to /api/track.
 * Failures are silently ignored — analytics should never break UX.
 */
export function useTrack() {
  const track = useCallback((event: TrackableEvent, metadata?: Record<string, unknown>) => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : undefined
      const payload = JSON.stringify({ event, path, metadata })
      // Use sendBeacon with Blob for proper application/json Content-Type
      if (typeof navigator?.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Never throw from analytics
    }
  }, [])

  return { track }
}
