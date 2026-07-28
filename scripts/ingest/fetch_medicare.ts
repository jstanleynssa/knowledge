#!/usr/bin/env tsx
/**
 * fetch_medicare.ts — Medicare.gov ingestion adapter
 *
 * Feeds the same source_documents / source_chunks schema as fetch_cms.ts.
 * URL discovery via Medicare.gov's flat sitemap.xml.
 * Medicare.gov is a consumer-facing site — most content is relevant.
 * Exclusions: PDFs (Phase 2 later), interactive finders, newsroom, blog.
 *
 * section_number convention: "MCR:<url-path>" (synthetic, URL-keyed)
 * e.g.  "MCR:your-medicare-costs/irmaa"
 *
 * Versioning: same Option A pattern as fetch_cms.ts.
 *
 * Usage:
 *   npx tsx scripts/ingest/fetch_medicare.ts --phase=1          # Build URL index only
 *   npx tsx scripts/ingest/fetch_medicare.ts --phase=2          # Fetch + ingest
 *   npx tsx scripts/ingest/fetch_medicare.ts --phase=all        # Both sequentially
 *   npx tsx scripts/ingest/fetch_medicare.ts --phase=2 --limit=50
 *   npx tsx scripts/ingest/fetch_medicare.ts --phase=check      # Completeness report
 */

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ───────────────────────────────────────────────────────────────────

const MCR_HOST = 'https://www.medicare.gov';
const UA = 'Tank/1.0 (NSSA Knowledge Base ingest; admin@nssapros.com)';
const DELAY_MS = 1200;
const BACKOFF_MAX_MS = 30_000;
const URL_INDEX_PATH = path.join(__dirname, '../../tmp/medicare_leaf_urls.json');

// ─── Path deny rules ──────────────────────────────────────────────────────────
//
// Medicare.gov is a focused Medicare consumer site — the overwhelming majority of
// its HTML pages are in scope. We deny only the clearly out-of-scope categories.
//
// PDFs are excluded here (Phase 1 = HTML only). A future PDF adapter will handle
// /publications/*.pdf entries from the sitemap.

const DENY_EXTENSIONS = ['.pdf', '.zip', '.xlsx', '.csv', '.doc', '.docx', '.epub', '.mobi', '.mp4', '.mp3'];

// Path prefix or substring denials
const DENY_SUBSTRINGS = [
  '/newsroom',
  '/news-release',
  '/blog',
  '/events',
  '/calendar',
  '/survey',
  '/publications/',     // PDFs, EPUBs, MOBIs — deferred to Phase 2 PDF adapter
  '/find-a-',           // /find-a-doctor, /find-a-plan — interactive tools
  '/care-compare',      // facility comparison tool
  '/plan-compare',      // plan finder (interactive, not content)
  '/drug-coverage-',    // interactive drug plan tool
  '/glossary',          // glossary entries are too short and get embedded as noise
  '/sitemap',
  '/es/',               // Spanish-language duplicates
  '/sp/',
];

