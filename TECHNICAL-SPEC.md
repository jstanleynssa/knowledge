# NSSA Knowledge Base — Technical Specification

**Version:** 1.0  
**Date:** 2026-07-19  
**Author:** Tank (AI Assistant) / Jason Stanley  
**Status:** Production

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Infrastructure & Architecture](#2-infrastructure--architecture)
3. [Database Schema](#3-database-schema)
4. [Corpus & Ingestion](#4-corpus--ingestion)
5. [Retrieval Pipeline](#5-retrieval-pipeline)
6. [Page Builder Pipeline](#6-page-builder-pipeline)
7. [Self-Verification Gate](#7-self-verification-gate)
8. [Research Agent](#8-research-agent)
9. [Feedback & Learning System](#9-feedback--learning-system)
10. [Admin Review System](#10-admin-review-system)
11. [Public-Facing Site](#11-public-facing-site)
12. [Coverage Reporting](#12-coverage-reporting)
13. [Page Generation Workflow](#13-page-generation-workflow)
14. [API Reference](#14-api-reference)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Key Design Decisions](#17-key-design-decisions)

---

## 1. Project Overview

The NSSA Knowledge Base is a verified reference site for Social Security and IRMAA/Medicare rules, serving financial advisors and retirees. Every factual claim on every page is mechanically traced to a verbatim source in the SSA Program Operations Manual System (POMS).

**Core principle:** The system generates pages autonomously, but human experts approve every page before it publishes. The verification gate mechanically catches unverifiable claims; human reviewers catch everything else. Accuracy is the core asset.

**URLs:**
- Public site: `https://knowledge.nssapros.com`
- Admin queue: `https://knowledge.nssapros.com/admin/kb-review`
- Research agent: `https://knowledge.nssapros.com/ask`

**Repo:** `/Users/nssaagent/knowledge/`

---

## 2. Infrastructure & Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Hosting | Vercel (production deployments via `vercel deploy --prod`) |
| Database | Supabase (PostgreSQL), project `eqipvrcmugnvkextqmym` |
| Vector search | pgvector (IVFFlat index, 1536-dim) |
| Full-text search | PostgreSQL GIN index + `tsvector` |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dimensions) |
| LLM — drafting | GPT-4o (query interpretation) + o4-mini (grounding/reasoning) |
| LLM — page builder | GPT-4o (grounding) |
| Authentication | Supabase magic link (OTP) — reviewer-only admin |

### Architecture diagram

```
                        ┌─────────────────────────┐
                        │   knowledge.nssapros.com  │
                        │   (Next.js / Vercel)      │
                        └──────────┬──────────────-─┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
  ┌──────▼──────┐         ┌────────▼──────┐        ┌────────▼──────┐
  │  Public KB  │         │  Admin Review │        │   /ask Agent  │
  │  /social-   │         │  /admin/kb-   │        │   (advisor     │
  │  security/* │         │  review       │        │    Q&A)        │
  │  /irmaa/*   │         └──────┬────────┘        └────────┬──────┘
  └──────┬──────┘                │                          │
         │                       │                          │
         └───────────────────────┴──────────────────────────┘
                                 │
                         ┌───────▼────────┐
                         │   Supabase DB  │
                         │  (PostgreSQL)  │
                         │  - reference_  │
                         │    pages       │
                         │  - source_     │
                         │    chunks      │
                         │  - source_     │
                         │    documents   │
                         │  - verified_   │
                         │    answers     │
                         │  - answer_     │
                         │    feedback    │
                         └────────────────┘
```

---

## 3. Database Schema

### `source_documents`
Raw POMS source documents ingested from SSA.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `section_number` | text | e.g. `RS 00615.201` |
| `title` | text | Section title |
| `full_text` | text | Full cleaned text content |
| `source_url` | text | `https://secure.ssa.gov/apps10/poms.nsf/lnx/…` |
| `doc_kind` | text | `rule` / `handbook` / `cfr` |
| `created_at` | timestamptz | |

**Indexes:** GIN tsvector index `idx_source_docs_fts` on `to_tsvector('english', coalesce(full_text, ''))`.

### `source_chunks`
Source documents chunked and embedded for vector search.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `source_document_id` | uuid FK → `source_documents` | |
| `section_number` | text | Denormalized from parent |
| `chunk_text` | text | Chunk content (~500 tokens) |
| `embedding` | vector(1536) | OpenAI `text-embedding-3-small` |

**Indexes:** IVFFlat index `idx_source_chunks_embedding` with 100 lists.

**Corpus size:** ~18,400 source documents, ~202,000 chunks.

### `reference_pages`
Published and draft KB reference pages.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text UNIQUE | URL path segment |
| `category` | text | `social-security` / `irmaa` |
| `title` | text | Short canonical label (breadcrumbs, admin queue) |
| `h1` | text | SEO-optimized headline rendered as page H1 |
| `seo_title` | text | ≤60 chars, for `<title>` tag |
| `meta_description` | text | 150-160 chars |
| `eyebrow` | text | Topic category (see §13) |
| `quick_answer` | text | HTML short answer block |
| `body_sections` | jsonb | Array of `{heading, prose, citation_ref}` |
| `worked_example` | jsonb | `{label, paragraphs[]}` — optional |
| `faq` | jsonb | Array of `{q, a}` |
| `primary_sources` | jsonb | Array of `{section_number, url, tag}` |
| `status` | page_status | `draft` / `in_review` / `published` / `superseded` / `retired` |
| `reviewer` | text | Assigned reviewer name |
| `approved_by` | text | Reviewer who approved |
| `approved_at` | timestamptz | |
| `date_published` | date | |
| `date_modified` | date | |
| `source_last_verified` | date | Last date content verified vs. SSA POMS |
| `draft_metadata` | jsonb | Pipeline trace: queries, retrieval trace, verification results |
| `deprecation_note` | text | For superseded pages |
| `h1` | text | SEO headline |
| `og_image_url` | text | OG image |

**Page lifecycle:** `draft` → `in_review` (if verification flagged values) → expert reviews → `published`

### `kb_reviewers`
Authorized admin reviewers.

| Column | Type |
|---|---|
| `id` | uuid PK |
| `email` | text UNIQUE |
| `display_name` | text |
| `categories` | text[] | `{social-security}`, `{irmaa}`, or `{social-security,irmaa}` |

**Current reviewers:** Jason Stanley (admin), Cindi Hill (SS), Todd Valles (IRMAA), Jim Blair (both), Travis Stanley (both).

### `verified_answers`
Expert-confirmed Q&A pairs used as few-shot context for the research agent.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | The question asked |
| `answer` | text | Verified answer (HTML) |
| `primary_sources` | jsonb | Sources cited |
| `answered_by` | text | `agent-approved` / `human-corrected` / reviewer name |
| `category` | text | `social-security` / `irmaa` |
| `status` | page_status | `published` = active in retrieval |
| `embedding` | vector(1536) | For similarity retrieval |
| `last_reviewed` | date | |

**Populated by:** (1) Agent answer thumbs up/correction, (2) KB page approval hook (h1 → question, quick_answer → answer).

**Indexes:** IVFFlat `idx_verified_answers_embedding`.

### `answer_feedback`
All agent feedback, including rejections (not promoted to verified_answers).

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `question` | text | |
| `original_answer` | text | What the agent said |
| `corrected_answer` | text | What the reviewer said it should say |
| `feedback_type` | text | `approve` / `correct` / `reject` |
| `correction_tags` | text[] | `wrong_section`, `wrong_value`, `missing_rule`, `misread_scenario` |
| `correction_note` | text | Free-text explanation |
| `category` | text | |
| `saved_to_verified` | boolean | True if promoted to verified_answers |

### Postgres functions

| Function | Purpose |
|---|---|
| `match_chunks(query_embedding, match_count, match_threshold)` | IVFFlat vector search over source_chunks; plpgsql VOLATILE with `SET LOCAL ivfflat.probes=3` |
| `search_documents_fts(fts_query, match_count)` | Ranked FTS over source_documents; excludes PR/PS sections |
| `match_verified_answers(query_embedding, match_count, match_threshold, filter_category)` | IVFFlat search over verified_answers |

---

## 4. Corpus & Ingestion

**Sources:**
- **POMS (SSA Program Operations Manual System):** 15,566 sections — core policy operations, the primary citation authority
- **CFR (Code of Federal Regulations, Title 20):** 1,981 sections — federal regulations
- **SSA Handbook:** 860 sections — plain-language summaries

**Section prefixes (key):**
- `RS` — Retirement & Survivors Insurance (Tier 1 advisor relevance)
- `HI` — Health Insurance / Medicare (Tier 1)
- `GN` — General (Filing, Evidence, Appeals) (Tier 1)
- `DI` — Disability Insurance (Tier 2)
- `SI` — Supplemental Security Income (Tier 3 — excluded from most queries)
- `PR` / `PS` — Precedent Rulings / Policy Statements (excluded from retrieval — state-specific, pollute results)
- `NL` — Notice Language (excluded — internal SSA communication templates)
- `HBK` — SSA Handbook sections

**Ingest pipeline:** `scripts/ingest/` — fetches, cleans, chunks (~500 tokens), embeds, stores.

**Source URL format:** All POMS URLs updated 2026-07-16 to new SSA location:  
`https://secure.ssa.gov/apps10/poms.nsf/lnx/{section_id}`  
(old format `https://policy.ssa.gov/poms.nsf/lnx/…` returns 301 → apps10 homepage)

---

## 5. Retrieval Pipeline

**File:** `scripts/retrieval/hybrid.ts`

### Flow

```
query string
    │
    ├── embed(query) → OpenAI text-embedding-3-small
    │       │
    │       ▼
    │   vectorSearch() → match_chunks RPC (IVFFlat, probes=3)
    │       │  returns top candidateK chunks (default 80)
    │       │  filtered client-side by threshold (default 0.50)
    │       │  aggregated to section level (max similarity per section)
    │       │  excludes PR/PS sections
    │
    ├── keywordSearch()
    │       │
    │       ├── Pass 1: search_documents_fts RPC
    │       │       Uses plainto_tsquery with POMS-normalized terms
    │       │       (spousal→spouse, widower→widow, etc.)
    │       │       Returns top N ranked by ts_rank
    │       │       Excludes PR/PS sections
    │       │
    │       └── Pass 2: ILIKE for section numbers and fractions
    │               Only when FTS returns < 5 results
    │
    └── RRF fusion (Reciprocal Rank Fusion, k=60)
            Deduplicates by section_number
            Returns top-K merged results with scores
```

### Key parameters (defaults)

| Parameter | Value | Notes |
|---|---|---|
| `topK` | 10 | Final sections returned |
| `vectorTopK` | 40 | Candidates fetched from vector search |
| `candidateK` | `max(topK*4, 80)` | Actual match_chunks fetch size |
| `threshold` | 0.50 | Client-side similarity filter |
| `ivfflat.probes` | 3 | Via `SET LOCAL` in `match_chunks` plpgsql function |

### Known gotchas

- **IVFFlat + WHERE = slow:** Never add `WHERE similarity > threshold` to the SQL — it forces a full scan. Use `ORDER BY … LIMIT` only; filter client-side.
- **FTS stemming:** Postgres English FTS: `spousal` stems to `spousal` (not `spous` like `spouse`). POMS text uses `spouse`. Normalize queries before FTS.
- **Authenticator timeout:** PostgREST runs all requests through the `authenticator` role, raised to 30s (was 8s). `match_chunks` is `VOLATILE` with `SET LOCAL ivfflat.probes=3`.
- **PR/PS exclusion:** State-specific precedent rulings match benefit keywords but are almost never relevant to factual queries. Excluded in both FTS and vector aggregation.

---

## 6. Page Builder Pipeline

**File:** `scripts/draft/draft_page_v2.ts`

### Flow

```
TOPIC, TITLE, SLUG, CATEGORY env vars
    │
    ▼
[1] Hybrid retrieval (topK=15 default)
    │
    ▼
[2] GPT-4o drafting with hardened grounding prompt
    │   - 7 strict rules (no importing outside knowledge)
    │   - Explicit OUTPUT SCHEMA (JSON)
    │   - Outputs: title, h1, seo_title, meta_description, eyebrow,
    │             quick_answer, body_sections, worked_example, faq,
    │             primary_sources
    │
    ▼
[3] Citation validation
    │   All section_numbers in primary_sources must exist in retrieved set
    │
    ▼
[4] Self-verification gate (see §7)
    │
    ▼
[5] DB insert
        status = 'draft' (verified) or 'in_review' (flagged values)
        draft_metadata stores: retrieval trace, verification results
```

### Key env vars

| Var | Description |
|---|---|
| `TOPIC` | Natural language topic query for retrieval |
| `TITLE` | Short canonical label (breadcrumbs) |
| `SLUG` | URL slug |
| `CATEGORY` | `social-security` or `irmaa` |
| `TOP_K` | Sections to retrieve (default 15) |
| `DRY_RUN` | `true` = print draft, don't save |
| `SKIP_WORKED_EXAMPLE` | `true` = omit worked_example from schema (avoids annual-value verification failures) |

### Eyebrow categories (constrained vocabulary)

**Social Security:** Claiming Rules · Spousal & Divorced Benefits · Survivor Benefits · Earnings Test · WEP & GPO · Benefit Calculation · Family Benefits · Filing & Enrollment · Appeals & Reconsideration · Medicare Enrollment

**IRMAA & Medicare:** IRMAA Basics · IRMAA Appeals · Medicare Part B · Medicare Part D

### Prompt content limits
- `MAX_SECTION_CHARS = 15000` per section in the user prompt (prevents context overflow)
- 10-15 sections × 15K chars ≈ 150-225K chars ≈ 38-56K tokens — within GPT-4o 128K context

---

## 7. Self-Verification Gate

**File:** `scripts/draft/verify.ts`

Deterministic (non-LLM) check that every stated specific in the draft traces to a cited source.

### Extraction patterns

Extracts these specific types from draft text:
- Fractions/rates: `\d+/\d+(?:\s+of\s+1%)?` (e.g. `25/36`, `19/40 of 1%`)
- Percentages: `\d+(?:\.\d+)?%`
- Dollar amounts: `\$[\d,]+(?:\.\d{2})?`
- Ages: `\bage\s+\d{2}\b`
- Month counts: `\b\d{2,3}\s+months?\b`
- Year counts: `\b\d{1,2}\s+years?\b` (excluding "years of coverage")

### Normalisation (applied before comparison)

- `85%` → `85 percent`; `85 percent` → `85 percent` (handles both forms)
- `19 /40` or `19/ 40` → `19/40` (spaces around fraction slash)
- `60 years old` / `60 years` → `age 60` (age normalisation, excluding "years of coverage")
- MM/DD date patterns excluded from fraction extraction

### Gate behavior

| Outcome | Action |
|---|---|
| All values verified | Save as `draft` |
| Unverified values found | Save as `in_review`; unverified values stored in `draft_metadata.verification.unverified`; shown as inline red SOURCE GAP blocks in review UI |
| Citation invented (not in retrieved set) | Block save entirely |

---

## 8. Research Agent

**UI:** `app/ask/page.tsx` (client component, conversational)  
**API:** `app/api/ask/route.ts`

### Pipeline

```
Advisor question (+ conversation history)
    │
    ▼
[1] Query interpretation — GPT-4o
    │   Returns:
    │   - retrieval_queries: 2-3 targeted sub-queries for multi-hop retrieval
    │   - clean_question: standalone resolved question
    │   - parties: scenario decomposition (who, ages, benefit types)
    │   - benefit_types: ["spousal", "retirement", etc.]
    │   - is_evaluating_advice: bool
    │   - category: "social-security" | "irmaa"
    │
    ▼
[2] Multi-query hybrid retrieval
    │   Runs hybridRetrieve() for each query in parallel
    │   Merges + deduplicates by section_number (highest score wins)
    │   Cap at 15 total sections
    │
    ▼
[3] Verified context injection
    │   Embeds clean_question → searches verified_answers (IVFFlat, threshold 0.75)
    │   If found: inject as "VERIFIED ANSWERS" prefix in user prompt
    │   If not found: fallback to top 3 published reference_pages for category
    │
    ▼
[4] Grounded answer — o4-mini (reasoning_effort: medium, max_completion_tokens: 8000)
    │   System prompt enforces:
    │   - Decompose parties/scenario before answering
    │   - Direct answer (correct/incorrect first)
    │   - Ground in sources ONLY (no training data import)
    │   - No first-person SSA voice
    │   - Third person for clients ("the client", not "you")
    │   - Proper HTML formatting (no inline list markers)
    │   Returns JSON: {verdict, verdict_summary, answer, primary_sources, gaps}
    │
    ▼
[5] Self-verification
    │   Same gate as page builder
    │   Unverified values shown as inline warning in chat UI
    │
    ▼
Response with: verdict banner, answer, citations, verification warnings, sections used
```

### Model choice rationale

- **Query interpretation:** GPT-4o (fast, cheap, simple JSON extraction)
- **Grounding:** o4-mini (reasoning model — better at multi-rule chaining; internal chain-of-thought before output; `reasoning_effort: medium` uses ~512 reasoning tokens before writing)

---

## 9. Feedback & Learning System

### Three feedback surfaces

**1. Agent answer feedback** (`/ask` page)
- **Verify** → saves to `verified_answers` with embedding; `feedback_type = 'approve'`
- **Make Suggestion** → opens correction panel with issue tags; saves to `answer_feedback`; if corrected version provided, also saves to `verified_answers`; `feedback_type = 'correct'` or `'reject'`

**2. KB page section feedback** (review UI, right panel)
- Per-section **Verify** / **Make Suggestion** buttons below each body section and FAQ answer
- Tracked in local state during review session
- Surfaces systematic issues across pages

**3. KB page approval hook** (`app/admin/kb-review/actions.ts → saveAndApprove()`)
- When a reviewer approves any page, the page's `h1` (as question) + `quick_answer` (as answer) is automatically embedded and upserted to `verified_answers`
- This pre-seeds the agent's context corpus with every expert-reviewed page with zero extra effort

### Learning path

| Phase | Mechanism | Benefit |
|---|---|---|
| Now | Few-shot injection from `verified_answers` | Agent gets better context per query |
| ~100 pairs | Pattern review — `answer_feedback` correction tags | Identify systematic retrieval gaps |
| ~300 pairs | Fine-tune GPT-4o-mini on verified Q&A pairs | Model learns Social Security reasoning patterns |
| Ongoing | Quarterly fine-tune cycles | Model improves with each review cycle |

---

## 10. Admin Review System

**URL:** `https://knowledge.nssapros.com/admin/kb-review`

### Authentication
Supabase magic link (OTP). Reviewer email must be in `kb_reviewers` table. Admin email (`jstanley@nssapros.com`) bypasses reviewer table check and sees all pages.

### Queue tabs
- **⚑ Review Due** (default) — published pages with stale/missing `source_last_verified` + all drafts and in_review pages
- **Needs Review** — `in_review` status
- **Drafts** — `draft` status
- **Published** — `published` status
- **Superseded** — `superseded` status

### Review editor

Split-pane layout:
- **Left:** Editable form fields — title, H1, SEO title, meta, eyebrow, quick answer (rich text editor), body sections, FAQ, primary sources, deprecation note
- **Right:** Live preview — updates as form changes; shows verification flag banner + inline SOURCE GAP blocks; Verify/Make Suggestion buttons per section and per FAQ

### Actions
- **Save for Later** — saves fields, preserves status; revalidates cache
- **Approve** → sets `status = 'published'`, stamps `date_published`, `approved_by`, `source_last_verified`; triggers `verified_answers` upsert hook

### Review Due / annual cycle
Pages show "Overdue" (>12 months since `source_last_verified`) or "Due soon" (>9 months). Workflow: filter ⚑ Review Due → verify content against current POMS → Approve → date stamps update.

### Rich text editor
Quick Answer field uses `components/RichTextEditor.tsx` — contenteditable with Bold/Italic toolbar. Stores as HTML. Reviewers never see raw tags.

---

## 11. Public-Facing Site

### Routes

| Route | Component | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Homepage with search + category cards + recent pages |
| `/search?q=` | `app/search/page.tsx` | Full-text search across published pages |
| `/social-security` | `app/social-security/page.tsx` | Category index with eyebrow filter pills |
| `/social-security/[slug]` | SSG from `generateStaticParams` | Individual article pages |
| `/irmaa` | `app/irmaa/page.tsx` | IRMAA & Medicare category index |
| `/irmaa/[slug]` | SSG | |
| `/ask` | `app/ask/page.tsx` | Research agent chat |
| `/preview/[id]` | Server component, public | Preview any page by ID (no auth) |

### SEO structure

**Breadcrumb:** `Knowledge Base / [Category] / [Eyebrow] / [Title]`  
Example: `Knowledge Base / IRMAA & Medicare / IRMAA Basics / Understanding the IRMAA Two-Year Look-Back Rule`

**H1 vs Title:** `title` is the short canonical label used in breadcrumbs and admin. `h1` is the keyword-rich SEO headline rendered on the page. Generated separately by the model.

**CTA block:**
- Social Security pages: links to `nssapros.com/social-security-training`
- IRMAA pages: links to `nssapros.com/irmaa-medicare-training-course`; red styling instead of navy
- Anchor text rotates through 6 keyword variants per category (e.g. "Social Security certification", "National Social Security Advisor", "IRMAA Certified Planner®")
- Action phrase varies by eyebrow (e.g. Claiming Rules → "can model this filing decision for the client")
- Heading varies by eyebrow (consumer voice — speaks to the retiree reading the page)

---

## 12. Coverage Reporting

**Script:** `scripts/coverage-report.ts`  
**Output:** `coverage.json` (generated on demand; read by the admin coverage page)  
**Admin UI:** `https://knowledge.nssapros.com/admin/coverage`

Reports:
- Total POMS sections / advisor-relevant (Tier 1+2) / internal/ops (Tier 3)
- Published page count and cited section count
- Per-cluster coverage % with progress bars (red <10%, yellow 10-40%, green 40%+)
- Suggested next draft clusters (largest uncovered Tier 1 topics)

**Refresh:** Run manually: `npx tsx scripts/coverage-report.ts --json`

---

## 13. Page Generation Workflow

### Topic queue

**File:** `lib/topic-queue.ts`  
Prioritized list of advisor-relevant topics with `{slug, title, topic, category}`. The "Give me more" button in the admin queue shows the reviewer how many topics remain and which category.

### Pull-based generation

Generation is manual (Tank runs the scripts locally) to prevent batching a wall of unreviewed pages onto SMEs. Target queue depth: ~15-20 in_review at a time.

**Commands to generate pages:**
```bash
cd /Users/nssaagent/knowledge
TOPIC="How does the Government Pension Offset reduce spousal benefits" \
TITLE="Government Pension Offset" \
SLUG="government-pension-offset" \
CATEGORY="social-security" \
SKIP_WORKED_EXAMPLE=true \
npx tsx --tsconfig tsconfig.json --env-file .env.local scripts/draft/draft_page_v2.ts
```

### Tranche discipline

Start conservative (5 pages per batch). Widen as consecutive clean tranches prove systematic errors are ruled out. The `MAX_COUNT` in `/api/admin/generate/route.ts` enforces the ceiling.

---

## 14. API Reference

### `POST /api/ask`

Research agent endpoint.

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
  "sections_used": [{"section_number": "string", "title": "string|null", "score": number, "source_url": "string"}],
  "verification": {"passed": boolean, "unverified": [...]}
}
```

### `POST /api/feedback`

Captures agent answer feedback.

**Request:**
```json
{
  "question": "string",
  "original_answer": "string",
  "corrected_answer": "string|undefined",
  "verdict": "string",
  "primary_sources": [...],
  "sections_used": [...],
  "feedback_type": "approve"|"correct"|"reject",
  "correction_tags": ["wrong_section"|"wrong_value"|"missing_rule"|"misread_scenario"],
  "correction_note": "string",
  "category": "social-security"|"irmaa"
}
```

### `POST /api/admin/generate`

Trigger page generation from topic queue (admin only).

**Request:**
```json
{"category": "social-security"|"irmaa"|undefined, "count": 5}
```

**Note:** Currently returns topic slugs to generate but does not spawn background process (Vercel serverless cannot spawn local scripts). Generation is run locally via CLI.

---

## 15. Environment Variables

### `.env.local` (knowledge repo)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key (embeddings + GPT-4o + o4-mini) |

### `~/.openclaw/workspace/.secrets/supabase.env`

Direct PostgreSQL connection variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) for running migrations and maintenance scripts via psql.

---

## 16. Deployment

**Deploy command:** `cd /Users/nssaagent/knowledge && vercel deploy --prod`

**Build:** Next.js static generation for published pages (`generateStaticParams`). Admin and agent pages are `force-dynamic`.

**Cache invalidation:** `revalidatePath()` called on approval/save actions.

**DB migrations:** Applied manually via psql using `~/.openclaw/workspace/.secrets/supabase.env`. Migration files in `supabase/migrations/`.

| Migration | Content |
|---|---|
| 001 | Initial schema |
| 002 | KB reviewer tables |
| 003 | Source documents + chunks + embeddings |
| 004 | Hybrid search infrastructure (match_chunks, search_documents_fts, GIN index, draft_metadata) |
| 005 | h1 column on reference_pages |
| Ad hoc | answer_feedback table, verified_answers RPC, authenticator role timeout |

---

## 17. Key Design Decisions

### Retrieval: IVFFlat + RRF, not HNSW

IVFFlat chosen for its performance on the 202K-chunk corpus with minimal setup. `probes=3` provides sufficient recall. The WHERE-on-similarity anti-pattern was discovered during development — always use ORDER BY + LIMIT only; never filter on similarity in SQL.

### Verification gate: mechanical, not LLM

The self-verification gate does substring matching (with normalisation) rather than asking an LLM to verify. This is intentional — LLMs can be convinced a value is "approximately" correct; substring matching is binary. The gate catches every number the model cannot trace to a source; humans catch everything else.

### Pages save with flags rather than blocking

As of v1.1, verification failure does NOT block the page save. Instead, pages with unverified values save as `in_review` with flag annotations visible in the review UI. This prevents the pipeline from being deadlocked by topics where POMS expresses values in tables (e.g. WEP percentage table) that are not parseable as inline text.

### No `worked_example` in most drafts

Annual-specific values (IRMAA thresholds, earnings test amounts, WEP percentage tables) change yearly. Models pull these from training data rather than source text. Worked examples for these topics are omitted (`SKIP_WORKED_EXAMPLE=true`) until a human reviewer can add verified values.

### o4-mini for reasoning, GPT-4o for classification

o4-mini's internal chain-of-thought (reasoning tokens) significantly improves multi-rule questions (e.g. chaining deemed filing + spousal reduction + earnings test). Query interpretation uses GPT-4o (fast, cheap, structured JSON extraction). Grounding uses o4-mini (`reasoning_effort: medium`, 8000 token budget — the model uses ~500 reasoning tokens before writing).

### Verified answers as the learning mechanism

Fine-tuning is the long-term goal, but the verified_answers corpus serves as a lightweight interim solution: every approved KB page and every agent thumbs-up seeds the corpus; future queries use these as few-shot examples via embedding similarity. At ~300 verified pairs, fine-tuning GPT-4o-mini becomes viable.

### Pull-based page generation

Pages are generated on reviewer demand, not on a schedule, to prevent a wall of unreviewed pages. The topic queue is prioritized by coverage gap (largest uncovered Tier 1 clusters first). Tranche size starts at 5 and will widen as clean consecutive tranches prove out systematic accuracy.

---

*Document maintained by Tank. Update when significant architectural changes are made.*
