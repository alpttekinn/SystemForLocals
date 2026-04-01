# Yeşilçam Çekmeköy — Project Plan v2

---

## 1. Product Requirements Document (PRD)

### 1.1 Overview

**Product:** Premium marketing website + reservation system for Yeşilçam Çekmeköy
**Type:** Cafe & Restaurant (Yeşilçam cinema nostalgia concept)
**Location:** Serencebey Caddesi No 52/D, Çekmeköy, İstanbul 34776
**Hours:** 10:00 – 00:00
**Phone:** 0216 519 52 21
**Instagram:** @yesilcamcekmekoy (~4,650 followers)

### 1.2 Problem Statement

Yeşilçam Çekmeköy has no web presence beyond Instagram. Discovery is limited to social media and word-of-mouth. Reservations happen only via phone, creating friction and lost bookings. There is no way to manage campaigns, menus, or group/event inquiries centrally. The brand appears less premium than competitors with proper websites.

### 1.3 Business Goals

| # | Goal | Success Metric |
|---|------|---------------|
| 1 | Increase reservations | +30% reservation volume within 3 months |
| 2 | Showcase atmosphere & food | Average session duration > 2 min |
| 3 | Improve local SEO | Top 5 Google results for "çekmeköy cafe restoran" |
| 4 | Premium brand perception | Bounce rate < 40% |
| 5 | Admin self-service | Staff manages all content without developer |
| 6 | Capture group/event demand | Dedicated inquiry funnel for large bookings |
| 7 | Vercel deployment | Live on Vercel, custom domain ready |

### 1.4 Target Users

| Persona | Description |
|---------|-------------|
| **Guest** | Local residents, couples, families in Çekmeköy. Age 25–55. Mobile-first. |
| **Event Planner** | People looking for private dining, birthdays, corporate events. Needs a dedicated inquiry path. |
| **Admin** | Restaurant owner/manager. Manages reservations, menu, campaigns, gallery, settings. |

### 1.5 Core Features

#### Public Website
- **Homepage** — Cinematic hero, featured menu, atmosphere gallery strip, CTA to reserve, location/hours, social proof
- **Menu** — Categorized menu with images (alt text managed), descriptions, prices
- **Gallery** — Photo gallery with lightbox, admin-managed captions and alt text
- **About** — Brand story, Yeşilçam nostalgia concept, team
- **Campaigns** — Active promotions grid + individual detail pages by slug
- **Contact** — Map embed, phone, address, contact form, social links
- **FAQ** — Frequently asked questions (admin-managed, SEO-rich)
- **Reservation** — Online booking with date/time/party-size selection, capacity-aware
- **Event Inquiry** — Dedicated form for group bookings and private events (party size > threshold or custom request)

#### Reservation System
- Date + time slot selection (slots generated from business_hours + reservation_rules)
- Party size input (min 1, max from reservation_rules)
- **Concurrency-safe booking:** server-side atomic capacity check via PostgreSQL advisory lock or SELECT FOR UPDATE — prevents overbooking under concurrent requests
- Capacity per slot; when full, slot hidden; when partially full, shows remaining
- **Blocked slots:** admin can block full days (holidays) or specific time ranges per date
- **Capacity overrides:** admin can increase/decrease capacity for specific date/time combos (e.g., private event day)
- Guest info: name, phone, email, special requests
- Confirmation screen + email with unique cancel link
- Optional SMS notification via provider abstraction
- **Reservation status history:** every status change logged with timestamp, actor, and reason

#### Event / Group Inquiry
- Separate public form for party size above threshold (e.g., 8+) or private events
- Fields: name, phone, email, preferred date(s), estimated guest count, event type, message
- Admin receives email alert; manages inquiries in dashboard
- Status flow: new → contacted → confirmed → completed / declined

