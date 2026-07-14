#!/usr/bin/env tsx
/**
 * fetch_poms.ts — Scripted POMS ingestion (no Octoparse required)
 *
 * Decision basis: POMS fetch tests 1 & 2 PASS — static HTML, no JS rendering,
 * no login, fields extractable cleanly. Test 3 (volume probe) result determines
 * whether bulk leaf pull uses this script or Octoparse.
 *
 * Strategy (two-phase, per handoff §3.4):
 *   Phase 1: Walk partlist → chapterlists → subchapterlists → assemble leaf URL index
 *   Phase 2: Fetch each leaf URL, extract fields, normalize, upsert into source_documents
 *
 * Usage:
 *   npx tsx scripts/ingest/fetch_poms.ts --phase=1          # Build URL index only
 *   npx tsx scripts/ingest/fetch_poms.ts --phase=2          # Fetch + ingest leaves
 *   npx tsx scripts/ingest/fetch_poms.ts --phase=all        # Run both sequentially
 *   npx tsx scripts/ingest/fetch_poms.ts --phase=2 --limit=50  # Dev: ingest first 50
 */

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '@/lib/supabase';
import type { SourceDocumentInsert } from '@/lib/types';
import 'dotenv/config';

// ─── Config ───────────────────────────────────────────────────────────────────

