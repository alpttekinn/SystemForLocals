import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getActiveCampaigns } from '@/lib/data/campaigns'
import { Container } from '@/components/ui/container'
import { Section, SectionHeader } from '@/components/ui/section'
import { tenantMetadata } from '@/lib/seo'

export async function generateMetadata() {
  return tenantMetadata('Kampanyalar')
}
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { RevealProvider } from '@/components/reveal-provider'

export default async function CampaignsPage() {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) notFound()

  const tenantId = await requireTenantId(slug)
  if (!tenantId) notFound()

  const campaigns = await getActiveCampaigns(tenantId)

  return (
    <>
    <RevealProvider />
    <Section className="bg-brand-surface pt-24">
      <Container>
        <SectionHeader
          title="Kampanyalar"
          subtitle="Güncel fırsat ve etkinliklerimizi keşfedin"
        />

        {campaigns.length === 0 ? (
          <EmptyState title="Şu an aktif kampanya bulunmamaktadır." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto reveal-stagger">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.slug}`} className="reveal">
                <Card hover className="h-full">
                  {campaign.image_url && (
                    <div className="aspect-video relative rounded-card overflow-hidden mb-4">
                      <Image
                        src={campaign.image_url}
                        alt={campaign.image_alt || campaign.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                    {campaign.title}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-charcoal-500 mt-2 line-clamp-3">
                      {campaign.description}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
    </>
  )
}
