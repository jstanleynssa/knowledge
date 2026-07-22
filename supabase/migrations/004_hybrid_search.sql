-- Migration 004: hybrid search infrastructure
-- Applied: 2026-07-16 (Tank)
--
-- 1. match_chunks    — vector similarity via pgvector (IVFFlat, probes=3)
-- 2. search_documents_fts — ranked FTS search for keyword retrieval leg
-- 3. GIN index for full-text search on source_documents
-- 4. draft_metadata column on reference_pages (logs retrieval trace per draft)
--
-- Notes:
--   - match_chunks uses plpgsql VOLATILE + SET LOCAL ivfflat.probes=3 for recall
--   - search_documents_fts excludes PR/PS state-specific sections (pollute results)
--   - authenticator and authenticated roles timeout raised to 30s (was 8s)
--     ALTER ROLE authenticator SET statement_timeout TO '30s';
--     ALTER ROLE authenticated SET statement_timeout TO '30s';

-- ─── 1. match_chunks — vector similarity via pgvector ─────────────────────────
-- IVFFlat pattern: ORDER BY + LIMIT only (no WHERE on similarity score).
-- The WHERE-on-similarity pattern forces a full scan and kills IVFFlat efficiency.
-- Threshold filtering happens client-side. probes=3 improves recall (scans 3 lists).
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count     int   DEFAULT 20,
  match_threshold float DEFAULT 0.65  -- unused in SQL; client filters post-fetch
)
RETURNS TABLE (
  chunk_id           uuid,
  source_document_id uuid,
  section_number     text,
  chunk_text         text,
  similarity         float
)
LANGUAGE plpgsql VOLATILE
AS $$
BEGIN
  SET LOCAL ivfflat.probes = 3;
  RETURN QUERY
    SELECT
      sc.id                                        AS chunk_id,
      sc.source_document_id,
      sc.section_number,
      sc.chunk_text,
      (1 - (sc.embedding <=> query_embedding))::float  AS similarity
    FROM source_chunks sc
    WHERE sc.embedding IS NOT NULL
    ORDER BY sc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── 2. search_documents_fts — ranked FTS for keyword retrieval leg ───────────
-- Returns source_documents ranked by ts_rank (most relevant first).
-- Excludes state-specific PR (Precedent Rulings) and PS (Policy Statements)
-- sections which often pollute spousal/benefit queries with state law context.
CREATE OR REPLACE FUNCTION search_documents_fts(
  fts_query   text,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  section_number text,
  title          text,
  full_text      text,
  source_url     text,
  rank           float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    sd.section_number,
    sd.title,
    sd.full_text,
    sd.source_url,
    ts_rank(to_tsvector('english', coalesce(sd.full_text, '')),
            plainto_tsquery('english', fts_query))::float AS rank
  FROM source_documents sd
  WHERE sd.doc_kind = 'rule'
    AND sd.full_text IS NOT NULL
    AND to_tsvector('english', coalesce(sd.full_text, '')) @@ plainto_tsquery('english', fts_query)
    AND sd.section_number NOT LIKE 'PR %'
    AND sd.section_number NOT LIKE 'PS %'
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- ─── 3. GIN index for full-text search on source_documents ────────────────────
-- Required for search_documents_fts performance.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_docs_fts
  ON source_documents
  USING gin (to_tsvector('english', coalesce(full_text, '')));

-- ─── 4. draft_metadata — retrieval trace per draft ────────────────────────────
-- Stores: query, top sections retrieved, verification result, source gaps.
ALTER TABLE reference_pages
  ADD COLUMN IF NOT EXISTS draft_metadata jsonb;
