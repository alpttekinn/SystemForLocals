import { z } from 'zod'

// =============================================================================
// Shared validation helpers
// =============================================================================

const turkishPhoneRegex = /^(\+90|0)?[1-9]\d{9}$/

const phoneSchema = z
  .string()
  .min(1, 'Telefon numarası gereklidir')
  .regex(turkishPhoneRegex, 'Geçerli bir telefon numarası giriniz')

const emailSchema = z
  .string()
  .min(1, 'E-posta adresi gereklidir')
  .email('Geçerli bir e-posta adresi giriniz')

const nameSchema = z
  .string()
  .min(2, 'İsim en az 2 karakter olmalıdır')
  .max(100, 'İsim en fazla 100 karakter olabilir')

// =============================================================================
// Reservation
// =============================================================================

export const createReservationSchema = z.object({
  guest_name: nameSchema,
  guest_phone: phoneSchema,
  guest_email: emailSchema,
  party_size: z
    .number()
    .int()
    .min(1, 'En az 1 kişi olmalıdır')
    .max(50, 'Maksimum kişi sayısı aşıldı'),
  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih giriniz (YYYY-MM-DD)'),
  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Geçerli bir saat giriniz (HH:MM)'),
  special_requests: z.string().max(500).optional().nullable(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const updateReservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show']),
  reason: z.string().max(500).optional(),
  admin_notes: z.string().max(1000).optional(),
})

export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>

// =============================================================================
// Event Inquiry
// =============================================================================

export const createEventInquirySchema = z.object({
  guest_name: nameSchema,
  guest_phone: phoneSchema,
  guest_email: emailSchema,
  event_type: z.enum(['birthday', 'corporate', 'wedding', 'private_dining', 'group', 'other']),
  estimated_guests: z
    .number()
    .int()
    .min(1, 'En az 1 kişi olmalıdır')
    .max(500, 'Maksimum kişi sayısı aşıldı'),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  alternative_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
})

export type CreateEventInquiryInput = z.infer<typeof createEventInquirySchema>

// =============================================================================
// Contact Form
// =============================================================================

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: z
    .string()
    .min(10, 'Mesajınız en az 10 karakter olmalıdır')
    .max(2000, 'Mesajınız en fazla 2000 karakter olabilir'),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>

// =============================================================================
// Admin — Tenant Branding
// =============================================================================

export const updateBrandingSchema = z.object({
  logo_url: z.string().url().max(2000).optional().nullable(),
  logo_alt: z.string().max(200).optional(),
  logo_dark_url: z.string().url().max(2000).optional().nullable(),
  favicon_url: z.string().url().max(2000).optional().nullable(),
  og_image_url: z.string().url().max(2000).optional().nullable(),
  theme_preset: z.enum(['forest', 'ocean', 'sunset', 'midnight', 'rose', 'amber', 'slate', 'custom']).optional(),
  color_primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  color_secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  color_accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  color_background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  color_surface: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  font_preset: z.enum(['classic', 'modern', 'elegant', 'playful']).optional(),
  button_style: z.enum(['rounded', 'pill', 'sharp']).optional(),
  tagline: z.string().max(200).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  hero_title: z.string().max(200).optional().nullable(),
  hero_subtitle: z.string().max(500).optional().nullable(),
  hero_image_url: z.string().url().max(2000).optional().nullable(),
  hero_cta_text: z.string().max(50).optional(),
  footer_text: z.string().max(500).optional().nullable(),
})

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>

// =============================================================================
// Admin — Tenant Contact
// =============================================================================

export const updateContactSchema = z.object({
  phone: z.string().min(1).max(30).optional().nullable(),
  phone_secondary: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(5).optional(),
  maps_embed_url: z.string().url().max(2000).optional().nullable(),
  maps_url: z.string().url().max(2000).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  instagram_url: z.string().url().max(500).optional().nullable(),
  facebook_url: z.string().url().max(500).optional().nullable(),
  twitter_url: z.string().url().max(500).optional().nullable(),
  tiktok_url: z.string().url().max(500).optional().nullable(),
  youtube_url: z.string().url().max(500).optional().nullable(),
})

export type UpdateContactInput = z.infer<typeof updateContactSchema>

// =============================================================================
// Admin — Tenant SEO
// =============================================================================

export const updateSeoSchema = z.object({
  meta_title_template: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional().nullable(),
  canonical_base_url: z.string().url().max(500).optional().nullable(),
  og_title: z.string().max(200).optional().nullable(),
  og_description: z.string().max(500).optional().nullable(),
  business_type: z.string().max(100).optional(),
  serves_cuisine: z.array(z.string().max(100)).optional(),
  price_range: z.string().max(10).optional(),
  opening_hours_spec: z.string().max(500).optional().nullable(),
})

export type UpdateSeoInput = z.infer<typeof updateSeoSchema>

// =============================================================================
// Admin — Business Hours
// =============================================================================

export const updateBusinessHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  is_open: z.boolean(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/),
  close_time: z.string().regex(/^\d{2}:\d{2}$/),
  break_start: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  break_end: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
})

