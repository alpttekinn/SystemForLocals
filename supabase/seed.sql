-- =============================================================================
-- CafePanel SaaS — Seed Data
--
-- Creates a demo tenant (Yeşilçam Çekmeköy) with full configuration,
-- realistic content, and operational defaults.
--
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING / fixed UUIDs).
-- =============================================================================

-- Use a fixed UUID for the demo tenant so seed is idempotent
DO $seed$
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
  'Çekmeköy''ün kalbinde, Yeşilçam sinemasının sıcaklığını yaşatan kafe ve restoran. Özenle hazırlanan lezzetler, sinematik atmosfer ve unutulmaz anlar.',
  'Yeşilçam Nostaljisi Çekmeköy''de',
  'Sıcak bir atmosferde, özenle hazırlanan lezzetler ve sinema nostaljisiyle dolu bir deneyim sizi bekliyor.',
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
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.271!2d29.3697!3d41.0493!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cacf8e3de87b1d%3A0x4357c6152e28cb10!2s%C3%87ekmek%C3%B6y%2C%20Istanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str',
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
  (v_tenant_id, 'Kahvaltı',         'kahvalti',          1, TRUE),
  (v_tenant_id, 'Başlangıçlar',     'baslangiclar',      2, TRUE),
  (v_tenant_id, 'Ana Yemekler',     'ana-yemekler',      3, TRUE),
  (v_tenant_id, 'Pizzalar',         'pizzalar',          4, TRUE),
  (v_tenant_id, 'Salatalar',        'salatalar',         5, TRUE),
  (v_tenant_id, 'Kahveler',         'kahveler',          6, TRUE),
  (v_tenant_id, 'Soğuk İçecekler',  'soguk-icecekler',   7, TRUE),
  (v_tenant_id, 'Sıcak İçecekler',  'sicak-icecekler',   8, TRUE),
  (v_tenant_id, 'Tatlılar',         'tatlilar',          9, TRUE)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- =========================
-- 9b. MENU ITEMS (Yeşilçam demo content)
-- =========================

