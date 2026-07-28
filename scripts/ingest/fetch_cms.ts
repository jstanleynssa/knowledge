#!/usr/bin/env tsx
/**
 * fetch_cms.ts — CMS.gov ingestion adapter
 *
 * Feeds the same source_documents / source_chunks schema as fetch_poms.ts.
 * URL discovery via CMS sitemap index (73 sub-sitemaps as of 2026-07).
 * Path-based allow/deny filtering keeps only Medicare-relevant content.
 *
 * section_number convention: "CMS:<url-path>" (synthetic, URL-keyed)
 * e.g.  "CMS:medicare/costs/irmaa"
 *
 * Versioning (Option A): INSERT new row + supersede old on content change.
 * Existing POMS/CFR upsert pattern is untouched.
 *
 * Usage:
 *   npx tsx scripts/ingest/fetch_cms.ts --phase=1           # Build URL index only
 *   npx tsx scripts/ingest/fetch_cms.ts --phase=2           # Fetch + ingest
 *   npx tsx scripts/ingest/fetch_cms.ts --phase=all         # Both sequentially
 *   npx tsx scripts/ingest/fetch_cms.ts --phase=2 --limit=50  # Dev: first 50
 *   npx tsx scripts/ingest/fetch_cms.ts --phase=check       # Completeness report
 */

import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ───────────────────────────────────────────────────────────────────

const CMS_HOST = 'https://www.cms.gov';
const UA = 'Tank/1.0 (NSSA Knowledge Base ingest; admin@nssapros.com)';
const DELAY_MS = 1200;
const BACKOFF_MAX_MS = 30_000;
const URL_INDEX_PATH = path.join(__dirname, '../../tmp/cms_leaf_urls.json');

// ─── Path allow/deny rules ────────────────────────────────────────────────────
//
// CMS.gov has 36K+ URLs across Medicaid, CHIP, Marketplace, innovation-center,
// procurement, newsroom, and Medicare. We want Medicare only.
//
// ALLOW: paths that start with any of these prefixes
const ALLOW_PREFIXES = [
  '/medicare/',
  '/medicareprovider',          // provider supplier enrollment (Medicare admin)
];

// DENY: sub-paths to exclude even if they match an ALLOW prefix.
// Checked after the allow test — a path that passes allow but matches deny is dropped.
const DENY_SUBSTRINGS = [
  '/newsroom',
  '/news-release',
  '/press-release',
  '/blog',
  '/events',
  '/calendar',
  '/staff',
  '/leadership',
  '/about',
  '/contact',
  '/procurement',
  '/acquisition',
  '/contract',
  '/vendor',
  '/rfp',
  '/solicitation',
  '/grant',
  '/employment',
  '/career',
  '/job',
  '/fraud-prevention',           // MAC fraud, not benefit rules
  '/audit',
  '/oig',
  '/coding',                     // clinical coding — not our audience
  '/quality',                    // quality measurement programs
  '/survey-certification',       // facility inspection
  '/research-statistics',
  '/data-research',
  '/data-and-systems',
  '/open-payments',
  '/national-health-expenditure',
  '/actuary',
  '/legislation',                // legislative text, not program rules
  '/regulations-and-guidance/legislation',
  '/publications/',              // PDFs/EPUBs — deferred to Phase 2 PDF adapter
  '/es/',                        // Spanish-language duplicate pages
  '/sp/',
];

