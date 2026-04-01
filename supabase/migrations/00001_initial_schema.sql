-- =============================================================================
-- Yeşilçam Çekmeköy — Full Database Schema
-- Migration: 00001_initial_schema
--
-- CONVENTIONS:
--   Day-of-week: 0 = Monday, 6 = Sunday (ISO 8601).
--   Midnight:    close_time = '00:00' means end of business day.
--                Application code treats close ≤ open as "24:00" (next midnight).
--   Singletons:  settings and reservation_rules use a singleton_guard column
--                (BOOLEAN UNIQUE CHECK TRUE) to guarantee max 1 row.
--   Timestamps:  All TIMESTAMPTZ, all default NOW().
--   UUIDs:       All PKs are gen_random_uuid().
-- =============================================================================

-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
  );
$$;

-- Helper function: check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;


-- =============================================================================
-- 1. PROFILES (extends Supabase Auth)
-- =============================================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin'
              CHECK (role IN ('super_admin', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update profiles"
  ON profiles FOR UPDATE
  USING (is_super_admin());


-- =============================================================================
-- 2. SETTINGS (singleton — general restaurant info)
-- =============================================================================
CREATE TABLE settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_guard  BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton_guard = TRUE),
  restaurant_name  TEXT DEFAULT 'Yeşilçam Çekmeköy',
  phone            TEXT DEFAULT '0216 519 52 21',
  email            TEXT,
  address          TEXT DEFAULT 'Serencebey Caddesi No 52/D, Çekmeköy, İstanbul 34776',
  maps_embed_url   TEXT,
  instagram_url    TEXT DEFAULT 'https://instagram.com/yesilcamcekmekoy',
  facebook_url     TEXT,
  twitter_url      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- 3. BUSINESS HOURS (per day-of-week, 0=Mon, 6=Sun)
-- =============================================================================
CREATE TABLE business_hours (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      BOOLEAN DEFAULT TRUE,
  open_time    TIME NOT NULL DEFAULT '10:00',
  close_time   TIME NOT NULL DEFAULT '00:00',
  break_start  TIME,
  break_end    TIME,
  UNIQUE(day_of_week)
);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read business hours"
  ON business_hours FOR SELECT
  USING (true);

CREATE POLICY "Admins can update business hours"
  ON business_hours FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- 4. SPECIAL DATES (closures / modified hours per date)
-- =============================================================================
CREATE TABLE special_dates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL UNIQUE,
  is_closed   BOOLEAN DEFAULT FALSE,
  open_time   TIME,
  close_time  TIME,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE special_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read special dates"
  ON special_dates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage special dates"
  ON special_dates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 5. RESERVATION RULES (singleton)
-- =============================================================================
CREATE TABLE reservation_rules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_guard         BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton_guard = TRUE),
  slot_duration_minutes   INT DEFAULT 60,
  default_slot_capacity   INT DEFAULT 20,
  max_party_size          INT DEFAULT 12,
  min_party_size          INT DEFAULT 1,
  group_inquiry_threshold INT DEFAULT 8,
  lead_time_hours         INT DEFAULT 2,
  max_days_ahead          INT DEFAULT 30,
  auto_confirm            BOOLEAN DEFAULT FALSE,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reservation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reservation rules"
  ON reservation_rules FOR SELECT
  USING (true);

CREATE POLICY "Super admins can update reservation rules"
  ON reservation_rules FOR UPDATE
  USING (is_super_admin());


-- =============================================================================
-- 6. BLOCKED SLOTS (closures + capacity overrides)
-- =============================================================================
CREATE TABLE blocked_slots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date               DATE NOT NULL,
  block_type         TEXT NOT NULL
                     CHECK (block_type IN ('full_day', 'time_range', 'capacity_override')),
  start_time         TIME,
  end_time           TIME,
  override_capacity  INT,
  reason             TEXT,
  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blocked slots"
  ON blocked_slots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blocked slots"
  ON blocked_slots FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 7. MENU CATEGORIES
-- =============================================================================
CREATE TABLE menu_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INT DEFAULT 0,
  is_visible  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible categories"
  ON menu_categories FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Admins can read all categories"
  ON menu_categories FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage categories"
  ON menu_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 8. MENU ITEMS
-- =============================================================================
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  image_url    TEXT,
  image_alt    TEXT,
  is_visible   BOOLEAN DEFAULT TRUE,
  is_featured  BOOLEAN DEFAULT FALSE,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible items"
  ON menu_items FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Admins can read all items"
  ON menu_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage items"
  ON menu_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 9. GALLERY ITEMS