const POMS_BASE = 'https://secure.ssa.gov/apps10/poms.nsf';
const POLICY_BASE = 'https://policy.ssa.gov/poms.nsf';
const UA = 'Tank/1.0 (NSSA Knowledge Base ingest; admin@nssapros.com)';
const DELAY_MS = 1500;              // polite delay between requests
const BACKOFF_MAX_MS = 30_000;      // max backoff on 429
const UPSERT_BATCH = 50;            // rows per Supabase upsert batch
const URL_INDEX_PATH = path.join(__dirname, '../../tmp/poms_leaf_urls.json');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const phase: string = (args.phase as string) ?? 'all';
const limit: number | undefined = args.limit ? parseInt(args.limit as string) : undefined;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchHtml(url: string, retries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 429) {
        const wait = Math.min(DELAY_MS * Math.pow(2, attempt + 2), BACKOFF_MAX_MS);
        console.warn(`  429 rate-limited — waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (res.status === 404) return null;  // missing page — skip
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries - 1) {
        console.error(`  Failed after ${retries} attempts: ${url} — ${err}`);
        return null;
      }
      await sleep(DELAY_MS * (attempt + 1));
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Link extraction ──────────────────────────────────────────────────────────

function extractLinks(html: string, filter: (href: string) => boolean): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  const re = /<a\s[^>]*href="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (filter(href) && !seen.has(href)) {
      seen.add(href);
      results.push(href);
    }
  }
  return results;
}

function absoluteUrl(href: string): string {
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `https://secure.ssa.gov${href}`;
  return `${POMS_BASE}/${href}`;
}

// ─── PHASE 1: Build leaf URL index ───────────────────────────────────────────

async function buildUrlIndex(): Promise<string[]> {
  console.log('\n=== PHASE 1: Building POMS leaf URL index ===');
  const allLeafUrls: string[] = [];

  // L0: partlist → chapter list URLs
  console.log('L0: Fetching partlist...');
  const partHtml = await fetchHtml(`${POMS_BASE}/partlist!OpenView`);
  if (!partHtml) throw new Error('Failed to fetch partlist');

  const chapterListUrls = extractLinks(partHtml, (h) =>
    h.toLowerCase().includes('chapterlist') && h.toLowerCase().includes('restricttocategory')
  ).map(absoluteUrl);
  console.log(`  → ${chapterListUrls.length} chapter-list URLs`);

  // L1: each chapterlist → subchapter list URLs
  const subchapterListUrls: string[] = [];
  for (let i = 0; i < chapterListUrls.length; i++) {
    const url = chapterListUrls[i];
    console.log(`L1 [${i + 1}/${chapterListUrls.length}]: ${url}`);
    await sleep(DELAY_MS);
    const html = await fetchHtml(url);
    if (!html) { console.warn('  skip (no response)'); continue; }

    const links = extractLinks(html, (h) =>
      h.toLowerCase().includes('subchapterlist') && h.toLowerCase().includes('restricttocategory')
    ).map(absoluteUrl);
    subchapterListUrls.push(...links);
  }
  console.log(`\nL1 total: ${subchapterListUrls.length} subchapter-list URLs`);

  // L2: each subchapterlist → leaf /lnx/ URLs
  for (let i = 0; i < subchapterListUrls.length; i++) {
    const url = subchapterListUrls[i];
    if (i % 20 === 0) console.log(`L2 [${i + 1}/${subchapterListUrls.length}]...`);
    await sleep(DELAY_MS);
    const html = await fetchHtml(url);
    if (!html) { continue; }

    const leafLinks = extractLinks(html, (h) => h.toLowerCase().includes('/lnx/')).map(absoluteUrl);
    allLeafUrls.push(...leafLinks);
  }

  // Deduplicate
  const unique = [...new Set(allLeafUrls)];
  console.log(`\nPhase 1 complete: ${unique.length} unique leaf URLs`);

  // Persist index
  fs.mkdirSync(path.dirname(URL_INDEX_PATH), { recursive: true });
  fs.writeFileSync(URL_INDEX_PATH, JSON.stringify(unique, null, 2));
  console.log(`URL index written to: ${URL_INDEX_PATH}`);

  return unique;
}

// ─── PHASE 2: Extract + normalize + upsert ───────────────────────────────────

const SECTION_RE = /\b([A-Z]{2,3})\s?(\d{5}\.\d{3})\b/;

function classifyDocKind(fullText: string | null, url: string): 'rule' | 'toc' | 'empty' {
  if (!fullText || fullText.length < 50) return 'empty';
  if (
    /Chapter\s+Table\s+of\s+Contents/i.test(fullText) ||
    /Sub-?chapter\b/i.test(fullText.slice(0, 200)) ||
    url.includes('!openview') ||
    url.includes('restricttocategory')
  ) return 'toc';
  if (fullText.length < 200) return 'toc';
  return 'rule';
}

function normalizeSectionNumber(raw: string): string {
  // Canonical form: 'GN 00204.020' (two-letter code, space, 5-digit.3-digit)
  return raw.replace(/\s+/, ' ').toUpperCase();
}

function extractLeafId(url: string): string | null {
  const m = url.match(/\/lnx\/(\d+)/i);
  return m ? m[1] : null;
}

function parseLeafPage(html: string, leafUrl: string): SourceDocumentInsert | null {
  // section_number: regex over page, checking likely locations first
  const sectionMatch = SECTION_RE.exec(html);
  const sectionRaw = sectionMatch ? `${sectionMatch[1]} ${sectionMatch[2]}` : null;
  const sectionNumber = sectionRaw ? normalizeSectionNumber(sectionRaw) : null;

  // full_text: strip tags from page body
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // last_updated: hidden input is the cleanest source
  const luHidden = html.match(/input[^>]*name="LastUpdate"[^>]*value="([^"]+)"/i);
  const luSpan = html.match(/Effective\s+Dates?[^<]{0,5}<\/span>[^<]*([A-Z][a-z]+\s+\d{1,2},?\s*\d{4}|\d{2}\/\d{2}\/\d{4})/i);
  const lastUpdated = luHidden?.[1] ?? luSpan?.[1] ?? null;

  // title: page <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // source_url: derive from leaf id (policy.ssa.gov is the canonical citation host)
  const leafId = extractLeafId(leafUrl);
  const sourceUrl = leafId ? `${POLICY_BASE}/lnx/${leafId}` : leafUrl;

  const docKind = classifyDocKind(stripped, leafUrl);

  return {
    source_type: 'poms',
    doc_kind: docKind,
    section_number: sectionNumber,
    title,
    full_text: docKind !== 'empty' ? stripped : null,
    source_url: sourceUrl,
    last_updated: lastUpdated,
    scrape_date: new Date().toISOString().split('T')[0],
  };
}