#### Admin Dashboard
- Supabase Auth login (email/password)
- **Reservations:** calendar + list view, filter by date/status, confirm/reject/cancel, admin notes, full status history
- **Event Inquiries:** list view with status management
- **Menu:** CRUD categories and items (name, desc, price, image with alt text, visibility, featured toggle)
- **Gallery:** upload images with caption + alt text, reorder via drag-and-drop, mark cover image, delete. Images optimized on upload.
- **Campaigns:** CRUD with title, slug, description (rich text), image (alt text), date range, active toggle. Each campaign gets a public detail page at `/campaigns/[slug]`.
- **FAQ:** CRUD question/answer pairs, reorderable
- **Settings:** split into 4 areas:
  - General settings (name, phone, email, address, social links, maps URL)
  - Business hours (per day-of-week open/close, optional break periods)
  - Special dates (closures, modified hours per specific date)
  - Reservation rules (slot duration, default capacity, max party size, lead time, max days ahead)
- **Blocked Slots:** manage full-day or time-range blocks, capacity overrides
- **Notification Logs:** view email/SMS delivery history per reservation
- **Media:** all uploaded images stored with caption, alt text, sort_order; cover image selectable per gallery/campaign

### 1.6 Non-Functional Requirements

- **Performance:** Lighthouse ≥ 90 all metrics
- **SEO:** Semantic HTML, JSON-LD structured data (Restaurant, LocalBusiness, FAQPage), sitemap.xml, robots.txt, OG/Twitter meta, campaign detail pages indexable
- **Accessibility:** WCAG 2.1 AA
- **Responsive:** Mobile-first, 375px–1440px+
- **Security:** Input sanitization, rate limiting on public APIs, RLS on all Supabase tables, advisory locks for booking concurrency
- **Observability:** Notification logs for debugging delivery issues; reservation status audit trail

### 1.7 Out of Scope (v1)

- Online payment / ordering
- Loyalty program
- Multi-language (English) — v2
- Table-specific reservation (just time-slot + capacity)
- POS integration
- Mobile app

---

## 2. Sitemap / Information Architecture

```
/                                → Homepage
├── /menu                        → Full menu (categorized)
├── /gallery                     → Photo gallery
├── /about                       → Brand story
├── /campaigns                   → Active campaigns grid
│   └── /campaigns/[slug]        → Campaign detail page
├── /faq                         → Frequently asked questions
├── /contact                     → Contact info, map, form
├── /reservation                 → Online reservation flow
│   └── /reservation/confirm     → Confirmation page
├── /reservation/cancel/[token]  → Cancel via unique token
├── /events                      → Event / group inquiry form
│
├── /admin                       → Admin dashboard (protected)
│   ├── /admin/reservations      → Manage reservations
│   ├── /admin/events            → Manage event inquiries
│   ├── /admin/menu              → Manage menu
│   ├── /admin/gallery           → Manage gallery
│   ├── /admin/campaigns         → Manage campaigns
│   ├── /admin/faq               → Manage FAQ
│   ├── /admin/settings          → General settings
│   ├── /admin/hours             → Business hours + special dates
│   ├── /admin/blocked-slots     → Blocked slots + capacity overrides
│   └── /admin/notifications     → Notification delivery logs
│
├── /api/
│   ├── /api/reservations              → POST create (atomic), GET list (admin)
│   ├── /api/reservations/[id]         → PATCH status, DELETE
│   ├── /api/reservations/availability → GET available slots for date
│   ├── /api/reservations/cancel/[token] → POST cancel by token
│   ├── /api/events                    → POST create inquiry, GET list (admin)
│   ├── /api/events/[id]               → PATCH status
│   ├── /api/menu                      → CRUD (admin)
│   ├── /api/gallery                   → CRUD (admin)
│   ├── /api/campaigns                 → CRUD (admin)
│   ├── /api/faq                       → CRUD (admin)
│   ├── /api/contact                   → POST contact form
│   ├── /api/settings                  → GET/PUT
│   ├── /api/hours                     → GET/PUT business hours + special dates
│   ├── /api/blocked-slots             → CRUD (admin)
│   └── /api/upload                    → POST image upload + optimization
│
├── sitemap.xml
├── robots.txt
└── manifest.json
```

