-- Migration 007: Update match_chunks for HNSW index
--
-- Removes the IVFFlat-specific SET LOCAL ivfflat.probes = 3 (no-op under HNSW,
-- but signals intent). Sets hnsw.ef_search = 100 for better recall at the cost
-- of slightly higher latency (default ef_search = 40 is too conservative for
-- the POMS corpus which has many semantically similar sections).
--
-- Run after Migration 006 (HNSW index) is fully built.

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
  SET LOCAL hnsw.ef_search = 100;
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