-- =============================================================================
CREATE TABLE gallery_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url      TEXT NOT NULL,
  thumbnail_url  TEXT,
  caption        TEXT,
  alt_text       TEXT NOT NULL DEFAULT '',
  is_cover       BOOLEAN DEFAULT FALSE,
  is_visible     BOOLEAN DEFAULT TRUE,
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible gallery items"
  ON gallery_items FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Admins can read all gallery items"
  ON gallery_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage gallery items"
  ON gallery_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 10. CAMPAIGNS
-- =============================================================================
CREATE TABLE campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  content     TEXT,
  image_url   TEXT,
  image_alt   TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active campaigns"
  ON campaigns FOR SELECT
  USING (
    is_active = TRUE
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

CREATE POLICY "Admins can read all campaigns"
  ON campaigns FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage campaigns"
  ON campaigns FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 11. FAQ ITEMS
-- =============================================================================
CREATE TABLE faq_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  is_visible  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible FAQ items"
  ON faq_items FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Admins can read all FAQ items"
  ON faq_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage FAQ items"
  ON faq_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- =============================================================================
-- 12. RESERVATIONS
-- =============================================================================
CREATE TABLE reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name        TEXT NOT NULL,
  guest_phone       TEXT NOT NULL,
  guest_email       TEXT NOT NULL,
  party_size        INT NOT NULL CHECK (party_size >= 1),
  reservation_date  DATE NOT NULL,
  reservation_time  TIME NOT NULL,
  special_requests  TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','no_show')),
  cancel_token      TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_lookup
  ON reservations(reservation_date, reservation_time, status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- No public SELECT — guests don't browse reservations.
-- No public INSERT — bookings go through create_reservation() RPC via Route Handler.

CREATE POLICY "Admins can read all reservations"
  ON reservations FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update reservations"
  ON reservations FOR UPDATE
  USING (is_admin());

-- Service role handles INSERT (from Route Handlers) and DELETE.


-- =============================================================================
-- 13. RESERVATION STATUS HISTORY (audit trail)
-- =============================================================================
CREATE TABLE reservation_status_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status       TEXT,
  new_status       TEXT NOT NULL,
  changed_by       UUID REFERENCES profiles(id),
  reason           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_res_history_reservation
  ON reservation_status_history(reservation_id);

ALTER TABLE reservation_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read reservation history"
  ON reservation_status_history FOR SELECT
  USING (is_admin());

-- Service role handles INSERT.


-- =============================================================================
-- 14. EVENT INQUIRIES
-- =============================================================================
CREATE TABLE event_inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name        TEXT NOT NULL,
  guest_phone       TEXT NOT NULL,
  guest_email       TEXT NOT NULL,
  event_type        TEXT NOT NULL
                    CHECK (event_type IN ('birthday','corporate','wedding','private_dining','group','other')),
  estimated_guests  INT NOT NULL CHECK (estimated_guests >= 1),
  preferred_date    DATE,
  preferred_time    TIME,
  alternative_date  DATE,
  message           TEXT,
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','confirmed','completed','declined')),
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_inquiries ENABLE ROW LEVEL SECURITY;

-- No public access — submissions go through Route Handlers with service role.

CREATE POLICY "Admins can read event inquiries"
  ON event_inquiries FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update event inquiries"
  ON event_inquiries FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- 15. NOTIFICATION LOGS
-- =============================================================================
CREATE TABLE notification_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id       UUID REFERENCES reservations(id) ON DELETE SET NULL,
  event_inquiry_id     UUID REFERENCES event_inquiries(id) ON DELETE SET NULL,
  channel              TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient            TEXT NOT NULL,
  template             TEXT NOT NULL,
  subject              TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','sent','failed','bounced')),
  provider             TEXT,
  provider_message_id  TEXT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_reservation
  ON notification_logs(reservation_id);

CREATE INDEX idx_notification_logs_event
  ON notification_logs(event_inquiry_id);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read notification logs"
  ON notification_logs FOR SELECT
  USING (is_admin());

-- Service role handles INSERT.


-- =============================================================================
-- 16. CONTACT SUBMISSIONS
-- =============================================================================
CREATE TABLE contact_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- No public access — submissions go through Route Handlers with service role.

CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  USING (is_admin());


-- =============================================================================
-- ATOMIC BOOKING FUNCTION
-- =============================================================================
-- Uses pg_advisory_xact_lock to serialize concurrent bookings for the same
-- date + time slot. This prevents overbooking under race conditions.
--
-- Called from Route Handlers via supabase.rpc('create_reservation', {...}).
-- The Route Handler uses the service_role key so this function has full access.
--
-- Returns the new reservation UUID on success.
-- Raises an exception with a code prefix on failure:
--   'SLOT_BLOCKED: ...' — the slot is blocked by admin
--   'SLOT_FULL: ...'    — not enough remaining capacity
-- =============================================================================

CREATE OR REPLACE FUNCTION create_reservation(
  p_guest_name       TEXT,
  p_guest_phone      TEXT,
  p_guest_email      TEXT,
  p_party_size       INT,
  p_date             DATE,
  p_time             TIME,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lock_key           BIGINT;
  v_current_occupancy  INT;
  v_slot_capacity      INT;
  v_override_capacity  INT;
  v_effective_capacity INT;
  v_reservation_id     UUID;
  v_is_blocked         BOOLEAN;
  v_auto_confirm       BOOLEAN;
  v_initial_status     TEXT;
BEGIN
  -- 1. Acquire advisory lock scoped to this transaction.
  --    hashtext() produces a deterministic int from the date+time string.
  v_lock_key := hashtext(p_date::TEXT || p_time::TEXT);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 2. Check if slot is blocked (full_day or matching time_range).
  SELECT EXISTS (
    SELECT 1 FROM blocked_slots
    WHERE date = p_date
      AND (
        block_type = 'full_day'
        OR (block_type = 'time_range' AND p_time >= start_time AND p_time < end_time)
      )
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'SLOT_BLOCKED: Bu zaman dilimi müsait değil.';
  END IF;

  -- 3. Get default capacity + auto_confirm from reservation_rules (singleton).
  SELECT default_slot_capacity, auto_confirm
    INTO v_slot_capacity, v_auto_confirm
    FROM reservation_rules
    LIMIT 1;

  IF v_slot_capacity IS NULL THEN
    v_slot_capacity := 20;  -- fallback if rules not seeded
  END IF;
  IF v_auto_confirm IS NULL THEN
    v_auto_confirm := FALSE;
  END IF;

  -- 4. Check for capacity override on this specific date/time.
  SELECT override_capacity INTO v_override_capacity
    FROM blocked_slots
    WHERE date = p_date
      AND block_type = 'capacity_override'
      AND p_time >= start_time
      AND p_time < end_time
    LIMIT 1;

  v_effective_capacity := COALESCE(v_override_capacity, v_slot_capacity);

  -- 5. Calculate current occupancy (pending + confirmed count as occupied).
  SELECT COALESCE(SUM(party_size), 0) INTO v_current_occupancy
    FROM reservations
    WHERE reservation_date = p_date
      AND reservation_time = p_time
      AND status IN ('pending', 'confirmed');

  -- 6. Check capacity.
  IF (v_current_occupancy + p_party_size) > v_effective_capacity THEN
    RAISE EXCEPTION 'SLOT_FULL: Bu zaman diliminde yeterli kapasite yok.';
  END IF;

  -- 7. Determine initial status.
  v_initial_status := CASE WHEN v_auto_confirm THEN 'confirmed' ELSE 'pending' END;

  -- 8. Insert the reservation.
  INSERT INTO reservations (
    guest_name, guest_phone, guest_email,
    party_size, reservation_date, reservation_time,
    special_requests, status
  ) VALUES (
    p_guest_name, p_guest_phone, p_guest_email,
    p_party_size, p_date, p_time,
    p_special_requests, v_initial_status
  )
  RETURNING id INTO v_reservation_id;

  -- 9. Log initial status in audit history.
  INSERT INTO reservation_status_history (
    reservation_id, old_status, new_status, reason
  ) VALUES (
    v_reservation_id, NULL, v_initial_status,
    'Rezervasyon misafir tarafından oluşturuldu'
  );

  RETURN v_reservation_id;
END;
$$;


-- =============================================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via management API)
-- =============================================================================
-- These are documented here for reference. Supabase storage buckets are
-- typically created via the dashboard or the Storage API, not via SQL.
--
-- Bucket: menu-images   (public)
-- Bucket: gallery       (public)
-- Bucket: campaigns     (public)
