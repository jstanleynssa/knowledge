# NSSA Knowledge Base — `knowledge.nssapros.com`

Database-driven Social Security & IRMAA reference corpus.
Plain-language explanations, each backed by SSA primary-source citations and reviewed
by a subject-matter expert before publication.

**Stack:** Next.js 16 · Supabase (shared with members/dashboard/directory) · Vercel · pgvector

---

## Architecture

```
Layer 1  source_documents / source_chunks   ← raw SSA source text + embeddings (NEVER published)
Layer 2  reference_pages                     ← our synthesis, review-gated (published)
Layer 3  static pages on Vercel             ← generated from approved Layer-2 rows
         + Phase 2: agent reads Layer 1 (vector) + verified_answers
```

**Non-negotiable:** nothing publishes, and no agent answer goes out, without SME review.

---

## Setup

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# add OPENAI_API_KEY and ANTHROPIC_API_KEY when ready to embed/draft

npm install
npm run dev
```

### Apply schema

Open Supabase dashboard → SQL editor → paste `supabase/migrations/001_initial_schema.sql` → Run.

---

## Build order (follow in sequence)

### Step 1 — Schema ✅
`supabase/migrations/001_initial_schema.sql` — all tables + pgvector extension.
Apply once via Supabase dashboard.

### Step 2 — Ingest POMS

**Fetch test result (2026-07-14): Tests 1, 2, and 3 all PASS.**
POMS serves static HTML. 75/75 pages at 1.5s rate, zero throttling. Full scripted ingest viable.

```bash
# Phase 1: build the leaf URL index
npm run ingest:poms:phase1

# Phase 2: fetch + ingest all leaf pages (~17K pages, ~7h at 1.5s/req)
npm run ingest:poms:phase2

# Or both together:
npm run ingest:poms

# Completeness check:
npm run ingest:poms:check

# After ingest, embed rule documents for Phase 2 agent:
npm run embed
```

If SSA starts rate-limiting the bulk run, switch to Octoparse:
```bash
OCTOPARSE_TASK_IDS=taskId1 OCTOPARSE_SOURCE_TYPES=poms npm run ingest:octoparse
```

### Step 3 — Page template ✅
`components/ReferencePage.tsx` — matches `deemed-filing.html` exactly.
`app/social-security/[slug]/page.tsx` — SSG route.
`app/irmaa/[slug]/page.tsx` — SSG route.
`app/robots.ts`, `app/llms.txt/route.ts` — crawl/AI indexing config.

### Step 4 — Review UI
Build in `members.nssapros.com` or `dashboard.nssapros.com` (Jason's call).
Reads `reference_pages` with `status = 'in_review'`.
Shows `source_documents.full_text` side-by-side with the cited section.
One-click Approve (→ `approved`) / Request changes (→ `draft`).

### Step 5 — Seed first 5 pages

```bash
# Draft a page (produces status='draft', goes to review queue):
npm run draft -- \
  --slug=deemed-filing \
  --category=social-security \
  --title="Deemed filing" \
  --sections="GN 00204.020,RS 00615.020" \
  --reviewer="Cindi Hill"
```

Seed pages: deemed-filing, divorced-spousal, surviving-divorced-spouse, annual-earnings-test, wep-gpo.
Run full review loop → measure SME time/page + citation accuracy → tune prompt before scaling.

### Step 6 — Publish on approval

POST to `/api/publish-webhook` (Bearer token required) to drip-publish approved pages.
Set up a Vercel deploy hook and add the URL to `VERCEL_DEPLOY_HOOK_URL`.
Schedule via cron/Supabase pg_cron as desired.

### Step 7 — Phase 2: Agent (after Phase 1 proven)

RAG over `source_chunks` + `verified_answers`. Wire up in `members.nssapros.com`
(gated to certified advisors). Guardrails: strict "answer only from retrieved context"
+ relevance threshold → refusal + `unanswered_questions` log when confidence low.

---

## File map

```
app/
  layout.tsx                     Root layout
  robots.ts                      robots.txt (allows AI bots)
  sitemap.ts                     sitemap.xml (auto from published pages)
  llms.txt/route.ts              /llms.txt for AI engines
  social-security/[slug]/        SSG reference pages
  irmaa/[slug]/                  SSG reference pages
  api/publish-webhook/           Publish + Vercel rebuild trigger
components/
  ReferencePage.tsx              Page template (matches deemed-filing.html)
lib/
  supabase.ts                    Supabase client (public + service)
  types.ts                       TypeScript types
scripts/
  ingest/
    fetch_poms.ts                Scripted POMS ingest (primary path)
    ingest_octoparse.ts          Octoparse API pull (fallback)
    chunk_and_embed.ts           Chunk + embed for vector search
  draft/
    draft_page.ts                AI-assisted page drafter (review-gated)
supabase/
  migrations/
    001_initial_schema.sql       Full schema (all layers + pgvector)
tmp/
  poms_leaf_urls.json            Phase 1 URL index (gitignored)
```

---

## Brand

- Navy: `#0D3B5C`
- IRMAACP red: `#C0394A`
- Citation amber: `#8A5A00` / `#F6EEDD`

---

## Reviewers

- **Cindi Hill** — Social Security pages
- **Todd Valles** — IRMAA pages
