'use client'

import { useEffect } from 'react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
      <Container size="narrow" className="text-center">
        <div className="text-burgundy-500 text-sm tracking-[0.5em] mb-4">✦ ✦ ✦</div>
        <h1 className="text-4xl font-serif font-bold text-charcoal-900 mb-2">Bir Hata Oluştu</h1>
        <p className="text-body text-charcoal-500 mb-8">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <Button variant="primary" onClick={reset}>
          Tekrar Dene
        </Button>
      </Container>
    </div>
  )
}
