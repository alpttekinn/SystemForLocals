// =============================================================================
// SaaS Multi-Tenant Database Row Types — mirrors Supabase schema
// =============================================================================

// --- Enums / Union Types ---

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type MemberRole = 'owner' | 'admin' | 'staff'

export type ThemePreset =
  | 'forest' | 'ocean' | 'sunset' | 'midnight'
  | 'rose' | 'amber' | 'slate' | 'custom'

export type FontPreset = 'classic' | 'modern' | 'elegant' | 'playful'
export type ButtonStyle = 'rounded' | 'pill' | 'sharp'

export type ReservationStatus =
  | 'pending' | 'confirmed' | 'rejected'
  | 'cancelled' | 'completed' | 'no_show'

export type EventInquiryStatus =
  | 'new' | 'contacted' | 'confirmed' | 'completed' | 'declined'

export type EventType =
  | 'birthday' | 'corporate' | 'wedding'
  | 'private_dining' | 'group' | 'other'

export type BlockType = 'full_day' | 'time_range' | 'capacity_override'
export type NotificationChannel = 'email' | 'sms'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'bounced'

// =============================================================================
// Platform / Tenancy Core
// =============================================================================

export interface Tenant {
  id: string
  slug: string
  name: string
  status: TenantStatus
  plan: TenantPlan
  created_at: string
  updated_at: string
}

export interface TenantDomain {
  id: string
  tenant_id: string
  domain: string
  is_primary: boolean
  is_verified: boolean
  verification_token: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface TenantMembership {
  id: string
  tenant_id: string
  user_id: string
  role: MemberRole
  is_platform_admin: boolean
  created_at: string
}

// =============================================================================
// Tenant Configuration (one per tenant)
// =============================================================================

export interface TenantBranding {
  id: string
  tenant_id: string
  logo_url: string | null
  logo_alt: string
  logo_dark_url: string | null
  favicon_url: string | null
  og_image_url: string | null
  theme_preset: ThemePreset
  color_primary: string | null
  color_secondary: string | null
  color_accent: string | null
  color_background: string | null
  color_surface: string | null
  font_preset: FontPreset
  button_style: ButtonStyle
  tagline: string | null
  short_description: string | null
  hero_title: string | null
  hero_subtitle: string | null
  hero_image_url: string | null
  hero_cta_text: string
  footer_text: string | null
  created_at: string
  updated_at: string
}

export interface TenantContact {
  id: string
  tenant_id: string
  phone: string | null
  phone_secondary: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  postal_code: string | null
  country: string
  maps_embed_url: string | null
  maps_url: string | null
  latitude: number | null
  longitude: number | null
  instagram_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  created_at: string
  updated_at: string
}

export interface TenantSeo {
  id: string
  tenant_id: string
  meta_title_template: string
  meta_description: string | null
  canonical_base_url: string | null
  og_title: string | null
  og_description: string | null
  business_type: string
  serves_cuisine: string[]
  price_range: string
  opening_hours_spec: string | null
  additional_json_ld: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TenantFeatures {
  id: string
  tenant_id: string
  reservations_enabled: boolean
  events_enabled: boolean
  gallery_enabled: boolean
  campaigns_enabled: boolean
  faq_enabled: boolean
  testimonials_enabled: boolean
  contact_form_enabled: boolean
  sms_enabled: boolean
  email_notifications_enabled: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// Composite: Full tenant config loaded for rendering
// =============================================================================

export interface TenantConfig {
  tenant: Tenant
  branding: TenantBranding
  contact: TenantContact
  seo: TenantSeo
  features: TenantFeatures
}

// =============================================================================
// Operations (tenant-scoped)
// =============================================================================

/**
 * Day-of-week convention: 0 = Monday, 6 = Sunday (ISO 8601).
 * JavaScript Date.getDay() returns 0 = Sunday — use jsDateToDayOfWeek() to convert.
 */
export interface BusinessHours {
  id: string
  tenant_id: string
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
  break_start: string | null
  break_end: string | null
}

export interface SpecialDate {
  id: string
  tenant_id: string
  date: string
  is_closed: boolean
  open_time: string | null
  close_time: string | null
  reason: string | null
  created_at: string
}

export interface ReservationRules {
  id: string
  tenant_id: string
  slot_duration_minutes: number
  default_slot_capacity: number
  max_party_size: number
  min_party_size: number
  group_inquiry_threshold: number
  lead_time_hours: number
  max_days_ahead: number
  auto_confirm: boolean
  updated_at: string
}

export interface BlockedSlot {
  id: string
  tenant_id: string
  date: string
  block_type: BlockType
  start_time: string | null
  end_time: string | null
  override_capacity: number | null
  reason: string | null
  created_by: string | null
  created_at: string
}

// =============================================================================
// Content (tenant-scoped)
// =============================================================================

export interface MenuCategory {
  id: string
  tenant_id: string
  name: string
  slug: string
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  tenant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  image_alt: string | null
  is_visible: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  tenant_id: string
  image_url: string
  thumbnail_url: string | null
  caption: string | null
  alt_text: string
  is_cover: boolean
  is_visible: boolean
  sort_order: number
  created_at: string
}

export interface Campaign {
  id: string
  tenant_id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  image_url: string | null
  image_alt: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FaqItem {
  id: string
  tenant_id: string
  question: string
  answer: string
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  tenant_id: string
  reviewer_name: string
  rating: number | null
  quote: string
  source: string | null
  avatar_url: string | null
  is_featured: boolean
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// =============================================================================
// Booking (tenant-scoped)
// =============================================================================

export interface Reservation {
  id: string
  tenant_id: string
  guest_name: string
  guest_phone: string
  guest_email: string
  party_size: number
  reservation_date: string
  reservation_time: string
  special_requests: string | null
  status: ReservationStatus
  cancel_token: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface ReservationStatusHistory {
  id: string
  reservation_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  reason: string | null
  created_at: string
}

export interface EventInquiry {
  id: string
  tenant_id: string
  guest_name: string
  guest_phone: string
  guest_email: string
  event_type: EventType
  estimated_guests: number
  preferred_date: string | null
  preferred_time: string | null
  alternative_date: string | null
  message: string | null
  status: EventInquiryStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// Communication (tenant-scoped)
// =============================================================================

export interface NotificationLog {
  id: string
  tenant_id: string
  reservation_id: string | null
  event_inquiry_id: string | null
  channel: NotificationChannel
  recipient: string
  template: string
  subject: string | null
  status: NotificationStatus
  provider: string | null
  provider_message_id: string | null
  error_message: string | null
  created_at: string
}

export interface ContactSubmission {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

// =============================================================================
// Application Types (non-DB)
// =============================================================================

export interface TimeSlot {
  time: string
  capacity: number
  occupied: number
  remaining: number
  available: boolean
}

export interface DayAvailability {
  date: string
  is_open: boolean
  reason?: string
  slots: TimeSlot[]
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[]
}

export interface ApiErrorResponse {
  error: string
  code?: string
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
}

/**
 * Minimal tenant info returned by resolver middleware.
 * Injected into request headers for downstream use.
 */
export interface ResolvedTenant {
  id: string
  slug: string
  name: string
}
