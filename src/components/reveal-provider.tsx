'use client'

import { useReveal } from '@/hooks/use-reveal'

/**
 * Drop-in component — renders nothing, just activates scroll-reveal animations.
 * Use in server components that need .reveal class support.
 */
export function RevealProvider() {
  useReveal()
  return null
}