-- Kahvaltı
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Serpme Kahvaltı', 'Zengin tabağıyla 2 kişilik geleneksel serpme kahvaltı. Taze peynirler, reçeller, bal-kaymak ve sınırsız çay.', 450, 1, TRUE),
  ('Yeşilçam Kahvaltı Tabağı', 'Sucuklu yumurta, beyaz peynir, domates, zeytin, tereyağı, bal ve taze ekmek.', 220, 2, FALSE),
  ('Menemen', 'Geleneksel tarifle hazırlanan domates, biber ve yumurta karışımı.', 140, 3, FALSE),
  ('Açma & Poğaça Tabağı', 'Günlük taze açma ve peynirli poğaça, tereyağı ve reçel eşliğinde.', 120, 4, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'kahvalti'
ON CONFLICT DO NOTHING;

-- Başlangıçlar
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Humus', 'Tahin, limon ve zeytinyağıyla servis edilen klasik humus.', 90, 1, FALSE),
  ('Sigara Böreği', 'Çıtır yufka içinde beyaz peynir. 4 adet.', 100, 2, FALSE),
  ('Çıtır Kalamar', 'Taze kalamar halkası, tartar sos eşliğinde.', 140, 3, TRUE),
  ('Mantar Sote', 'Tereyağında sote edilmiş karışık mantar, sarımsak ve maydanoz.', 110, 4, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'baslangiclar'
ON CONFLICT DO NOTHING;

-- Ana Yemekler
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Bonfile', 'Izgara dana bonfile, fırın patates ve mevsim sebzeleri ile.', 380, 1, TRUE),
  ('Tavuk Pirzola', 'Marine edilmiş tavuk pirzola, pilav ve ızgara sebze.', 260, 2, FALSE),
  ('Köfte Tabağı', 'El yapımı köfte, pilav, közlenmiş biber ve domates.', 220, 3, FALSE),
  ('Levrek Izgara', 'Günlük taze levrek, roka salatası eşliğinde.', 320, 4, TRUE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'ana-yemekler'
ON CONFLICT DO NOTHING;

-- Pizzalar
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Karışık Pizza', 'Sucuk, mantar, mısır, zeytin, biber ve mozzarella.', 200, 1, TRUE),
  ('Margarita', 'Taze domates sos, mozzarella ve fesleğen.', 160, 2, FALSE),
  ('Yeşilçam Special', 'Kavrulmuş tavuk, karamelize soğan, roka ve parmesan.', 220, 3, TRUE),
  ('Sucuklu Pizza', 'Bol sucuklu, mozzarella ve taze soğan.', 190, 4, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'pizzalar'
ON CONFLICT DO NOTHING;

-- Salatalar
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Sezar Salata', 'Marul, kruton, parmesan ve sezar sos. Tavuklu seçenek mevcut.', 150, 1, FALSE),
  ('Çoban Salata', 'Domates, salatalık, biber, soğan ve maydanoz.', 80, 2, FALSE),
  ('Akdeniz Salatası', 'Roka, kuru domates, beyaz peynir, ceviz ve nar ekşisi.', 130, 3, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'salatalar'
ON CONFLICT DO NOTHING;

-- Kahveler
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Türk Kahvesi', 'Geleneksel közde pişirme yöntemiyle hazırlanan Türk kahvesi.', 60, 1, TRUE),
  ('Espresso', 'Özel harman çekirdeklerden hazırlanan tek shot espresso.', 55, 2, FALSE),
  ('Latte', 'Espresso ve kremamsı süt köpüğü.', 80, 3, FALSE),
  ('Cappuccino', 'Espresso, buharla ısıtılmış süt ve köpük.', 80, 4, FALSE),
  ('Filtre Kahve', 'Günlük taze çekilmiş filtre kahve.', 65, 5, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'kahveler'
ON CONFLICT DO NOTHING;

-- Soğuk İçecekler
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Taze Limonata', 'Ev yapımı taze sıkılmış limonata. Naneli seçenek mevcut.', 70, 1, TRUE),
  ('Buzlu Çay', 'Şeftali veya limon aromalı buzlu çay.', 60, 2, FALSE),
  ('Smoothie', 'Muz, çilek ve yoğurt karışımı taze smoothie.', 90, 3, FALSE),
  ('Ice Latte', 'Buzlu espresso ve soğuk süt.', 90, 4, FALSE),
  ('Mevsim Meyve Suyu', 'Günlük taze sıkım portakal veya nar suyu.', 75, 5, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'soguk-icecekler'
ON CONFLICT DO NOTHING;

-- Sıcak İçecekler
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Çay', 'Demleme siyah çay, sınırsız.', 30, 1, FALSE),
  ('Bitki Çayı', 'Ihlamur, papatya, adaçayı veya kuşburnu.', 50, 2, FALSE),
  ('Sahlep', 'Tarçın ve fındık ile sıcak sahlep.', 70, 3, FALSE),
  ('Sıcak Çikolata', 'Gerçek çikolatadan hazırlanan sıcak çikolata. Marşmelov ile.', 80, 4, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'sicak-icecekler'
ON CONFLICT DO NOTHING;

-- Tatlılar
INSERT INTO menu_items (tenant_id, category_id, name, description, price, sort_order, is_visible, is_featured)
SELECT v_tenant_id, c.id, v.name, v.description, v.price, v.sort_order, TRUE, v.is_featured
FROM menu_categories c,
(VALUES
  ('Künefe', 'Hatay usulü tel kadayıf künefe, dondurma eşliğinde.', 150, 1, TRUE),
  ('Sufle', 'Sıcak çikolatalı sufle, vanilyalı dondurma ile.', 130, 2, TRUE),
  ('San Sebastian Cheesecake', 'Ev yapımı San Sebastian usulü cheesecake.', 120, 3, FALSE),
  ('Baklava', 'Antep fıstıklı ev baklavası. 4 dilim.', 140, 4, FALSE),
  ('Tiramisu', 'İtalyan usulü mascarpone kremalı tiramisu.', 110, 5, FALSE)
) AS v(name, description, price, sort_order, is_featured)
WHERE c.tenant_id = v_tenant_id AND c.slug = 'tatlilar'
ON CONFLICT DO NOTHING;

-- =========================
-- 9c. GALLERY ITEMS (Yeşilçam demo)
-- =========================
INSERT INTO gallery_items (tenant_id, image_url, alt_text, caption, sort_order, is_visible) VALUES
  (v_tenant_id, '/images/gallery/interior-1.jpg', 'Yeşilçam Çekmeköy iç mekan', 'Sıcak ve davetkar iç mekanımız', 1, TRUE),
  (v_tenant_id, '/images/gallery/interior-2.jpg', 'Yeşilçam Çekmeköy oturma alanı', 'Rahat oturma alanlarımız', 2, TRUE),
  (v_tenant_id, '/images/gallery/food-1.jpg', 'Serpme kahvaltı', 'Zengin serpme kahvaltımız', 3, TRUE),
  (v_tenant_id, '/images/gallery/food-2.jpg', 'Pizza servis', 'Fırından taze pizza', 4, TRUE),
  (v_tenant_id, '/images/gallery/ambiance-1.jpg', 'Akşam atmosferi', 'Akşam aydınlatması ile mekan', 5, TRUE),
  (v_tenant_id, '/images/gallery/detail-1.jpg', 'Türk kahvesi servisi', 'Geleneksel Türk kahvesi servisimiz', 6, TRUE),
  (v_tenant_id, '/images/gallery/food-3.jpg', 'Bonfile tabağı', 'Özenle hazırlanan ana yemekler', 7, TRUE),
  (v_tenant_id, '/images/gallery/terrace-1.jpg', 'Teras alanı', 'Bahçe ve teras oturma alanımız', 8, TRUE),
  (v_tenant_id, '/images/gallery/dessert-1.jpg', 'Tatlı tabağı', 'El yapımı tatlı çeşitlerimiz', 9, TRUE),
  (v_tenant_id, '/images/gallery/event-1.jpg', 'Özel etkinlik', 'Doğum günü organizasyonu', 10, TRUE),
  (v_tenant_id, '/images/gallery/bar-1.jpg', 'İçecek servis', 'Özel latte art kahvelerimiz', 11, TRUE),
  (v_tenant_id, '/images/gallery/ambiance-2.jpg', 'Nostaljik dekor', 'Yeşilçam temalı dekorasyon detayları', 12, TRUE)
ON CONFLICT DO NOTHING;

-- =========================
-- 9d. CAMPAIGNS (Yeşilçam demo)
-- =========================
INSERT INTO campaigns (tenant_id, title, slug, description, start_date, end_date, is_active, sort_order) VALUES
  (
    v_tenant_id,
    'Hafta İçi Kahvaltı Fırsatı',
    'hafta-ici-kahvalti',
    'Pazartesi - Cuma arası 2 kişilik serpme kahvaltıda %20 indirim! Güne enerjik başlayın.',
    '2026-03-01',
    '2026-06-30',
    TRUE,
    1
  ),
  (
    v_tenant_id,
    'Öğrenci Menüsü',
    'ogrenci-menusu',
    'Geçerli öğrenci kimliği ile ana yemek + içecek kombinasyonlarında özel fiyatlar.',
    '2026-01-01',
    '2026-12-31',
    TRUE,
    2
  ),
  (
    v_tenant_id,
    'Akşam Yemeği Paketi',
    'aksam-yemegi-paketi',
    '2 kişilik akşam yemeği paketi: Başlangıç + Ana Yemek + Tatlı + İçecek sadece 550₺. Cuma ve Cumartesi geçerli.',
    '2026-04-01',
    '2026-09-30',
    TRUE,
    3
  ),
  (
    v_tenant_id,
    'Doğum Günü Sürprizi',
    'dogum-gunu-surprizi',
    'Doğum gününüzü bizimle kutlayın! 4+ kişilik rezervasyonlarda doğum günü pastası hediye.',
    '2026-01-01',
    '2026-12-31',
    TRUE,
    4
  )
ON CONFLICT DO NOTHING;

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
    'Ayşe Korkmaz',
    5,
    'Harika bir atmosfer ve lezzetli yemekler. Sinema teması çok yaratıcı, kendimizi özel hissettik. Serpme kahvaltısı muhteşemdi!',
    'Google',
    TRUE, TRUE, 1
  ),
  (
    v_tenant_id,
    'Mehmet Yıldırım',
    5,
    'Kahvaltısı mükemmel, Türk kahvesi harika. Çekmeköy''de bu kalitede bir mekan bulmak güzel. Her hafta sonu ailecek geliyoruz.',
    'Google',
    TRUE, TRUE, 2
  ),
  (
    v_tenant_id,
    'Selin Demir',
    5,
    'Doğum günümüzü burada kutladık. Ekip çok ilgiliydi, mekan dekorasyonu muhteşemdi. Etkinlik organizasyonu için kesinlikle tavsiye ederim.',
    'Instagram',
    TRUE, TRUE, 3
  ),
  (
    v_tenant_id,
    'Emre Başaran',
    5,
    'Yeşilçam Special pizza ve taze limonata favori kombinasyonum oldu. Her hafta sonu geliyoruz artık. Personel çok güler yüzlü.',
    'TripAdvisor',
    TRUE, TRUE, 4
  ),
  (
    v_tenant_id,
    'Zehra Aydın',
    5,
    'Kurumsal yemeğimizi burada verdik, 30 kişilik gruba sorunsuz hizmet ettiler. Menü çeşitliliği ve sunum kalitesi beklentimizin üzerindeydi.',
    'Google',
    TRUE, TRUE, 5
  ),
  (
    v_tenant_id,
    'Burak Çelik',
    4,
    'Akşam yemeği için gittiğimde bonfile ve sufle denedim, ikisi de çok başarılıydı. Mekan sessiz ve huzurlu, romantik akşamlar için ideal.',
    'Google',
    TRUE, TRUE, 6
  ),
  (
    v_tenant_id,
    'Deniz Kaya',
    5,
    'Çekmeköy''de en sevdiğim mekan. Hem yemek kalitesi hem de ambiyans olarak çok başarılı. Künefesi mutlaka deneyin!',
    'Google',
    FALSE, TRUE, 7
  ),
  (
    v_tenant_id,
    'Fatma Özkan',
    5,
    'Vejetaryen seçeneklerin bu kadar çeşitli olması beni çok mutlu etti. Akdeniz salatası ve mantar sote favorilerim.',
    'Instagram',
    FALSE, TRUE, 8
  ),
  (
    v_tenant_id,
    'Okan Yılmaz',
    5,
    'İş toplantılarımız için düzenli olarak tercih ediyoruz. Sakin ortam, kaliteli servis ve lezzetli menü. Tam puan!',
    'Google',
    FALSE, TRUE, 9
  ),
  (
    v_tenant_id,
    'Canan Arslan',
    4,
    'Nişan yemeğimizi burada yaptık, 50 kişilik organizasyonu harika yönettiler. Özel menü hazırladılar, herkes çok beğendi.',
    'TripAdvisor',
    FALSE, TRUE, 10
  );

END $seed$;

-- =============================================================================
-- SECOND DEMO TENANT: Mavi Deniz Cafe
-- (Proves multi-tenant isolation — different theme, different content)
-- =============================================================================
DO $seed$
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

END $seed$;
