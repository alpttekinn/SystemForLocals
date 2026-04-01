-- =============================================================================
-- SaaS Multi-Tenant Schema — Full Refactor
-- Migration: 00002_saas_multi_tenant
--
-- Transforms single-business schema into multi-tenant SaaS platform.
--
-- CONVENTIONS:
--   Day-of-week: 0 = Monday, 6 = Sunday (ISO 8601).
--   Midnight:    close_time = '00:00' means end of business day.
--   Tenant scope: Every operational/content table has tenant_id FK.
--   Advisory locks: create_reservation() uses tenant_id in lock key.
--   Config singletons: UNIQUE(tenant_id) enforces one config row per tenant.
--   Timestamps: All TIMESTAMPTZ, all default NOW().
--   UUIDs: All PKs are gen_random_uuid().
-- =============================================================================

-- =============================================
-- CLEANUP: Drop Phase 1 single-tenant objects
-- =============================================

DROP FUNCTION IF EXISTS create_reservation(TEXT, TEXT, TEXT, INT, DATE, TIME, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS notification_log CASCADE;
DROP TABLE IF EXISTS event_inquiries CASCADE;
DROP TABLE IF EXISTS reservation_status_history CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS faq_items CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS gallery_items CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS blocked_slots CASCADE;
DROP TABLE IF EXISTS reservation_rules CASCADE;
DROP TABLE IF EXISTS special_dates CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================================================
-- PLATFORM / TENANCY CORE
-- =============================================================================

-- Tenants (businesses)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant domains (subdomains + custom domains)
CREATE TABLE tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);

-- User profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant memberships (user-to-tenant role bindings)
CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'admin', 'staff')),
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_memberships_user ON tenant_memberships(user_id);
CREATE INDEX idx_memberships_tenant ON tenant_memberships(tenant_id);

-- =============================================================================
-- TENANT CONFIGURATION (one row per tenant each — UNIQUE on tenant_id)
-- =============================================================================

-- Branding: visual identity + hero content
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  -- Logos
  logo_url TEXT,
  logo_alt TEXT DEFAULT '',
  logo_dark_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,

  -- Theme presets (bounded, not arbitrary)
  theme_preset TEXT DEFAULT 'forest'
    CHECK (theme_preset IN (
      'forest', 'ocean', 'sunset', 'midnight',
      'rose', 'amber', 'slate', 'custom'
    )),
  -- Custom color overrides (hex, used only when theme_preset = 'custom')
  color_primary TEXT,
  color_secondary TEXT,
  color_accent TEXT,
  color_background TEXT,
  color_surface TEXT,

  font_preset TEXT DEFAULT 'classic'
    CHECK (font_preset IN ('classic', 'modern', 'elegant', 'playful')),
  button_style TEXT DEFAULT 'rounded'
    CHECK (button_style IN ('rounded', 'pill', 'sharp')),

  -- Hero / copy
  tagline TEXT,
  short_description TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_cta_text TEXT DEFAULT 'Rezervasyon Yap',
  footer_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact settings: location, phone, social links
CREATE TABLE tenant_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  phone TEXT,
  phone_secondary TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'TR',
  maps_embed_url TEXT,
  maps_url TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO / structured data
CREATE TABLE tenant_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  meta_title_template TEXT DEFAULT '{page} | {business}',
  meta_description TEXT,
  canonical_base_url TEXT,
  og_title TEXT,
  og_description TEXT,

  -- JSON-LD LocalBusiness / Restaurant schema
  business_type TEXT DEFAULT 'Restaurant',
  serves_cuisine TEXT[] DEFAULT '{}',
  price_range TEXT DEFAULT '$$',
  opening_hours_spec TEXT,
  additional_json_ld JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags per tenant
CREATE TABLE tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  reservations_enabled BOOLEAN DEFAULT TRUE,
  events_enabled BOOLEAN DEFAULT TRUE,
  gallery_enabled BOOLEAN DEFAULT TRUE,
  campaigns_enabled BOOLEAN DEFAULT TRUE,
  faq_enabled BOOLEAN DEFAULT TRUE,
  testimonials_enabled BOOLEAN DEFAULT TRUE,
  contact_form_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OPERATIONS (tenant-scoped)
