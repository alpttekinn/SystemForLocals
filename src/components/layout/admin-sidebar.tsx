'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, PartyPopper, UtensilsCrossed,
  Images, Megaphone, HelpCircle, Clock, ShieldBan, Bell,
  Settings, LogOut, ChevronLeft, Star, MessageCircle, MessagesSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_LINKS, getActiveNavLinks } from '@/lib/constants'
import { useTenantOptional } from '@/lib/tenant'

const ICON_MAP = {
  LayoutDashboard, CalendarDays, PartyPopper, UtensilsCrossed,
  Images, Megaphone, HelpCircle, Clock, ShieldBan, Bell, Settings, Star,
  MessageCircle, MessagesSquare,
} as const

interface AdminSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function AdminSidebar({ collapsed = false, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const tenant = useTenantOptional()

  const adminLinks = tenant
    ? getActiveNavLinks(ADMIN_NAV_LINKS, tenant.features as unknown as Record<string, boolean>)
    : ADMIN_NAV_LINKS

  const panelName = tenant ? tenant.tenant.name : 'Admin Panel'

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-brand-primary-dark text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-brand-primary/50 shrink-0">
        {!collapsed && (
          <Link href="/admin" className="font-serif text-lg font-bold text-white truncate">
            {panelName}
          </Link>
        )}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className={cn(
            'p-1.5 rounded-button text-white/60 hover:text-white hover:bg-brand-primary transition-colors',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          <ChevronLeft
            size={18}
            className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-hide">
        {adminLinks.map((link) => {
          const iconName = (link as unknown as { icon: string }).icon
          const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP] || LayoutDashboard
          const isActive =
            link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-button text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-white/70 hover:text-white hover:bg-brand-primary',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-brand-primary/50 px-2 py-3">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-button text-sm font-medium text-white/50 hover:text-white hover:bg-brand-primary transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title="Siteye dön"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Siteye Dön</span>}
        </Link>
      </div>
    </aside>
  )
}