function isAllowedUrl(urlPath: string): boolean {
  const lp = urlPath.toLowerCase();

  // Must match at least one allow prefix
  const allowed = ALLOW_PREFIXES.some((p) => lp.startsWith(p));
  if (!allowed) return false;

  // Must not match any deny substring
  const denied = DENY_SUBSTRINGS.some((d) => lp.includes(d));
  return !denied;
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

function extractLastmod(xml: string, url: string): string | null {
  // Try to find <lastmod> immediately after the matching <loc>
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<loc>\\s*${escaped}\\s*</loc>\\s*<lastmod>\\s*([^<]+)\\s*</lastmod>`,
    'i'
  );
  const m = re.exec(xml);
  return m ? m[1].trim() : null;
}

// ─── PHASE 1: Build leaf URL index ───────────────────────────────────────────

async function buildUrlIndex(): Promise<string[]> {
  console.log('\n=== PHASE 1: Building CMS.gov leaf URL index ===');

  // Fetch sitemap index to get sub-sitemap URLs
  const indexXml = await fetchHtml(`${CMS_HOST}/sitemap.xml`);
  if (!indexXml) throw new Error('Failed to fetch CMS sitemap index');

  // Sitemap index uses <loc> for sub-sitemaps; these point to page-keyed URLs
  const sitemapUrls = extractSitemapUrls(indexXml)
    .filter((u) => u.includes('sitemap.xml'));
  console.log(`Found ${sitemapUrls.length} sub-sitemaps`);

  const allPageUrls: string[] = [];

  for (let i = 0; i < sitemapUrls.length; i++) {
    const sitemapUrl = sitemapUrls[i];
    if (i % 10 === 0) {
      console.log(`Sitemap ${i + 1}/${sitemapUrls.length}...`);
    }
    await sleep(DELAY_MS);
    const xml = await fetchHtml(sitemapUrl);
    if (!xml) continue;

    const pageUrls = extractSitemapUrls(xml)
      .filter((u) => u.startsWith(CMS_HOST) && !u.endsWith('.xml'));
    allPageUrls.push(...pageUrls);
  }

  console.log(`Total URLs discovered: ${allPageUrls.length}`);

  // Filter to Medicare-relevant paths
  const filtered = allPageUrls.filter((u) => {
    try {
      const urlPath = new URL(u).pathname;
      return isAllowedUrl(urlPath);
    } catch {
      return false;
    }
  });

  console.log(`After allow/deny filtering: ${filtered.length} URLs`);

  fs.mkdirSync(path.dirname(URL_INDEX_PATH), { recursive: true });
  fs.writeFileSync(URL_INDEX_PATH, JSON.stringify(filtered, null, 2));
  console.log(`URL index written to: ${URL_INDEX_PATH}`);

  return filtered;
}

// ─── HTML extraction ──────────────────────────────────────────────────────────
//
// CMS.gov is a Drupal site. Key structural elements:
//   - <title> — page title
//   - <h1> — primary heading (matches <title> usually)
//   - <main> / article / .main-content — body
//   - <table> — IRMAA brackets, premium tables, enrollment windows
//
// Tables are serialized as structured text with [TABLE:...]/[/TABLE] markers
// so chunk_and_embed.ts can treat them as atomic chunks.

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

function extractPageTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!m) return null;
  return m[1]
    .replace(/\s*\|\s*CMS\.gov.*$/i, '')  // strip " | CMS.gov" suffix
    .replace(/\s*\|\s*CMS.*$/i, '')
    .trim();
}

function extractLastUpdated(html: string): string | null {
  // CMS.gov Drupal pages show "Updated: MM/DD/YYYY" or "Last Updated: ..."
  const patterns = [
    /(?:Last\s+)?Updated?:?\s*<\/?\w[^>]*>?\s*(\w[^<\n]{4,30})/i,
    /class="[^"]*date-modified[^"]*"[^>]*>\s*([^<]+)/i,
    /<time[^>]*datetime="([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return m[1].trim().slice(0, 30);
  }
  return null;
}

/** Serialize a single HTML table as structured text. */
function serializeTable(tableHtml: string, heading: string): string {
  // Extract header row (<th> cells) and data rows (<td> cells)
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
    lines.push(headerCells.map(() => '---').join(' | '));  // separator
  }
  for (const row of rows) {
    lines.push(row.join(' | '));
  }
  lines.push('[/TABLE]');
  return lines.join('\n');
}

/** Strip HTML tags and normalize whitespace. */
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

/**
 * Extract clean, structured text from a CMS.gov HTML page.
 * Tables are serialized with their nearest preceding heading as the label.
 */
function extractPageText(html: string): string | null {
  // Remove script, style, nav, footer, header, aside, form, and interactive blocks
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to isolate the main content region
  const mainMatch =
    body.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
    body.match(/class="[^"]*(?:main-content|page-content|field-body|content-inner)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)>/i) ??
    body.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  const contentHtml = mainMatch ? mainMatch[1] : body;

  // Serialize tables before stripping all tags.
  // For each table, find the nearest preceding heading to use as the table label.
  const parts: string[] = [];
  let cursor = 0;
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let m: RegExpExecArray | null;

  while ((m = tableRe.exec(contentHtml)) !== null) {
    // Prose before this table
    const proseChunk = contentHtml.slice(cursor, m.index);
    if (proseChunk.trim().length > 0) {
      parts.push(stripTags(proseChunk));
    }

    // Find the nearest heading before this table in the prose chunk
    const headingMatch = proseChunk.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
    const nearestHeading = headingMatch
      ? stripTags(headingMatch[headingMatch.length - 1])
      : 'Table';

    const serialized = serializeTable(m[0], nearestHeading);
    if (serialized) parts.push(serialized);

    cursor = m.index + m[0].length;
  }

  // Remaining prose after last table
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
    const p = u.pathname.replace(/^\/|\/$/g, '');  // strip leading/trailing slash
    return `CMS:${p}`;
  } catch {
    return null;
  }
}

// ─── Versioning upsert ────────────────────────────────────────────────────────

type RowInsert = {
  source_type: 'cms';
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
  // Find existing active row by section_number (which encodes the URL for CMS rows)
  const { data: existing, error: fetchErr } = await supabase
    .from('source_documents')
    .select('id, full_text, ingest_version')
    .eq('source_type', 'cms')
    .eq('section_number', row.section_number!)
    .is('superseded_at', null)
    .maybeSingle();

  if (fetchErr) {
    console.error(`  DB fetch error for ${row.section_number}: ${fetchErr.message}`);
    return 'error';
  }

  if (!existing) {
    // New URL — insert version 1
    const { error: insertErr } = await supabase
      .from('source_documents')
      .insert({ ...row, ingest_version: 1 });
    if (insertErr) {
      console.error(`  Insert error for ${row.section_number}: ${insertErr.message}`);
      return 'error';
    }
    return 'inserted';
  }

  // Content unchanged — update scrape_date only
  if (existing.full_text === row.full_text) {
    await supabase
      .from('source_documents')
      .update({ scrape_date: row.scrape_date })
      .eq('id', existing.id);
    return 'unchanged';
  }

  // Content changed — supersede old, insert new version
  const now = new Date().toISOString();
  const { error: supersedeErr } = await supabase
    .from('source_documents')
    .update({ superseded_at: now })
    .eq('id', existing.id);
  if (supersedeErr) {
    console.error(`  Supersede error for ${row.section_number}: ${supersedeErr.message}`);
    return 'error';
  }

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
  console.log('\n=== PHASE 2: Fetching + ingesting CMS.gov pages ===');
  console.log(`Target: ${pageUrls.length} pages at ${DELAY_MS}ms/request`);

  const supabase = createServiceClient();
  const scrapeDate = new Date().toISOString().split('T')[0];

  // ── Pre-load already-ingested section numbers ─────────────────────────────
  // Avoids re-fetching pages already in the DB on restart; saves HTTP budget.
  console.log('Loading already-ingested CMS section numbers...');
  const existingSections = new Set<string>();
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('source_documents')
      .select('section_number')
      .eq('source_type', 'cms')
      .is('superseded_at', null)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) { console.warn('Could not pre-load existing sections:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const row of data) { if (row.section_number) existingSections.add(row.section_number); }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  console.log(`  Resuming: ${existingSections.size} already ingested, ${pageUrls.length - existingSections.size} remaining.`);
  // ─────────────────────────────────────────────────────────────────────────

  let inserted = 0, unchanged = 0, versioned = 0, skipped = 0, errors = 0;

  for (let i = 0; i < pageUrls.length; i++) {
    const pageUrl = pageUrls[i];

    if (i % 100 === 0 && i > 0) {
      console.log(
        `Progress: ${i}/${pageUrls.length} | ` +
        `new=${inserted} unchanged=${unchanged} updated=${versioned} skip=${skipped} err=${errors}`
      );
    }

    // Skip binary files — can't scrape as text; CMS sitemap includes many PDFs/ZIPs
    const BINARY_EXTS = ['.pdf', '.zip', '.xlsx', '.xls', '.pptx', '.ppt', '.doc', '.docx', '.epub', '.mp4', '.mp3', '.csv'];
    if (BINARY_EXTS.some(ext => pageUrl.toLowerCase().endsWith(ext))) {
      skipped++;
      continue;
    }

    // Skip pages already in the DB — resume-safe restart
    const sectionNumberEarly = makeSectionNumber(pageUrl);
    if (sectionNumberEarly && existingSections.has(sectionNumberEarly)) {
      skipped++;
      continue;
    }

    await sleep(DELAY_MS);
    const html = await fetchHtml(pageUrl);
    if (!html) { errors++; continue; }

    const sectionNumber = makeSectionNumber(pageUrl);
    if (!sectionNumber) { skipped++; continue; }

    const title = sanitizeText(extractPageTitle(html));
    const fullText = sanitizeText(extractPageText(html));
    const lastUpdated = extractLastUpdated(html);

    // Classify: pages with substantial extracted text are 'rule'; very short or
    // extraction-failed pages are 'empty' (stored but not embedded).
    const docKind = fullText && fullText.length >= 150 ? 'rule' : 'empty';

    const row: RowInsert = {
      source_type: 'cms',
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

  console.log('\n=== CMS.gov ingest complete ===');
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
  console.log('NSSA CMS.gov Ingestion Script');
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
      .eq('source_type', 'cms')
      .is('superseded_at', null);
    const { count: supersededCount } = await supabase
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'cms')
      .not('superseded_at', 'is', null);
    console.log('\nCMS.gov completeness check:');
    console.log(`  URL index:   ${pageUrls.length}`);
    console.log(`  Active rows: ${count}`);
    console.log(`  Superseded:  ${supersededCount}`);
    if (count) {
      console.log(`  Coverage:    ${((count / pageUrls.length) * 100).toFixed(1)}%`);
    }
  }

  console.log('\nDone. Next step: npx tsx scripts/ingest/chunk_and_embed.ts --source=cms');
}

main().catch((err) => { console.error(err); process.exit(1); });