### Navigation

**Public nav:** Anasayfa | Menü | Galeri | Hakkımızda | Kampanyalar | SSS | İletişim | **Rezervasyon (CTA)**

**Public footer:** adds Özel Etkinlikler (Events) link

**Admin sidebar:** Rezervasyonlar | Etkinlik Talepleri | Menü | Galeri | Kampanyalar | SSS | Çalışma Saatleri | Bloklu Slotlar | Bildirim Logları | Ayarlar | Çıkış

---

## 3. Database Schema (Supabase / PostgreSQL)

```sql
-- =============================================
-- PROFILES (extends Supabase Auth)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SETTINGS (general restaurant info)
-- =============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT DEFAULT 'Yeşilçam Çekmeköy',
  phone TEXT DEFAULT '0216 519 52 21',
  email TEXT,
  address TEXT DEFAULT 'Serencebey Caddesi No 52/D, Çekmeköy, İstanbul 34776',
  maps_embed_url TEXT,
  instagram_url TEXT DEFAULT 'https://instagram.com/yesilcamcekmekoy',
  facebook_url TEXT,
  twitter_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUSINESS HOURS (per day-of-week)
-- =============================================
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Mon, 6=Sun
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME NOT NULL DEFAULT '10:00',
  close_time TIME NOT NULL DEFAULT '00:00',
  break_start TIME,            -- optional mid-day break
  break_end TIME,
  UNIQUE(day_of_week)
);

-- =============================================
-- SPECIAL DATES (closures / modified hours)
-- =============================================
CREATE TABLE special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN DEFAULT FALSE,           -- full-day closure
  open_time TIME,                            -- override hours (NULL = use default)
  close_time TIME,
  reason TEXT,                               -- e.g. "Bayram tatili"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESERVATION RULES
-- =============================================
CREATE TABLE reservation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_duration_minutes INT DEFAULT 60,
  default_slot_capacity INT DEFAULT 20,      -- max total guests per slot
  max_party_size INT DEFAULT 12,
  min_party_size INT DEFAULT 1,
  group_inquiry_threshold INT DEFAULT 8,     -- party size >= this → redirect to event inquiry
  lead_time_hours INT DEFAULT 2,             -- must book at least 2h ahead
  max_days_ahead INT DEFAULT 30,             -- can book up to 30 days in advance
  auto_confirm BOOLEAN DEFAULT FALSE,        -- auto-confirm or require admin approval
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BLOCKED SLOTS (closures + capacity overrides)
-- =============================================
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  block_type TEXT NOT NULL
    CHECK (block_type IN ('full_day', 'time_range', 'capacity_override')),
  start_time TIME,                           -- NULL for full_day
  end_time TIME,                             -- NULL for full_day
  override_capacity INT,                     -- only for capacity_override
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);

-- =============================================
-- MENU CATEGORIES
-- =============================================
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MENU ITEMS
-- =============================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  image_alt TEXT,                             -- managed alt text
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GALLERY ITEMS
-- =============================================
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,                        -- optimized thumbnail
  caption TEXT,
  alt_text TEXT NOT NULL DEFAULT '',          -- SEO alt text
  is_cover BOOLEAN DEFAULT FALSE,            -- cover/featured image
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGNS
-- =============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,                 -- for /campaigns/[slug]
  description TEXT,                          -- short summary for grid
  content TEXT,                              -- rich detail for campaign page
  image_url TEXT,
  image_alt TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAQ
-- =============================================
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESERVATIONS
-- =============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_reservations_lookup
  ON reservations(reservation_date, reservation_time, status);

-- =============================================
-- RESERVATION STATUS HISTORY (audit trail)
-- =============================================
CREATE TABLE reservation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),   -- NULL = system/guest action
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_res_history_reservation
  ON reservation_status_history(reservation_id);

-- =============================================
-- EVENT INQUIRIES (group/private bookings)
-- =============================================
CREATE TABLE event_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- =============================================
-- NOTIFICATION LOGS
-- =============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  event_inquiry_id UUID REFERENCES event_inquiries(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient TEXT NOT NULL,                   -- email address or phone number
  template TEXT NOT NULL,                    -- e.g. 'reservation_confirmed'
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','bounced')),
  provider TEXT,                             -- 'resend', 'netgsm', 'twilio', etc.
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_reservation
  ON notification_logs(reservation_id);

-- =============================================
-- CONTACT SUBMISSIONS
-- =============================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATOMIC BOOKING FUNCTION
-- Prevents overbooking via advisory lock + capacity check
-- =============================================
CREATE OR REPLACE FUNCTION create_reservation(
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
BEGIN
  -- Generate a deterministic lock key from date + time
  v_lock_key := hashtext(p_date::TEXT || p_time::TEXT);

  -- Acquire advisory lock (blocks concurrent inserts for same slot)
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check if slot is blocked (full_day or matching time_range)
  SELECT EXISTS (
    SELECT 1 FROM blocked_slots
    WHERE date = p_date
      AND (
        block_type = 'full_day'
        OR (block_type = 'time_range' AND p_time >= start_time AND p_time < end_time)
      )
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'SLOT_BLOCKED: This time slot is not available.';
  END IF;

  -- Get default capacity from reservation_rules
  SELECT default_slot_capacity INTO v_slot_capacity
  FROM reservation_rules LIMIT 1;

  IF v_slot_capacity IS NULL THEN
    v_slot_capacity := 20; -- fallback
  END IF;

  -- Check for capacity override on this date/time
  SELECT override_capacity INTO v_override_capacity
  FROM blocked_slots
  WHERE date = p_date
    AND block_type = 'capacity_override'
    AND p_time >= start_time
    AND p_time < end_time
  LIMIT 1;

  v_effective_capacity := COALESCE(v_override_capacity, v_slot_capacity);

  -- Calculate current occupancy
  SELECT COALESCE(SUM(party_size), 0) INTO v_current_occupancy
  FROM reservations
  WHERE reservation_date = p_date
    AND reservation_time = p_time
    AND status IN ('pending', 'confirmed');

  -- Check capacity
  IF (v_current_occupancy + p_party_size) > v_effective_capacity THEN
    RAISE EXCEPTION 'SLOT_FULL: Not enough capacity for this party size.';
  END IF;

  -- Insert reservation
  INSERT INTO reservations (
    guest_name, guest_phone, guest_email,
    party_size, reservation_date, reservation_time,
    special_requests, status
  ) VALUES (
    p_guest_name, p_guest_phone, p_guest_email,
    p_party_size, p_date, p_time,
    p_special_requests, 'pending'
  )
  RETURNING id INTO v_reservation_id;

  -- Log initial status
  INSERT INTO reservation_status_history (
    reservation_id, old_status, new_status, reason
  ) VALUES (
    v_reservation_id, NULL, 'pending', 'Reservation created by guest'
  );

  RETURN v_reservation_id;
END;
$$;
```

