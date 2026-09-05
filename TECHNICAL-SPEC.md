# NSSA Knowledge Base & AXIOM — Technical Specification

**Version:** 2.0
**Date:** 2026-09-05
**Author:** Tank / Jason Stanley
**Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Corpus & Ingestion](#4-corpus--ingestion)
5. [Retrieval Pipeline](#5-retrieval-pipeline)
6. [AXIOM — Advisor Q&A Agent](#6-axiom--advisor-qa-agent)
7. [Feedback & Learning Loop](#7-feedback--learning-loop)
8. [Page Generation Pipeline](#8-page-generation-pipeline)
9. [Self-Verification Gate](#9-self-verification-gate)
10. [AXIOM Access Control](#10-axiom-access-control)
11. [Admin Tools](#11-admin-tools)
12. [Public-Facing KB Site](#12-public-facing-kb-site)
13. [Infrastructure](#13-infrastructure)
14. [API Reference](#14-api-reference)
15. [Environment Variables](#15-environment-variables)
16. [Known Issues & Recent Fixes](#16-known-issues--recent-fixes)
17. [Key Design Decisions](#17-key-design-decisions)

---

## 1. System Overview

The NSSA platform has two distinct but deeply connected products sharing one codebase and database:

**Knowledge Base** (`knowledge.nssapros.com`) — A publicly indexed reference library of Social Security and IRMAA/Medicare rules. Every page is generated from primary federal sources (POMS, CFR, SSA Handbook, CMS), mechanically verified for factual grounding, and approved by a certified human expert before publishing. Target audience: SEO-driven discovery by advisors, clients, and the public.

**AXIOM** (`axiom.nssapros.com`) — A gated AI research assistant for NSSA-credentialed financial advisors. Advisors ask questions about client scenarios; AXIOM retrieves grounded answers from the same corpus and cites specific federal sources. Every answer is traceable to a real rule. Target audience: active NSSA® and IRMAACP™ credential holders.

**Core principle:** All knowledge in both products traces to federal primary sources. No claim is made that cannot be pointed back to a specific SSA POMS section, CFR section, or CMS guidance document.

---

## 2. Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │         Vercel Edge / Serverless             │
                 │  knowledge.nssapros.com (Next.js App Router) │
                 └──────┬──────────────┬────────────┬──────────┘
                        │              │            │
              ┌──────────▼──┐  ┌───────▼──────┐ ┌──▼───────────────┐
              │  Public KB  │  │  AXIOM /codex│ │  Admin /admin/   │
              │  /social-   │  │  /axiom      │ │  kb-review       │
              │  security/* │  │  axiom.nssa  │ │  topics          │
              │  /irmaa/*   │  │  pros.com    │ │  coverage        │
              └──────┬──────┘  └───────┬──────┘ └──┬───────────────┘
                     │                 │            │
                     └─────────────────┴────────────┘
                                       │
                     ┌─────────────────▼──────────────────┐
                     │            Supabase (PostgreSQL)    │
                     │   Project: eqipvrcmugnvkextqmym     │
                     │   Region: US East                   │
                     │                                     │
                     │  Tables:                            │
                     │  source_documents  source_chunks    │
                     │  reference_pages   codex_topics     │
                     │  generation_jobs   verified_answers │
                     │  answer_feedback   axiom_queries    │
                     │  axiom_subscribers kb_reviewers     │
                     └────────────────────────────────────-┘
                                       │
                     ┌─────────────────▼──────────────────┐
                     │              OpenAI                 │
                     │  text-embedding-3-small (1536-dim)  │
                     │  gpt-4o (interpretation + drafting) │
                     └────────────────────────────────────-┘
                                       │
                     ┌─────────────────▼──────────────────┐
                     │      Mac Studio (Local Cron)        │
                     │  generation-worker.ts               │
                     │  * * * * * .env.worker              │
                     └────────────────────────────────────-┘
```

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Hosting | Vercel (Pro plan — 60s function timeout) |
| Database | Supabase PostgreSQL (`eqipvrcmugnvkextqmym`) |
| Vector search | pgvector HNSW index (1536-dim, cosine) |
| Full-text search | PostgreSQL GIN index + `tsvector` |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| LLM | `gpt-4o` — query interpretation, answer generation, drafting |
| Auth | Supabase magic link (OTP) |
| Routing | Cloudflare Worker `nssa-path-proxy` → /codex, /directory, /blog |

---

## 3. Data Model

### `source_documents`
Raw corpus documents. Every citable source lives here.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `section_number` | text UNIQUE | e.g. `RS 00615.205`, `CMSPDF:medicare/...` |
| `title` | text | Section title from SSA/CMS |
| `full_text` | text | Full cleaned content |
| `source_url` | text | Canonical URL |
| `doc_kind` | text | `rule` / `toc` / `empty` |
| `source_type` | text | `poms` / `cfr` / `handbook` / `cms` / `medicare` / `cmspdf` |
| `superseded_at` | timestamptz | NULL = active; non-null = superseded |
| `created_at` | timestamptz | |

**Indexes:** GIN tsvector `idx_source_docs_fts` on `to_tsvector('english', full_text)`.

---

### `source_chunks`
Chunked and embedded slices of source documents for vector search.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `source_document_id` | uuid FK → `source_documents` | |
| `section_number` | text | Denormalized from parent |
| `chunk_text` | text | ~800 chars / ~200 tokens |
| `embedding` | vector(1536) | OpenAI `text-embedding-3-small` |

**Indexes:**
- `idx_source_chunks_embedding_hnsw` — HNSW (`m=16, ef_construction=64`) on `embedding` (cosine ops). Applied 2026-09-05.
- (Previously: IVFFlat with `lists=100` — retired due to corpus growth to 1.1M chunks.)

**Scale:** ~1.1M chunks across all source types.

---

### `reference_pages`
Published and draft KB reference pages.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text UNIQUE | URL path segment |
| `category` | text | `social-security` / `irmaa` |
| `title` | text | Short label (breadcrumbs, admin) |
| `h1` | text | SEO headline (rendered as `<h1>`) |
| `seo_title` | text | ≤60 chars for `<title>` tag |
| `meta_description` | text | 150–160 chars |
| `eyebrow` | text | Topic category label (constrained vocabulary) |
| `quick_answer` | text | HTML answer block |
| `body_sections` | jsonb | `[{heading, prose, citation_ref}]` |
| `worked_example` | jsonb | `{label, paragraphs[]}` or null |
| `faq` | jsonb | `[{q, a}]` |
| `primary_sources` | jsonb | `[{section_number, url, tag}]` |
| `status` | enum | `draft` → `in_review` → `published` → `superseded` / `retired` |
| `reviewer` | text | Assigned reviewer |
| `approved_by` | text | Who approved |
| `approved_at` | timestamptz | |
| `date_published` | date | |
| `date_modified` | date | |
| `source_last_verified` | date | Last checked against live POMS |
| `draft_metadata` | jsonb | Pipeline trace: queries, retrieval, verification results |

**Lifecycle:** `draft` (verified clean) → `in_review` (flagged values or correction needed) → expert review → `published`

---

### `codex_topics`
Topic registry — one row per knowledge base article topic.

| Column | Type | Description |
|---|---|---|
| `id` | int PK | |
| `slug` | text UNIQUE | Matches `reference_pages.slug` |
| `title` | text | Display title |
| `status` | text | `draft` / `in_review` / `published` |
| `updated_at` | timestamptz | |

---

### `generation_jobs`
Queue for async page generation (processed by local cron worker).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `topic` | text | Natural language topic |
| `title` | text | Page title |
| `slug` | text | Target slug |
| `category` | text | `social-security` / `irmaa` |
| `status` | text | `pending` → `running` → `done` / `error` |
| `page_id` | uuid | FK to `reference_pages` on success |
| `error` | text | Error message on failure |
| `requested_by` | text | Email of requester |
| `created_at` | timestamptz | |
| `started_at` | timestamptz | |
| `finished_at` | timestamptz | |

---

### `verified_answers`
Expert-confirmed Q&A pairs injected as context for AXIOM queries.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | The question |
| `answer` | text | Verified HTML answer |
| `primary_sources` | jsonb | `[{section_number, url, tag}]` |
| `answered_by` | text | `agent-approved` / `human-corrected` / reviewer name |
| `category` | text | `social-security` / `irmaa` |
| `status` | text | `published` = active |
| `embedding` | vector(1536) | Embedded question for similarity retrieval |
| `last_reviewed` | date | |
| `created_at` | timestamptz | |

**Populated by:**
1. AXIOM feedback — approve (agent answer) or correct (human rewrite)
2. KB page approval hook — page `h1` → question, `quick_answer` → answer

**Retrieved via:** `match_verified_answers` RPC (similarity threshold 0.70).

---

### `answer_feedback`
All AXIOM feedback events, including rejections.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | |
| `original_answer` | text | Agent's answer |
| `corrected_answer` | text | Human correction (if correct type) |
| `verdict` | text | Agent's original verdict |
| `primary_sources` | jsonb | Sources from original answer |
| `sections_used` | jsonb | All retrieval sections used |
| `feedback_type` | text | `approve` / `correct` / `reject` |
| `correction_tags` | text[] | `wrong_section` / `wrong_value` / `missing_rule` / `misread_scenario` |
| `correction_note` | text | Free-text reviewer explanation |
| `category` | text | |
| `saved_to_verified` | boolean | True if promoted to `verified_answers` |
| `reviewer_name` | text | From axiom_reviewer cookie |
| `created_at` | timestamptz | |

---

### `axiom_queries`
Log of every question submitted to AXIOM (for analytics and debugging).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `raw_question` | text | As typed by advisor |
| `clean_question` | text | Resolved standalone question |
| `benefit_types` | text[] | e.g. `[retirement, spousal]` |
| `category` | text | `social-security` / `irmaa` |
| `parties` | text[] | Scenario decomposition |
| `created_at` | timestamptz | |

---

### `axiom_subscribers`
AXIOM access control — one row per authorized user.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `email` | text UNIQUE | |
| `role` | text | `staff` / `subscriber` |
| `tier` | text | `standard` / `arpi_grad` / `firm` / `staff` |
| `status` | text | `active` / `cancelled` / `past_due` |
| `kajabi_purchase_id` | text | Source purchase |
| `created_at` | timestamptz | |

---

### `kb_reviewers`
Authorized KB admin reviewers.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `email` | text UNIQUE | |
| `display_name` | text | |
| `categories` | text[] | `{social-security}` / `{irmaa}` / `{social-security,irmaa}` |

**Current reviewers:** Jason Stanley (admin), Cindi Hill (SS), Todd Valles (IRMAA), Jim Blair (both), Travis Stanley (both).

---

### SQL Functions

| Function | Purpose |
|---|---|
| `match_chunks(query_embedding, match_count, match_threshold)` | HNSW vector search over `source_chunks`; plpgsql VOLATILE with `SET LOCAL hnsw.ef_search=100` (as of migration 007) |
| `search_documents_fts(fts_query, match_count)` | Ranked FTS over `source_documents`; excludes PR/PS state-specific sections |
| `match_verified_answers(query_embedding, match_count, match_threshold, filter_category)` | IVFFlat search over `verified_answers` |

---

## 4. Corpus & Ingestion

### Source corpora

| Source | Type | Scale | Coverage |
|---|---|---|---|
| SSA POMS | `poms` | 15,566 sections | Core SS policy rules — primary citation authority |
| Code of Federal Regulations Title 20 | `cfr` | ~1,981 sections | Federal SS/Medicare regulations |
| SSA Handbook | `handbook` | ~860 sections | Plain-language SS summaries |
| CMS.gov HTML | `cms` | Large | Medicare coverage rules, payment policies |
| CMS PDFs | `cmspdf` | Large | Medicare enrollment guidance documents |
| Medicare.gov | `medicare` | Medium | Consumer Medicare explanations |

### POMS section prefixes

| Prefix | Meaning | Retrieval tier |
|---|---|---|
| `RS` | Retirement & Survivors Insurance | Tier 1 — always include |
| `HI` | Health Insurance / Medicare | Tier 1 |
| `GN` | General (filing, evidence, appeals) | Tier 1 |
| `DI` | Disability Insurance | Tier 2 |
| `SI` | Supplemental Security Income | Tier 3 — exclude from most queries |
| `PR`, `PS` | Precedent Rulings / Policy Statements | Excluded — state-specific, pollute results |
| `NL` | Notice Language | Excluded — internal SSA templates |
| `HBK` | SSA Handbook | Tier 1 |

### Ingest pipeline (`scripts/ingest/`)

```
fetch_poms.ts       → Crawls SSA POMS → source_documents
fetch_cms.ts        → Crawls CMS.gov → source_documents
fetch_cms_pdfs.ts   → Downloads and parses CMS PDFs → source_documents
fetch_medicare.ts   → Crawls Medicare.gov → source_documents
chunk_and_embed.ts  → Chunks (~800 chars) + embeds → source_chunks
cleanup_noise_chunks.ts → Removes low-value chunks
```

**Chunk size:** ~800 chars / ~200 tokens with 100-char overlap. Table blocks from CMS adapters are treated as atomic (never split).

**Embedding:** `text-embedding-3-small` (1536 dims). Batch size 100. All embeddings stored in `source_chunks.embedding` as `vector(1536)`.

**Running incremental embed:** `npx tsx scripts/ingest/chunk_and_embed.ts` (skips already-chunked docs). `--force` re-embeds everything. `--source=cms` limits to CMS rows.

---

## 5. Retrieval Pipeline

**File:** `scripts/retrieval/hybrid.ts`

### Source filter sets

| Constant | Sources | Used for |
|---|---|---|
| `SS_SOURCES` | poms, cfr, handbook | Social Security KB page generation |
| `IRMAA_SOURCES` | poms, cfr, handbook, medicare, cms | IRMAA KB page generation |
| `ALL_SOURCES` | poms, cfr, handbook, cms, medicare | AXIOM live Q&A (broader) |

### Single-query hybrid retrieval

```
query string
    │
    ├─► embed(query) → text-embedding-3-small
    │       │
    │       ▼
    │   match_chunks RPC (HNSW, ef_search=100)
    │   Fetches vectorTopK=40 chunks
    │   Aggregates to section level (max similarity per section)
    │   Filters: threshold=0.50, excludes PR/PS, filters by sourcesFilter
    │
    ├─► keywordSearch(query, sourcesFilter)
    │       │
    │       ├── Pass 1: search_documents_fts RPC
    │       │   plainto_tsquery with POMS-normalized terms:
    │       │   spousal→spouse, widower→widow, divorced→divorce,
    │       │   disabled→disability, retirement→retire
    │       │   Extracts significant words (>3 chars, not stopwords)
    │       │   Returns top 25 by ts_rank
    │       │
    │       └── Pass 2: ILIKE on section numbers + fractions
    │           Only when FTS returns < 5 results
    │           Searches full_text for specific patterns
    │
    └─► RRF fusion (k=60)
        For each section in union:
          score = 1/(60 + vector_rank) + 1/(60 + keyword_rank)
        Sort descending → top topK sections
        Fetch full_text from source_documents for top sections
        Return RetrievedSection[] + RetrievalTrace
```

### Parameters (defaults)

| Parameter | Default | Notes |
|---|---|---|
| `topK` | 10 | Final sections returned |
| `vectorTopK` | 40 | Candidates from vector search |
| `keywordTopK` | 25 | Candidates from FTS |
| `threshold` | 0.50 | Client-side similarity filter |
| `hnsw.ef_search` | 100 | Search expansion (higher = better recall, slower) |
| RRF `k` | 60 | Smoothing constant |

### Known gotchas

- **Never WHERE on similarity in SQL** — defeats HNSW index, forces full scan. Always `ORDER BY … LIMIT`, filter client-side.
- **FTS stemming gap** — `spousal` doesn't stem to `spouse` in Postgres English. Normalize before FTS.
- **PR/PS exclusion** — State-specific precedent rulings match benefit keywords but almost never answer advisor factual questions.
- **HNSW + new inserts** — Unlike IVFFlat, HNSW handles inserts without rebuild. But index was just rebuilt 2026-09-05; allow a few minutes for queries to use the new index.

---

## 6. AXIOM — Advisor Q&A Agent

### Overview

AXIOM is a gated, citation-grounded AI research assistant for NSSA-credentialed advisors. It answers questions about specific client scenarios by retrieving federal source sections and generating grounded answers citing those sections.

**URL:** `https://axiom.nssapros.com` (Cloudflare → Vercel rewrites to `/codex/axiom`)
**API:** `POST /api/ask`
**Frontend:** `app/axiom/AskInterface.tsx` (client component)
**Page:** `app/axiom/page.tsx` (server component — auth gate + subscriber check)

### Full pipeline

```
Advisor question (+ conversation history)
    │
    ▼
[1] Query Interpretation — gpt-4o, temp=0
    Input: question + last 6 turns of history
    Output JSON:
      retrieval_queries[]   2–3 targeted sub-queries for multi-hop retrieval
      clean_question        standalone resolved question (pronouns resolved)
      parties[]             scenario decomposition ("client (age 62, $1500 PIA)", ...)
      benefit_types[]       retirement / spousal / survivor / irmaa / wep / gpo / ...
      is_evaluating_advice  true if advisor is asking whether specific advice is correct
      is_followup           true if question uses pronouns from prior context
      category              social-security | irmaa
    │
    ▼
[2] Multi-Query Hybrid Retrieval (parallel)
    Runs hybridRetrieve() for each retrieval_query in parallel
    ALL_SOURCES filter (poms + cfr + handbook + cms + medicare)
    topK=8 per query
    Merge + deduplicate by section_number (highest score wins)
    Filter: min RRF score 0.020 (removes single-signal noise)
    Cap at 15 sections total
    │
    ▼
[3] Verified Context Injection
    Embed clean_question → match_verified_answers (threshold 0.70)
    Searches BOTH categories (SS and IRMAA) — cross-category misclassification common
    Takes top 3 by similarity
    If found → inject as "VERIFIED ANSWERS" block in user prompt
    If not found → fallback: top 4 published reference_pages (both categories)
    │
    ▼
[4] Grounded Answer Generation — gpt-4o, temp=0, max_tokens=4000
    System prompt enforces:
      - Decompose parties FIRST, then work through rules for each
      - Lead with direct verdict (correct/incorrect/yes/no)
      - Ground every claim in provided sources only
      - No importing from training data
      - Evaluate advice when is_evaluating_advice=true
      - For follow-ups: don't re-evaluate prior context — jump to the new question
      - Financial calculations: compare cumulative totals over same window, not monthly diff × months
      - No first-person SSA voice; third person for clients; second person for advisor
      - Proper HTML: <p> <ul> <li> — never inline bullet markers
    Output JSON: {verdict, verdict_summary, answer, primary_sources, gaps}
    Verdict values: correct | incorrect | partial | no_advice_to_evaluate | uncertain
    │
    ▼
[5] Citation Validation (client-side)
    Filters primary_sources to only those present in retrieved sections
    (Prevents hallucinated citations from reaching response)
    │
    ▼
[6] Self-Verification Gate
    Same gate as page builder (see §9)
    Dollar amounts excluded from verification (client-specific derived values)
    Unverified values shown as inline warning in chat UI (max 3 surfaced)
    │
    ▼
Response JSON: verdict, verdict_summary, answer, primary_sources, gaps,
               retrieval_queries, parties, clean_question, category,
               sections_used[], verification{passed, unverified[]}
```

### Frontend — AskInterface

**File:** `app/axiom/AskInterface.tsx`

Key behaviors:
- **Conversation persistence** — full conversation serialized to `localStorage` (key: `axiom_conversation_v2`) and restored on page load
- **Verdict banner** — color-coded: green (correct), red (incorrect), yellow (partial), blue (no advice / uncertain)
- **Citations** — shown below answer as clickable source pills
- **Verification warnings** — shown if `verification.passed = false`
- **Feedback UI** — per-turn: ✓ Verified / ✗ Incorrect / ⚑ Flag buttons
- **Correction flow** — "Incorrect" opens panel with issue tags + correction note + optional rewrite
- **"What I learned"** — shown after feedback submission; persists across reloads (localStorage)
- **Subscriber thumbs** — simplified positive/negative feedback for non-staff subscribers (routes to `/codex/api/axiom/feedback`)

### Staff vs Subscriber view

| Feature | Staff | Subscriber |
|---|---|---|
| Reviewer badge + name | ✓ | ✗ |
| Verify / Incorrect / Flag feedback | ✓ | ✗ |
| Subscriber thumbs | ✗ | ✓ |
| Sections used debug panel | ✓ | ✗ |

Staff = `axiom_subscribers.role = 'staff'`. Staff emails: jstanley, chill, tvalles, jblair, travispaulstanley.

---

## 7. Feedback & Learning Loop

### Three feedback types

| Type | Trigger | Effect |
|---|---|---|
| `approve` | Reviewer clicks ✓ Verified | Saves original answer to `verified_answers` |
| `correct` | Reviewer submits correction note | Triggers rewrite → saves corrected answer to `verified_answers` |
| `reject` | Reviewer flags as wrong/unusable | Logs to `answer_feedback` only — never promoted |

All three types log to `answer_feedback`. Only approve and correct promote to `verified_answers`.

### Rewrite endpoint (`POST /api/ask/rewrite`)

When a reviewer submits a correction:
1. Frontend sends: `{question, original_answer, correction_note, primary_sources}`
2. Endpoint rewrites the answer using gpt-4o (temp=0.2) with the correction note incorporated
3. Rules: keep valid citations, fix errors, incorporate feedback, never speak as SSA
4. Returns: `{ok, answer, learned, primary_sources}` — `primary_sources` carries forward originals (rewrite doesn't do new retrieval)
5. Frontend shows rewritten answer with original citations

### Feedback save (`POST /api/feedback`)

```
feedback_type = 'approve' or 'correct'
    │
    ├── Insert to answer_feedback (always)
    │
    ├── Extract POMS section numbers from correction_note
    │   Pattern: RS/GN/HI/SI/DI/RM/SM/MS/PR/PS/NL/TN + 5-digit.3-digit
    │   Also: 20 CFR NNN.NNN, HBK NNNN
    │   Merges with existing primary_sources (no duplicates)
    │
    ├── Embed question → text-embedding-3-small
    │
    └── Insert to verified_answers
            question, answer (corrected if 'correct'), primary_sources (merged),
            answered_by ('agent-approved' or 'human-corrected'),
            category, status='published', embedding, last_reviewed=today
```

### KB page approval hook

When a reviewer approves a KB page (`saveAndApprove()` in `app/admin/kb-review/actions.ts`):
- Page `h1` → verified_answers `question`
- Page `quick_answer` → verified_answers `answer`
- Page `primary_sources` → verified_answers `primary_sources`
- Embedded and upserted to `verified_answers` automatically

This pre-seeds AXIOM's context corpus with every expert-reviewed page at zero extra effort.

### Learning path

| Phase | Mechanism | Trigger |
|---|---|---|
| Active now | Few-shot injection from `verified_answers` | Every AXIOM query |
| ~100 pairs | Pattern review via `answer_feedback` correction tags | Manual audit |
| ~300 pairs | Fine-tune gpt-4o-mini on verified Q&A | Quarterly |

---

## 8. Page Generation Pipeline

### Overview

Pages are generated asynchronously via a job queue and local cron worker. Advisors (or admins) submit generation requests through the admin UI; the local Mac Studio cron processes them one at a time.

### Job queue (`generation_jobs`)

Jobs enter with `status = 'pending'`. The worker picks them up every minute, processes one per run, and marks `done` or `error`.

**Job states:**
- `pending` → waiting to be picked up
- `running` → actively being processed (set atomically on claim)
- `done` → page saved to `reference_pages`; `page_id` set
- `error` → pipeline failed; `error` message set

**If a worker is killed mid-job:** The job stays `running` (stuck). Fix: manually reset to `pending` via Supabase or DB script.

### Worker (`scripts/generation-worker.ts`)

**Cron:** `* * * * *` (every minute, via crontab on Mac Studio)
**Env file:** `.env.worker` (never overwritten by `vercel env pull`)
**Log:** `/tmp/generation-worker.log`

```
Worker tick:
    │
    ├── Query generation_jobs WHERE status='pending' ORDER BY created_at LIMIT 1
    │
    ├── If none → log "No pending jobs" → exit
    │
    ├── Mark job status='running', started_at=now (atomic guard: only if still 'pending')
    │
    ├── runDraft({topic, title, slug, category, skipWorkedExample=true})
    │   (See §8 — Page Builder Pipeline)
    │
    ├── On success:
    │   ├── Update codex_topics status='in_review' (unless already 'published')
    │   └── Update generation_jobs status='done', page_id=result.id, finished_at=now
    │
    └── On error:
        └── Update generation_jobs status='error', error=message, finished_at=now
```

### Page Builder Pipeline (`scripts/draft/draft_page_v2.ts`)

```
[1] Hybrid retrieval (topK=15)
    Uses sourcesFilter based on category (SS_SOURCES or IRMAA_SOURCES)
    │
    ▼
[2] GPT-4o drafting (temp=0, max_tokens=4096)
    Prompt includes:
      - VALID SECTION NUMBERS list (explicit, character-for-character)
      - SOURCE blocks with full text (≤15,000 chars each)
      - 7 strict grounding rules
      - Constrained eyebrow vocabulary
    Output JSON schema:
      title, h1, seo_title, meta_description, eyebrow,
      quick_answer, body_sections[], worked_example|null, faq[],
      primary_sources[]
    │
    ▼
[3] Citation validation
    Checks: every section_number in primary_sources must be in retrieved set
    If invalid citations found → self-correction retry:
      Send failed citations + valid list back to gpt-4o
      Ask it to fix only primary_sources array
      Re-validate once
    If still invalid after retry → throw (job → error)
    │
    ▼
[4] Self-verification gate (see §9)
    │
    ▼
[5] Slug check
    Allows overwriting existing 'draft' pages (re-generation)
    Blocks if existing page is 'in_review' or 'published'
    │
    ▼
[6] DB write (insert or update)
    status = 'draft' (all values verified) or 'in_review' (flags present)
    draft_metadata stores: pipeline_version, topic, trace, verification, source_gaps
```

### Eyebrow vocabulary (constrained)

**Social Security:** Claiming Rules · Spousal & Divorced Benefits · Survivor Benefits · Earnings Test · WEP & GPO · Benefit Calculation · Family Benefits · Filing & Enrollment · Appeals & Reconsideration · Medicare Enrollment

**IRMAA:** IRMAA Basics · IRMAA Appeals · Medicare Part B · Medicare Part D

### CLI usage (local generation)

```bash
cd ~/knowledge
TOPIC="Spousal benefit reduction for filing before FRA" \
TITLE="Spousal Benefits at 62" \
SLUG="spousal-benefits-at-62" \
CATEGORY="social-security" \
SKIP_WORKED_EXAMPLE=true \
DRY_RUN=true \   # omit to actually save
npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/draft/draft_page_v2.ts
```

---

## 9. Self-Verification Gate

**File:** `scripts/draft/verify.ts`

Deterministic (non-LLM) check that every stated numeric specific in the draft text can be found verbatim in the retrieved source sections.

### Extracted value patterns

| Pattern | Examples |
|---|---|
| Fractions | `25/36`, `19/40 of 1%` |
| Percentages | `30%`, `5.5 percent` |
| Dollar amounts | `$1,195`, `$48.50` |
| Ages | `age 62`, `age 67` |
| Month counts | `36 months`, `120 months` |
| Year counts | `10 years`, `5 years` (excludes "years of coverage") |

### Normalization before comparison

- `85%` ↔ `85 percent` (both forms matched)
- `19 /40` / `19/ 40` → `19/40` (strip spaces around fraction slash)
- `60 years old` / `60 years` → `age 60`
- `MM/DD` date patterns excluded from fraction extraction

### Gate outcomes

| Outcome | Result |
|---|---|
| All values verified | `status = 'draft'` |
| Unverified values found | `status = 'in_review'`; values stored in `draft_metadata.verification.unverified` |
| Hallucinated citations | Job fails entirely (thrown before DB write) |

**In AXIOM responses:** Dollar amounts excluded from verification — client-specific computed values (e.g. `$1,125`) are derived from advisor-provided inputs × POMS formulas and will never appear verbatim in POMS source text. Only POMS rule values (fractions, percentages, month/year counts) are checked.

---

## 10. AXIOM Access Control

### Auth flow

1. Unauthenticated user visits `axiom.nssapros.com` (→ `/codex/axiom`)
2. Middleware (`proxy.ts`) checks Supabase session cookie
3. No session → redirect to `/codex/axiom/login`
4. Login: user enters email → Supabase OTP magic link → email with link
5. Click link → Supabase sets session cookie
6. Middleware checks `axiom_subscribers` table for `status = 'active'`
7. Not found or not active → redirect to `/codex/axiom/join`
8. Active subscriber → serve AXIOM

### Subscriber provisioning

**Automated (Kajabi → Zapier → `/api/axiom/provision`):**

```json
POST /api/axiom/provision
Header: x-axiom-secret: <AXIOM_PROVISION_SECRET>

{
  "action": "provision" | "revoke" | "past_due",
  "email": "advisor@example.com",
  "tier": "standard" | "arpi_grad" | "firm" | "staff",
  "kajabi_purchase_id": "..."
}
```

Actions:
- `provision` → upsert `axiom_subscribers` with `status = 'active'`
- `revoke` → set `status = 'cancelled'`
- `past_due` → set `status = 'past_due'`

**Manual (staff only):** Direct Supabase insert/update.

**Self-service (join page):** `axiom.nssapros.com/join` — beta enrollment form. Advisors enter name + email + credential. Calls `/api/axiom/enroll` → inserts subscriber row.

### Roles and tiers

| Role | Tier | Access |
|---|---|---|
| `staff` | `staff` | AXIOM + full feedback UI (verify/correct/flag) |
| `subscriber` | `standard` | AXIOM + subscriber thumbs only |
| `subscriber` | `arpi_grad` | Same as standard |
| `subscriber` | `firm` | Same as standard |

Staff names are hardcoded in `axiom/page.tsx` (STAFF_NAMES map) for display in the reviewer badge.

---

## 11. Admin Tools

All admin routes: `knowledge.nssapros.com/admin/...`

Auth: Supabase magic link. Email must be in `kb_reviewers` table. `jstanley@nssapros.com` bypasses the table check (admin).

### KB Review Queue (`/admin/kb-review`)

Split-pane review editor:
- **Left:** Editable fields — title, H1, SEO, meta, eyebrow, quick answer (rich text), body sections, FAQ, sources, deprecation note
- **Right:** Live preview with verification flag banners and inline SOURCE GAP blocks; per-section Verify/Suggest buttons

Queue tabs: ⚑ Review Due · Needs Review · Drafts · Published · Superseded

Actions: Save for Later (preserves status) · Approve (→ published, stamps dates, triggers verified_answers upsert)

### Topic Management (`/admin/topics`)

Lists all `codex_topics` with status. Buttons to queue generation (→ inserts `generation_jobs` row), view existing draft, or publish.

### Coverage Stats (`/admin/coverage`)

Reports KB coverage vs the corpus:
- Total POMS sections / advisor-relevant (Tier 1+2) / internal (Tier 3)
- Published pages + cited sections
- Per-cluster coverage % with progress bars

Refreshed by running `npx tsx scripts/coverage-report.ts --json` locally.

### DB Health (`/admin/db-health`)

Live counts: source_documents, source_chunks (with/without embeddings), reference_pages by status, verified_answers, pending generation_jobs.

### AXIOM Feedback (`/admin/axiom-feedback`)

Lists all `answer_feedback` rows with question, type, correction note, tags. Useful for spotting systematic retrieval gaps.

### AXIOM Subscribers (`/admin/axiom-subscribers`)

Lists `axiom_subscribers` with status/tier. Staff can update status/tier.

### My Feedback (`/admin/my-feedback`)

Per-reviewer history of feedback submitted.

---

## 12. Public-Facing KB Site

### Routes

| Route | Description |
|---|---|
| `/` | Homepage — search + category cards + recent pages |
| `/social-security` | SS category index with eyebrow filter pills |
| `/social-security/[slug]` | SSG article page |
| `/irmaa` | IRMAA category index |
| `/irmaa/[slug]` | SSG article page |
| `/search?q=` | Full-text search across published pages |
| `/preview/[id]` | Preview any page by ID (no auth) |

### SEO structure

Breadcrumb: `Knowledge Base › [Category] › [Eyebrow] › [Title]`

**H1 vs Title:** `title` = short label (breadcrumbs, admin). `h1` = keyword-rich SEO headline on the page. Generated separately by the model.

### CTA block (per category)

- **SS pages:** Links to `nssapros.com/social-security-training`; navy styling
- **IRMAA pages:** Links to `nssapros.com/irmaa-medicare-training-course`; red styling
- Anchor text rotates through 6 keyword variants per category
- Action phrase and heading vary by eyebrow

---

## 13. Infrastructure

### Vercel

- **Deployment:** `cd ~/knowledge && vercel deploy --prod` or push to `main` (auto-deploy configured)
- **Max function duration:** 60 seconds (Pro plan) — set in `route.ts` via `export const maxDuration = 60`
- **Environment:** Sensitive vars (OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY) are encrypted in Vercel; `vercel env pull` intentionally leaves them blank locally
- **Build:** SSG for published KB pages. Admin + AXIOM pages are `force-dynamic`.
- **Cache invalidation:** `revalidatePath()` called on approval/save actions.

### Supabase

- **Project:** `eqipvrcmugnvkextqmym` (US East)
- **Admin:** `jstanley@nssapros.com`
- **Vector index:** HNSW on `source_chunks.embedding` (`m=16, ef_construction=64`) — applied 2026-09-05
- **FTS index:** GIN on `to_tsvector('english', full_text)` of `source_documents`
- **Role timeouts:** `authenticator` and `authenticated` roles set to 30s statement timeout

### Cloudflare

- **Worker:** `nssa-path-proxy` routes:
  - `/codex/*` → Knowledge Base Vercel app
  - `/directory/*` → Directory Vercel app
  - `/blog/*` → Blog Vercel app
  - `/admin/*` → Admin Vercel app

### Local cron (Mac Studio)

```
* * * * * cd /Users/nssaagent/knowledge && \
  /opt/homebrew/bin/node node_modules/.bin/tsx \
  --tsconfig tsconfig.json \
  --env-file .env.worker \
  scripts/generation-worker.ts >> /tmp/generation-worker.log 2>&1
```

**Env file:** `.env.worker` — manually maintained; never overwritten by `vercel env pull`.
**Log:** `/tmp/generation-worker.log`

### DB Migrations

| File | Content |
|---|---|
| `001_initial_schema.sql` | Core tables + IVFFlat indexes |
| `002_add_superseded.sql` | superseded_at column |
| `003_kb_reviewers.sql` | kb_reviewers table |
| `004_hybrid_search.sql` | match_chunks, search_documents_fts, GIN index, draft_metadata column |
| `005_cms_medicare_versioning.sql` | CMS/Medicare source versioning |
| `006_hnsw_index.sql` | Drop IVFFlat, create HNSW on source_chunks — **manual, run in Supabase SQL editor** |
| `007_hnsw_match_chunks.sql` | Update match_chunks to use `hnsw.ef_search=100` — **run after 006 builds** |

---

## 14. API Reference

### `POST /api/ask`

AXIOM Q&A endpoint. Requires active Supabase session with `axiom_subscribers.status = 'active'`.

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
  "verdict": "correct|incorrect|partial|no_advice_to_evaluate|uncertain",
  "verdict_summary": "string",
  "answer": "HTML string",
  "primary_sources": [{"section_number": "string", "url": "string", "tag": "Source"}],
  "gaps": ["string"],
  "retrieval_queries": ["string"],
  "parties": ["string"],
  "clean_question": "string",
  "category": "social-security|irmaa",
  "sections_used": [{"section_number": "string", "title": "string|null", "score": 0.0, "source_url": "string"}],
  "verification": {"passed": true, "unverified": []}
}
```

### `POST /api/ask/rewrite`

Rewrites an answer incorporating a reviewer's correction note.

**Request:** `{question, original_answer, correction_note, primary_sources}`
**Response:** `{ok, answer, learned, primary_sources}`

### `POST /api/feedback`

Captures AXIOM feedback and optionally promotes to verified_answers.

**Request:** `{question, original_answer, corrected_answer?, verdict, primary_sources, sections_used, feedback_type, correction_tags, correction_note, category, reviewer_name}`
**Response:** `{ok, analysis}` — `analysis` is a 1–2 sentence learning summary (shown in "What I learned" UI card)

### `POST /api/axiom/provision`

Zapier/Kajabi webhook to provision or revoke AXIOM access.

**Header:** `x-axiom-secret: <AXIOM_PROVISION_SECRET>`
**Request:** `{action: provision|revoke|past_due, email, tier?, kajabi_purchase_id?}`

---

## 15. Environment Variables

### `.env.worker` (Mac Studio local — never committed)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI key for embeddings + gpt-4o |

### Vercel Production Environment (encrypted)

Same four variables above, plus:
- `AXIOM_PROVISION_SECRET` — shared secret for Kajabi webhook
- `AXIOM_PASSWORD` — legacy (if still in use)
- `RESEND_API_KEY` — transactional email (if applicable)

### Note on `vercel env pull`

Running `vercel env pull` **intentionally blanks all sensitive (encrypted) variables** in the pulled `.env.vercel-live` file. Never use `.env.vercel-live` for the generation worker. Use `.env.worker` which is manually maintained.

---

## 16. Known Issues & Recent Fixes

### Fixed 2026-09-05

| Issue | Root Cause | Fix |
|---|---|---|
| Generation worker crashing — `SUPABASE_SERVICE_ROLE_KEY not set` | `vercel env pull` ran Sep 4 and blanked `.env.vercel-live` sensitive keys | Created `.env.worker` with manually maintained keys; cron now points to `.env.worker` |
| Knowledge base pages not generating (Todd Valles report) | Worker crash above — all jobs failing | Worker fixed; 24k+ error log entries cleared; stuck jobs reset to pending |
| Citation validation failing for CMSPDF topics | GPT was using list position numbers (1, 2, 5) instead of full CMSPDF path identifiers | Added explicit VALID SECTION NUMBERS list to user prompt; added self-correction retry that sends failed citations + valid list back to GPT |
| Slug blocks regeneration of existing draft pages | `draft_page_v2.ts` threw on any existing slug regardless of status | Changed check: allows overwriting `draft` pages; only blocks `in_review` and `published` |
| Rewrite endpoint drops citations | `/api/ask/rewrite` returned `{ok, answer, learned}` with no `primary_sources` | Added `primary_sources: primary_sources ?? []` to response |
| POMS sections not surfacing in AXIOM retrieval (e.g. RS 00615.205 "Reduced Spouse Benefits") | IVFFlat index built for ~200K rows; corpus grown to 1.1M chunks; with `lists=100` and `probes=3`, only ~3% of chunks were scanned per query | Applied HNSW index (Migration 006); updated `match_chunks` function for HNSW (Migration 007) |

### Open — monitoring

| Issue | Status |
|---|---|
| HNSW index build in progress (as of 09:40 EDT 2026-09-05) | Background build; queries fall back to partial scan until complete. Check: does `match_chunks` return RS sections? |
| Migration 007 (`match_chunks` HNSW tuning) | Ready in `supabase/migrations/007_hnsw_match_chunks.sql` — run in Supabase SQL editor after HNSW index build completes |
| RS 00615.205 "Reduced Spouse Benefits" returning no citations | Will resolve once HNSW index is live (section has embeddings; just not indexed by HNSW yet) |

---

## 17. Key Design Decisions

### Hybrid retrieval (vector + FTS), not vector-only

Vector search catches semantic meaning but misses exact token matches (section numbers, fractions, specific benefit-type terms). FTS catches exact tokens but misses paraphrase. RRF fusion without weight tuning consistently outperforms either alone on Social Security policy retrieval.

### Citation validation + self-correction retry

The validator checks exact string equality between GPT's cited `section_number` values and the retrieved set. For POMS sections (e.g. `RS 00615.201`), GPT is reliable. For long CMSPDF paths (e.g. `CMSPDF:medicare/eligibility-and-enrollment/.../filename.pdf`), GPT makes transcription errors. The explicit VALID SECTION NUMBERS list in the prompt reduced errors significantly; the self-correction retry loop catches remaining failures without failing the job.

### Verification gate: mechanical, not LLM

Substring matching (with normalization) rather than LLM verification. LLMs can be convinced a value is "approximately" correct. Substring matching is binary. The gate catches every number the model cannot trace verbatim to a source; humans catch everything else.

### Verified answers as interim fine-tuning

Fine-tuning is the long-term goal. The `verified_answers` corpus serves as a lightweight interim: every approved KB page and every thumbs-up seeds the corpus; future AXIOM queries inject similar Q&A as few-shot context via embedding similarity. At ~300 verified pairs, fine-tuning gpt-4o-mini becomes viable.

### HNSW over IVFFlat at scale

IVFFlat with `lists=100` is appropriate up to ~200K rows. At 1.1M rows with `probes=3`, it scans only ~3% of vectors per query — effectively useless for POMS content that landed in unprobed clusters. HNSW handles inserts without rebuild, maintains consistent recall at scale, and has no probe tuning required.

### Local cron, not Vercel serverless, for page generation

Vercel serverless has a 60-second function timeout. Full page generation (retrieval + GPT-4o drafting + self-verification) typically takes 45–90 seconds. Running the worker on Mac Studio (local cron) eliminates the timeout constraint and avoids cold-start latency.

### Pull-based generation, not scheduled batch

Pages are generated on admin request, not on a schedule. This prevents a wall of unreviewed pages accumulating for SMEs. Target queue depth: 15–20 `in_review` at a time. The topic queue is prioritized by coverage gap.

---

*Document maintained by Tank. Update when significant architectural changes are made.*
*Last updated: 2026-09-05 by Tank (v2.0 — full AXIOM coverage, HNSW migration, recent fixes)*
