-- ============================================================
-- NSSA Knowledge Base — Full Schema
-- Supabase project: eqipvrcmugnvkextqmym
-- Applied via Supabase dashboard SQL editor or CLI
-- ============================================================

-- pgvector extension (required for embeddings)
create extension if not exists vector;

-- ============================================================
-- LAYER 1 — Raw source substrate (NEVER published)
-- ============================================================

create table if not exists source_documents (
  id              uuid primary key default gen_random_uuid(),
  source_type     text not null check (source_type in ('poms','cfr','handbook','regs')),
  doc_kind        text not null default 'rule'
                    check (doc_kind in ('rule','toc','empty')),
  -- 'rule'  = substantial full_text + parsed section_number; only these are publishable/embeddable
  -- 'toc'   = table-of-contents/structure rows; kept for breadcrumbs/hierarchy, never cited
  -- 'empty' = null/sparse full_text; retained but never published
  section_number  text,           -- e.g. 'GN 00204.020', '20 CFR 404.30' — normalized on ingest
  title           text,
  full_text       text,           -- verbatim source; NEVER published raw
  source_url      text,           -- policy.ssa.gov/poms.nsf/lnx/{id} canonical citation URL
  last_updated    text,           -- SSA LastUpdated / Effective Date stamp
  scrape_date     date not null,
  created_at      timestamptz default now(),
  unique (source_type, section_number)
);
create index if not exists idx_source_documents_type_section on source_documents (source_type, section_number);
create index if not exists idx_source_documents_doc_kind on source_documents (doc_kind);

-- Chunked + embedded passages for retrieval (Phase 2 agent + review assist)
-- Only created from source_documents where doc_kind = 'rule'
create table if not exists source_chunks (
  id                  uuid primary key default gen_random_uuid(),
  source_document_id  uuid references source_documents(id) on delete cascade,
  section_number      text,
  chunk_text          text not null,
  embedding           vector(1536),   -- OpenAI text-embedding-3-small dims
  created_at          timestamptz default now()
);
create index if not exists idx_source_chunks_doc_id on source_chunks (source_document_id);
create index if not exists idx_source_chunks_embedding on source_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- LAYER 2 — Reference pages (the published content)
-- ============================================================

do $$ begin
  create type page_status as enum ('draft','in_review','approved','published','retired');
exception when duplicate_object then null; end $$;

create table if not exists reference_pages (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,       -- 'deemed-filing'
  category              text not null               -- 'social-security' | 'irmaa'
                          check (category in ('social-security','irmaa')),
  title                 text not null,              -- H1, canonical rule name (NOT a sentence)
  seo_title             text not null,              -- <title>, ≤60 chars
  meta_description      text not null,              -- 150–160 chars
  eyebrow               text,                       -- 'Claiming Rules'
  quick_answer          text not null,              -- definition-led, ~200 words; AI-cited most
  body_sections         jsonb not null default '[]'::jsonb,
  -- [{heading: string, prose: string, citation_ref: string}]
  worked_example        jsonb,
  -- {label: string, paragraphs: string[]}
  faq                   jsonb not null default '[]'::jsonb,
  -- [{q: string, a: string}] → FAQPage JSON-LD + visible FAQ
  primary_sources       jsonb not null default '[]'::jsonb,
  -- [{tag: string, section_number: string, url: string}]
  -- section_number resolves to source_documents.section_number for side-by-side review
  og_image_url          text,
  reviewer              text,                       -- 'Cindi Hill' | 'Todd Valles'
  status                page_status not null default 'draft',
  source_last_verified  date,
  date_published        date,
  date_modified         date,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create index if not exists idx_reference_pages_status on reference_pages (status);
create index if not exists idx_reference_pages_category_slug on reference_pages (category, slug);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_reference_pages_updated_at on reference_pages;
create trigger trg_reference_pages_updated_at
  before update on reference_pages
  for each row execute function update_updated_at();

-- ============================================================
-- PHASE 2 TABLES — Build now, wire up after Phase 1 proven
-- ============================================================

-- Expert-verified Q&A (the "learning" lives in the DB, not the model)
create table if not exists verified_answers (
  id              uuid primary key default gen_random_uuid(),
  question        text not null,
  answer          text not null,
  primary_sources jsonb not null default '[]'::jsonb,
  -- same citation discipline as reference_pages; no uncited answers accepted
  answered_by     text not null,    -- 'Jim Blair' | 'Cindi Hill' | 'Todd Valles'
  category        text not null check (category in ('social-security','irmaa')),
  status          page_status not null default 'draft',
  embedding       vector(1536),     -- searched by the agent's retrieval step
  last_reviewed   date not null,
  created_at      timestamptz default now()
);
create index if not exists idx_verified_answers_status on verified_answers (status);
create index if not exists idx_verified_answers_embedding on verified_answers using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Gap capture: agent couldn't answer → demand signal + expert queue
create table if not exists unanswered_questions (
  id              uuid primary key default gen_random_uuid(),
  question        text not null,
  advisor_id      text,
  retrieval_score real,             -- why it failed the confidence threshold
  routed_to       text,             -- expert assigned
  resolved_by     uuid references verified_answers(id),
  status          text default 'open' check (status in ('open','routed','resolved')),
  created_at      timestamptz default now()
);
create index if not exists idx_unanswered_status on unanswered_questions (status);

-- ============================================================
-- RLS (Row-Level Security) — enable now, policies per table
-- ============================================================
-- source_documents: no public read (raw SSA text, never published)
alter table source_documents enable row level security;
alter table source_chunks enable row level security;

-- reference_pages: public read of 'published' rows only
alter table reference_pages enable row level security;
create policy "public read published pages"
  on reference_pages for select
  using (status = 'published');

-- verified_answers / unanswered_questions: no public access (Phase 2, advisor-gated)
alter table verified_answers enable row level security;
alter table unanswered_questions enable row level security;

-- Service role bypasses RLS (ingest scripts, admin review UI use service role key)
-- No additional policies needed for service role.

-- ============================================================
-- Vector similarity search function (Phase 2 agent retrieval)
-- ============================================================
create or replace function match_source_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count     int default 10
)
returns table (
  id                 uuid,
  source_document_id uuid,
  section_number     text,
  chunk_text         text,
  similarity         float
)
language sql stable as $$
  select
    sc.id,
    sc.source_document_id,
    sc.section_number,
    sc.chunk_text,
    1 - (sc.embedding <=> query_embedding) as similarity
  from source_chunks sc
  where 1 - (sc.embedding <=> query_embedding) > match_threshold
  order by sc.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_verified_answers(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count     int default 5
)
returns table (
  id          uuid,
  question    text,
  answer      text,
  primary_sources jsonb,
  answered_by text,
  similarity  float
)
language sql stable as $$
  select
    va.id,
    va.question,
    va.answer,
    va.primary_sources,
    va.answered_by,
    1 - (va.embedding <=> query_embedding) as similarity
  from verified_answers va
  where va.status = 'approved'
    and 1 - (va.embedding <=> query_embedding) > match_threshold
  order by va.embedding <=> query_embedding
  limit match_count;
$$;