### 3.2 Row Level Security (RLS)

| Table | Public Read | Public Write | Admin Read | Admin Write |
|-------|------------|-------------|------------|-------------|
| profiles | — | — | ✓ (own) | ✓ (super_admin) |
| settings | ✓ | — | ✓ | ✓ |
| business_hours | ✓ | — | ✓ | ✓ |
| special_dates | ✓ | — | ✓ | ✓ |
| reservation_rules | ✓ | — | ✓ | ✓ |
| blocked_slots | ✓ (date check) | — | ✓ | ✓ |
| menu_categories | ✓ (visible) | — | ✓ | ✓ |
| menu_items | ✓ (visible) | — | ✓ | ✓ |
| gallery_items | ✓ (visible) | — | ✓ | ✓ |
| campaigns | ✓ (active+date) | — | ✓ | ✓ |
| faq_items | ✓ (visible) | — | ✓ | ✓ |
| reservations | — | via RPC only | ✓ | ✓ |
| reservation_status_history | — | — | ✓ | ✓ (insert) |
| event_inquiries | — | INSERT only | ✓ | ✓ |
| notification_logs | — | — | ✓ | ✓ (insert) |
| contact_submissions | — | INSERT only | ✓ | ✓ |

### 3.3 Supabase Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `menu-images` | Menu item photos | Yes |
| `gallery` | Gallery photos + thumbnails | Yes |
| `campaigns` | Campaign banners | Yes |

