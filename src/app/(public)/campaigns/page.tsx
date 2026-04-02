import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { requireTenantId } from '@/lib/data/tenant'
import { getActiveCampaigns } from '@/lib/data/campaigns'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { tenantMetadata } from '@/lib/seo'

export async function generateMetadata() {
  return tenantMetadata('Kampanyalar')
}
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { RevealProvider } from '@/components/reveal-provider'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

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
    {/* Hero banner */}
    <section className="bg-brand-gradient text-white pt-28 pb-12">
      <Container className="text-center">
        <h1 className="text-heading text-white mb-3">Kampanyalar</h1>
        <p className="text-body-lg text-white/70 max-w-xl mx-auto">Güncel fırsat ve etkinliklerimizi keşfedin</p>
        <div className="gold-divider mt-6" />
      </Container>
    </section>

    <Section className="bg-brand-gradient-subtle">
      <Container>
        {campaigns.length === 0 ? (
          <EmptyState
            title="Yeni kampanyalar yolda"
            description="Fırsat ve etkinliklerimiz için bizi takipte kalın."
          />
        ) : (
          <>
            <p className="text-center text-sm text-brand-text-muted mb-6">{campaigns.length} aktif kampanya</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto reveal-stagger">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.slug}`} className="reveal group">
                  <Card hover className="h-full overflow-hidden" padding="none">
                    {campaign.image_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <Image
                          src={campaign.image_url}
                          alt={campaign.image_alt || campaign.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {/* End date badge */}
                        {campaign.end_date && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                            Son: {formatDate(campaign.end_date)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                        {campaign.title}
                      </h3>
                      {campaign.description && (
                        <p className="text-sm text-brand-text-muted mt-2 line-clamp-3">
                          {campaign.description}
                        </p>
                      )}
                      <span className="inline-block mt-3 text-sm font-semibold text-brand-primary">
                        Detayları Gör &rarr;
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
    </>
  )
}
