'use client'

import { useEffect } from 'react'

/**
 * Activates scroll-reveal animations.
 * Call once in a page/layout component.
 * Elements with class "reveal" will get "revealed" when they enter the viewport.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
