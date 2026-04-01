-- =============================================================================
-- CafePanel SaaS — Seed Data
--
-- Creates a demo tenant (Yeşilçam Çekmeköy) with full configuration,
-- realistic content, and operational defaults.
--
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING / fixed UUIDs).
-- =============================================================================

-- Use a fixed UUID for the demo tenant so seed is idempotent
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- =========================
-- 1. TENANT
-- =========================
INSERT INTO tenants (id, slug, name, status, plan)
VALUES (
  v_tenant_id,
  'yesilcam-cekmekoy',
  'Yeşilçam Çekmeköy',
  'active',
  'pro'
)
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- 2. TENANT DOMAIN
-- =========================
INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified)
VALUES (v_tenant_id, 'yesilcam-cekmekoy.localhost', TRUE, TRUE)
ON CONFLICT (domain) DO NOTHING;

-- =========================
-- 3. BRANDING
-- =========================
INSERT INTO tenant_branding (
  tenant_id, theme_preset, font_preset, button_style,
  tagline, short_description,
  hero_title, hero_subtitle, hero_cta_text, footer_text
) VALUES (
  v_tenant_id,
  'forest',
  'classic',
  'rounded',
  'Yeşilçam Nostaljisi Çekmeköy''de',
  'Çekmeköy''ün kalbinde, Yeşilçam nostaljisiyle harmanlanan sıcak bir kafe ve restoran deneyimi.',
  'Yeşilçam Nostaljisi Çekmeköy''de',
  'Sıcak bir atmosferde, unutulmaz lezzetler ve sinema nostaljisiyle dolu anlar sizi bekliyor.',
  'Rezervasyon Yap',
  '© Yeşilçam Çekmeköy. Tüm hakları saklıdır.'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================
-- 4. CONTACT
-- =========================
INSERT INTO tenant_contact (
  tenant_id, phone, whatsapp, email,
  address, city, district, postal_code, country,
  maps_embed_url, instagram_url
) VALUES (
  v_tenant_id,
  '0216 519 52 21',
  '+905001234567',
  'info@yesilcamcekmekoy.com',
  'Serencebey Caddesi No 52/D',
  'İstanbul',
  'Çekmeköy',
  '34776',
  'TR',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.0!2d29.37!3d41.05',
  'https://instagram.com/yesilcamcekmekoy'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================
-- 5. SEO
-- =========================
INSERT INTO tenant_seo (
  tenant_id, meta_title_template, meta_description,
  business_type, serves_cuisine, price_range
) VALUES (
  v_tenant_id,
  '{page} | Yeşilçam Çekmeköy',
  'Çekmeköy''ün kalbinde, Yeşilçam nostaljisiyle harmanlanan sıcak bir kafe ve restoran deneyimi. Özenle hazırlanan lezzetler, sinematik atmosfer.',
  'Restaurant',
  ARRAY['Turkish', 'Cafe', 'Pizza', 'Breakfast'],
  '$$'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================
-- 6. FEATURES
-- =========================
INSERT INTO tenant_features (
  tenant_id,
  reservations_enabled, events_enabled, gallery_enabled,
  campaigns_enabled, faq_enabled, testimonials_enabled,
  contact_form_enabled, sms_enabled, email_notifications_enabled
) VALUES (
  v_tenant_id,
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================
-- 7. RESERVATION RULES
-- =========================
INSERT INTO reservation_rules (
  tenant_id, slot_duration_minutes, default_slot_capacity,
  max_party_size, min_party_size, group_inquiry_threshold,
  lead_time_hours, max_days_ahead, auto_confirm
) VALUES (
  v_tenant_id,
  60,     -- 1-hour slots
  20,     -- 20 guests per slot
  12,     -- max 12 per reservation
  1,      -- min 1 guest
  8,      -- 8+ → event inquiry
  2,      -- book 2h ahead minimum
  30,     -- up to 30 days ahead
  FALSE   -- require admin confirmation
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =========================
-- 8. BUSINESS HOURS (0=Mon, 6=Sun)
-- =========================
INSERT INTO business_hours (tenant_id, day_of_week, is_open, open_time, close_time) VALUES
  (v_tenant_id, 0, TRUE, '10:00', '00:00'),  -- Pazartesi
  (v_tenant_id, 1, TRUE, '10:00', '00:00'),  -- Salı
  (v_tenant_id, 2, TRUE, '10:00', '00:00'),  -- Çarşamba
  (v_tenant_id, 3, TRUE, '10:00', '00:00'),  -- Perşembe
  (v_tenant_id, 4, TRUE, '10:00', '00:00'),  -- Cuma
  (v_tenant_id, 5, TRUE, '10:00', '00:00'),  -- Cumartesi
  (v_tenant_id, 6, TRUE, '10:00', '00:00')   -- Pazar
ON CONFLICT (tenant_id, day_of_week) DO NOTHING;

-- =========================
-- 9. MENU CATEGORIES
-- =========================
INSERT INTO menu_categories (tenant_id, name, slug, sort_order, is_visible) VALUES
  (v_tenant_id, 'Soğuk İçecekler', 'soguk-icecekler',  1, TRUE),
  (v_tenant_id, 'Kahveler',         'kahveler',          2, TRUE),
  (v_tenant_id, 'Salatalar',        'salatalar',         3, TRUE),
  (v_tenant_id, 'Pizzalar',         'pizzalar',          4, TRUE),
  (v_tenant_id, 'Sıcak İçecekler',  'sicak-icecekler',   5, TRUE),
  (v_tenant_id, 'Kahvaltı',         'kahvalti',          6, TRUE),
  (v_tenant_id, 'Tatlılar',         'tatlilar',          7, TRUE),
  (v_tenant_id, 'Ana Yemekler',     'ana-yemekler',      8, TRUE),
  (v_tenant_id, 'Başlangıçlar',     'baslangiclar',      9, TRUE)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- =========================
-- 10. FAQ ITEMS
-- =========================
INSERT INTO faq_items (tenant_id, question, answer, sort_order, is_visible) VALUES
  (
    v_tenant_id,
    'Rezervasyon nasıl yapabilirim?',
    'Web sitemiz üzerinden online rezervasyon yapabilir veya 0216 519 52 21 numaralı telefonumuzdan bizi arayarak rezervasyon oluşturabilirsiniz.',
    1, TRUE
  ),
  (
    v_tenant_id,
    'Çalışma saatleriniz nedir?',
    'Her gün 10:00 - 00:00 saatleri arasında hizmet vermekteyiz.',
    2, TRUE
  ),
  (
    v_tenant_id,
    'Özel etkinlikler için mekanınız uygun mu?',
    'Evet! Doğum günleri, kurumsal yemekler, nişan ve özel davetler için mekanımızı ayırtabilirsiniz. Etkinlik talebi formumuzu doldurarak bizimle iletişime geçebilirsiniz.',
    3, TRUE
  ),
  (
    v_tenant_id,
    'Otopark imkanınız var mı?',
    'Mekanımızın yakınında ücretsiz sokak parkı mevcuttur. Ayrıca yakın çevrede otopark alanları bulunmaktadır.',
    4, TRUE
  ),
  (
    v_tenant_id,
    'Menünüzde vejetaryen seçenekler var mı?',
    'Evet, menümüzde çeşitli vejetaryen salata, pizza ve kahvaltı seçenekleri bulunmaktadır.',
    5, TRUE
  );

-- =========================
-- 11. TESTIMONIALS
-- =========================
INSERT INTO testimonials (tenant_id, reviewer_name, rating, quote, source, is_featured, is_published, sort_order) VALUES
  (
    v_tenant_id,
    'Ayşe K.',
    5,
    'Harika bir atmosfer ve lezzetli yemekler. Sinema teması çok yaratıcı, kendimizi özel hissettik.',
    'Google',
    TRUE, TRUE, 1
  ),
  (
    v_tenant_id,
    'Mehmet Y.',
    5,
    'Kahvaltısı mükemmel, kahveleri harika. Çekmeköy''deki en sevdiğim mekan.',
    'Instagram',
    TRUE, TRUE, 2
  ),
  (
    v_tenant_id,
    'Selin D.',
    4,
    'Doğum günümüzü burada kutladık. Ekip çok ilgiliydi, dekorasyon muhteşemdi.',
    'Google',
    TRUE, TRUE, 3
  ),
  (
    v_tenant_id,
    'Emre B.',
    5,
    'Pizza ve soğuk içecekler çok başarılı. Her hafta sonu geliyoruz artık.',
    'TripAdvisor',
    FALSE, TRUE, 4
  );

END $$;

-- =============================================================================
-- SECOND DEMO TENANT: Mavi Deniz Cafe
-- (Proves multi-tenant isolation — different theme, different content)
-- =============================================================================
DO $$
DECLARE
  v2_tenant_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN

-- Tenant
INSERT INTO tenants (id, slug, name, status, plan)
VALUES (v2_tenant_id, 'mavi-deniz-cafe', 'Mavi Deniz Cafe', 'active', 'starter')
ON CONFLICT (slug) DO NOTHING;

-- Domain
INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified)
VALUES (v2_tenant_id, 'mavi-deniz-cafe.localhost', TRUE, TRUE)
ON CONFLICT (domain) DO NOTHING;

-- Branding
INSERT INTO tenant_branding (
  tenant_id, theme_preset, font_preset, button_style,
  tagline, short_description,
  hero_title, hero_subtitle, hero_cta_text, footer_text
) VALUES (
  v2_tenant_id,
  'ocean',
  'modern',
  'pill',
  'Denizin Mavisi, Lezzetin Doruğu',
  'Sahil kenarında taze deniz ürünleri ve Akdeniz mutfağının en seçkin lezzetleri.',
  'Denizin Kenarında Taze Lezzetler',
  'Akdeniz esintisi ve eşsiz deniz manzarasıyla unutulmaz yemek deneyimi.',
  'Masa Ayırt',
  '© Mavi Deniz Cafe. Tüm hakları saklıdır.'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Contact
INSERT INTO tenant_contact (
  tenant_id, phone, whatsapp, email,
  address, city, district, postal_code, country,
  instagram_url
) VALUES (
  v2_tenant_id,
  '0242 555 12 34',
  '+905009876543',
  'info@mavideniz.cafe',
  'Sahil Yolu Caddesi No 18',
  'Antalya',
  'Konyaaltı',
  '07070',
  'TR',
  'https://instagram.com/mavidenizcafe'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- SEO
INSERT INTO tenant_seo (
  tenant_id, meta_title_template, meta_description,
  business_type, serves_cuisine, price_range
) VALUES (
  v2_tenant_id,
  '{page} | Mavi Deniz Cafe',
  'Konyaaltı sahilinde taze deniz ürünleri ve Akdeniz mutfağı. Mavi Deniz Cafe''de eşsiz lezzetler.',
  'Restaurant',
  ARRAY['Seafood', 'Mediterranean', 'Turkish'],
  '$$$'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Features
INSERT INTO tenant_features (
  tenant_id,
  reservations_enabled, events_enabled, gallery_enabled,
  campaigns_enabled, faq_enabled, testimonials_enabled,
  contact_form_enabled, sms_enabled, email_notifications_enabled
) VALUES (
  v2_tenant_id,
  TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Reservation Rules
INSERT INTO reservation_rules (
  tenant_id, slot_duration_minutes, default_slot_capacity,
  max_party_size, min_party_size, group_inquiry_threshold,
  lead_time_hours, max_days_ahead, auto_confirm
) VALUES (
  v2_tenant_id, 90, 15, 10, 2, 6, 3, 14, TRUE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Business Hours (0=Mon, 6=Sun)
INSERT INTO business_hours (tenant_id, day_of_week, is_open, open_time, close_time) VALUES
  (v2_tenant_id, 0, FALSE, '11:00', '23:00'),  -- Pazartesi kapali
  (v2_tenant_id, 1, TRUE,  '11:00', '23:00'),
  (v2_tenant_id, 2, TRUE,  '11:00', '23:00'),
  (v2_tenant_id, 3, TRUE,  '11:00', '23:00'),
  (v2_tenant_id, 4, TRUE,  '11:00', '00:00'),   -- Cuma gece yarisina kadar
  (v2_tenant_id, 5, TRUE,  '10:00', '00:00'),   -- Cumartesi uzun
  (v2_tenant_id, 6, TRUE,  '10:00', '22:00')    -- Pazar erken
ON CONFLICT (tenant_id, day_of_week) DO NOTHING;

-- Menu Categories
INSERT INTO menu_categories (tenant_id, name, slug, sort_order, is_visible) VALUES
  (v2_tenant_id, 'Baliklar',      'baliklar',       1, TRUE),
  (v2_tenant_id, 'Mezeler',       'mezeler',        2, TRUE),
  (v2_tenant_id, 'Salatalar',     'salatalar',      3, TRUE),
  (v2_tenant_id, 'Icecekler',     'icecekler',      4, TRUE),
  (v2_tenant_id, 'Tatlilar',      'tatlilar',       5, TRUE)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- FAQ
INSERT INTO faq_items (tenant_id, question, answer, sort_order, is_visible) VALUES
  (v2_tenant_id, 'Rezervasyon şart mı?', 'Hafta sonları yoğunluk yaşanabildiğinden rezervasyon önerilir.', 1, TRUE),
  (v2_tenant_id, 'Deniz manzaralı masa talep edebilir miyim?', 'Evet, rezervasyon sırasında özel isteklerinizi belirtebilirsiniz.', 2, TRUE),
  (v2_tenant_id, 'Çocuklara özel menünüz var mı?', 'Evet, 12 yaş altı misafirlerimiz için özel çocuk menümüz mevcuttur.', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Testimonials
INSERT INTO testimonials (tenant_id, reviewer_name, rating, quote, source, is_featured, is_published, sort_order) VALUES
  (v2_tenant_id, 'Ali R.', 5, 'Deniz manzarasi ve taze balik bir arada. Muhtesem!', 'Google', TRUE, TRUE, 1),
  (v2_tenant_id, 'Zeynep M.', 4, 'Akdeniz mezelerini cok sevdik. Atmosfer harikaydı.', 'Instagram', TRUE, TRUE, 2),
  (v2_tenant_id, 'Can T.', 5, 'Antalya''da en iyi restoran deneyimlerinden biri.', 'TripAdvisor', FALSE, TRUE, 3)
ON CONFLICT DO NOTHING;

END $$;