---

## 4. Admin Roles & Reservation Flow

### 4.1 Admin Roles

| Role | Permissions |
|------|------------|
| **super_admin** | Full access: all content, settings, business hours, rules, blocked slots, other admins |
| **admin** | Manage reservations, event inquiries, menu, gallery, campaigns, FAQ. Cannot manage other admins or reservation_rules. |

### 4.2 Reservation Flow (Guest)

```
┌─────────────┐     ┌────────────────────────┐     ┌──────────────────┐
│ Select Date  │────▶│ Fetch available slots   │────▶│ Select time slot │
│              │     │ (respects business_hours│     │ + party size     │
│              │     │  special_dates, blocked │     │                  │
│              │     │  slots, capacity)       │     │ If party_size >= │
│              │     └────────────────────────┘     │ threshold → route│
│              │                                    │ to /events       │
└─────────────┘                                    └──────────────────┘
                                                          │
                                                          ▼
                    ┌────────────────────────┐     ┌──────────────────┐
                    │ Confirmation screen    │◀────│ Fill contact info│
                    │ + email with cancel    │     │ + submit         │
                    │   link sent            │     │                  │
                    │                        │     │ Atomic RPC call: │
                    │ Status history entry:  │     │ create_reservation│
                    │ → pending              │     │ (advisory lock)  │
                    └────────────────────────┘     └──────────────────┘
                            │
                            ▼
                    ┌────────────────────────┐
                    │ Guest can cancel       │
                    │ via unique link        │
                    │ → status: cancelled    │
                    │ → history entry logged │
                    │ → notification logged  │
                    └────────────────────────┘
```

### 4.3 Reservation Flow (Admin)

```
┌──────────────────┐     ┌──────────────────────────────────┐
│ View reservations│────▶│ Filter by date / status           │
│ (calendar + list)│     │ See occupancy per slot            │
└──────────────────┘     └──────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ Per reservation:                                            │
│  • Confirm   → email to guest, history logged, notif logged │
│  • Reject    → email with reason, history + notif logged    │
│  • Cancel    → email, history + notif logged                │
│  • Complete  → history logged                               │
│  • No-show   → history logged                               │
│  • Add notes                                                │
└────────────────────────────────────────────────────────────┘
```

### 4.4 Event Inquiry Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Guest fills form │────▶│ Admin gets email  │────▶│ Admin manages in │
│ at /events       │     │ alert             │     │ dashboard        │
│                  │     │ notif logged      │     │                  │
│ Fields:          │     └──────────────────┘     │ Status flow:     │
│ - name, phone    │                               │ new → contacted  │
│ - email          │                               │ → confirmed      │
│ - event type     │                               │ → completed /    │
│ - est. guests    │                               │   declined       │
│ - preferred dates│                               └──────────────────┘
│ - message        │
└──────────────────┘
```

### 4.5 Availability Calculation (concurrency-safe)

```
For GET /api/reservations/availability?date=YYYY-MM-DD:

1. Load business_hours for that day-of-week
2. Check special_dates → if is_closed=true → return empty
3. If special_dates has override hours → use those instead
4. Generate time slots from open_time to close_time per slot_duration_minutes
5. For each slot:
   a. Check blocked_slots → if full_day or matching time_range → skip
   b. Check capacity_override → use override_capacity if exists, else default
   c. SELECT COALESCE(SUM(party_size),0) FROM reservations
      WHERE date=X AND time=Y AND status IN ('pending','confirmed')
   d. remaining = effective_capacity - current_occupancy
   e. Return slot with remaining capacity (hide if remaining <= 0)

