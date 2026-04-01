'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { PageLoading } from '@/components/ui/loading'
import { ToastProvider } from '@/components/ui/toast'
import { TenantProvider } from '@/lib/tenant'
import { generateThemeVars } from '@/lib/tenant'
import type { TenantConfig } from '@/types'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && !isLoginPage) {
        router.replace('/admin/login')
        return
      }

      if (session && isLoginPage) {
        router.replace('/admin')
        return
      }

      // Load tenant config for admin panel
      if (session && !isLoginPage) {
        try {
          const res = await fetch('/api/tenant')
          if (res.ok) {
            const config = await res.json()
            setTenantConfig(config)
          }
        } catch {
          // Tenant config is optional for admin — sidebar will use fallback
        }
      }

      setIsAuthenticated(!!session || isLoginPage)
      setIsLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && !isLoginPage) {
          router.replace('/admin/login')
        }
        setIsAuthenticated(!!session || isLoginPage)
      }
    )

    return () => subscription.unsubscribe()
  }, [router, isLoginPage])

  if (isLoading) {
    return <PageLoading />
  }

  if (!isAuthenticated) {
    return null
  }

  // Login page gets a simple centered layout
  if (isLoginPage) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
          {children}
        </div>
      </ToastProvider>
    )
  }

  // Admin panel layout with sidebar
  const themeVars = tenantConfig ? generateThemeVars(tenantConfig.branding) : {}

  const adminContent = (
    <ToastProvider>
      <div className="min-h-screen flex bg-cream-100" style={themeVars as React.CSSProperties}>
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  )

  if (tenantConfig) {
    return (
      <TenantProvider config={tenantConfig}>
        {adminContent}
      </TenantProvider>
    )
  }

  return adminContent
}
