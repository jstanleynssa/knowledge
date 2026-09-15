-- Migration 009: Add pinned column to axiom_conversations
-- Run in Supabase SQL editor before deploying sidebar update.
ALTER TABLE axiom_conversations ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_axiom_conversations_pinned ON axiom_conversations (user_email, pinned) WHERE pinned = true;
