#!/usr/bin/env tsx
/**
 * ingest_octoparse.ts — Pull POMS/CFR/Handbook data from Octoparse API
 *
 * Use when: fetch_poms.ts Test 3 fails (SSA throttles bulk scripted fetches)
 * or when Jason has configured Octoparse cloud tasks for CFR/Handbook sources.
 *
 * Octoparse API facts (Standard tier):
 * - Auth: OAuth2 with refresh token (15-day validity — implement refresh, not static key)
 * - Endpoint: dataapi.octoparse.com/api/alldata/GetDataOfTaskByOffset
 * - Max 1,000 rows/request; loop offset until exhausted
 * - Rate limit: 20 req/sec; back off on 429
 * - Cloud-only: API can't reach local runs
 * - Data expires after 90 days: pull promptly, Supabase is the durable copy
 *
 * Usage:
 *   OCTOPARSE_TASK_IDS=taskId1,taskId2 npx tsx scripts/ingest/ingest_octoparse.ts
 */

import { createServiceClient } from '@/lib/supabase';
import type { SourceDocumentInsert, OctoparsePOMSRow, SourceType } from '@/lib/types';
import 'dotenv/config';

// ─── Config ───────────────────────────────────────────────────────────────────

const OCTOPARSE_BASE = 'https://dataapi.octoparse.com';
const TOKEN_URL = 'https://dataapi.octoparse.com/token';
const PAGE_SIZE = 1000;
const RATE_LIMIT_DELAY_MS = 60;   // 20 req/sec → ~60ms between requests
const UPSERT_BATCH = 50;

// ─── OAuth2 token management ──────────────────────────────────────────────────

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // ms epoch
}

let tokenState: TokenState | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenState && Date.now() < tokenState.expiresAt - 60_000) {
    return tokenState.accessToken;
  }
  // Refresh or initial auth
  const username = process.env.OCTOPARSE_USERNAME!;
  const password = process.env.OCTOPARSE_PASSWORD!;
  if (!username || !password) {
    throw new Error('OCTOPARSE_USERNAME / OCTOPARSE_PASSWORD not set');
  }

  const body = tokenState
    ? new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenState.refreshToken,
      })
    : new URLSearchParams({
        grant_type: 'password',
        username,
        password,
      });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Octoparse auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenState = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenState.accessToken;
}

// ─── Data fetch (paginated) ───────────────────────────────────────────────────