For POST /api/reservations (booking):
→ Calls create_reservation() Postgres function
→ Advisory lock on (date, time) prevents race conditions
→ Atomic check + insert in single transaction
→ Returns reservation ID or error (SLOT_BLOCKED / SLOT_FULL)
```

### 4.6 Notification Flow

```
Event                    │ Email to Guest     │ Email to Admin   │ SMS (opt) │ Logged
─────────────────────────┼────────────────────┼──────────────────┼───────────┼────────
Reservation created      │ ✓ Confirmation     │ ✓ New alert      │ ✓ Guest  │ ✓
Reservation confirmed    │ ✓ Confirmed notice │ —                │ ✓ Guest  │ ✓
Reservation rejected     │ ✓ With reason      │ —                │ —        │ ✓
Reservation cancelled    │ ✓ Cancellation     │ ✓ Alert          │ —        │ ✓
Reminder (day before)    │ ✓ Reminder         │ —                │ ✓ Guest  │ ✓
Event inquiry created    │ ✓ Acknowledgement  │ ✓ New alert      │ —        │ ✓
Contact form submitted   │ — (or auto-reply)  │ ✓ Alert          │ —        │ ✓
```

**SMS Provider Abstraction:**
```typescript
interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
// Implementations: TwilioProvider, NetgsmProvider, MockProvider
// SMS_PROVIDER env var selects active provider
```

**All notifications logged to `notification_logs`** with channel, recipient, template, status, provider info.

---

## 5. Visual Design System

### 5.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `forest-950` | `#1a2e1a` | Darkest green — text on light, overlays |
| `forest-900` | `#264d26` | Primary dark — nav, footer |
| `forest-800` | `#2d5f2d` | Primary — buttons, headings |
| `forest-700` | `#357a35` | Hover states |
| `forest-600` | `#3d8b3d` | Accents |
| `forest-100` | `#e8f5e8` | Light tint — backgrounds |
| `forest-50` | `#f2faf2` | Lightest — cards |
| `burgundy-900` | `#4a1525` | Deep — accents, icons |
| `burgundy-700` | `#6b1d34` | Secondary buttons, links |
| `burgundy-500` | `#8b2545` | Hover, highlights |
| `cream-100` | `#faf6f0` | Page backgrounds |
| `cream-200` | `#f0e8d8` | Cards, section dividers |
| `cream-50` | `#fdfbf7` | Base background |
| `gold-600` | `#b8960c` | Stars, premium accents |
| `gold-400` | `#d4b44a` | Decorative highlights |
| `charcoal-900` | `#1a1a1a` | Body text |
| `charcoal-600` | `#4a4a4a` | Secondary text |
| `charcoal-400` | `#7a7a7a` | Muted text |

### 5.2 Typography

| Element | Font | Weight | Size (mobile → desktop) |
|---------|------|--------|------------------------|
| Display heading | **Playfair Display** | 700 | 2.5rem → 4rem |
| Section heading | **Playfair Display** | 600 | 1.75rem → 2.5rem |
| Sub-heading | **Inter** | 600 | 1.25rem → 1.5rem |
| Body | **Inter** | 400 | 1rem |
| Small / Caption | **Inter** | 400 | 0.875rem |
| Nav links | **Inter** | 500 | 0.9rem |
| Button text | **Inter** | 600 | 0.875rem – 1rem |

### 5.3 Spacing & Layout

- Grid: 12-column, max-width 1280px, centered
- Section padding: 80px (desktop) / 48px (mobile) vertical
- Card border-radius: 12px
- Button border-radius: 8px
- Shadows: warm-toned `0 4px 24px rgba(26,46,26,0.08)`

### 5.4 Component Patterns

