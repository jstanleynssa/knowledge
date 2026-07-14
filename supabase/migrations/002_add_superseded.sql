-- ============================================================
-- Migration 002 — Superseded status + deprecation note
-- Apply via Supabase dashboard SQL editor
-- ============================================================

-- Add 'superseded' to the page_status enum
-- (Postgres allows adding enum values; cannot remove without recreation)
ALTER TYPE page_status ADD VALUE IF NOT EXISTS 'superseded';

-- Add deprecation_note column to reference_pages
-- Used when status = 'superseded' to explain why (e.g. "Modified by Social Security Fairness Act of 2023")
ALTER TABLE reference_pages
  ADD COLUMN IF NOT EXISTS deprecation_note text;

-- Update RLS: superseded pages are still publicly readable (for posterity)
-- The existing "public read published pages" policy only allows published — extend it:
DROP POLICY IF EXISTS "public read published pages" ON reference_pages;
CREATE POLICY "public read active pages"
  ON reference_pages FOR SELECT
  USING (status IN ('published', 'superseded'));
