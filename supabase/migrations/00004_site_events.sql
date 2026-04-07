-- Migration: site_events for CTA tracking + analytics
-- Lightweight event tracking for public-site interactions.
-- Used for admin dashboard analytics and maintenance value justification.

CREATE TABLE IF NOT EXISTS site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'reservation_cta', 'phone_click', 'whatsapp_click',
    'directions_click', 'event_inquiry_submit', 'contact_form_submit',
    'page_view'
  )),
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast tenant+type+date queries
CREATE INDEX IF NOT EXISTS idx_site_events_tenant_type
  ON site_events (tenant_id, event_type, created_at DESC);

-- Index for date-range analytics
CREATE INDEX IF NOT EXISTS idx_site_events_tenant_date
  ON site_events (tenant_id, created_at DESC);

-- RLS: only service role writes; no public read
ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (admin client bypasses RLS anyway)
-- No public policies needed — all writes go through API routes.
