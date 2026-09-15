-- Migration 010: axiom_clients + client_id on axiom_conversations
-- Run in Supabase SQL editor before deploying chunk 2.

CREATE TABLE IF NOT EXISTS axiom_clients (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text        NOT NULL,
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_email, name)
);

CREATE INDEX IF NOT EXISTS idx_axiom_clients_email ON axiom_clients (user_email);

ALTER TABLE axiom_conversations
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES axiom_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_axiom_conversations_client
  ON axiom_conversations (user_email, client_id);

ALTER TABLE axiom_clients ENABLE ROW LEVEL SECURITY;
