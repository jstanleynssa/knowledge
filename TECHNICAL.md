# NSSA Knowledge Base — Technical Reference

**Project:** `knowledge.nssapros.com`  
**Stack:** Next.js 16 · Supabase (Postgres + pgvector) · Vercel  
**Supabase project:** `eqipvrcmugnvkextqmym`  
**Last updated:** 2026-07-14

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Repository Structure](#4-repository-structure)
5. [Content Pipeline](#5-content-pipeline)
6. [Review System](#6-review-system)
7. [Authentication & Security](#7-authentication--security)
8. [Publishing](#8-publishing)
9. [Environment Variables](#9-environment-variables)
10. [Running Locally](#10-running-locally)
11. [Deployment](#11-deployment)
12. [Phase 2 — RAG Agent](#12-phase-2--rag-agent)
13. [Known Constraints & Gotchas](#13-known-constraints--gotchas)

---

## 1. Overview

The NSSA Knowledge Base is a database-driven Social Security and IRMAA reference corpus published at `knowledge.nssapros.com`. It provides:

- **Authoritative reference pages** on SS/IRMAA rules, drafted from primary government sources (POMS, CFR), reviewed by subject-matter experts, and published as statically-generated HTML
- **A review workflow** for SME gatekeeping before anything goes live
- **A Phase 2 RAG advisor agent** (schema ready, not yet wired) that answers advisor questions by retrieving from the indexed source corpus

The guiding principle: **every published claim traces to a cited government source.** Nothing publishes without an SME sign-off.

---

## 2. Architecture

### Content layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1 — Raw Source Substrate (never published)   │
│  source_documents  →  source_chunks (+ embeddings)  │
└─────────────────────────┬───────────────────────────┘
                          │  draft_page.ts (AI drafter)
                          ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2 — Reference Pages                          │
│  reference_pages  (draft → in_review → approved     │
│                    → published → retired/superseded) │
└─────────────────────────┬───────────────────────────┘
                          │  Next.js SSG
                          ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3 — Static Site (Vercel)                     │
│  /social-security/[slug]   /irmaa/[slug]            │
└─────────────────────────────────────────────────────┘
```

### Status lifecycle

```
draft  →  in_review  →  approved  →  published
                                  ↘  retired
                                  ↘  superseded
```

Only `published` and `superseded` pages are publicly readable (RLS enforced). `superseded` pages remain readable with a deprecation note explaining why (e.g., modified by legislation).

### Site rendering

- Public pages (`/social-security/[slug]`, `/irmaa/[slug]`) are **SSG** — statically generated at Vercel build time from `published` rows
- Review UI (`/admin/kb-review`) is **dynamic** — server-rendered per request with auth
- Preview (`/preview/[id]`) is **dynamic** — service-client access to any status for internal use

---

## 3. Database Schema

### `source_documents` (Layer 1)

Raw government text. Never published or exposed publicly.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `source_type` | text | `poms \| cfr \| handbook \| regs` |
| `doc_kind` | text | `rule \| toc \| empty` — only `rule` rows are publishable/embeddable |
| `section_number` | text | Normalized: `GN 00204.020`, `20 CFR 404.30` |
| `title` | text | |
| `full_text` | text | Verbatim source — NEVER published raw |
| `source_url` | text | Canonical `policy.ssa.gov` citation URL |
| `last_updated` | text | SSA's date stamp |
| `scrape_date` | date | |

**RLS:** Fully locked — no public read. Service role only.

---

### `source_chunks` (Layer 1)

Chunked + embedded passages for Phase 2 RAG retrieval.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `source_document_id` | uuid | FK → `source_documents` |
| `section_number` | text | |
| `chunk_text` | text | |
| `embedding` | vector(1536) | OpenAI `text-embedding-3-small` |

**Index:** IVFFlat (cosine) — 100 lists. Only populated from `doc_kind = 'rule'` rows.

---

### `reference_pages` (Layer 2)

The published content. Every row is one canonical rule page.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | URL-safe, e.g. `deemed-filing` |
| `category` | text | `social-security \| irmaa` |
| `title` | text | H1, canonical rule name |
| `seo_title` | text | `<title>` tag, ≤60 chars |
| `meta_description` | text | 150–160 chars |
| `eyebrow` | text | Optional section label, e.g. `Claiming Rules` |
| `quick_answer` | text | Definition-led summary, ~200 words |
| `body_sections` | jsonb | `[{heading, prose, citation_ref}]` |
| `worked_example` | jsonb | `{label, paragraphs[]}` |
| `faq` | jsonb | `[{q, a}]` — renders as FAQPage JSON-LD |
| `primary_sources` | jsonb | `[{tag, section_number, url}]` |
| `og_image_url` | text | |
| `reviewer` | text | Assigned SME display name |
| `status` | enum | `draft \| in_review \| approved \| published \| retired \| superseded` |
| `deprecation_note` | text | Set when `status = 'superseded'` |
| `source_last_verified` | date | |
| `date_published` | date | Set by publish webhook |
| `date_modified` | date | Set by publish webhook |
| `approved_by` | text | Display name of approving SME (set at approval) |
| `approved_at` | timestamptz | Timestamp of approval |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated by trigger |

**RLS:** Public read of `status IN ('published', 'superseded')` only. Service role bypasses.

---

### `kb_reviewers`

Controls access to the review UI and tracks which categories each reviewer can approve.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | Magic link auth email — must match `auth.users.email` |
| `display_name` | text | Written to `approved_by` at approval time |
| `categories` | text[] | `{'social-security'}`, `{'irmaa'}`, or both |
| `created_at` | timestamptz | |

**Current reviewers:**

| Reviewer | Email | Categories |
|---|---|---|
| Cindi Hill | `chill@nssapros.com` | Social Security |
| Todd Valles | `tvalles@nssapros.com` | IRMAA |
| Jim Blair | `jblair@mypremierplan.com` | Social Security + IRMAA |

**RLS:** Enabled. No public policy — service role only.

**Admin bypass:** `jstanley@nssapros.com` is hardcoded as admin in the proxy and action logic. Admin bypasses the `kb_reviewers` table entirely and sees all categories.

---

### `verified_answers` + `unanswered_questions` (Phase 2)

Schema is in place; not yet wired to the advisor agent. See [Phase 2](#12-phase-2--rag-agent).

---

### Vector search functions

Two SQL functions for Phase 2 retrieval:

- `match_source_chunks(query_embedding, match_threshold, match_count)` — cosine similarity search over source corpus
- `match_verified_answers(query_embedding, match_threshold, match_count)` — search over approved expert answers

---

## 4. Repository Structure

```
knowledge/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx          # Magic link login form ('use client')
│   │   └── kb-review/
│   │       ├── page.tsx            # Review queue (filtered by reviewer category)
│   │       ├── actions.ts          # approvePage() server action
│   │       └── [id]/
│   │           ├── page.tsx        # Individual page review + approve button
│   │           └── ApproveButton.tsx  # Client component for approval
│   ├── auth/callback/route.ts      # PKCE magic link code exchange
│   ├── api/
│   │   ├── preview-check/route.ts  # Diagnostic (delete when done)
│   │   └── publish-webhook/route.ts  # Marks approved→published + triggers Vercel rebuild
│   ├── social-security/[slug]/page.tsx  # SSG public page
│   ├── irmaa/[slug]/page.tsx            # SSG public page
│   ├── preview/[id]/page.tsx            # Dynamic preview (any status, service client)
│   ├── layout.tsx
│   ├── page.tsx                    # Homepage (placeholder)
│   ├── globals.css
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   └── ReferencePage.tsx           # Full-page render component (SSG + preview + review)
├── lib/
│   ├── supabase.ts                 # Client factory (public / service / session / proxy)
│   └── types.ts                   # All TypeScript types
├── scripts/
│   ├── ingest/
│   │   ├── fetch_poms.ts           # Phase 1/2 POMS HTTP fetch + DB upsert
│   │   ├── ingest_octoparse.ts     # Octoparse CSV → source_documents
│   │   └── chunk_and_embed.ts      # source_documents → source_chunks + embeddings
│   └── draft/
│       └── draft_page.ts           # AI drafter: source rows → reference_pages (draft)
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_superseded.sql
│   └── 003_kb_reviewers.sql
├── proxy.ts                        # Next.js 16 route protection (replaces middleware.ts)
├── next.config.ts
├── package.json
└── TECHNICAL.md                    # This file
```

---

## 5. Content Pipeline

### Step 1 — Ingest source documents

**Option A — Octoparse (current for POMS):**
```bash
npm run ingest:octoparse
# Reads a CSV export from Octoparse and upserts into source_documents
```

**Option B — Direct HTTP fetch (scripts/ingest/fetch_poms.ts):**
```bash
npm run ingest:poms           # both phases
npm run ingest:poms:phase1    # TOC pages only
npm run ingest:poms:phase2    # leaf rule pages only
npm run ingest:poms:check     # dry-run count check
```

Both paths upsert on `(source_type, section_number)` — safe to re-run.

### Step 2 — Chunk and embed

```bash
npm run embed         # only chunks not yet embedded
npm run embed:force   # re-embed everything
```

Produces `source_chunks` rows with `vector(1536)` embeddings via OpenAI `text-embedding-3-small`. Only `doc_kind = 'rule'` rows are embedded.

### Step 3 — Draft a reference page

```bash
npm run draft -- \
  --slug=deemed-filing \
  --category=social-security \
  --title="Deemed filing" \
  --sections="GN 00204.020,RS 00615.020" \
  --reviewer="Cindi Hill"
```

The AI drafter:
1. Fetches the specified `source_documents` rows from the DB
2. Calls Claude (or OpenAI — swappable) to produce structured page content
3. Inserts a `reference_pages` row with `status = 'draft'`
4. **Never invents section numbers** — all `primary_sources` citations must trace to a real DB row

**⚠️ Do not batch-generate at volume.** Seed first 5 pages, run through the full review loop, measure quality, tune the prompt, then scale.

### Step 4 — Set status to `in_review`

When a draft is ready for SME review, update its status:

```sql
UPDATE reference_pages
SET status = 'in_review', reviewer = 'Cindi Hill'
WHERE slug = 'deemed-filing';
```

Or do it via Supabase dashboard. The reviewer name in the `reviewer` column is informational — the `kb_reviewers` table determines actual access.

### Step 5 — SME review and approval

Reviewers log into `/admin/kb-review`, read the page, and click **Approve**. This:
- Sets `status = 'approved'`
- Sets `approved_by = reviewer.display_name` (snapshot, not FK)
- Sets `approved_at = now()`

### Step 6 — Publish

Call the publish webhook to promote all `approved` rows to `published` and trigger a Vercel rebuild:

```bash
curl -X POST https://knowledge.nssapros.com/api/publish-webhook \
  -H "Authorization: Bearer $PUBLISH_WEBHOOK_SECRET"
```

The webhook:
1. Fetches all `approved` pages
2. Sets `status = 'published'`, `date_published`, `date_modified`
3. POSTs to `VERCEL_DEPLOY_HOOK_URL` to trigger a rebuild

Vercel rebuilds the static site and the new pages go live.

---

## 6. Review System

### How access works

The `kb_reviewers` table is the permission layer. Any user whose email is in that table can access `/admin/kb-review`. The route proxy checks this on every request.

**Access control matrix:**

| User | Can access | Sees |
|---|---|---|
| `jstanley@nssapros.com` | All `/admin/*` | All `in_review` pages |
| `chill@nssapros.com` | All `/admin/*` | Social Security pages only |
| `tvalles@nssapros.com` | All `/admin/*` | IRMAA pages only |
| `jblair@mypremierplan.com` | All `/admin/*` | Social Security + IRMAA |
| Anyone else | `/admin/login` only | Bounced with `?error=unauthorized` |

### Onboarding a new reviewer

1. Add them to `kb_reviewers`:
```sql
INSERT INTO kb_reviewers (email, display_name, categories)
VALUES ('new@example.com', 'Name Here', ARRAY['social-security']);
```

2. Send them the URL: `https://knowledge.nssapros.com/admin/kb-review`

3. They enter their email → receive a magic link → click it → account created automatically on first auth

No portal invite needed — Supabase magic link creates the `auth.users` record on first login.

### Removing a reviewer

```sql
DELETE FROM kb_reviewers WHERE email = 'old@example.com';
```

Their `auth.users` record persists but they lose access immediately (proxy checks `kb_reviewers` on every request).

### Attribution record

Each approved page stores a permanent snapshot:
- `approved_by`: Display name at time of approval (e.g., `"Cindi Hill"`)
- `approved_at`: Timestamp

This is a snapshot, not a FK — if the reviewer is removed from `kb_reviewers`, the approval record remains intact.

---

## 7. Authentication & Security

### Auth method

Magic link (OTP) via Supabase Auth, PKCE flow.

**Flow:**
1. User visits `/admin/*` → proxy intercepts, redirects to `/admin/login?next=<path>`
2. User enters email → client calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback?next=...' } })`
3. Supabase emails a magic link
4. User clicks → lands at `/auth/callback?code=...`
5. Callback calls `supabase.auth.exchangeCodeForSession(code)` → session stored in cookies
6. Redirected to original path

### Supabase client types

Four clients in `lib/supabase.ts`:

| Function | Key used | Use case |
|---|---|---|
| `createPublicClient()` | Anon key | SSG pages, public RLS reads |
| `createServiceClient()` | Service role key | Ingest scripts, admin actions — bypasses RLS |
| `createSessionClient()` | Anon key + cookie session | Server Components, Route Handlers, Server Actions |
| `createProxyClient(req, res)` | Anon key + cookie session | `proxy.ts` only — reads/writes cookies on request/response |

**⚠️ Never expose the service role key to the browser.** It is used server-side only.

### Route protection (`proxy.ts`)

Next.js 16 uses `proxy.ts` (not `middleware.ts`). The proxy:

1. Passes through `/admin/login` and `/auth/callback` without auth check
2. For all other `/admin/*` routes, verifies the Supabase session via `supabase.auth.getUser()`
3. If no session → redirect to `/admin/login`
4. If session but not admin and not in `kb_reviewers` → redirect with `?error=unauthorized`

### RLS summary

| Table | Public read | Notes |
|---|---|---|
| `reference_pages` | `published` + `superseded` only | Enforced by RLS policy |
| `source_documents` | None | Raw government text — never exposed |
| `source_chunks` | None | Embedding vectors — service role only |
| `kb_reviewers` | None | Service role only |
| `verified_answers` | None | Phase 2, advisor-gated |
| `unanswered_questions` | None | Phase 2 |

---

## 8. Publishing

### Manual trigger

```bash
curl -X POST https://knowledge.nssapros.com/api/publish-webhook \
  -H "Authorization: Bearer $PUBLISH_WEBHOOK_SECRET"
```

### Automated trigger (recommended)

Set up a Supabase `pg_cron` job or an external cron to call the webhook on a schedule (e.g., nightly at 2 AM ET).

### What happens on publish

1. All `status = 'approved'` rows → `status = 'published'`
2. `date_published` and `date_modified` set to today
3. Vercel deploy hook fired → rebuild triggered
4. Next.js SSG runs `generateStaticParams()` which fetches `published` rows → static HTML generated per slug

**Important:** The deploy hook URL (`VERCEL_DEPLOY_HOOK_URL`) is optional. If absent, pages are marked published in the DB but the static site won't update until the next manual deploy.

### Retiring or superseding a page

```sql
-- Retire (no replacement)
UPDATE reference_pages SET status = 'retired' WHERE slug = 'some-slug';

-- Supersede (rule changed by legislation)
UPDATE reference_pages
SET status = 'superseded',
    deprecation_note = 'Modified by Social Security Fairness Act of 2023'
WHERE slug = 'some-slug';
```

Superseded pages remain publicly readable with their deprecation note rendered on the page.

---

## 9. Environment Variables

All vars go in `.env.local` (local) or Vercel environment settings (production).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public, safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — **never expose to browser** |
| `ANTHROPIC_API_KEY` | For drafting | Used by `draft_page.ts` |
| `OPENAI_API_KEY` | For embedding | Used by `chunk_and_embed.ts` |
| `PUBLISH_WEBHOOK_SECRET` | Recommended | Secures `/api/publish-webhook` |
| `VERCEL_DEPLOY_HOOK_URL` | Recommended | Triggers Vercel rebuild on publish |

---

## 10. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
# → http://localhost:3000

# 4. Test review UI
# Navigate to http://localhost:3000/admin/kb-review
# You'll be redirected to /admin/login — enter your email to get a magic link
```

**Note:** Magic links in development will redirect to `http://localhost:3000/auth/callback`. Supabase must have `http://localhost:3000` in its allowed redirect URLs (Supabase Dashboard → Auth → URL Configuration).

---

## 11. Deployment

This repo deploys to **Vercel** via Git push. No special build config needed — `next build` is the build command.

**Required Vercel environment variables:** See [Section 9](#9-environment-variables).

**Supabase allowed redirect URLs** (Auth → URL Configuration):
- `https://knowledge.nssapros.com/auth/callback`
- `http://localhost:3000/auth/callback` (for local dev)

**Migrations:** Applied manually via Supabase dashboard SQL editor or `psql`. Files in `supabase/migrations/` are the source of record. Migration 003 was applied via `bin/supabase-sql.sh` on 2026-07-14.

---

## 12. Phase 2 — RAG Agent

The schema for Phase 2 is already in place (`verified_answers`, `unanswered_questions`, `source_chunks` with embeddings, `match_source_chunks()` and `match_verified_answers()` functions). The agent is not yet wired.

**Planned architecture:**

1. Advisor asks a question
2. Agent embeds the question (`text-embedding-3-small`)
3. Calls `match_verified_answers()` — if confident match found, returns that answer
4. Falls back to `match_source_chunks()` — retrieves relevant POMS/CFR passages
5. Claude drafts an answer, citing only the retrieved `section_number` values
6. If confidence below threshold → logs to `unanswered_questions` for expert routing

**Expert review loop:**

- SMEs review `unanswered_questions` and produce verified answers in `verified_answers`
- Verified answers get embedded and enter the retrieval pool
- Over time the agent gets better without retraining

---

## 13. Known Constraints & Gotchas

### Next.js 16 specifics

- **`proxy.ts` not `middleware.ts`** — Next.js 16 renamed this file. Do not create `middleware.ts`.
- **`params` is a Promise** — `await params` before destructuring in `page.tsx` and `layout.tsx`
- **`cookies()` is async** — always `await cookies()` in Server Components

### Supabase + SSR

- Use `createSessionClient()` (from `@supabase/ssr`) for any server-side code that needs the user session
- Use `createServiceClient()` only for admin/ingest operations — it bypasses RLS
- The proxy client (`createProxyClient`) must mutate both `req.cookies` and `res.cookies` to propagate refreshed tokens

### Content discipline

- **Never publish a claim without a citation.** The `primary_sources` array must contain real `section_number` values traceable to `source_documents` rows
- **`full_text` is never published raw.** It is input to the AI drafter only
- **Do not batch-generate pages at volume** until the first 5 have been reviewed and approved. The prompt will need tuning

### Reviewer accounts

As of 2026-07-14, Cindi Hill, Todd Valles, and Jim Blair do not yet have portal accounts at their `@nssapros.com` / `@mypremierplan.com` emails. They will be auto-provisioned by Supabase on first magic link login. Send them `https://knowledge.nssapros.com/admin/kb-review`.

### `approved_by` is a snapshot

The `approved_by` column stores the reviewer's display name at approval time (not a FK). This is intentional — if a reviewer is removed from `kb_reviewers`, historical approvals remain attributed correctly.

### Publish webhook and Vercel rebuild

The publish webhook marks pages as `published` in the DB *before* triggering the Vercel rebuild. There is a brief window (seconds to minutes, depending on build time) where the DB says `published` but the static site hasn't updated. This is acceptable for a content site with no real-time requirements.

---

*Maintained by Tank (NSSA AI assistant). Update this file when schema, routes, or pipeline steps change.*
