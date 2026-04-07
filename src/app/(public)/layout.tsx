import { headers } from 'next/headers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileCTABar } from '@/components/layout/mobile-cta-bar'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { TenantProvider } from '@/lib/tenant'
import { resolveTenantConfig, generateThemeVars } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { TenantSwitcher } from '@/components/tenant-switcher'

// Show tenant switcher only in explicit dev/demo mode — never on production for real visitors.
const SHOW_TENANT_SWITCHER = process.env.NEXT_PUBLIC_ENABLE_TENANT_SWITCHER === 'true'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')

  if (!slug) {
    notFound()
  }

  const tenantConfig = await resolveTenantConfig(slug)

  if (!tenantConfig) {
    notFound()
  }

  const themeVars = generateThemeVars(tenantConfig.branding)

  return (
    <div className="flex flex-col min-h-screen" style={themeVars as React.CSSProperties}>
      <TenantProvider config={tenantConfig}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-white focus:text-charcoal-900 focus:underline">
          Ana iceriğe atla
        </a>
        <Header />
        <main id="main-content" className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileCTABar />
        <WhatsAppButton />
        {SHOW_TENANT_SWITCHER && <TenantSwitcher />}
      </TenantProvider>
    </div>
  )
}