export type UpdateBusinessHoursInput = z.infer<typeof updateBusinessHoursSchema>

// =============================================================================
// Admin — Reservation Rules
// =============================================================================

export const updateReservationRulesSchema = z.object({
  slot_duration_minutes: z.number().int().min(15).max(240).optional(),
  default_slot_capacity: z.number().int().min(1).max(200).optional(),
  max_party_size: z.number().int().min(1).max(100).optional(),
  min_party_size: z.number().int().min(1).max(10).optional(),
  group_inquiry_threshold: z.number().int().min(2).max(100).optional(),
  lead_time_hours: z.number().int().min(0).max(72).optional(),
  max_days_ahead: z.number().int().min(1).max(365).optional(),
  auto_confirm: z.boolean().optional(),
})

export type UpdateReservationRulesInput = z.infer<typeof updateReservationRulesSchema>

// =============================================================================
// Admin — Blocked Slots
// =============================================================================

export const createBlockedSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  block_type: z.enum(['full_day', 'time_range', 'capacity_override']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  override_capacity: z.number().int().min(0).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
})

export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>

// =============================================================================
// Admin — Menu
// =============================================================================

export const menuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
})

export type MenuCategoryInput = z.infer<typeof menuCategorySchema>

export const menuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(0),
  image_url: z.string().url().max(2000).optional().nullable(),
  image_alt: z.string().max(300).optional().nullable(),
  is_visible: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export type MenuItemInput = z.infer<typeof menuItemSchema>

// =============================================================================
// Admin — Gallery
// =============================================================================

export const galleryItemSchema = z.object({
  image_url: z.string().url().max(2000),
  thumbnail_url: z.string().url().max(2000).optional().nullable(),
  caption: z.string().max(300).optional().nullable(),
  alt_text: z.string().min(1).max(300),
  is_cover: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export type GalleryItemInput = z.infer<typeof galleryItemSchema>

// =============================================================================
// Admin — Campaigns
// =============================================================================

export const campaignSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  content: z.string().max(10000).optional().nullable(),
  image_url: z.string().url().max(2000).optional().nullable(),
  image_alt: z.string().max(300).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_active: z.boolean().optional(),
})

export type CampaignInput = z.infer<typeof campaignSchema>

// =============================================================================
// Admin — FAQ
// =============================================================================

export const faqItemSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  sort_order: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
})

export type FaqItemInput = z.infer<typeof faqItemSchema>

// =============================================================================
// Admin — Special Dates
// =============================================================================

export const specialDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_closed: z.boolean(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  close_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
})

export type SpecialDateInput = z.infer<typeof specialDateSchema>

// =============================================================================
// Admin — Testimonials
// =============================================================================

export const testimonialSchema = z.object({
  reviewer_name: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  quote: z.string().min(1).max(2000),
  source: z.string().max(200).optional().nullable(),
  avatar_url: z.string().url().max(2000).optional().nullable(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export type TestimonialInput = z.infer<typeof testimonialSchema>
