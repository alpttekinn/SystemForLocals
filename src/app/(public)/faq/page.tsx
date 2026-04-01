import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireTenantId } from '@/lib/data/tenant'
import { getVisibleFaqItems } from '@/lib/data/faq'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
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
    <Section className="bg-brand-surface pt-24">
      <Container size="narrow">
        <SectionHeader
          title="Sıkça Sorulan Sorular"
          subtitle="Merak ettiklerinize yanıtlar"
        />

        {items.length === 0 ? (
          <EmptyState title="Henüz soru eklenmedi." />
        ) : (
          <Accordion items={items.map((item) => ({
            id: item.id,
            title: item.question,
            content: item.answer,
          }))} />
        )}
      </Container>
    </Section>
  )
}