-- =============================================================================

-- Business hours (per tenant, per day-of-week, 0=Mon 6=Sun)
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME NOT NULL DEFAULT '10:00',
  close_time TIME NOT NULL DEFAULT '00:00',
  break_start TIME,
  break_end TIME,
  UNIQUE(tenant_id, day_of_week)
);

CREATE INDEX idx_business_hours_tenant ON business_hours(tenant_id);

-- Special dates (closures / modified hours per specific date)
CREATE TABLE special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  open_time TIME,
  close_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

CREATE INDEX idx_special_dates_tenant_date ON special_dates(tenant_id, date);

-- Reservation rules (one ruleset per tenant)
CREATE TABLE reservation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  slot_duration_minutes INT DEFAULT 60,
  default_slot_capacity INT DEFAULT 20,
  max_party_size INT DEFAULT 12,
  min_party_size INT DEFAULT 1,
  group_inquiry_threshold INT DEFAULT 8,
  lead_time_hours INT DEFAULT 2,
  max_days_ahead INT DEFAULT 30,
  auto_confirm BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked slots (full-day closures, time-range blocks, capacity overrides)
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  block_type TEXT NOT NULL
    CHECK (block_type IN ('full_day', 'time_range', 'capacity_override')),
  start_time TIME,
  end_time TIME,
  override_capacity INT,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_tenant_date ON blocked_slots(tenant_id, date);

-- =============================================================================
-- CONTENT (tenant-scoped)
-- =============================================================================

-- Menu categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_menu_categories_tenant ON menu_categories(tenant_id);

-- Menu items (tenant_id denormalized for direct query performance)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  image_alt TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- Gallery items
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  is_cover BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_items_tenant ON gallery_items(tenant_id);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  image_alt TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);

-- FAQ items
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_items_tenant ON faq_items(tenant_id);

-- Testimonials / reviews (NEW)
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  quote TEXT NOT NULL,
  source TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_tenant ON testimonials(tenant_id);

-- =============================================================================
-- BOOKING (tenant-scoped)
-- =============================================================================

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  party_size INT NOT NULL CHECK (party_size >= 1),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','no_show')),
  cancel_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_tenant_date ON reservations(tenant_id, reservation_date, reservation_time, status);

-- Reservation status history (audit trail)
CREATE TABLE reservation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_res_history_reservation ON reservation_status_history(reservation_id);

-- Event inquiries (group/private bookings)
CREATE TABLE event_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('birthday','corporate','wedding','private_dining','group','other')),
  estimated_guests INT NOT NULL CHECK (estimated_guests >= 1),
  preferred_date DATE,
  preferred_time TIME,
  alternative_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','confirmed','completed','declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_inquiries_tenant ON event_inquiries(tenant_id);

-- =============================================================================
-- COMMUNICATION (tenant-scoped)
-- =============================================================================

-- Notification delivery log
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  event_inquiry_id UUID REFERENCES event_inquiries(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','bounced')),
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_tenant ON notification_log(tenant_id);
CREATE INDEX idx_notification_log_reservation ON notification_log(reservation_id);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_tenant ON contact_submissions(tenant_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if current user has any membership in a given tenant
CREATE OR REPLACE FUNCTION has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
  );
$$;

-- Check if current user is admin or owner for a given tenant
CREATE OR REPLACE FUNCTION is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Check if current user is a platform-level super admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE user_id = auth.uid()
      AND is_platform_admin = TRUE
  );
$$;

-- Get all tenant IDs the current user belongs to
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(ARRAY_AGG(tenant_id), '{}')
  FROM tenant_memberships
  WHERE user_id = auth.uid();
$$;