| Component | Style |
|-----------|-------|
| Primary Button | `forest-800` bg, cream text, hover → `forest-700` |
| Secondary Button | Transparent, `forest-800` border, hover → filled |
| CTA Button | `burgundy-700` bg, cream text, subtle gold bottom border |
| Cards | `cream-50` bg, subtle shadow, 12px radius, hover lift |
| Section Dividers | Film-strip SVG or thin gold line |
| Nav | Semi-transparent `forest-900`, blur backdrop, sticky |
| Footer | `forest-950` bg, cream text, grid layout |

### 5.5 Yeşilçam Nostalgia Motifs (Subtle)

- Film-strip SVG borders as section dividers (sparingly)
- Three-star motif from logo as decorative elements
- Very subtle film grain overlay on hero images (3-5% opacity CSS noise)
- Vignette on hero/gallery images (cinematic framing)
- Serif headings evoke vintage cinema poster type
- Warm color temperature on food/venue images (CSS filter)

### 5.6 Animations

- Page transitions: subtle fade-in
- Scroll: fade-up with stagger (Intersection Observer)
- Hover: cards lift 4px, buttons darken, images zoom 1.05
- Loading: skeleton screens
- Hero: Ken Burns subtle zoom

---

## 6. Phased Implementation Plan

### Phase 1 — Foundation (Days 1–2)
- [ ] Next.js 15 + TypeScript + Tailwind + App Router scaffold
- [ ] Folder structure setup
- [ ] Tailwind config: custom colors, fonts, spacing tokens
- [ ] Supabase project + env vars
- [ ] Full database migration: all 16 tables + indexes + RPC function
- [ ] RLS policies for all tables
- [ ] Storage buckets (menu-images, gallery, campaigns)
- [ ] Shared UI components: Button, Card, Input, Select, Modal, Skeleton, Toast
- [ ] Layout components: Header, Footer, Container, Section
- [ ] Seed data: default settings, business_hours (7 days), reservation_rules

### Phase 2 — Public Pages (Days 3–5)
- [ ] Homepage: hero, featured menu, atmosphere strip, CTA, location band
- [ ] Menu page: categories + items from Supabase
- [ ] Gallery page: grid + lightbox (images with alt text)
- [ ] About page: brand story, nostalgia narrative
- [ ] Campaigns page: grid view of active campaigns
- [ ] Campaign detail page: `/campaigns/[slug]`
- [ ] FAQ page: accordion with structured data (FAQPage schema)
- [ ] Contact page: map, info, form → API → Supabase
- [ ] Event inquiry page: `/events` with dedicated form
- [ ] SEO: metadata, JSON-LD (Restaurant, LocalBusiness, FAQPage), sitemap.xml, robots.txt, OG meta

### Phase 3 — Reservation System (Days 6–8)
- [ ] Availability API: slot generation from business_hours + special_dates + blocked_slots + capacity
- [ ] Reservation API: atomic booking via `create_reservation()` RPC
- [ ] Cancel API: cancel by token
- [ ] Reservation page: date picker → slot grid → form → confirmation
- [ ] Event inquiry API: create + list + status update
- [ ] Email integration (Resend): confirmation, cancellation, admin alerts, event inquiry acknowledgement
- [ ] Email templates (React Email or inline)
- [ ] SMS provider abstraction (interface + mock)
- [ ] Notification logging: all sends logged to notification_logs
- [ ] Status history: every status change logged to reservation_status_history
- [ ] Rate limiting on public reservation + event + contact endpoints

### Phase 4 — Admin Dashboard (Days 9–13)
- [ ] Supabase Auth + admin login page
- [ ] Admin layout: sidebar nav, protected via middleware
- [ ] Reservations: calendar + list view, status management, notes, history timeline view
- [ ] Event inquiries: list with status flow management
- [ ] Menu CRUD: categories + items with image upload (alt text field)
- [ ] Gallery CRUD: upload with caption + alt text, drag-and-drop reorder, cover image toggle, thumbnail generation
- [ ] Campaigns CRUD: title, slug, rich description, image (alt text), date range, active toggle
- [ ] FAQ CRUD: question/answer pairs, drag-and-drop reorder
- [ ] Settings: general info edit form
- [ ] Business hours: per-day editor with break support
- [ ] Special dates: manage closures + modified hours
- [ ] Blocked slots: create/manage full-day blocks, time-range blocks, capacity overrides
- [ ] Notification logs: filterable list view per reservation
- [ ] Image upload API: optimize + store original + thumbnail

