-- =============================================================================
-- Migration 00003: Branding Extensions
-- 
-- Adds four new configurable fields to tenant_branding to remove all
-- hardcoded hospitality copy from public pages and make the product
-- truly white-label.
--
-- Fields:
--   announcement_bar_text  — header announcement bar (nullable = bar hidden)
--   about_story            — long-form about page text body (nullable = section hidden)
--   venue_highlights       — array of badge keys from ALL_VENUE_BADGE_OPTIONS
--   trust_stats            — JSONB array of {label, value} for homepage stats band
-- =============================================================================

ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS announcement_bar_text TEXT,
  ADD COLUMN IF NOT EXISTS about_story          TEXT,
  ADD COLUMN IF NOT EXISTS venue_highlights     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_stats          JSONB  DEFAULT '[]';

-- Grant: existing RLS policies on tenant_branding cover the new columns.
-- No new policies required.

COMMENT ON COLUMN tenant_branding.announcement_bar_text IS
  'Text shown in the sticky announcement bar above the main nav. NULL = bar hidden.';

COMMENT ON COLUMN tenant_branding.about_story IS
  'Long-form about/story text rendered on the About page. NULL = story block hidden.';

COMMENT ON COLUMN tenant_branding.venue_highlights IS
  'Array of badge keys (e.g. ''parking'', ''wifi'') shown as venue feature badges on homepage.';

COMMENT ON COLUMN tenant_branding.trust_stats IS
  'JSON array of [{label: string, value: string}] shown in trust-signals band. Empty = band hidden.';