async function* fetchTaskData(taskId: string): AsyncGenerator<OctoparsePOMSRow[]> {
  let offset = 0;
  let total = 0;

  while (true) {
    const token = await getAccessToken();
    const url = `${OCTOPARSE_BASE}/api/alldata/GetDataOfTaskByOffset?taskId=${taskId}&offset=${offset}&size=${PAGE_SIZE}`;

    const res = await fetch(url, {
      headers: { Authorization: `bearer ${token}` },
    });

    if (res.status === 429) {
      console.warn(`  429 rate-limited — waiting 5s`);
      await sleep(5000);
      continue;
    }
    if (!res.ok) throw new Error(`Octoparse fetch failed: ${res.status}`);

    const data = await res.json();
    const rows: OctoparsePOMSRow[] = data.data ?? [];

    if (rows.length === 0) break;  // exhausted

    total += rows.length;
    yield rows;

    if (rows.length < PAGE_SIZE) break;  // last page
    offset += PAGE_SIZE;

    await sleep(RATE_LIMIT_DELAY_MS);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Normalization (§3.3) ─────────────────────────────────────────────────────

const SECTION_RE = /\b([A-Z]{2,3})\s?(\d{5}\.\d{3})\b/;
const POLICY_BASE = 'https://policy.ssa.gov/poms.nsf';

function extractLeafId(url: string): string | null {
  const m = url.match(/\/lnx\/(\d+)/i);
  return m ? m[1] : null;
}

function parseSectionNumber(row: OctoparsePOMSRow): string | null {
  // Check subSectionTitle → SectionTitle → FullRule in order
  for (const field of [row.subSectionTitle, row.SectionTitle, row.FullRule]) {
    if (!field) continue;
    const m = SECTION_RE.exec(field);
    if (m) return `${m[1]} ${m[2]}`;
  }
  return null;
}

function classifyDocKind(fullRule: string | null, url: string): 'rule' | 'toc' | 'empty' {
  if (!fullRule || fullRule.trim().length < 50) return 'empty';
  if (
    /Chapter\s+Table\s+of\s+Contents/i.test(fullRule) ||
    /Sub-?chapter\b/i.test(fullRule.slice(0, 200)) ||
    url.includes('!openview') ||
    url.includes('restricttocategory')
  ) return 'toc';
  if (fullRule.trim().length < 200) return 'toc';
  return 'rule';
}

function normalizeRow(raw: OctoparsePOMSRow, sourceType: SourceType): SourceDocumentInsert | null {
  const fullText = raw.FullRule?.trim() || null;
  const docKind = classifyDocKind(fullText, raw.Page_URL ?? '');

  // source_url: derive canonical policy.ssa.gov URL from leaf id
  const leafId = extractLeafId(raw.Page_URL ?? '');
  const sourceUrl = leafId
    ? `${POLICY_BASE}/lnx/${leafId}`
    : raw.Page_URL ?? null;

  // title: subSectionTitle preferred over SectionTitle
  const title = raw.subSectionTitle?.trim() || raw.SectionTitle?.trim() || null;

  const sectionNumber = parseSectionNumber(raw);

  // Rows without section_number AND without meaningful content → skip
  if (!sectionNumber && docKind === 'empty') return null;

  return {
    source_type: sourceType,
    doc_kind: docKind,
    section_number: sectionNumber,
    title,
    full_text: docKind !== 'empty' ? fullText : null,
    source_url: sourceUrl,
    last_updated: raw.LastUpdated?.trim() || null,
    scrape_date: new Date().toISOString().split('T')[0],
  };
}

// ─── Upsert + change detection ────────────────────────────────────────────────

async function upsertBatch(
  supabase: ReturnType<typeof createServiceClient>,
  rows: SourceDocumentInsert[],
  changedSections: Set<string>
) {
  // First, check which sections are changing (for freshness flag)
  if (changedSections.size === 0) {
    const sections = rows.map((r) => r.section_number).filter(Boolean) as string[];
    if (sections.length > 0) {
      const { data: existing } = await supabase
        .from('source_documents')
        .select('section_number, full_text, last_updated')
        .in('section_number', sections);

      const existingMap = new Map((existing ?? []).map((r) => [r.section_number, r]));
      for (const row of rows) {
        if (!row.section_number) continue;
        const ex = existingMap.get(row.section_number);
        if (ex && (ex.full_text !== row.full_text || ex.last_updated !== row.last_updated)) {
          changedSections.add(row.section_number);
        }
      }
    }
  }

  const { error } = await supabase
    .from('source_documents')
    .upsert(rows, { onConflict: 'source_type,section_number', ignoreDuplicates: false });

  if (error) console.error('Upsert error:', error.message);
}

async function flagChangedPages(
  supabase: ReturnType<typeof createServiceClient>,
  changedSections: Set<string>
) {
  if (changedSections.size === 0) return;
  console.log(`Flagging reference_pages for ${changedSections.size} changed sections...`);
  for (const sn of changedSections) {
    const { error } = await supabase
      .from('reference_pages')
      .update({ status: 'in_review' })
      .not('status', 'in', '(draft,retired)')
      .contains('primary_sources', [{ section_number: sn }]);
    if (error) console.error(`Flag error ${sn}:`, error.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const taskIds = (process.env.OCTOPARSE_TASK_IDS ?? '').split(',').filter(Boolean);
  const sourceTypes = (process.env.OCTOPARSE_SOURCE_TYPES ?? 'poms').split(',') as SourceType[];

  if (taskIds.length === 0) {
    throw new Error('OCTOPARSE_TASK_IDS not set. Comma-separate task IDs.');
  }
  if (taskIds.length !== sourceTypes.length) {
    throw new Error('OCTOPARSE_TASK_IDS and OCTOPARSE_SOURCE_TYPES must have same count.');
  }

  const supabase = createServiceClient();
  const changedSections = new Set<string>();

  for (let i = 0; i < taskIds.length; i++) {
    const taskId = taskIds[i];
    const sourceType = sourceTypes[i];
    console.log(`\n--- Task ${taskId} (${sourceType}) ---`);

    const batch: SourceDocumentInsert[] = [];
    let total = 0, skipped = 0;

    for await (const rows of fetchTaskData(taskId)) {
      for (const raw of rows) {
        const normalized = normalizeRow(raw, sourceType);
        if (!normalized) { skipped++; continue; }
        batch.push(normalized);
        total++;

        if (batch.length >= UPSERT_BATCH) {
          await upsertBatch(supabase, batch.splice(0, UPSERT_BATCH), changedSections);
        }
      }
      console.log(`  Fetched ${total} rows so far (skipped ${skipped})...`);
    }

    if (batch.length > 0) await upsertBatch(supabase, batch, changedSections);
    console.log(`Task ${taskId} done: ${total} rows ingested, ${skipped} skipped`);
  }

  await flagChangedPages(supabase, changedSections);
  console.log('\nAll tasks complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