async function ingestLeaves(leafUrls: string[]): Promise<void> {
  console.log('\n=== PHASE 2: Fetching + ingesting leaf pages ===');
  console.log(`Target: ${leafUrls.length} pages at ${DELAY_MS}ms/request`);

  const supabase = createServiceClient();
  const rows: SourceDocumentInsert[] = [];
  let fetched = 0, skipped = 0, errors = 0;

  for (let i = 0; i < leafUrls.length; i++) {
    const url = leafUrls[i];
    if (i % 100 === 0 && i > 0) {
      console.log(`Progress: ${i}/${leafUrls.length} | ok=${fetched} skip=${skipped} err=${errors}`);
    }

    await sleep(DELAY_MS);
    const html = await fetchHtml(url);
    if (!html) { errors++; continue; }

    const row = parseLeafPage(html, url);
    if (!row || !row.section_number) {
      // No section number: still store as toc/empty keyed on source_url
      // Use source_url as a fallback — don't drop the row
      skipped++;
      continue;
    }

    rows.push(row);
    fetched++;

    // Batch upsert
    if (rows.length >= UPSERT_BATCH) {
      await upsertBatch(supabase, rows.splice(0, UPSERT_BATCH));
    }
  }

  // Final batch
  if (rows.length > 0) await upsertBatch(supabase, rows);

  console.log(`\nPhase 2 complete: fetched=${fetched} skipped=${skipped} errors=${errors}`);
  console.log(`Completeness check: expected=${leafUrls.length} ingested=${fetched} (${((fetched/leafUrls.length)*100).toFixed(1)}%)`);
  if (fetched < leafUrls.length * 0.95) {
    console.warn('WARNING: <95% ingested — re-run for missing pages');
  }
}

async function upsertBatch(supabase: ReturnType<typeof createServiceClient>, rows: SourceDocumentInsert[]) {
  const { error } = await supabase
    .from('source_documents')
    .upsert(rows, { onConflict: 'source_type,section_number', ignoreDuplicates: false });

  if (error) {
    console.error('Upsert error:', error.message);
  }
}

// ─── Change detection: flag reference_pages for re-review ────────────────────

async function flagChangedPages(supabase: ReturnType<typeof createServiceClient>, changedSections: string[]) {
  if (changedSections.length === 0) return;
  console.log(`\nFlagging reference_pages citing ${changedSections.length} changed sections...`);

  // Find reference_pages where any primary_source section_number matches a changed section
  for (const sectionNumber of changedSections) {
    const { error } = await supabase
      .from('reference_pages')
      .update({ status: 'in_review' })
      .neq('status', 'draft')
      .neq('status', 'retired')
      .contains('primary_sources', [{ section_number: sectionNumber }]);

    if (error) console.error(`Flag error for ${sectionNumber}:`, error.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('NSSA POMS Ingestion Script');
  console.log(`Phase: ${phase}${limit ? ` | Limit: ${limit}` : ''}`);

  let leafUrls: string[] = [];

  if (phase === '1' || phase === 'all') {
    leafUrls = await buildUrlIndex();
  } else if (phase === '2' || phase === 'check') {
    // Load persisted index
    if (!fs.existsSync(URL_INDEX_PATH)) {
      throw new Error(`URL index not found at ${URL_INDEX_PATH}. Run phase=1 first.`);
    }
    leafUrls = JSON.parse(fs.readFileSync(URL_INDEX_PATH, 'utf-8'));
    console.log(`Loaded ${leafUrls.length} leaf URLs from index`);
  }

  if (phase === '2' || phase === 'all') {
    const target = limit ? leafUrls.slice(0, limit) : leafUrls;
    await ingestLeaves(target);
  }

  if (phase === 'check') {
    // Completeness check only
    const supabase = createServiceClient();
    const { count } = await supabase
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'poms');
    console.log(`\nCompleteness check:`);
    console.log(`  URL index: ${leafUrls.length}`);
    console.log(`  DB rows (poms): ${count}`);
    const pct = count ? ((count / leafUrls.length) * 100).toFixed(1) : '0';
    console.log(`  Coverage: ${pct}%`);
  }

  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
