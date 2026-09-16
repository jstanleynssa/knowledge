-- axiom_subscriber_trial_fields.sql
-- Adds trial support and identity columns to axiom_subscribers.
--
-- Paste into the Supabase SQL editor and run. DO NOT run via migration runner.
-- All statements use IF NOT EXISTS — safe to run more than once.

ALTER TABLE axiom_subscribers ADD COLUMN IF NOT EXISTS name               text;
ALTER TABLE axiom_subscribers ADD COLUMN IF NOT EXISTS trial_ends_at      timestamptz;
ALTER TABLE axiom_subscribers ADD COLUMN IF NOT EXISTS reminder_sent_at   timestamptz;
ALTER TABLE axiom_subscribers ADD COLUMN IF NOT EXISTS kajabi_purchase_id text;
