-- Migration 006: Replace IVFFlat with HNSW on source_chunks.embedding
--
-- Why: IVFFlat was built with lists=100 (appropriate for ~200K rows).
-- The corpus has grown to 1.1M chunks. With 100 lists and 1.1M rows,
-- IVFFlat does a near-sequential scan (~41 seconds). HNSW:
--   - Doesn't require rebuild after inserts
--   - Faster queries at this scale
--   - Better recall with comparable parameters
--   - m=16, ef_construction=64 is the standard starting point
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Run this file manually in Supabase SQL editor (split at the blank line).

DROP INDEX IF EXISTS idx_source_chunks_embedding;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_chunks_embedding_hnsw
  ON source_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
