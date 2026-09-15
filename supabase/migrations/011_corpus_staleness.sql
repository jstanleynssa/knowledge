-- Migration 011: Corpus staleness tracking
-- Adds last_checked and content_hash to source_documents for change detection.

ALTER TABLE source_documents
  ADD COLUMN IF NOT EXISTS last_checked  date,
  ADD COLUMN IF NOT EXISTS content_hash  text;   -- SHA-256 of full_text; null = not yet hashed

-- Index for finding unchecked / stale sections efficiently
CREATE INDEX IF NOT EXISTS idx_source_docs_last_checked
  ON source_documents (source_type, last_checked NULLS FIRST)
  WHERE doc_kind = 'rule' AND superseded_at IS NULL;

-- Table to log detected changes for admin review
CREATE TABLE IF NOT EXISTS corpus_update_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_number  text        NOT NULL,
  source_type     text        NOT NULL,
  old_last_updated text,
  new_last_updated text,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'refreshed', 'dismissed')),
  detected_at     timestamptz DEFAULT now(),
  refreshed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_corpus_update_log_status
  ON corpus_update_log (status, detected_at DESC);

ALTER TABLE corpus_update_log ENABLE ROW LEVEL SECURITY;
