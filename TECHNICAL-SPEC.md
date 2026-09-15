# AXIOM Technical Specification

**Version:** 2.0  
**Date:** 2026-09-05  
**Author:** Tank (AI Assistant) / Jason Stanley  
**Status:** Production  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Retrieval Pipeline](#4-retrieval-pipeline)
5. [Answer Generation Pipeline](#5-answer-generation-pipeline)
6. [Feedback & Learning Loop](#6-feedback--learning-loop)
7. [Page Generation Pipeline](#7-page-generation-pipeline)
8. [Access Control](#8-access-control)
9. [Frontend — AskInterface](#9-frontend--askinterface)
10. [Admin Tools](#10-admin-tools)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [API Reference](#12-api-reference)
13. [Environment Variables](#13-environment-variables)
14. [Known Issues & Recent Fixes](#14-known-issues--recent-fixes)
15. [Key Design Decisions](#15-key-design-decisions)

---

## 1. System Overview

### What AXIOM Is

AXIOM is a gated AI research assistant at **axiom.nssapros.com** that lets NSSA-credentialed financial advisors ask Social Security and IRMAA/Medicare questions and receive grounded, cited answers drawn from a curated POMS/CFR/CMS corpus.

Every answer is:
- **Grounded** — written only from retrieved source documents
- **Cited** — every claim references a specific POMS/CFR section number with a live link
- **Verified** — a mechanical self-verification gate checks that stated fractions, percentages, ages, and month counts appear verbatim in the cited source
- **Correctable** — staff reviewers can approve, correct, or reject answers; corrections propagate to future queries via the `verified_answers` corpus

### Who Uses It

| User Type | Access | Feedback Capability |
|---|---|---|
| **Subscriber** (NSSA-credentialed advisor) | Supabase magic link + active `axiom_subscribers` row | Thumbs up/down (β) |
| **Staff reviewer** (Jason, Cindi, Todd, Jim, Travis) | Same auth + `role = 'staff'` in `axiom_subscribers` | Full Verify/Make Suggestion/Correct panel |
| **Fidelity demo** | Password gate (`axiom_access` cookie) + reviewer name cookie | Full reviewer panel |

### How AXIOM Fits the Broader Platform

```
nssapros.com / Kajabi        →  purchase event  →  Zapier
                                                     │
                                                     ▼
                                         POST /api/axiom/provision
                                         (sets axiom_subscribers.status = 'active')
                                                     │
                                                     ▼
                                         axiom.nssapros.com (AXIOM)
                                         (Supabase magic link login)
                                                     │
                                                     ▼
                                         knowledge.nssapros.com corpus
                                         (Supabase: source_documents, source_chunks,
                                          verified_answers, reference_pages)
```

AXIOM consumes the same Supabase project (`eqipvrcmugnvkextqmym`) as the public Knowledge Base at `knowledge.nssapros.com`. They share the corpus tables but have separate frontend routes and auth flows.

The Knowledge Base is also the source of human-reviewed verified answers that seed AXIOM's few-shot context.

---

## 2. Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Base path | `/codex` (served from `www.nssapros.com/codex`) |
| Hosting | Vercel (production) |
| Database | Supabase (PostgreSQL), project `eqipvrcmugnvkextqmym` |
| Vector search | pgvector — HNSW index (m=16, ef_construction=64) — migrating from IVFFlat |
| Full-text search | PostgreSQL GIN index + `tsvector` |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dimensions) |
| LLM — query interpretation | GPT-4o |
| LLM — answer generation | GPT-4o |
| LLM — rewrite / feedback analysis | GPT-4o |
| Auth | Supabase magic link / OTP (subscribers) + cookie-based password gate (staff/Fidelity) |
| Routing proxy | Cloudflare Worker `nssa-path-proxy` (routes `/codex` → Vercel, `/admin` → Vercel) |
| Generation worker | Local Node.js cron (runs on NSSA's Mac Studio every 60s) |

### High-Level Architecture Diagram

```
                    ┌──────────────────────────────────────────┐
                    │       axiom.nssapros.com                  │
                    │  (Vercel via Cloudflare Worker rewrite)   │
                    └────────────────┬─────────────────────────┘
                                     │
            ┌────────────────────────┼──────────────────────────┐
            │                        │                          │
     ┌──────▼──────┐        ┌────────▼──────┐        ┌─────────▼──────┐
     │  /axiom/join │        │  /axiom/login │        │  /axiom (chat)  │
     │  (enrollment)│        │  (Supabase OTP)│        │  AskInterface   │
     └─────────────┘        └───────────────┘        └────────┬────────┘
                                                               │
                                              ┌────────────────┼────────────────┐
                                              │                │                │
                                     ┌────────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
                                     │  POST /api/ask │ │POST /api/ask│ │POST /api/    │
                                     │                │ │   /rewrite  │ │  feedback    │
                                     └────────┬───────┘ └─────────────┘ └──────────────┘
                                              │
                          ┌───────────────────┼──────────────────────┐
                          │                   │                      │
                   ┌──────▼──────┐   ┌────────▼────────┐   ┌────────▼────────┐
                   │  OpenAI API  │   │   Supabase DB   │   │  OpenAI API     │
                   │  (GPT-4o)    │   │  source_chunks  │   │  (embeddings)   │
                   │  interpret + │   │  source_docs    │   │  text-embedding │
                   │  generate    │   │  verified_ans.  │   │  -3-small       │
                   └─────────────┘   └─────────────────┘   └─────────────────┘

Local Mac Studio (generation worker, cron):
   generation_jobs (Supabase) → generation-worker.ts → draft_page_v2.ts → reference_pages
```

### Route Structure (basePath: `/codex`)

| URL | Handler | Auth |
|---|---|---|
| `axiom.nssapros.com/` | 301 → `/codex/axiom` | — |
| `axiom.nssapros.com/join` | rewrite → `/codex/axiom/join` | None (public enrollment) |
| `axiom.nssapros.com/login` | rewrite → `/codex/axiom/login` | None |
| `/codex/axiom` | `app/axiom/page.tsx` | Supabase session + `axiom_subscribers` |
| `/codex/axiom/fidelity` | `app/axiom/fidelity/page.tsx` | Cookie password gate + reviewer cookie |
| `/codex/api/ask` | `app/api/ask/route.ts` | None (route-level, session checked separately) |
| `/codex/api/ask/rewrite` | `app/api/ask/rewrite/route.ts` | None |
| `/codex/api/feedback` | `app/api/feedback/route.ts` | None |
| `/codex/api/axiom/provision` | `app/api/axiom/provision/route.ts` | `x-axiom-secret` header |
| `/codex/api/axiom/enroll` | `app/api/axiom/enroll/route.ts` | None (public) |
| `/codex/api/axiom/feedback` | `app/api/axiom/feedback/route.ts` | Supabase session + active subscriber |
| `/codex/api/axiom-auth` | `app/api/axiom-auth/route.ts` | — (sets `axiom_access` cookie) |
| `/codex/api/axiom-reviewer` | `app/api/axiom-reviewer/route.ts` | `axiom_access` cookie |
| `/codex/auth/callback` | `app/auth/callback/route.ts` | PKCE code exchange |
| `/codex/admin/kb-review` | `app/admin/kb-review/page.tsx` | Supabase session + `kb_reviewers` |
| `/codex/admin/axiom-feedback` | `app/admin/axiom-feedback/page.tsx` | Admin session |
| `/codex/admin/axiom-subscribers` | `app/admin/axiom-subscribers/page.tsx` | Admin session |

---

## 3. Data Model

All tables live in Supabase project `eqipvrcmugnvkextqmym` (US East). The service role bypasses RLS everywhere; all ingest and API routes use the service role key.

### `source_documents` — Raw corpus

The ground truth. Never published directly. Ingested from SSA POMS, 20 CFR, SSA Handbook, CMS.gov, Medicare.gov.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `source_type` | text | `poms` / `cfr` / `handbook` / `cms` / `medicare` |
| `doc_kind` | text | `rule` (embeddable) / `toc` (structure only) / `empty` (sparse text) |
| `section_number` | text | e.g. `RS 00615.201`, `20 CFR 404.313`, `CMS:irmaa`, `HBK 0720` |
| `title` | text | Section title |
| `full_text` | text | Verbatim cleaned source text. Never published raw. |
| `source_url` | text | Canonical citation URL: `https://secure.ssa.gov/apps10/poms.nsf/lnx/…` |
| `last_updated` | text | SSA effective-date stamp |
| `scrape_date` | date | When ingested |
| `superseded_at` | timestamptz | Set when a newer version replaces this row; never embed or serve superseded rows |
| `created_at` | timestamptz | |

**Unique constraint:** `(source_type, section_number)`  
**Indexes:** `idx_source_documents_type_section`, `idx_source_documents_doc_kind`, GIN `idx_source_docs_fts` on `to_tsvector('english', coalesce(full_text, ''))`

**Section prefixes and relevance tiers:**

| Prefix | Corpus | Tier |
|---|---|---|
| `RS` | Retirement & Survivors (POMS) | 1 — primary advisor relevance |
| `HI` | Health Insurance / Medicare (POMS) | 1 |
| `GN` | General — filing, evidence, appeals (POMS) | 1 |
| `DI` | Disability Insurance (POMS) | 2 |
| `SI` | SSI (POMS) | 3 — mostly excluded |
| `PR`, `PS` | Precedent Rulings, Policy Statements | Excluded from retrieval (state-specific) |
| `NL` | Notice Language | Excluded (internal SSA templates) |
| `HBK` | SSA Handbook | 1 |
| `20 CFR` | Code of Federal Regulations | 1 |
| `CMS:` | CMS.gov HTML documents | 1 (IRMAA) |
| `CMSPDF:` | CMS.gov PDF documents | 1 (filtered by relevance score) |
| `MCR:` | Medicare.gov | 1 (IRMAA) |

### `source_chunks` — Embeddings

Only created from `source_documents` where `doc_kind = 'rule'` and `superseded_at IS NULL`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `source_document_id` | uuid FK → `source_documents` (cascade delete) | |
| `section_number` | text | Denormalized from parent for fast grouping |
| `chunk_text` | text | ~800 chars per chunk (prose); table blocks atomic regardless of size |
| `embedding` | vector(1536) | `text-embedding-3-small` |
| `created_at` | timestamptz | |

**Indexes:**  
- `idx_source_chunks_doc_id` on `source_document_id`  
- `idx_source_chunks_embedding_hnsw` using HNSW `(embedding vector_cosine_ops)` with `m=16, ef_construction=64`  
  *(IVFFlat index `idx_source_chunks_embedding` dropped in migration 006)*

**Chunking parameters:**

| Parameter | Value |
|---|---|
| `CHUNK_SIZE` | 800 chars (~200 tokens) |
| `CHUNK_OVERLAP` | 100 chars |
| `EMBED_BATCH` | 100 texts per OpenAI API call |
| Table blocks | Atomic (never split) — preserves IRMAA bracket tables |

### `reference_pages` — Published KB content

Expert-reviewed, published pages on `knowledge.nssapros.com`. Also used as fallback context by AXIOM when `verified_answers` has no matching pair.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text UNIQUE | URL path: `spousal-benefits-at-62` |
| `category` | text | `social-security` / `irmaa` |
| `title` | text | Short canonical label (breadcrumbs, admin queue) |
| `h1` | text | SEO headline rendered on page |
| `seo_title` | text | ≤60 chars for `<title>` tag |
| `meta_description` | text | 150–160 chars |
| `eyebrow` | text | Constrained vocabulary: e.g. `Claiming Rules`, `IRMAA Basics` |
| `quick_answer` | text | HTML; definition-led, ≤200 words; becomes the AXIOM verified answer on approval |
| `body_sections` | jsonb | `[{heading, prose, citation_ref}]` |
| `worked_example` | jsonb | `{label, paragraphs[]}` — omitted for most IRMAA topics |
| `faq` | jsonb | `[{q, a}]` — 4–6 items in search-query phrasing |
| `primary_sources` | jsonb | `[{tag, section_number, url}]` |
| `status` | page_status enum | `draft` → `in_review` → `published`; also `approved`, `superseded`, `retired`, `deleted` |
| `reviewer` | text | Assigned reviewer name |
| `approved_by` | text | Reviewer who approved |
| `approved_at` | timestamptz | |
| `date_published` | date | |
| `date_modified` | date | |
| `source_last_verified` | date | When content last verified against live POMS |
| `draft_metadata` | jsonb | Pipeline trace: retrieval queries, section scores, verification result, source gaps |
| `deprecation_note` | text | For `superseded` pages |
| `og_image_url` | text | |

**Page lifecycle:**  
`draft` (all values verified) → reviewer edits → `published`  
`in_review` (unverified values flagged) → reviewer reviews → `published`  
`published` → stale after ~12 months → reviewer re-verifies → `source_last_verified` updated

**RLS policy:** Public read on `status IN ('published', 'superseded')`. Admin/service role bypasses RLS.

### `reference_pages_history` — Snapshot log

Immutable history. Written before every save, approve, delete, or send-back. Enables content recovery.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `page_id` | uuid | |
| `page_slug` | text | |
| `action` | text | `save_draft` / `approve` / `send_back` / `delete` |
| `actor` | text | Reviewer display name |
| `snapshot` | jsonb | Full `reference_pages` row at time of action |
| `created_at` | timestamptz | |

### `verified_answers` — Expert-confirmed Q&A corpus

The AXIOM agent's learning layer. Injected as few-shot context for semantically similar queries.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | The question (h1 or advisor question) |
| `answer` | text | HTML answer |
| `primary_sources` | jsonb | Same format as `reference_pages.primary_sources` |
| `answered_by` | text | `agent-approved` / `human-corrected` / reviewer display name |
| `category` | text | `social-security` / `irmaa` |
| `status` | page_status | `published` = active in retrieval |
| `embedding` | vector(1536) | Embedded from `question` text |
| `last_reviewed` | date | |
| `created_at` | timestamptz | |

**Seeded by three paths:**
1. Agent answer + staff reviewer clicks **Verify** (`feedback_type = 'approve'`)
2. Staff reviewer makes a correction + clicks **Save suggestion** (`feedback_type = 'correct'`)
3. KB page approval hook — `h1` becomes question, `quick_answer` becomes answer (runs in `saveAndApprove()`)

**Index:** HNSW on `embedding` (same migration as source_chunks)

### `answer_feedback` — Full feedback log

Every feedback event, including rejections that are NOT promoted to `verified_answers`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | |
| `original_answer` | text | What the agent said |
| `corrected_answer` | text | What the reviewer said it should say (correct/reject only) |
| `verdict` | text | Agent's original verdict |
| `primary_sources` | jsonb | |
| `sections_used` | jsonb | All sections retrieved for this query |
| `feedback_type` | text | `approve` / `correct` / `reject` |
| `correction_tags` | text[] | `wrong_section` / `wrong_value` / `missing_rule` / `misread_scenario` |
| `correction_note` | text | Free-text reviewer note |
| `category` | text | |
| `saved_to_verified` | boolean | False for `reject` |
| `reviewer_name` | text | From `axiom_reviewer` cookie or `reviewer_name` field |
| `created_at` | timestamptz | |

### `axiom_queries` — Question log

Fire-and-forget telemetry. Every advisor question is logged here asynchronously (never blocks the response).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `raw_question` | text | Original question as typed |
| `clean_question` | text | Resolved, standalone question after GPT-4o interpretation |
| `benefit_types` | text[] | e.g. `['spousal', 'deemed_filing']` |
| `category` | text | `social-security` / `irmaa` |
| `parties` | text[] | Scenario decomposition: `['primary worker (age 64)', 'spouse (age 62)']` |
| `created_at` | timestamptz | |

### `axiom_subscribers` — Subscription management

Controls access to AXIOM. Provisioned by Zapier (Kajabi purchase events) or manually by admin.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text UNIQUE | Must match Supabase auth email |
| `name` | text | Display name |
| `tier` | text | `standard` / `arpi_grad` / `firm` / `staff` |
| `role` | text | `subscriber` / `staff` |
| `status` | text | `active` / `cancelled` / `past_due` |
| `kajabi_purchase_id` | text | From Zapier provision event |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Roles:**
- `subscriber` — gets the answer interface; sees SubscriberThumbs (thumbs up/down)
- `staff` — also gets the FeedbackBar (Verify / Make Suggestion / Correct)

### `axiom_feedback` — Subscriber beta feedback

Thumbs up/down from non-staff subscribers. Separate from the staff `answer_feedback` table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_email` | text | Authenticated subscriber email |
| `question` | text | |
| `answer_excerpt` | text | First 500 chars of answer |
| `rating` | text | `positive` / `negative` |
| `comment` | text | Optional; elicited on negative rating |
| `created_at` | timestamptz | |

**Protected by:** Supabase session auth + active subscriber check. Shown in `/admin/axiom-feedback`.

### `codex_topics` — Topic queue with status tracking

Tracks which topics have been generated, are in review, or are published. Synced by the generation worker and approval actions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text UNIQUE | |
| `title` | text | |
| `topic` | text | Natural language query for retrieval |
| `category` | text | |
| `status` | text | `pending` / `in_review` / `published` |
| `created_at` | timestamptz | |

**Status transitions:**
- `pending` → topic is in the queue, not yet generated
- `in_review` → `generation-worker.ts` set this after runDraft succeeds
- `published` → `saveAndApprove()` sets this on KB page approval (with slug-matching fallback via `generation_jobs`)

### `generation_jobs` — Async page generation queue

Queued by `/api/admin/generate` for custom topic requests. The local `generation-worker.ts` cron polls this table and runs `runDraft()`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | Page title |
| `slug` | text | Target slug |
| `topic` | text | Natural language query for retrieval |
| `category` | text | |
| `status` | text | `pending` / `running` / `done` / `error` |
| `page_id` | uuid | Populated on success — references `reference_pages.id` |
| `error` | text | Error message on failure |
| `requested_by` | text | Reviewer email |
| `created_at` | timestamptz | |
| `started_at` | timestamptz | |
| `finished_at` | timestamptz | |

### `kb_reviewers` — Authorized admin reviewers

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text UNIQUE | |
| `display_name` | text | |
| `categories` | text[] | `{social-security}` / `{irmaa}` / `{social-security,irmaa}` |

**Current reviewers:** Jason Stanley (admin), Cindi Hill (SS), Todd Valles (IRMAA), Jim Blair (both), Travis Stanley (both).

Admin email `jstanley@nssapros.com` bypasses the `kb_reviewers` check in all admin actions.

### `unanswered_questions` — Gap capture

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | |
| `advisor_id` | text | |
| `retrieval_score` | real | Why it failed confidence threshold |
| `routed_to` | text | Assigned expert |
| `resolved_by` | uuid FK → `verified_answers` | |
| `status` | text | `open` / `routed` / `resolved` |

### SQL Functions

#### `match_chunks` — Vector similarity over source_chunks

```sql
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
  SET LOCAL hnsw.ef_search = 100;  -- migration 007; was ivfflat.probes = 3
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
```

**Design notes:**
- `VOLATILE` + `SET LOCAL`: allows HNSW parameters to be set per-call inside a transaction
- `ef_search = 100`: higher recall (default 40 is too conservative for the POMS corpus, which has many semantically similar sections)
- No `WHERE similarity > threshold` in SQL — forces full scan with IVFFlat/HNSW; always use `ORDER BY … LIMIT`, filter client-side

#### `search_documents_fts` — Ranked full-text search

```sql
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
```

**PR/PS exclusion:** State-specific Precedent Rulings and Policy Statements match benefit keywords but are almost never relevant to factual advisor queries. Excluded in both FTS and vector aggregation.

#### `match_verified_answers` — Vector search over verified_answers

```sql
CREATE OR REPLACE FUNCTION match_verified_answers(
  query_embedding  vector(1536),
  match_count      int   DEFAULT 5,
  match_threshold  float DEFAULT 0.75,
  filter_category  text  DEFAULT NULL
)
RETURNS TABLE (
  id            uuid,
  question      text,
  answer        text,
  primary_sources jsonb,
  answered_by   text,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT va.id, va.question, va.answer, va.primary_sources, va.answered_by,
         1 - (va.embedding <=> query_embedding) AS similarity
  FROM verified_answers va
  WHERE va.status = 'published'
    AND (filter_category IS NULL OR va.category = filter_category)
    AND 1 - (va.embedding <=> query_embedding) > match_threshold
  ORDER BY va.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 4. Retrieval Pipeline

**File:** `scripts/retrieval/hybrid.ts`

AXIOM uses **hybrid retrieval** — vector search for semantic matching combined with keyword/FTS search for exact token recall — fused via **Reciprocal Rank Fusion (RRF)**. This is materially better than either method alone for POMS queries, where section numbers, fractions, and benefit-type labels are critical high-signal tokens that embeddings can underweight.

### Full Pipeline

```
query string
    │
    ├── 1. embed(query) → OpenAI text-embedding-3-small (1536-dim)
    │       │
    │       ▼
    │   vectorSearch(embedding, vectorTopK=40, threshold=0.50)
    │       → match_chunks RPC (HNSW, ef_search=100)
    │       → fetch candidateK = max(topK*4, 80) chunks
    │       → filter client-side: similarity >= 0.50
    │       → group by section_number (max similarity per section)
    │       → exclude PR/PS sections
    │       → vectorRanked[]: [{section_number, rank, similarity}]
    │
    ├── 2. keywordSearch(query, keywordTopK=25, sourcesFilter)
    │       │
    │       ├── Pass 1: search_documents_fts RPC
    │       │       Extract significant words (len>3, exclude stopwords)
    │       │       Normalize: spousal→spouse, widower→widow, etc.
    │       │       plainto_tsquery → ts_rank ORDER BY rank DESC
    │       │       Exclude PR/PS sections
    │       │
    │       └── Pass 2: ILIKE on high-signal terms
    │               extractKeyTerms(query):
    │                 - benefit-type keywords + synonyms (spousal↔spouse, widow↔widower)
    │                 - section number patterns (/[A-Z]{2,3}\s?\d{3,5}/)
    │                 - numeric fractions (/\d+\/\d+/)
    │               Specific terms (section#, fractions) always included
    │               Broad terms (benefit types) only if FTS returned < 5 results
    │               Parallel ILIKE queries, deduped by section_number
    │
    └── 3. RRF fusion (k=60)
            for each unique section_number in (vectorRanked ∪ kwRanked):
              score = rrfScore(vector_rank) + rrfScore(keyword_rank)
              rrfScore(rank) = 1 / (60 + rank)
            Sort descending by score
            Return top-K sections with full text + debug info
```

### Source Filter Constants

```typescript
SS_SOURCES:    ['poms', 'cfr', 'handbook']           // default for SS pages
IRMAA_SOURCES: ['poms', 'cfr', 'handbook', 'medicare', 'cms']  // IRMAA/Medicare
ALL_SOURCES:   ['poms', 'cfr', 'handbook', 'cms', 'medicare']  // AXIOM live Q&A
```

AXIOM always uses `ALL_SOURCES` — broader coverage for open-ended advisor questions.

### Default Parameters

| Parameter | Value | Notes |
|---|---|---|
| `topK` | 10 (page builder: 15) | Final sections returned |
| `vectorTopK` | 40 | Chunks fetched from vector search |
| `candidateK` | `max(topK*4, 80)` | Actual `match_chunks` fetch size |
| `keywordTopK` | 25 | Sections from keyword search |
| `threshold` | 0.50 | Client-side cosine similarity filter |
| `RRF_K` | 60 | Standard RRF constant |
| `hnsw.ef_search` | 100 | Set via `SET LOCAL` in `match_chunks` |

### Multi-Query Retrieval (AXIOM-specific)

The `/api/ask` route runs `hybridRetrieve()` once per sub-query from `interpretQuery()` (2–3 queries), then merges and deduplicates by `section_number`:

```typescript
async function multiQueryRetrieve(queries: string[], topKPerQuery = 8) {
  const results = await Promise.all(
    queries.map(q => hybridRetrieve(q, { topK: topKPerQuery, sourcesFilter: ALL_SOURCES }))
  );
  // Keep highest score per section across all queries
  const bySection = new Map<string, RetrievedSection>();
  for (const { sections } of results) {
    for (const s of sections) {
      const existing = bySection.get(s.section_number);
      if (!existing || s.score > existing.score) bySection.set(s.section_number, s);
    }
  }
  // Min score filter: RRF score < 0.020 = appeared in only one method with no corroboration
  return [...bySection.values()]
    .filter(s => s.score >= 0.020)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}
```

### Known Retrieval Gotchas

| Issue | Root cause | Fix |
|---|---|---|
| IVFFlat slow at 1.1M chunks | 100 lists × ~11K rows each → near-sequential scan (~41s) | Migrated to HNSW (migration 006/007) |
| `WHERE similarity > threshold` kills index | Forces full scan; IVFFlat/HNSW only optimizes `ORDER BY … LIMIT` | Always filter client-side after `LIMIT` |
| FTS misses `spousal` | Postgres English dictionary doesn't stem `spousal` → `spous` the way `spouse` does | Normalize query tokens before FTS |
| Broad ILIKE is unranked | `ILIKE '%spouse%'` matches thousands of rows in arbitrary order | Use FTS first; only fall back to ILIKE for specific tokens |
| Authenticator role timeout | PostgREST runs all requests through `authenticator` role (default 8s timeout) | Raised to 30s via `ALTER ROLE authenticator SET statement_timeout TO '30s'` |

---

## 5. Answer Generation Pipeline

**File:** `app/api/ask/route.ts`  
**Max duration:** 60 seconds (Vercel Pro serverless limit)

### Full Pipeline

```
POST /api/ask
  { question: string, history: HistoryMessage[] }
    │
    ▼
[1] interpretQuery(question, history) — GPT-4o, temp=0, JSON mode
    │   Returns:
    │   - retrieval_queries: string[]   2–3 targeted sub-queries for multi-hop retrieval
    │   - clean_question: string        standalone resolved question (pronouns resolved from history)
    │   - parties: string[]             ["primary worker (age 64, $3800 PIA)", "spouse (age 62)"]
    │   - benefit_types: string[]       ["spousal", "deemed_filing", "earnings_test"]
    │   - is_evaluating_advice: bool    true only if advisor presents specific advice for evaluation
    │   - is_followup: bool             true if question uses pronouns from prior turns
    │   - category: string              "social-security" | "irmaa"
    │
    ├── embed(clean_question) — text-embedding-3-small (reused for verified context)
    │
    ▼
[2] multiQueryRetrieve(retrieval_queries, topKPerQuery=8) — parallel
    │   Runs hybridRetrieve() for each sub-query in parallel
    │   Merges + deduplicates (highest RRF score wins per section)
    │   Filters: score >= 0.020
    │   Returns up to 15 sections
    │
[3] getVerifiedContext(clean_question, category, embedding) — parallel with [2]
    │   Runs match_verified_answers for BOTH categories (cross-category: SSA-44/IRMAA
    │   questions often miscategorized; search is cheap; never filter by category here)
    │   match_threshold: 0.70 | match_count: 5 per category
    │   Combines + sorts by similarity, takes top 3
    │   Fallback: published reference_pages from both categories (top 4)
    │   Returns: "--- VERIFIED ANSWERS ---\n..." prefix string
    │
    ▼
[4] generateAnswer(clean_question, parties, isEvaluating, isFollowup,
                   sections, verifiedContext, history) — GPT-4o, temp=0
    │   System prompt enforces 10 rules (see §5.1 below)
    │   Returns JSON:
    │   {
    │     verdict: "correct"|"incorrect"|"partial"|"no_advice_to_evaluate"|"uncertain"
    │     verdict_summary: string
    │     answer: string (HTML)
    │     primary_sources: [{section_number, url, tag}]
    │     gaps: string[]
    │   }
    │
    ▼
[5] verifyClaims(draft, sections, verifiedContext) — deterministic, non-LLM
    │   Extract specifics from answer text: fractions, %, $, ages, months, years
    │   Check each against normalised cited-section full_text
    │   Filter out $ values (client-supplied inputs, never in POMS verbatim)
    │   Cap reported unverified at 3
    │
    ▼
[6] Fire-and-forget: axiom_queries.insert (never blocks response)
    │
    ▼
Response:
  {
    verdict, verdict_summary, answer, primary_sources, gaps,
    retrieval_queries, parties, clean_question, category,
    sections_used: [{section_number, title, score, source_url}],
    verification: { passed: bool, unverified: [...] }
  }
```

### 5.1 Answer Generation System Prompt Rules

The system prompt for GPT-4o in `generateAnswer()` enforces:

1. **DECOMPOSE FIRST** — Identify each party (name, age, filing status). Work through applicable rules for each party in sequence, then write the answer.
2. **ANSWER DIRECTLY** — Lead with the direct answer: correct/incorrect/yes/no first, then explain.
3. **GROUND IN SOURCES ONLY** — Every specific rule, %, amount, age, formula must come verbatim from the provided sections or verified references. Never import training data.
4. **EVALUATE ADVICE WHEN ASKED** — If `is_evaluating_advice`, state: "The advice is correct / incorrect / partially correct" and explain exactly what is wrong.
5. **CITE SECTIONS** — After each claim, cite the section number in parentheses: `(RS 00615.201)`.
6. **FLAG GAPS** — Write `[SOURCE GAP: description]` if sources don't cover the question.
7. **NEVER GUESS** — If sources don't cover it, say so explicitly.
8. **NEVER SPEAK AS THE SSA** — Always third person: "SSA requires", not "we require". Never "our records", "contact us", etc.
9. **SPEAK TO THE ADVISOR AS "YOU"** — Address the advisor directly (`you`, `your client`). Refer to the CLIENT and people in the scenario in third person (`the client`, `the individual`, `the primary worker`, `the spouse`).
10. **FINANCIAL IMPACT CALCULATIONS** — Always compare total cumulative receipts over the same time window for each scenario. Never just multiply monthly benefit difference × months. Show side-by-side: (A) early-filing total receipts, (B) delayed-filing total receipts, (C) net difference = A − B.

**Additional context injected into the user prompt:**
- Prior 6 turns of conversation history (as `ADVISOR:` / `YOU:` labels)
- `PARTIES IN THIS SCENARIO:` block from `interpretQuery()`
- `NOTE:` directing the model on whether to evaluate advice, answer a follow-up, or treat as a fresh question
- `AVAILABLE SECTION NUMBERS` — exact list of section IDs that may appear in `primary_sources` (citation validation)
- Verified answers injected as `--- VERIFIED ANSWERS (confirmed correct by expert reviewers) ---`
- Source section full_text (truncated to 5000 chars each)

### 5.2 Self-Verification Gate

**File:** `scripts/draft/verify.ts`

Deterministic, non-LLM. Extracts numeric specifics from the draft and checks each against the cited-section full_text.

**Patterns extracted:**

| Pattern | Regex | Examples |
|---|---|---|
| Fractions | `\d+/\d+(?:\s+of\s+1%)?` (excludes MM/DD dates) | `25/36`, `5/9 of 1%`, `19/40` |
| Percentages | `\d+(?:\.\d+)?%` | `50%`, `6.2%`, `0.5%` |
| Dollar amounts | `\$[\d,]+(?:\.\d{2})?` | `$1,000`, `$105` |
| Ages | `\bage\s+\d{2}\b` | `age 62`, `age 66` |
| Month counts | `\b\d{2,3}\s+months?\b` | `36 months`, `120 months` |
| Year counts | `\b\d{1,2}\s+years?\b` | `10 years`, `5 years` |

**Normalisation before comparison:**
- `85%` ↔ `85 percent` (handles both forms in POMS)
- `19 /40` or `19/ 40` → `19/40` (spaces around fraction slash)
- `60 years old` / `60 years` → `age 60` (excluding "years of coverage")

**Dollar-amount filter (AXIOM-specific):** Dollar amounts derived by multiplying advisor-provided inputs by POMS formulas (`$3,800 × 0.75 = $2,850`) never appear verbatim in POMS text. Flagging them is noise. Both `/api/ask` and the page builder filter `u.value.startsWith('$')` from unverified claims before surfacing them.

**Gate outcomes:**

| Result | Draft Action |
|---|---|
| All values verified | `/api/ask`: respond normally; page builder: save as `draft` |
| Unverified values | `/api/ask`: include `verification.passed = false` in response, UI shows warning; page builder: save as `in_review` with flags in `draft_metadata` |
| Invented citation (not in retrieved set) | Page builder: blocks save entirely; triggers one self-correction retry |

---

## 6. Feedback & Learning Loop

### Three Feedback Surfaces

**1. Staff reviewer feedback (FeedbackBar in AskInterface)**  
Only shown when `reviewerName` prop is set (role = `staff` in `axiom_subscribers`).

```
┌─────────────────────────────────────┐
│  [✓ Verify]  [✎ Make Suggestion]   │
└─────────────────────────────────────┘

Verify → POST /api/feedback { feedback_type: 'approve' }
         → embed(question) → verified_answers.insert
         → GPT-4o generates learning analysis ("I learned that…")
         → UI shows "Verified" badge + analysis card

Make Suggestion → opens correction panel:
   Tags: [wrong section] [wrong value] [missing rule] [misread scenario]
   Free-text note
   [Save suggestion] → POST /api/feedback { feedback_type: 'correct' }
                    → POST /api/ask/rewrite { question, original_answer, correction_note }
                    → shows UpdatedResponsePanel (track-changes diff)
                    → [Confirm — fix worked] → POST /api/feedback { feedback_type: 'approve' }
                                              → verified_answers.insert(rewritten answer)
                    → [Still not right] → another correction cycle
   [Flag as wrong] → POST /api/feedback { feedback_type: 'reject' }
                   → answer_feedback.insert only (no verified_answers)
```

**2. Subscriber thumbs (SubscriberThumbs)**  
Only shown when `reviewerName` is null (subscriber, not staff).

```
┌─────────────────────────────────────────────────────┐
│  Beta Feedback   Was this answer helpful?           │
│  [👍 Helpful]  [👎 Not helpful]                     │
└─────────────────────────────────────────────────────┘

Either → POST /api/axiom/feedback (authenticated, subscriber-only)
       → axiom_feedback.insert { user_email, question, answer_excerpt, rating, comment }
       → shows in /admin/axiom-feedback dashboard
```

**3. KB page approval hook**  
When a reviewer approves any page via `saveAndApprove()`:
```
reference_pages { h1, quick_answer, primary_sources, category }
    → embed(h1)
    → verified_answers.upsert (keyed by question + category)
```
This pre-seeds the corpus with every human-approved KB page automatically — zero extra effort for reviewers.

### Rewrite Endpoint

**File:** `app/api/ask/rewrite/route.ts`

Takes the original answer + correction note → GPT-4o rewrites the answer incorporating the feedback.

```
POST /api/ask/rewrite
  { question, original_answer, correction_note, primary_sources }

System prompt: start from the original answer as base, fix errors, keep valid citations
Model: GPT-4o, temp=0.2, max_tokens=1500
Returns: { ok, answer (HTML), learned (plain text summary), primary_sources }
```

**Key fix (2026-09-05):** The endpoint now returns `primary_sources` from the request body, passing them through to the rewritten answer. Previously, citations were silently dropped when the rewrite was accepted.

### Section number extraction from correction notes

When `feedback_type = 'correct'`, the `/api/feedback` route scans `correction_note` for POMS/CFR section references using:

```
/\b(?:RS|GN|HI|SI|DI|RM|SM|MS|PR|PS|NL|TN|HBK)\s+\d{5}\.\d{3}[A-Z0-9]*|\b20\s+CFR\s+\d+\.\d+|\bHBK\s+\d+/gi
```

Any mentioned section numbers are merged into `primary_sources` before saving to `verified_answers`, so citations in the reviewer's note become clickable links on the verified answer.

### Learning Progression

| Phase | Mechanism | Benefit |
|---|---|---|
| Now | `verified_answers` injected as few-shot context | Agent answers with prior confirmed rulings |
| ~100 pairs | Review `answer_feedback.correction_tags` | Identify systematic retrieval/reasoning gaps |
| ~300 pairs | Fine-tune GPT-4o-mini on verified Q&A | Model learns Social Security reasoning patterns |
| Ongoing | Quarterly fine-tune cycles | Compound improvement |

---

## 7. Page Generation Pipeline

### Topic Queue

Topics are maintained in two places:
- **`lib/topic-queue.ts`** — `TOPIC_QUEUE` array of `{slug, title, topic, category}` (used for batch generation from the admin UI)
- **`codex_topics` table** — Supabase-backed topic list with status tracking, used by the topic management admin page

### Generation Modes

**Mode 1: Custom topic (from admin topics page)**  
Reviewer creates a new topic → `/api/admin/generate` (body.custom=true) → inserts into `generation_jobs` → returns `async: true` → generation-worker.ts picks it up within 60s.

**Mode 2: Queue batch (from admin kb-review page)**  
Reviewer clicks "Generate" → sends specific slugs or category → `/api/admin/generate` → calls `runDraft()` directly (synchronous, within Vercel function timeout). Hard ceiling: `MAX_COUNT = 10` per batch.

### Generation Worker

**File:** `scripts/generation-worker.ts`  
**Cron:** `* * * * *` (every minute on NSSA's Mac Studio)  
**Log:** `/tmp/generation-worker.log`  
**Env:** `.env.worker` (never overwritten by `vercel env pull`)

```
Cron tick:
    │
    ▼
SELECT * FROM generation_jobs WHERE status='pending' ORDER BY created_at LIMIT 1
    │
    ├── No jobs → log "No pending jobs." → exit
    │
    └── Job found:
          UPDATE generation_jobs SET status='running', started_at=now()
          WHERE id=<job.id> AND status='pending'  ← guard against double-pickup
              │
              ▼
          runDraft({ topic, title, slug, category, skipWorkedExample: true })
              │
              ├── Success:
              │     Check codex_topics.status — only reset to 'in_review' if NOT 'published'
              │     (guards against clobbering approved work during concurrent review)
              │     UPDATE generation_jobs SET status='done', page_id=<id>, finished_at=now()
              │
              └── Error:
                    UPDATE generation_jobs SET status='error', error=<msg>, finished_at=now()
```

### Draft Pipeline (`draft_page_v2.ts`)

```
runDraft({ topic, title, slug, category, topK=15, dryRun=false })
    │
    ▼
[1] Hybrid retrieval (topK sections)
    sourcesFilter: IRMAA_SOURCES if category='irmaa', else SS_SOURCES
    (AXIOM worker always uses category-appropriate sources, not ALL_SOURCES)
    │
    ▼
[2] GPT-4o drafting
    SYSTEM_PROMPT: 9 non-negotiable rules (no importing outside knowledge,
    state operative specifics, flag SOURCE GAPs, distinguish benefit types, etc.)
    Returns JSON: { title, h1, seo_title, meta_description, eyebrow,
                    quick_answer, body_sections, worked_example, faq, primary_sources }
    MAX_SECTION_CHARS = 15000 per source in user prompt
    │
    ▼
[3] Citation validation
    All section_numbers in primary_sources must exist in retrieved set
    On failure → GPT-4o self-correction retry:
      "The following section_numbers are invalid: [...]. The ONLY valid values are: [...]"
      Match each invalid citation to closest valid section_number
    On failure after retry → throw Error (blocks save)
    │
    ▼
[4] SOURCE GAP check
    Scan draft JSON text for /\[SOURCE GAP[^\]]*\]/g
    Log warnings; flag in draft_metadata but do NOT block save
    │
    ▼
[5] Self-verification (verifyClaims)
    See §5.2
    │
    ├── passed=true → status = 'draft'
    └── passed=false → status = 'in_review'
    │
    ▼
[6] DB upsert
    If existing 'draft' row with same slug → UPDATE (overwrite)
    If existing non-draft row → throw Error (protects published/approved)
    Else → INSERT
    draft_metadata = { pipeline_version, drafted_at, topic, trace, verification, source_gaps }
```

**Key fix (2026-09-05):** The slug overwrite check now allows re-generation of existing drafts (any row with `status = 'draft'` is overwritten with the fresh content). Previously, regeneration was blocked even for drafts.

### Eyebrow Vocabulary (constrained to this exact list)

**Social Security:** `Claiming Rules` · `Spousal & Divorced Benefits` · `Survivor Benefits` · `Earnings Test` · `WEP & GPO` · `Benefit Calculation` · `Family Benefits` · `Filing & Enrollment` · `Appeals & Reconsideration` · `Medicare Enrollment`

**IRMAA & Medicare:** `IRMAA Basics` · `IRMAA Appeals` · `Medicare Part B` · `Medicare Part D`

---

## 8. Access Control

### AXIOM Subscriber Model (main path)

```
User → axiom.nssapros.com
    │
    ├── Not authenticated → redirect to /login
    │       │
    │       ▼
    │   /axiom/login: Supabase signInWithOtp({ email })
    │       → Supabase sends magic link + 6-digit OTP
    │       → User clicks link or enters OTP
    │       → /auth/callback: exchangeCodeForSession(code)
    │       → session cookie set → redirect to /axiom
    │
    └── Authenticated (session valid):
            app/axiom/page.tsx:
              createSessionClient().auth.getUser()
              → SELECT from axiom_subscribers WHERE email = userEmail
              → if no row OR status != 'active' → not authorized (error shown)
              → if status = 'active' AND role = 'staff' → reviewerName set → FeedbackBar shown
              → if status = 'active' AND role = 'subscriber' → SubscriberThumbs shown
```

**Error states on `/login`:**
- `?error=not_subscriber` — email not in `axiom_subscribers`
- `?error=past_due` — subscription has a payment issue
- `?error=auth_failed` — magic link expired or invalid

### Provisioning Flow (Kajabi → Zapier → AXIOM)

```
Kajabi purchase event
    │
    ▼
Zapier webhook → POST /api/axiom/provision
    Header: x-axiom-secret: <AXIOM_PROVISION_SECRET>
    Body: { action: "provision"|"revoke"|"past_due", email, tier?, kajabi_purchase_id? }
    │
    ├── provision → axiom_subscribers.upsert({ status:'active', tier, role:'subscriber' })
    ├── revoke    → axiom_subscribers.update({ status:'cancelled' })
    └── past_due  → axiom_subscribers.update({ status:'past_due' })
```

### Public Beta Enrollment (direct)

```
/axiom/join (public, no auth):
    Form: name, email, credential (nssa/irmaacp/both)
    → POST /api/axiom/enroll
      → axiom_subscribers.insert({ status:'active', tier:'standard', role:'subscriber' })
      → returns 'enrolled' | 'already_enrolled' | 'reactivated'
    → UI redirects user to /axiom/login
```

### Fidelity Demo Model (cookie-based)

Used for white-label demos — no Supabase subscription required.

```
/axiom/fidelity:
    1. Check cookies.get('axiom_access')
       → if missing/wrong → render <AxiomGate /> (password form)
       → POST /api/axiom-auth { password } → sets axiom_access httpOnly cookie (30 days)

    2. Check cookies.get('axiom_reviewer')
       → if missing → render <ReviewerGate /> (name selector)
       → POST /api/axiom-reviewer { reviewer_name } → sets axiom_reviewer cookie (30 days)
       → Valid names: Jason Stanley, Cindi Hill, Todd Valles, Jim Blair, Travis Stanley

    3. Both cookies present → render full AskInterface with reviewerName set
```

### KB Admin Access (for staff reviewers)

The KB admin at `/admin/kb-review` uses Supabase magic link auth. Email must be in `kb_reviewers` table or equal `ADMIN_EMAIL` (`jstanley@nssapros.com`).

---

## 9. Frontend — AskInterface

**File:** `app/axiom/AskInterface.tsx`  
A single client component. Used from `/axiom/page.tsx` (subscriber mode) and `/axiom/fidelity/page.tsx` (Fidelity demo mode with custom theme).

### Component Props

```typescript
interface AskInterfaceProps {
  sourceSummary?: string;    // "18,432 source documents · 1,102,000 indexed passages"
  reviewerName?: string | null; // null = subscriber; string = show FeedbackBar
  userEmail?: string;        // used for SubscriberThumbs
  theme?: Partial<AskTheme>; // accent colors — overridden for Fidelity green
}
```

### State

| State | Persisted | Notes |
|---|---|---|
| `turns: Turn[]` | localStorage (7 days, max 30 turns) | Full conversation with answers, feedback state |
| `input: string` | No | Current textarea content |
| `sectionsOpen: Record<number, boolean>` | No | Which turns have retrieved sections expanded |
| Feedback cache | localStorage (max 300 entries) | Normalized question → `{type, analysis, ts}` — re-shows badges on page reload |

### Turn Structure

```typescript
interface Turn {
  question: string;
  answer: Answer | null;
  loading?: boolean;
  error?: string;
  feedback?: 'approve' | 'correct' | 'reject' | null;
  feedbackAnalysis?: string;      // GPT-4o learning summary from /api/feedback
  rerunLoading?: boolean;         // true while /api/ask/rewrite is running
  rerunAnswer?: Answer | null;    // rewritten answer from /api/ask/rewrite
  rerunFeedback?: 'approve' | 'reject' | null;  // reviewer verdict on rewrite
}
```

### Conversation History

Each turn builds `history` from prior completed turns (max last 6):

```typescript
function buildHistory() {
  return turns
    .filter(t => t.answer)
    .flatMap(t => [
      { role: 'user', content: t.question },
      { role: 'assistant', content: stripHtml(t.answer.answer) },
    ]);
}
```

Passed to `POST /api/ask` in the `history` field. The query interpreter uses it to resolve follow-up pronouns (`clean_question`) and to avoid re-evaluating already-settled premises (`is_followup = true`).

### Loading Animation (LoadingBubble)

Four-step progress indicator with animated SVG ring (0–90% progress):

| Step | Label | Detail | Duration |
|---|---|---|---|
| 0 | Searching primary sources | POMS · CFR · SSA Handbook | 2.5s |
| 1 | Matching relevant sections | Hybrid retrieval · scoring | 3.5s |
| 2 | Checking verified answers | Expert-reviewed corpus | 2.0s |
| 3 | Grounding the response | GPT-4o · chain-of-thought | Holds at 90% until answer arrives |

### Verdict Display

The answer includes a verdict pill colored by type:

| Verdict | Color | Label |
|---|---|---|
| `correct` | Green | ✓ Correct |
| `incorrect` | Red | ✗ Incorrect |
| `partial` | Amber | ⚠ Partially correct |
| `no_advice_to_evaluate` | Navy/blue | ℹ Reference |
| `uncertain` | Dark | ? Uncertain |

`no_advice_to_evaluate` is set when the advisor asks a genuine information-seeking question (not evaluating advice). The verdict pill is **not shown** for this type — it would be confusing/meaningless for reference answers.

### UpdatedResponsePanel (track-changes diff)

After a staff reviewer submits a correction and the rewrite arrives, `UpdatedResponsePanel` shows a word-level diff between the original and revised answer using the LCS algorithm:

- **Green highlight:** words added in the revision
- **Red strikethrough:** words removed from the original
- Toggle: **Track Changes** / **Clean** (shows rewritten answer without markup)
- Actions: **Confirm — fix worked** (approves the rewrite to `verified_answers`) · **Still not right** (another correction cycle)

### Theme Support

The `AskInterface` accepts a `theme` override for white-label deployments:

```typescript
interface AskTheme {
  accent:      string;  // button, user bubble, textarea border
  accentDark:  string;  // disabled/hover shade
  textareaBg:  string;  // input area background
  shadowColor: string;  // rgba for textarea glow
}
```

Fidelity uses green (`#006044`) instead of NSSA blue (`#1C80BC`).

### Keyboard & UX

- `Enter` → submit; `Shift+Enter` → new line
- "New question" button portals into the header when conversation is active
- Auto-scroll to bottom on each new turn
- Empty-state shows 4 example prompts as clickable quick-start buttons

---

## 10. Admin Tools

All admin pages require Supabase session auth. Email must match `kb_reviewers` or be `jstanley@nssapros.com`.

### `/admin/kb-review` — Main KB review queue

**Page:** `app/admin/kb-review/page.tsx`  
**Editor:** `app/admin/kb-review/[id]/ReviewEditor.tsx`  
**Actions:** `app/admin/kb-review/actions.ts`

**Queue tabs:** Review Due (⚑, default) · Needs Review · Drafts · Published · Superseded

**Review Due definition:** Published pages with `source_last_verified` > 12 months ago, OR all `draft`/`in_review` pages.

**Editor layout:**
- **Left pane:** Editable fields — title, h1, SEO title, meta description, eyebrow, quick answer (rich text editor), body sections (individual prose + citation_ref per section), FAQ, primary sources, reviewer, deprecation note
- **Right pane:** Live preview — verdict flag banner, inline SOURCE GAP blocks (red), Verify/Make Suggestion per section and per FAQ item

**Actions (server actions in `actions.ts`):**

| Action | Effect |
|---|---|
| `saveDraft()` | Updates fields, preserves status, writes history snapshot |
| `saveAndApprove()` | Sets `status='published'`, stamps dates, seeds `verified_answers`, syncs `codex_topics`, fires Vercel deploy hook, pings IndexNow |
| `sendBackToReview()` | Sets `status='in_review'`, clears `source_last_verified`, syncs `codex_topics` |
| `supersedePageAction()` | Sets `status='superseded'`, writes `deprecation_note` |
| `deletePage()` | Admin-only; sets `status='deleted'`; only for non-published pages; snapshots first |

**Page history:** `reference_pages_history` table — every action snapshots the full page row before modifying it.

### `/admin/axiom-feedback` — Subscriber beta feedback

Shows aggregate stats (total ratings, positive %, negative count, last 7 days, unique contributors) and a filterable table of all `axiom_feedback` rows. Filter tabs: All / 👍 Positive / 👎 Negative.

### `/admin/axiom-subscribers` — Subscriber management

Lists all `axiom_subscribers` rows with status badges. Supports manual provisioning (safety net for Zapier misses), status changes (activate/revoke), and tier edits. Staff accounts shown in blue rows with a note not to revoke them.

### `/admin/db-health` — Corpus health dashboard

Live stats:
- Source document counts by source type, doc kind, embedding state
- Chunk count and embedding coverage percentage
- KB reference page counts by status
- Live ingest/embedder progress via `IngestProgress` client component (polls `/api/admin/ingest-status`)

Source type metadata shows expected URL index ranges and notes (e.g., POMS: "15,566 rule + 1,284 toc").

### `/admin/topics` — Topic queue management

Lists `codex_topics` rows by status. Reviewers can create new topics (via custom generation form), trigger generation for pending topics, or change status. `TopicActions` client component handles the generate button and status toggles.

### `/admin/coverage` — Coverage statistics

Reads from `coverage.json` (generated by `scripts/coverage-report.ts`). Shows:
- Corpus overview: total POMS sections, advisor-relevant (Tier 1+2), published pages, cited sections
- Per-cluster progress bars (red <10%, yellow 10–40%, green 40%+)
- Suggested next draft clusters (largest uncovered Tier 1 topics)

Refresh: `npx tsx scripts/coverage-report.ts --json`

### `/admin/my-feedback` — Per-reviewer feedback log

Shows the reviewer's own `answer_feedback` history — approve/correct/reject counts and individual entries with correction tags and notes. Useful for reviewing one's own quality signal over time.

### `/admin/leaderboard` — Feedback leaderboard

Aggregate view of `answer_feedback` by reviewer. Date range picker for filtering. Shows approve/correct/reject counts per reviewer — gamification for the review team.

---

## 11. Infrastructure & Deployment

### Vercel Deployment

```bash
cd /Users/nssaagent/knowledge
vercel deploy --prod
```

**Build:** Next.js SSG for published pages (`generateStaticParams()`). Admin, agent, and AXIOM pages are `force-dynamic`.

**Base path:** `/codex` — the app is served from `www.nssapros.com/codex` by Cloudflare Worker `nssa-path-proxy`.

**Cache strategy:**
- `/_next/static/*` — `public, max-age=31536000, immutable`
- `/(social-security|irmaa)/*` — `public, s-maxage=3600, stale-while-revalidate=604800`

**Cache invalidation:** `revalidatePath('/admin/kb-review', 'page')` called on approval/save. Deploy hook (Vercel) fired on every page approval to rebuild SSG pages immediately.

### Cloudflare Routing

`nssa-path-proxy` Cloudflare Worker routes:
- `/blog` → Vercel app (blog)
- `/directory` → Vercel app (advisor directory)
- `/codex` → Vercel app (knowledge base + AXIOM)
- `/admin` → Vercel app (admin routes)

CORS note: Next.js CSRF protection requires `allowedOrigins: ['www.nssapros.com', 'knowledge.nssapros.com', 'axiom.nssapros.com']` in `next.config.ts` `experimental.serverActions` because the Cloudflare Worker proxy changes the `Origin` header relative to the `Host`.

### axiom.nssapros.com Domain Routing

Handled in `vercel.json` using Vercel's `has: [{type:"host"}]` matchers:

```json
{
  "rewrites": [
    { "source": "/join",  "destination": "/codex/axiom/join",  "has": [{"type":"host","value":"axiom.nssapros.com"}] },
    { "source": "/login", "destination": "/codex/axiom/login", "has": [{"type":"host","value":"axiom.nssapros.com"}] }
  ],
  "redirects": [
    { "source": "/", "destination": "/codex/axiom", "permanent": false, "has": [{"type":"host","value":"axiom.nssapros.com"}] }
  ]
}
```

Root requests to `axiom.nssapros.com/` redirect to `/codex/axiom`. Join and login pages are rewritten to their full `/codex/axiom/…` paths without a redirect.

### Generation Worker (Local Cron)

**File:** `scripts/generation-worker.ts`  
**Schedule:** Every minute — crontab on NSSA's Mac Studio:

```
* * * * * cd /Users/nssaagent/knowledge && npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/generation-worker.ts >> /tmp/generation-worker.log 2>&1
```

**Key:** Uses `--env-file .env.worker` — NOT `.env.local` — because running `vercel env pull` overwrites `.env.local` with Vercel's production env snapshot, which can wipe the worker's local env vars. `.env.worker` is managed manually and is never touched by `vercel env pull`.

**Why local, not Vercel:** `runDraft()` takes 30–120 seconds per page (retrieval + GPT-4o + verification). Vercel serverless functions time out at 60 seconds (Pro plan max). The generation worker runs locally with no timeout.

### Environment Files

| File | Purpose | Managed by |
|---|---|---|
| `.env.local` | Local development + Vercel env pull target | Auto (vercel env pull) |
| `.env.worker` | Generation worker cron env | Manual only — NEVER overwrite with vercel env pull |
| `.env.vercel-live` | Snapshot of Vercel production vars (reference only) | Auto (vercel env pull) |
| `.env.vercel-prod` | Snapshot of Vercel production vars (reference only) | Auto |

### Supabase Configuration

| Setting | Value |
|---|---|
| Project ID | `eqipvrcmugnvkextqmym` |
| Region | US East |
| Admin email | `jstanley@nssapros.com` |
| `authenticator` role timeout | 30s (raised from 8s in migration 004) |
| `authenticated` role timeout | 30s |

**RLS summary:**
- `source_documents`, `source_chunks`: No public read (raw corpus, never published)
- `reference_pages`: Public read on `status IN ('published', 'superseded')`
- `verified_answers`, `answer_feedback`, `axiom_subscribers`, etc.: Service role only (no public access)

### Migration History

| File | Applied | Content |
|---|---|---|
| `001_initial_schema.sql` | Initial | source_documents, source_chunks (IVFFlat), reference_pages, verified_answers, unanswered_questions, RLS policies, match_source_chunks, match_verified_answers |
| `002_add_superseded.sql` | Post-launch | `superseded` status enum value, `deprecation_note` column, updated RLS policy to include superseded |
| `003_kb_reviewers.sql` | 2026-07-14 | `kb_reviewers` table, seed (Cindi, Todd, Jim), `approved_by`/`approved_at` on reference_pages |
| `004_hybrid_search.sql` | 2026-07-16 | `match_chunks` function (IVFFlat, probes=3), `search_documents_fts` function, GIN index, `draft_metadata` column, role timeouts |
| `005_cms_medicare_versioning.sql` | 2026-07-xx | CMS/Medicare source types, versioning (superseded_at) |
| `005_partners_logo_url.sql` | 2026-07-xx | Partners table logo_url (unrelated to AXIOM) |
| `006_hnsw_index.sql` | 2026-09-05 (in progress) | DROP IVFFlat; CREATE INDEX CONCURRENTLY HNSW (m=16, ef_construction=64) |
| `007_hnsw_match_chunks.sql` | 2026-09-05 | Replaces `match_chunks` function: removes `ivfflat.probes`, adds `hnsw.ef_search=100` |

**Tables not in migrations (created ad-hoc):** `answer_feedback`, `axiom_queries`, `axiom_subscribers`, `axiom_feedback`, `codex_topics`, `generation_jobs`, `reference_pages_history`, `kb_reviewers` (updated), `partners`

---

## 12. API Reference

### `POST /codex/api/ask`

Main advisor Q&A endpoint. Max duration: 60 seconds.

**Request:**
```json
{
  "question": "string",
  "history": [{"role": "user"|"assistant", "content": "string"}]
}
```

**Response:**
```json
{
  "verdict": "correct"|"incorrect"|"partial"|"no_advice_to_evaluate"|"uncertain",
  "verdict_summary": "string",
  "answer": "HTML string",
  "primary_sources": [{"section_number": "string", "url": "string", "tag": "Source"}],
  "gaps": ["string"],
  "retrieval_queries": ["string"],
  "parties": ["string"],
  "clean_question": "string",
  "category": "social-security"|"irmaa",
  "sections_used": [{"section_number": "string", "title": "string|null", "score": 0.0, "source_url": "string"}],
  "verification": {"passed": true, "unverified": [{"value": "string", "context": "string"}]}
}
```

### `POST /codex/api/ask/rewrite`

Rewrite an existing answer with a reviewer's correction note.

**Request:**
```json
{
  "question": "string",
  "original_answer": "HTML string",
  "correction_note": "string",
  "primary_sources": [{"section_number": "string", "url": "string", "tag": "string"}]
}
```

**Response:**
```json
{
  "ok": true,
  "answer": "HTML string (rewritten)",
  "learned": "string (plain text, first-person learning summary)",
  "primary_sources": [...]
}
```

### `POST /codex/api/feedback`

Staff reviewer feedback. Saves to `answer_feedback` always; saves to `verified_answers` on `approve` or `correct`.

**Request:**
```json
{
  "question": "string",
  "original_answer": "string",
  "corrected_answer": "string (optional)",
  "verdict": "string",
  "primary_sources": [...],
  "sections_used": [...],
  "feedback_type": "approve"|"correct"|"reject",
  "correction_tags": ["wrong_section"|"wrong_value"|"missing_rule"|"misread_scenario"],
  "correction_note": "string",
  "category": "social-security"|"irmaa",
  "reviewer_name": "string"
}
```

**Response:** `{ ok: true, analysis: "string (GPT-4o learning summary)" }`

### `POST /codex/api/axiom/provision`

Zapier webhook. Requires `x-axiom-secret` header.

**Request:**
```json
{
  "action": "provision"|"revoke"|"past_due",
  "email": "string",
  "tier": "standard"|"arpi_grad"|"firm"|"staff",
  "kajabi_purchase_id": "string"
}
```

**Response:** `{ ok: true, action, email }`

### `POST /codex/api/axiom/enroll`

Public beta self-enrollment.

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "credential": "nssa"|"irmaacp"|"both"
}
```

**Response:** `{ result: "enrolled"|"already_enrolled"|"reactivated" }`

### `POST /codex/api/axiom/feedback`

Subscriber thumbs feedback. Requires Supabase session + active subscriber.

**Request:**
```json
{
  "question": "string",
  "answer_excerpt": "string (optional, ≤500 chars)",
  "rating": "positive"|"negative",
  "comment": "string (optional)"
}
```

**Response:** `{ ok: true }`

### `POST /codex/api/admin/generate`

Trigger page generation (admin/reviewer only). Two modes:
- **Custom:** `{ custom: true, title, topic, category, slug? }` → enqueues to `generation_jobs` (async)
- **Queue:** `{ slugs?: string[], category?, count? }` → runs `runDraft()` synchronously (max 10)

---

## 13. Environment Variables

### Required for all runtime (`.env.local` / Vercel)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://eqipvrcmugnvkextqmym.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only — bypasses RLS) |
| `OPENAI_API_KEY` | OpenAI API key (embeddings + GPT-4o) |

### AXIOM-specific

| Variable | Purpose |
|---|---|
| `AXIOM_PASSWORD` | Password for cookie-based gate (Fidelity demo, `/axiom/fidelity`) |
| `AXIOM_PROVISION_SECRET` | Shared secret for Zapier provisioning webhook (`x-axiom-secret` header) |

### Worker-specific (`.env.worker` only)

Same as above — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. Kept separately to avoid being overwritten by `vercel env pull`.

### Optional

| Variable | Purpose |
|---|---|
| `VERCEL_DEPLOY_HOOK_URL` | Triggers Vercel rebuild on KB page approval |
| `GSC_CLIENT_ID` / `GSC_SITE` | Google Search Console integration |
| `INDEXNOW_KEY` | IndexNow API key for search engine ping on publish |

---

## 14. Known Issues & Recent Fixes

### Fixed 2026-09-05

**Rewrite endpoint dropping `primary_sources`**  
- **Symptom:** After a reviewer corrected an answer and confirmed the rewrite, citations disappeared from the displayed answer.
- **Root cause:** `/api/ask/rewrite` returned only `{ok, answer, learned}` — `primary_sources` was not passed through. `AskInterface` would update `turn.answer` but had no sources to display.
- **Fix:** `/api/ask/rewrite` now returns `primary_sources: primary_sources ?? []` (passed from request body). The rewrite doesn't do a fresh retrieval pass, so it carries forward the original citations.

**Draft overwrite blocked regeneration**  
- **Symptom:** Regenerating a page that already had a `draft` row failed with "Slug already exists (status: draft)."
- **Root cause:** `draft_page_v2.ts` threw an error if any row with the same slug existed, regardless of status.
- **Fix:** The overwrite check now only blocks `status NOT IN ('draft')`. Existing draft rows are `UPDATE`d with fresh content. Non-draft statuses (published, in_review, approved, superseded) still block regeneration.

### Fixed Earlier (August/September 2026)

**Citation validation failure on CMSPDF topics**  
- **Symptom:** IRMAA topics backed by CMS PDF documents (`CMSPDF:` section prefix) always failed citation validation, blocking page saves.
- **Root cause:** The model cited section numbers in the format returned by `primary_sources[]` but the PDF section numbers didn't exactly match any of the retrieved sections due to CMS PDF naming conventions.
- **Fix:** `draft_page_v2.ts` now provides an explicit list of valid section numbers in the user prompt. When validation fails, a self-correction retry asks GPT-4o to re-map invalid citations to the closest valid section number from the list.

**Generation worker env wipe (`vercel env pull`)**  
- **Symptom:** Generation worker stopped working after a `vercel env pull` run, with authentication errors.
- **Root cause:** `vercel env pull` overwrites `.env.local` with a Vercel environment snapshot that may omit or differ from locally-set secrets needed by the worker.
- **Fix:** Worker now reads from `.env.worker` via `--env-file .env.worker` flag. `.env.worker` is managed manually and documented as "never overwrite with `vercel env pull`".

### In Progress 2026-09-05

**IVFFlat → HNSW index migration**  
- **Migration 006** drops the IVFFlat index and creates HNSW concurrently.
- `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block — must be run manually in Supabase SQL editor as a split statement.
- **Migration 007** updates `match_chunks` to use `SET LOCAL hnsw.ef_search = 100` instead of `ivfflat.probes = 3`.
- **Status:** HNSW index is being built as of 2026-09-05. Until the build completes, queries fall back to sequential scan. Migration 007 should be applied immediately after 006 completes.
- **Motivation:** At 1.1M chunks with IVFFlat lists=100, each scan touches ~11,000 rows per list × 3 probes = ~33,000 rows but the planner was choosing near-full scans (~41 seconds). HNSW has no rebuild-after-insert requirement and better recall at this scale.

---

## 15. Key Design Decisions

### Hybrid retrieval over pure vector search

Vector search alone misses exact tokens: section numbers (`RS 00615.201`), fractions (`25/36`), benefit-type labels (`spousal`, `widower`). Keyword search alone has no semantic understanding. RRF fusion gives each method equal standing and requires no weight tuning — the `k=60` constant provides a stable combination.

### Multi-query retrieval for complex scenarios

Single queries for multi-party scenarios (spousal + earnings test + deemed filing) retrieve primarily sections relevant to the dominant topic. Decomposing into 2–3 sub-queries and running them in parallel surfaces sections for each rule independently, then deduplication keeps the best-scoring version of each section.

### Verified answers as few-shot context, not fine-tuning

Fine-tuning is the long-term goal (~300 verified pairs). The `verified_answers` corpus provides an interim solution: every approved KB page and every staff thumbs-up injects a verified Q&A pair. At query time, semantically similar pairs are injected into the GPT-4o prompt as authoritative context. This gives the model the correct answer for known question patterns without requiring a model update cycle.

### Cross-category verified answer search

The query interpreter classifies questions as `social-security` or `irmaa`. SSA-44 (IRMAA appeal) questions are frequently classified as `social-security` because SSA issues the form. Filtering `match_verified_answers` by category would make correct IRMAA verified answers invisible to these questions. The verified answer corpus is small; cross-category search is cheap and safe.

### Mechanical verification gate, not LLM verification

LLMs can be convinced a value is "approximately" correct. Substring matching is binary — `25/36` is either in the cited source text or it isn't. The gate catches every numeric specific the model cannot trace to a source. Dollar amounts derived from advisor-provided inputs are excluded (they are client-specific calculations, never in POMS verbatim).

### Pages save with flags rather than blocking

Early versions blocked the page save if any values were unverified. This deadlocked topics where POMS expresses values in tables that are not parseable as inline text (e.g., WEP percentage tables). Now: unverified values save the page as `in_review`, store flag annotations in `draft_metadata`, and surface them in the review editor as inline red blocks for human review.

### Local generation worker instead of Vercel function

Draft generation takes 30–120 seconds — well over Vercel Pro's 60-second serverless limit. The local cron worker on the Mac Studio has no timeout and has direct access to the local `.env.worker` config. The `generation_jobs` queue decouples the admin UI from generation time: the reviewer sees "queued" immediately; the page appears in `in_review` within ~60 seconds.

### Cookie-based auth for Fidelity demo, Supabase for subscribers

The subscriber model needs real auth (OTP magic link) to associate feedback with verified email addresses. The Fidelity demo is a temporary white-label experience for a specific team — a shared password and reviewer name selection is appropriate for this use case without requiring full account provisioning.

---

*Document maintained by Tank. Version 2.0 — 2026-09-05. Update when significant architectural changes are made.*
