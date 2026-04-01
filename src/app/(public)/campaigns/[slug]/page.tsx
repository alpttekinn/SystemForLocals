import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { requireTenantId } from '@/lib/data/tenant'
import { getCampaignBySlug } from '@/lib/data/campaigns'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const headersList = await headers()
  const tenantSlug = headersList.get('x-tenant-slug')
  if (!tenantSlug) notFound()

  const tenantId = await requireTenantId(tenantSlug)
  if (!tenantId) notFound()

  const campaign = await getCampaignBySlug(tenantId, slug)
  if (!campaign) notFound()

  return (
    <Section className="bg-brand-surface pt-24">
      <Container size="narrow">
        {campaign.image_url && (
          <div className="aspect-video relative rounded-card overflow-hidden mb-8">
            <Image
              src={campaign.image_url}
              alt={campaign.image_alt || campaign.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
              priority
            />
          </div>
        )}

        <h1 className="font-serif text-3xl font-bold text-charcoal-900 mb-4">
          {campaign.title}
        </h1>

        {campaign.description && (
          <p className="text-lg text-charcoal-600 mb-6">{campaign.description}</p>
        )}

        {campaign.content && (
          <div className="prose prose-charcoal max-w-none mb-8 whitespace-pre-line text-charcoal-700">
            {campaign.content}
          </div>
        )}

        <div className="mt-8">
          <Link href="/campaigns">
            <Button variant="secondary">← Tüm Kampanyalar</Button>
          </Link>
        </div>
      </Container>
    </Section>
  )
}
