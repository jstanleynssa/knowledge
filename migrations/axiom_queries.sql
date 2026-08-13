-- AXIOM query log — created 2026-08-11
-- Run this in the Supabase SQL editor for project eqipvrcmugnvkextqmym

CREATE TABLE IF NOT EXISTS public.axiom_queries (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_question   text NOT NULL,
  clean_question text,
  benefit_types  text[],
  category       text,
  parties        text[],
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS axiom_queries_created_at_idx ON public.axiom_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS axiom_queries_category_idx   ON public.axiom_queries (category);

-- Optional: allow the service role to insert/select (already true by default for service role)
ALTER TABLE public.axiom_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON public.axiom_queries
  USING (true) WITH CHECK (true);