-- =============================================================================
-- ATOMIC BOOKING FUNCTION (tenant-aware, concurrency-safe)
--
-- Uses pg_advisory_xact_lock with tenant_id + date + time to prevent
-- double-booking. Lock key is tenant-scoped so different tenants
-- never block each other.
-- =============================================================================

CREATE OR REPLACE FUNCTION create_reservation(
  p_tenant_id UUID,
  p_guest_name TEXT,
  p_guest_phone TEXT,
  p_guest_email TEXT,
  p_party_size INT,
  p_date DATE,
  p_time TIME,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_key BIGINT;
  v_current_occupancy INT;
  v_slot_capacity INT;
  v_override_capacity INT;
  v_effective_capacity INT;
  v_reservation_id UUID;
  v_is_blocked BOOLEAN;
  v_auto_confirm BOOLEAN;
  v_initial_status TEXT;
BEGIN
  -- Tenant-scoped advisory lock: prevents concurrent inserts for same tenant+date+time
  v_lock_key := hashtext(p_tenant_id::TEXT || p_date::TEXT || p_time::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if slot is blocked (full_day or matching time_range) for this tenant
  SELECT EXISTS (
    SELECT 1 FROM blocked_slots
    WHERE tenant_id = p_tenant_id
      AND date = p_date
      AND (
        block_type = 'full_day'
        OR (block_type = 'time_range' AND p_time >= start_time AND p_time < end_time)
      )
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'SLOT_BLOCKED: This time slot is not available.';
  END IF;

  -- Get default capacity + auto_confirm from tenant's reservation_rules
  SELECT default_slot_capacity, auto_confirm
  INTO v_slot_capacity, v_auto_confirm
  FROM reservation_rules
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  IF v_slot_capacity IS NULL THEN
    v_slot_capacity := 20; -- platform fallback
    v_auto_confirm := FALSE;
  END IF;

  -- Check for capacity override on this tenant+date+time
  SELECT override_capacity INTO v_override_capacity
  FROM blocked_slots
  WHERE tenant_id = p_tenant_id
    AND date = p_date
    AND block_type = 'capacity_override'
    AND p_time >= start_time
    AND p_time < end_time
  LIMIT 1;

  v_effective_capacity := COALESCE(v_override_capacity, v_slot_capacity);

  -- Calculate current occupancy for this tenant+slot
  SELECT COALESCE(SUM(party_size), 0) INTO v_current_occupancy
  FROM reservations
  WHERE tenant_id = p_tenant_id
    AND reservation_date = p_date
    AND reservation_time = p_time
    AND status IN ('pending', 'confirmed');

  -- Capacity check
  IF (v_current_occupancy + p_party_size) > v_effective_capacity THEN
    RAISE EXCEPTION 'SLOT_FULL: Not enough capacity for this party size.';
  END IF;

  -- Determine initial status
  v_initial_status := CASE WHEN v_auto_confirm THEN 'confirmed' ELSE 'pending' END;

  -- Insert reservation
  INSERT INTO reservations (
    tenant_id, guest_name, guest_phone, guest_email,
    party_size, reservation_date, reservation_time,
    special_requests, status
  ) VALUES (
    p_tenant_id, p_guest_name, p_guest_phone, p_guest_email,
    p_party_size, p_date, p_time,
    p_special_requests, v_initial_status
  )
  RETURNING id INTO v_reservation_id;

  -- Log initial status in audit trail
  INSERT INTO reservation_status_history (
    reservation_id, old_status, new_status, reason
  ) VALUES (
    v_reservation_id, NULL, v_initial_status, 'Reservation created by guest'
  );

  RETURN v_reservation_id;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ---- TENANTS ----
-- Public: read active tenants (for directory / slug resolution)
CREATE POLICY "tenants_public_read" ON tenants
  FOR SELECT TO anon, authenticated USING (status = 'active');
-- Admin: members can read their tenants
CREATE POLICY "tenants_member_read" ON tenants
  FOR SELECT TO authenticated USING (id = ANY(get_user_tenant_ids()));
-- Platform admin: full access
CREATE POLICY "tenants_platform_admin" ON tenants
  FOR ALL TO authenticated USING (is_platform_admin());

-- ---- TENANT DOMAINS ----
CREATE POLICY "domains_public_read" ON tenant_domains
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "domains_admin_write" ON tenant_domains
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

-- ---- PROFILES ----
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT TO authenticated USING (is_platform_admin());

-- ---- TENANT MEMBERSHIPS ----
CREATE POLICY "memberships_own_read" ON tenant_memberships
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "memberships_tenant_admin" ON tenant_memberships
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));
CREATE POLICY "memberships_platform_admin" ON tenant_memberships
  FOR ALL TO authenticated USING (is_platform_admin());

-- ---- CONFIG TABLES (branding, contact, seo, features) ----
-- Pattern: public can read for resolved tenant; tenant admins can write

CREATE POLICY "branding_public_read" ON tenant_branding
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "branding_admin_write" ON tenant_branding
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "contact_public_read" ON tenant_contact
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "contact_admin_write" ON tenant_contact
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "seo_public_read" ON tenant_seo
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "seo_admin_write" ON tenant_seo
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "features_public_read" ON tenant_features
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "features_admin_write" ON tenant_features
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

-- ---- OPERATIONS TABLES ----
-- Public read (for availability calc); admin write scoped to tenant

CREATE POLICY "hours_public_read" ON business_hours
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "hours_admin_write" ON business_hours
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "special_dates_public_read" ON special_dates
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "special_dates_admin_write" ON special_dates
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "rules_public_read" ON reservation_rules
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "rules_admin_write" ON reservation_rules
  FOR ALL TO authenticated USING (is_tenant_admin(tenant_id));

CREATE POLICY "blocked_public_read" ON blocked_slots
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "blocked_admin_write" ON blocked_slots
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

-- ---- CONTENT TABLES ----
-- Public: read visible/active for resolved tenant; admin: full CRUD scoped

CREATE POLICY "menu_cat_public_read" ON menu_categories
  FOR SELECT TO anon, authenticated USING (is_visible = TRUE);
CREATE POLICY "menu_cat_admin" ON menu_categories
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT TO anon, authenticated USING (is_visible = TRUE);
CREATE POLICY "menu_items_admin" ON menu_items
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "gallery_public_read" ON gallery_items
  FOR SELECT TO anon, authenticated USING (is_visible = TRUE);
CREATE POLICY "gallery_admin" ON gallery_items
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "campaigns_public_read" ON campaigns
  FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "campaigns_admin" ON campaigns
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "faq_public_read" ON faq_items
  FOR SELECT TO anon, authenticated USING (is_visible = TRUE);
CREATE POLICY "faq_admin" ON faq_items
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT TO anon, authenticated USING (is_published = TRUE);
CREATE POLICY "testimonials_admin" ON testimonials
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

-- ---- BOOKING TABLES ----
-- No public direct read; all via Route Handlers with service_role
-- Admin: scoped to their tenant

CREATE POLICY "reservations_admin" ON reservations
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

CREATE POLICY "res_history_admin" ON reservation_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = reservation_id
      AND has_tenant_access(r.tenant_id)
  ));
CREATE POLICY "res_history_insert" ON reservation_status_history
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = reservation_id
      AND has_tenant_access(r.tenant_id)
  ));

CREATE POLICY "event_inq_admin" ON event_inquiries
  FOR ALL TO authenticated USING (has_tenant_access(tenant_id));

-- ---- COMMUNICATION TABLES ----
CREATE POLICY "notif_log_admin" ON notification_log
  FOR SELECT TO authenticated USING (has_tenant_access(tenant_id));
CREATE POLICY "notif_log_insert" ON notification_log
  FOR INSERT TO authenticated WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "contact_sub_admin" ON contact_submissions
  FOR SELECT TO authenticated USING (has_tenant_access(tenant_id));
-- Public can submit contact forms (via Route Handler, but policy allows insert)
CREATE POLICY "contact_sub_public_insert" ON contact_submissions
  FOR INSERT TO anon WITH CHECK (TRUE);
