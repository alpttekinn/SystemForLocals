'use client'

import { createContext, useContext } from 'react'
import type { TenantConfig } from '@/types'

/**
 * TenantContext — provides the active tenant's configuration to all components.
 *
 * Populated by the public layout (server component fetches config,
 * passes to client provider). Admin layout does the same with its tenant scope.
 *
 * Components access via useTenant() hook.
 */

const TenantContext = createContext<TenantConfig | null>(null)

export function TenantProvider({
  config,
  children,
}: {
  config: TenantConfig
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Access the active tenant config.
 * Throws if used outside TenantProvider (catches misconfiguration early).
 */
export function useTenant(): TenantConfig {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant() must be used within a TenantProvider')
  }
  return ctx
}

/**
 * Optional tenant access (returns null if no provider).
 * Useful in shared components that may render outside tenant context.
 */
export function useTenantOptional(): TenantConfig | null {
  return useContext(TenantContext)
}