### Phase 5 — Polish & Deploy (Days 14–15)
- [ ] Responsive testing: 375px – 1440px+
- [ ] Lighthouse audit + optimization (images via next/image, font subsetting, bundle analysis)
- [ ] Error handling: 404, 500, form errors, toast notifications
- [ ] Loading states: skeletons, spinners for all async operations
- [ ] Scroll animations + micro-interactions
- [ ] Favicon, Apple touch icon, manifest.json
- [ ] Vercel deployment config + env vars
- [ ] Final QA pass

---

## Folder Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── menu/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── about/page.tsx
│   │   ├── campaigns/
│   │   │   ├── page.tsx                # Campaign grid
│   │   │   └── [slug]/page.tsx         # Campaign detail
│   │   ├── faq/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── events/page.tsx             # Event/group inquiry form
│   │   ├── reservation/
│   │   │   ├── page.tsx
│   │   │   ├── confirm/page.tsx
│   │   │   └── cancel/[token]/page.tsx
│   │   └── layout.tsx                  # Public layout (nav + footer)
│   │
│   ├── admin/
│   │   ├── page.tsx                    # Dashboard overview
│   │   ├── login/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── events/page.tsx
│   │   ├── menu/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── hours/page.tsx
│   │   ├── blocked-slots/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── layout.tsx                  # Admin layout (sidebar)
│   │
│   ├── api/
│   │   ├── reservations/
│   │   │   ├── route.ts                # POST create, GET list
│   │   │   ├── [id]/route.ts           # PATCH, DELETE
│   │   │   ├── availability/route.ts   # GET slots
│   │   │   └── cancel/[token]/route.ts # POST cancel
│   │   ├── events/
│   │   │   ├── route.ts                # POST create, GET list
│   │   │   └── [id]/route.ts           # PATCH status
│   │   ├── menu/route.ts
│   │   ├── gallery/route.ts
│   │   ├── campaigns/route.ts
│   │   ├── faq/route.ts
│   │   ├── contact/route.ts
│   │   ├── settings/route.ts
│   │   ├── hours/route.ts
│   │   ├── blocked-slots/route.ts
│   │   └── upload/route.ts             # Image upload + optimization
│   │
│   ├── layout.tsx
│   ├── globals.css
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── ui/                             # Design system primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── modal.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   ├── accordion.tsx               # FAQ
│   │   ├── badge.tsx
│   │   ├── date-picker.tsx
│   │   └── drag-handle.tsx
│   │
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── container.tsx
│   │
│   ├── sections/                       # Page sections
│   │   ├── hero.tsx
│   │   ├── featured-menu.tsx
│   │   ├── atmosphere.tsx
│   │   ├── location-band.tsx
│   │   └── cta-banner.tsx
│   │
│   └── reservation/
│       ├── date-picker.tsx
│       ├── time-slot-grid.tsx
│       ├── reservation-form.tsx
│       └── confirmation.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client (RSC)
│   │   └── admin.ts                    # Service role client
│   │
│   ├── notifications/
│   │   ├── email.ts
│   │   ├── sms/
│   │   │   ├── interface.ts
│   │   │   ├── twilio.ts
│   │   │   ├── netgsm.ts
│   │   │   ├── mock.ts
│   │   │   └── index.ts               # Factory
│   │   ├── logger.ts                   # Logs to notification_logs table
│   │   └── templates/
│   │
│   ├── images/
│   │   └── optimize.ts                 # Image optimization on upload
│   │
│   ├── utils.ts
│   ├── constants.ts
│   └── validations.ts                  # Zod schemas
│
├── types/
│   └── index.ts
│
└── hooks/
    ├── use-reservations.ts
    └── use-toast.ts
```

---

**Awaiting approval to begin implementation.**
