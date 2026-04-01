import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
      <Container size="narrow" className="text-center">
        <div className="text-gold-500 text-sm tracking-[0.5em] mb-4">★ ★ ★</div>
        <h1 className="text-6xl font-serif font-bold text-charcoal-900 mb-2">404</h1>
        <h2 className="text-xl font-serif text-charcoal-700 mb-4">Sayfa Bulunamadı</h2>
        <p className="text-body text-charcoal-500 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link href="/">
          <Button variant="primary">Ana Sayfaya Dön</Button>
        </Link>
      </Container>
    </div>
  )
}
