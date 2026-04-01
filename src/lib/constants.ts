/**
 * DAY-OF-WEEK CONVENTION
 * ──────────────────────
 * This project uses ISO 8601: 0 = Monday, 6 = Sunday.
 * JavaScript Date.getDay() uses 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * Always convert with jsDateToDayOfWeek() from @/lib/utils before comparing.
 *
 * This convention is used consistently in:
 * - database (business_hours.day_of_week)
 * - availability API calculations
 * - admin forms
 * - UI labels (DAYS_OF_WEEK array below)
 */

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazartesi', short: 'Pzt' },
  { value: 1, label: 'Salı', short: 'Sal' },
  { value: 2, label: 'Çarşamba', short: 'Çar' },
  { value: 3, label: 'Perşembe', short: 'Per' },
  { value: 4, label: 'Cuma', short: 'Cum' },
  { value: 5, label: 'Cumartesi', short: 'Cmt' },
  { value: 6, label: 'Pazar', short: 'Paz' },
] as const

// --- Reservation status metadata ---

export const RESERVATION_STATUS_CONFIG = {
  pending: { label: 'Beklemede', color: 'gold', icon: 'Clock' },
  confirmed: { label: 'Onaylandı', color: 'forest', icon: 'CheckCircle' },
  rejected: { label: 'Reddedildi', color: 'burgundy', icon: 'XCircle' },
  cancelled: { label: 'İptal Edildi', color: 'charcoal', icon: 'Ban' },
  completed: { label: 'Tamamlandı', color: 'forest', icon: 'CheckCheck' },
  no_show: { label: 'Gelmedi', color: 'burgundy', icon: 'UserX' },
} as const

// --- Event inquiry metadata ---

export const EVENT_INQUIRY_STATUS_CONFIG = {
  new: { label: 'Yeni', color: 'gold' },
  contacted: { label: 'İletişime Geçildi', color: 'forest' },
  confirmed: { label: 'Onaylandı', color: 'forest' },
  completed: { label: 'Tamamlandı', color: 'charcoal' },
  declined: { label: 'Reddedildi', color: 'burgundy' },
} as const

export const EVENT_TYPE_LABELS = {
  birthday: 'Doğum Günü',
  corporate: 'Kurumsal',
  wedding: 'Düğün / Nişan',
  private_dining: 'Özel Yemek',
  group: 'Grup Rezervasyonu',
  other: 'Diğer',
} as const

// --- Notification templates ---

export const NOTIFICATION_TEMPLATES = {
  RESERVATION_CREATED: 'reservation_created',
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  RESERVATION_REJECTED: 'reservation_rejected',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  RESERVATION_REMINDER: 'reservation_reminder',
  EVENT_INQUIRY_RECEIVED: 'event_inquiry_received',
  EVENT_INQUIRY_ADMIN_ALERT: 'event_inquiry_admin_alert',
  CONTACT_FORM_ADMIN_ALERT: 'contact_form_admin_alert',
  RESERVATION_ADMIN_ALERT: 'reservation_admin_alert',
} as const

// --- Site metadata (REMOVED: now comes from tenant config) ---
// SITE_CONFIG has been replaced by TenantConfig loaded at runtime.
// Use useTenant() in client components or resolveTenantConfig() server-side.

// --- Platform-level constants ---

export const PLATFORM_NAME = 'CafePanel'
export const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'

// --- Navigation ---
// Nav links are generated from tenant features. These are the base definitions.

export interface NavLink {
  href: string
  label: string
  featureKey?: string // maps to TenantFeatures boolean field
}

export const PUBLIC_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Anasayfa' },
  { href: '/menu', label: 'Menü' },
  { href: '/gallery', label: 'Galeri', featureKey: 'gallery_enabled' },
  { href: '/about', label: 'Hakkımızda' },
  { href: '/campaigns', label: 'Kampanyalar', featureKey: 'campaigns_enabled' },
  { href: '/faq', label: 'SSS', featureKey: 'faq_enabled' },
  { href: '/contact', label: 'İletişim' },
]

export const ADMIN_NAV_LINKS: NavLink[] = [
  { href: '/admin', label: 'Panel', icon: 'LayoutDashboard' } as NavLink & { icon: string },
  { href: '/admin/reservations', label: 'Rezervasyonlar', icon: 'CalendarDays', featureKey: 'reservations_enabled' } as NavLink & { icon: string },
  { href: '/admin/events', label: 'Etkinlik Talepleri', icon: 'PartyPopper', featureKey: 'events_enabled' } as NavLink & { icon: string },
  { href: '/admin/menu', label: 'Menü', icon: 'UtensilsCrossed' } as NavLink & { icon: string },
  { href: '/admin/gallery', label: 'Galeri', icon: 'Images', featureKey: 'gallery_enabled' } as NavLink & { icon: string },
  { href: '/admin/campaigns', label: 'Kampanyalar', icon: 'Megaphone', featureKey: 'campaigns_enabled' } as NavLink & { icon: string },
  { href: '/admin/faq', label: 'SSS', icon: 'HelpCircle', featureKey: 'faq_enabled' } as NavLink & { icon: string },
  { href: '/admin/testimonials', label: 'Değerlendirmeler', icon: 'Star', featureKey: 'testimonials_enabled' } as NavLink & { icon: string },
  { href: '/admin/hours', label: 'Çalışma Saatleri', icon: 'Clock' } as NavLink & { icon: string },
  { href: '/admin/blocked-slots', label: 'Bloklu Slotlar', icon: 'ShieldBan' } as NavLink & { icon: string },
  { href: '/admin/notifications', label: 'Bildirimler', icon: 'Bell' } as NavLink & { icon: string },
  { href: '/admin/settings', label: 'Ayarlar', icon: 'Settings' } as NavLink & { icon: string },
]

/**
 * Filter nav links by tenant features.
 * Links without a featureKey are always shown.
 */
export function getActiveNavLinks(
  links: NavLink[],
  features: Record<string, boolean>,
): NavLink[] {
  return links.filter(link => {
    if (!link.featureKey) return true
    return features[link.featureKey] !== false
  })
}

// --- Storage buckets ---

export const STORAGE_BUCKETS = {
  TENANT_ASSETS: 'tenant-assets', // all tenant media under {slug}/ prefix
} as const

/**
 * Build tenant-scoped storage paths.
 * Structure: tenant-assets/{tenant-slug}/{category}/
 */
export function getTenantStoragePath(tenantSlug: string, category: 'brand' | 'hero' | 'gallery' | 'menu' | 'campaigns') {
  return `${tenantSlug}/${category}`
}
