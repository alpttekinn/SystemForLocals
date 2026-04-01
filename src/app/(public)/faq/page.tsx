import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireTenantId } from '@/lib/data/tenant'
import { getVisibleFaqItems } from '@/lib/data/faq'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Accordion } from '@/components/ui/accordion'
import { EmptyState } from '@/components/ui/empty-state'
import { tenantMetadata } from '@/lib/seo'

export async function generateMetadata() {
  return tenantMetadata('SSS')
}

export default async function FaqPage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) notFound()

  const tenantId = await requireTenantId(slug)
  if (!tenantId) notFound()

  const items = await getVisibleFaqItems(tenantId)

  return (
    <>
      {/* Hero banner */}
      <section className="bg-brand-gradient text-white pt-28 pb-12">
        <Container className="text-center">
          <h1 className="text-heading text-white mb-3">Sıkça Sorulan Sorular</h1>
          <p className="text-body-lg text-white/70 max-w-xl mx-auto">Merak ettiklerinize yanıtlar</p>
          <div className="gold-divider mt-6" />
        </Container>
      </section>

      <Section className="bg-brand-gradient-subtle">
        <Container size="narrow">
          {items.length === 0 ? (
            <EmptyState
              title="Sorular hazırlanıyor"
              description="Sıkça sorulan sorular bölümü yakında burada olacak."
            />
          ) : (
            <Accordion items={items.map((item) => ({
              id: item.id,
              title: item.question,
              content: item.answer,
            }))} />
          )}
        </Container>
      </Section>
    </>
  )
}
