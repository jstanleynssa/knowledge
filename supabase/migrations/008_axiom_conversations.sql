-- Migration 008: axiom_conversations — DB-backed conversation history for AXIOM
-- Applied: 2026-09-10
--
-- Stores full conversation turn history per authenticated subscriber.
-- API routes use service role (bypasses RLS); auth enforced in route handlers.

CREATE TABLE IF NOT EXISTS axiom_conversations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   text        NOT NULL,
  title        text        NOT NULL DEFAULT 'New conversation',
  turns        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Index for fast per-user listing sorted by recency
CREATE INDEX IF NOT EXISTS idx_axiom_conversations_email_updated
  ON axiom_conversations (user_email, updated_at DESC);

-- Auto-update updated_at on every PATCH
CREATE OR REPLACE FUNCTION update_axiom_conv_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS trg_axiom_conv_updated_at ON axiom_conversations;
CREATE TRIGGER trg_axiom_conv_updated_at
  BEFORE UPDATE ON axiom_conversations
  FOR EACH ROW EXECUTE FUNCTION update_axiom_conv_updated_at();

-- RLS enabled; service role bypasses (all API routes use service role key)
ALTER TABLE axiom_conversations ENABLE ROW LEVEL SECURITY;
