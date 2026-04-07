-- =============================================================================
-- Migration 00005: WhatsApp Communication + AI First Response
-- =============================================================================
-- Adds tenant-aware WhatsApp configuration, conversation/lead logging,
-- and AI auto-reply settings for hospitality lead capture.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. WhatsApp settings per tenant (singleton per tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE whatsapp_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enabled       BOOLEAN NOT NULL DEFAULT false,
  phone_number  TEXT,                          -- WhatsApp Business number (E.164)
  cta_label     TEXT DEFAULT 'WhatsApp ile Yazın',
  
  -- AI auto-reply settings
  ai_enabled            BOOLEAN NOT NULL DEFAULT false,
  ai_business_tone      TEXT DEFAULT 'Samimi ve profesyonel bir kafe/restoran asistanı',
  ai_allowed_topics     TEXT[] DEFAULT ARRAY[
    'opening_hours', 'address', 'menu_categories', 'reservation_guidance',
    'event_inquiry', 'contact_info', 'campaign_summary'
  ],
  ai_fallback_text      TEXT DEFAULT 'Detaylı bilgi için sizi yetkilimize yönlendiriyorum. Kısa süre içinde size dönüş yapılacaktır.',
  ai_escalation_text    TEXT DEFAULT 'Bu konuda size daha iyi yardımcı olabilmemiz için yetkilimiz en kısa sürede sizinle iletişime geçecektir.',
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- ---------------------------------------------------------------------------
-- 2. WhatsApp conversation status enum
-- ---------------------------------------------------------------------------
-- Tracks each lead/conversation lifecycle
DO $$ BEGIN
  CREATE TYPE whatsapp_conversation_status AS ENUM (
    'new',              -- click tracked, no message yet
    'ai_replied',       -- AI sent first response
    'awaiting_human',   -- AI escalated or uncertain
    'human_replied',    -- Business owner responded
    'closed'            -- Conversation marked done
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3. WhatsApp conversations / lead log
-- ---------------------------------------------------------------------------
CREATE TABLE whatsapp_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Lead identification
  customer_phone  TEXT,                          -- visitor phone if known
  customer_name   TEXT,                          -- visitor name if known
  source          TEXT NOT NULL DEFAULT 'website_button',  -- website_button, direct, qr_code
  
  -- Conversation state
  status          whatsapp_conversation_status NOT NULL DEFAULT 'new',
  ai_used         BOOLEAN NOT NULL DEFAULT false,
  
  -- Message tracking
  last_message_preview TEXT,                     -- last message snippet (max ~200 chars)
  message_count        INT NOT NULL DEFAULT 0,
  
  -- Metadata
  metadata        JSONB DEFAULT '{}',            -- flexible: referrer, page, utm, etc.
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wa_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_wa_conversations_status ON whatsapp_conversations(tenant_id, status);
CREATE INDEX idx_wa_conversations_created ON whatsapp_conversations(tenant_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. WhatsApp messages (individual messages in a conversation)
-- ---------------------------------------------------------------------------
CREATE TABLE whatsapp_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  direction         TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type       TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human')),
  content           TEXT NOT NULL,
  
  -- AI metadata
  ai_model          TEXT,                        -- e.g. 'gemini-2.0-flash'
  ai_confidence     REAL,                        -- 0.0 - 1.0 confidence score
  ai_escalated      BOOLEAN DEFAULT false,       -- true if AI decided to hand off
  
  -- Provider metadata
  provider_message_id TEXT,                      -- external message ID from WhatsApp provider
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wa_messages_conversation ON whatsapp_messages(conversation_id, created_at);
CREATE INDEX idx_wa_messages_tenant ON whatsapp_messages(tenant_id);

-- ---------------------------------------------------------------------------
-- 5. Add whatsapp_enabled to tenant_features
-- ---------------------------------------------------------------------------
ALTER TABLE tenant_features
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 6. RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Service role (used by admin API) bypasses RLS.
-- Authenticated users can read their own tenant's data.

CREATE POLICY "wa_settings_tenant_read" ON whatsapp_settings
  FOR SELECT USING (tenant_id = ANY(get_user_tenant_ids()));
CREATE POLICY "wa_settings_service" ON whatsapp_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "wa_conversations_tenant_read" ON whatsapp_conversations
  FOR SELECT USING (tenant_id = ANY(get_user_tenant_ids()));
CREATE POLICY "wa_conversations_service" ON whatsapp_conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "wa_messages_tenant_read" ON whatsapp_messages
  FOR SELECT USING (tenant_id = ANY(get_user_tenant_ids()));
CREATE POLICY "wa_messages_service" ON whatsapp_messages
  FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 7. Seed default whatsapp_settings for existing tenants
-- ---------------------------------------------------------------------------
INSERT INTO whatsapp_settings (tenant_id)
SELECT id FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM whatsapp_settings)
ON CONFLICT (tenant_id) DO NOTHING;