function isAllowedUrl(urlPath: string): boolean {
  const lp = urlPath.toLowerCase();

  // Exclude by file extension
  if (DENY_EXTENSIONS.some((ext) => lp.endsWith(ext))) return false;

  // Exclude by substring
  if (DENY_SUBSTRINGS.some((d) => lp.includes(d))) return false;

  return true;
}

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
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 429) {
        const wait = Math.min(DELAY_MS * Math.pow(2, attempt + 2), BACKOFF_MAX_MS);
        console.warn(`  429 — waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err: any) {
      if (attempt === retries - 1) {
        console.error(`  Failed after ${retries} attempts: ${url} — ${err?.message}`);
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

// ─── Sitemap parsing ──────────────────────────────────────────────────────────

function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

// ─── PHASE 1: Build leaf URL index ───────────────────────────────────────────

async function buildUrlIndex(): Promise<string[]> {
  console.log('\n=== PHASE 1: Building Medicare.gov leaf URL index ===');

  // Medicare.gov has a single flat sitemap (not an index)
  const sitemapXml = await fetchHtml(`${MCR_HOST}/sitemap.xml`);
  if (!sitemapXml) throw new Error('Failed to fetch Medicare.gov sitemap');

  // Handle both flat sitemaps and sitemap indexes gracefully
  const isSitemapIndex = sitemapXml.includes('<sitemapindex');
  let allUrls: string[] = [];

  if (isSitemapIndex) {
    // If Medicare.gov ever adds a sitemap index, handle it
    const subSitemapUrls = extractSitemapUrls(sitemapXml)
      .filter((u) => u.includes('sitemap'));
    console.log(`  Sitemap index with ${subSitemapUrls.length} sub-sitemaps`);
    for (const subUrl of subSitemapUrls) {
      await sleep(500);
      const xml = await fetchHtml(subUrl);
      if (xml) allUrls.push(...extractSitemapUrls(xml));
    }
  } else {
    allUrls = extractSitemapUrls(sitemapXml);
  }

  console.log(`Total URLs discovered: ${allUrls.length}`);

  // Filter to allowed HTML pages only
  const filtered = allUrls.filter((u) => {
    if (!u.startsWith(MCR_HOST)) return false;
    try {
      const urlPath = new URL(u).pathname;
      return isAllowedUrl(urlPath);
    } catch {
      return false;
    }
  });

  console.log(`After filtering: ${filtered.length} HTML URLs (PDFs deferred to Phase 2 adapter)`);

  fs.mkdirSync(path.dirname(URL_INDEX_PATH), { recursive: true });
  fs.writeFileSync(URL_INDEX_PATH, JSON.stringify(filtered, null, 2));
  console.log(`URL index written to: ${URL_INDEX_PATH}`);

  return filtered;
}

// ─── HTML extraction ──────────────────────────────────────────────────────────
//
// Medicare.gov is a Drupal site with clean, consumer-oriented HTML.
// Structure is simpler than CMS.gov:
//   - <title> — page title
//   - <main> — primary content region
//   - <table> — cost/premium/IRMAA tables
//
// Same table serialization approach as fetch_cms.ts: [TABLE:...]/[/TABLE] markers.

function extractPageTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!m) return null;
  return m[1]
    .replace(/\s*\|\s*Medicare\.gov.*$/i, '')
    .replace(/\s*\|\s*Medicare.*$/i, '')
    .trim();
}

function extractLastUpdated(html: string): string | null {
  const patterns = [
    /(?:Last\s+)?Updated?:?\s*<\/?\w[^>]*>?\s*(\w[^<\n]{4,30})/i,
    /class="[^"]*date-modified[^"]*"[^>]*>\s*([^<]+)/i,
    /<time[^>]*datetime="([^"]+)"/i,
    /page-date[^>]*>\s*([^<]{5,30})/i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return m[1].trim().slice(0, 30);
  }
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function serializeTable(tableHtml: string, heading: string): string {
  const headerCells = [...tableHtml.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
    .map((m) => stripTags(m[1]).trim())
    .filter(Boolean);

  const rows: string[][] = [];
  const trMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const trMatch of trMatches) {
    const cells = [...trMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((m) => stripTags(m[1]).trim())
      .filter(Boolean);
    if (cells.length > 0) rows.push(cells);
  }

  if (headerCells.length === 0 && rows.length === 0) return '';

  const lines: string[] = [`[TABLE: ${heading}]`];
  if (headerCells.length > 0) {
    lines.push(headerCells.join(' | '));
    lines.push(headerCells.map(() => '---').join(' | '));
  }
  for (const row of rows) {
    lines.push(row.join(' | '));
  }
  lines.push('[/TABLE]');
  return lines.join('\n');
}

/**
 * Sanitize text for PostgreSQL: remove null bytes and other invalid UTF-8
 * characters that Supabase rejects with "unsupported Unicode escape sequence".
 */
function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/\u0000/g, '')           // null bytes — Postgres rejects these
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')  // other control chars
    .replace(/\uFFFD/g, '')           // replacement character (binary garbage)
    .trim() || null;
}

function extractPageText(html: string): string | null {
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Medicare.gov Drupal: main content is in <main> or .ds-content-page
  const mainMatch =
    body.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
    body.match(/class="[^"]*(?:ds-content-page|main-content|field-body|page-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ??
    body.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  const contentHtml = mainMatch ? mainMatch[1] : body;

  const parts: string[] = [];
  let cursor = 0;
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let m: RegExpExecArray | null;

  while ((m = tableRe.exec(contentHtml)) !== null) {
    const proseChunk = contentHtml.slice(cursor, m.index);
    if (proseChunk.trim().length > 0) {
      parts.push(stripTags(proseChunk));
    }

    const headingMatch = proseChunk.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
    const nearestHeading = headingMatch
      ? stripTags(headingMatch[headingMatch.length - 1])
      : 'Table';

    const serialized = serializeTable(m[0], nearestHeading);
    if (serialized) parts.push(serialized);

    cursor = m.index + m[0].length;
  }

  if (cursor < contentHtml.length) {
    parts.push(stripTags(contentHtml.slice(cursor)));
  }

  const fullText = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return fullText.length > 100 ? fullText : null;
}

// ─── Synthetic section_number ─────────────────────────────────────────────────

function makeSectionNumber(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    const p = u.pathname.replace(/^\/|\/$/g, '');
    return `MCR:${p}`;
  } catch {
    return null;
  }
}

// ─── Versioning upsert ────────────────────────────────────────────────────────

type RowInsert = {
  source_type: 'medicare';
  doc_kind: 'rule' | 'toc' | 'empty';
  section_number: string | null;
  title: string | null;
  full_text: string | null;
  source_url: string;
  last_updated: string | null;
  scrape_date: string;
};

async function upsertWithVersioning(
  supabase: ReturnType<typeof createServiceClient>,
  row: RowInsert
): Promise<'inserted' | 'unchanged' | 'versioned' | 'error'> {
  const { data: existing, error: fetchErr } = await supabase
    .from('source_documents')
    .select('id, full_text, ingest_version')
    .eq('source_type', 'medicare')
    .eq('section_number', row.section_number!)
    .is('superseded_at', null)
    .maybeSingle();

  if (fetchErr) {
    console.error(`  DB fetch error for ${row.section_number}: ${fetchErr.message}`);
    return 'error';
  }

  if (!existing) {
    const { error } = await supabase
      .from('source_documents')
      .insert({ ...row, ingest_version: 1 });
    if (error) {
      console.error(`  Insert error for ${row.section_number}: ${error.message}`);
      return 'error';
    }
    return 'inserted';
  }

  if (existing.full_text === row.full_text) {
    await supabase
      .from('source_documents')
      .update({ scrape_date: row.scrape_date })
      .eq('id', existing.id);
    return 'unchanged';
  }

  const now = new Date().toISOString();
  await supabase
    .from('source_documents')
    .update({ superseded_at: now })
    .eq('id', existing.id);

  const { error: versionErr } = await supabase
    .from('source_documents')
    .insert({ ...row, ingest_version: (existing.ingest_version ?? 1) + 1 });
  if (versionErr) {
    console.error(`  Version insert error for ${row.section_number}: ${versionErr.message}`);
    return 'error';
  }

  return 'versioned';
}

// ─── PHASE 2: Fetch + ingest ──────────────────────────────────────────────────

async function ingestPages(pageUrls: string[]): Promise<void> {
  console.log('\n=== PHASE 2: Fetching + ingesting Medicare.gov pages ===');
  console.log(`Target: ${pageUrls.length} pages at ${DELAY_MS}ms/request`);

  const supabase = createServiceClient();
  const scrapeDate = new Date().toISOString().split('T')[0];

  let inserted = 0, unchanged = 0, versioned = 0, skipped = 0, errors = 0;

  for (let i = 0; i < pageUrls.length; i++) {
    const pageUrl = pageUrls[i];

    if (i % 100 === 0 && i > 0) {
      console.log(
        `Progress: ${i}/${pageUrls.length} | ` +
        `new=${inserted} unchanged=${unchanged} updated=${versioned} skip=${skipped} err=${errors}`
      );
    }

    await sleep(DELAY_MS);
    const html = await fetchHtml(pageUrl);
    if (!html) { errors++; continue; }

    const sectionNumber = makeSectionNumber(pageUrl);
    if (!sectionNumber) { skipped++; continue; }

    const title = sanitizeText(extractPageTitle(html));
    const fullText = sanitizeText(extractPageText(html));
    const lastUpdated = extractLastUpdated(html);

    const docKind = fullText && fullText.length >= 150 ? 'rule' : 'empty';

    const row: RowInsert = {
      source_type: 'medicare',
      doc_kind: docKind,
      section_number: sectionNumber,
      title,
      full_text: fullText,
      source_url: pageUrl,
      last_updated: lastUpdated,
      scrape_date: scrapeDate,
    };

    const result = await upsertWithVersioning(supabase, row);
    switch (result) {
      case 'inserted':  inserted++; break;
      case 'unchanged': unchanged++; break;
      case 'versioned': versioned++; break;
      case 'error':     errors++;   break;
    }
  }

  console.log('\n=== Medicare.gov ingest complete ===');
  console.log(`  New:       ${inserted}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Updated:   ${versioned} (superseded old versions)`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total:     ${pageUrls.length}`);

  if (errors > pageUrls.length * 0.05) {
    console.warn('WARNING: >5% error rate — check network/rate limiting and re-run');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('NSSA Medicare.gov Ingestion Script');
  console.log(`Phase: ${phase}${limit ? ` | Limit: ${limit}` : ''}`);

  let pageUrls: string[] = [];

  if (phase === '1' || phase === 'all') {
    pageUrls = await buildUrlIndex();
  } else if (phase === '2' || phase === 'check') {
    if (!fs.existsSync(URL_INDEX_PATH)) {
      throw new Error(`URL index not found at ${URL_INDEX_PATH}. Run phase=1 first.`);
    }
    pageUrls = JSON.parse(fs.readFileSync(URL_INDEX_PATH, 'utf-8'));
    console.log(`Loaded ${pageUrls.length} URLs from index`);
  }

  if (phase === '2' || phase === 'all') {
    const target = limit ? pageUrls.slice(0, limit) : pageUrls;
    await ingestPages(target);
  }

  if (phase === 'check') {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'medicare')
      .is('superseded_at', null);
    const { count: supersededCount } = await supabase
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'medicare')
      .not('superseded_at', 'is', null);
    console.log('\nMedicare.gov completeness check:');
    console.log(`  URL index:   ${pageUrls.length}`);
    console.log(`  Active rows: ${count}`);
    console.log(`  Superseded:  ${supersededCount}`);
    if (count) {
      console.log(`  Coverage:    ${((count / pageUrls.length) * 100).toFixed(1)}%`);
    }
  }

  console.log('\nDone. Next step: npx tsx scripts/ingest/chunk_and_embed.ts --source=medicare');
}

main().catch((err) => { console.error(err); process.exit(1); });
