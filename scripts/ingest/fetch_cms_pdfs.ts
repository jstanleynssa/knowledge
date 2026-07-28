#!/usr/bin/env tsx
/**
 * fetch_cms_pdfs.ts — CMS.gov PDF ingestion adapter (Phase 2)
 *
 * Reads cms_leaf_urls.json, filters to PDFs only, downloads each one, and
 * extracts text using pdf-parse. Feeds the same source_documents schema as
 * fetch_cms.ts. Run AFTER fetch_cms.ts --phase=2 (HTML pages).
 *
 * Text-based PDFs (most CMS government docs) → doc_kind = 'rule'
 * Image-only / scanned PDFs (extraction returns < MIN_TEXT_LEN chars) → doc_kind = 'empty'
 *   These are candidates for OCR in a future phase (fetch_cms_pdfs_ocr.ts).
 *
 * section_number convention: "CMSPDF:<url-path>"
 * e.g. "CMSPDF:medicare/costs/downloads/irmaa-guide-2024.pdf"
 *
 * Usage:
 *   npx tsx scripts/ingest/fetch_cms_pdfs.ts              # All PDFs (incremental)
 *   npx tsx scripts/ingest/fetch_cms_pdfs.ts --limit=50   # Dev: first 50
 *   npx tsx scripts/ingest/fetch_cms_pdfs.ts --check      # Completeness report
 *   npx tsx scripts/ingest/fetch_cms_pdfs.ts --ocr-check  # List image-only PDFs
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ───────────────────────────────────────────────────────────────────

const CMS_HOST       = 'https://www.cms.gov';
const UA             = 'Tank/1.0 (NSSA Knowledge Base ingest; admin@nssapros.com)';
const URL_INDEX_PATH = path.join(__dirname, '../../tmp/cms_leaf_urls.json');
const DELAY_MS       = 1500;          // between PDF fetches (respectful; PDFs are heavier)
const MAX_PDF_BYTES  = 25 * 1024 * 1024;  // skip PDFs > 25 MB
const MIN_TEXT_LEN   = 150;          // below this → image-only, mark as 'empty'
const UPSERT_BATCH   = 50;
const BACKOFF_MS     = 30_000;

const PDF_EXTS = ['.pdf'];

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const limit    = typeof args['limit'] === 'string' ? parseInt(args['limit']) : null;
const isCheck  = !!args['check'];
const isOcrCheck = !!args['ocr-check'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function isPdfUrl(url: string): boolean {
  return PDF_EXTS.some(ext => url.toLowerCase().endsWith(ext));
}

function makeSectionNumber(url: string): string | null {
  try {
    const parsed = new URL(url);
    const p = parsed.pathname.replace(/^\//, '');
    return p ? `CMSPDF:${p}` : null;
  } catch {
    return null;
  }
}

function sanitizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, 500_000); // hard cap — very large PDFs truncated
}

// ─── PDF download + extraction ────────────────────────────────────────────────
//
// Uses pdf-parse v2's PDFParse class which handles the download internally.
// For future OCR phase: parser.getScreenshot() renders pages as PNG buffers
// that can be passed to GPT-4o vision.

interface PdfResult {
  status: 'ok' | 'too_large' | 'fetch_error' | 'parse_error' | 'empty';
  text: string;
  pages: number;
  sizeBytes: number;
}

async function fetchAndExtract(url: string): Promise<PdfResult> {
  // HEAD first to check Content-Length before downloading
  let sizeBytes = 0;
  try {
    const head = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!head.ok) return { status: 'fetch_error', text: '', pages: 0, sizeBytes };
    const cl = head.headers.get('content-length');
    if (cl) sizeBytes = parseInt(cl);
    if (sizeBytes > MAX_PDF_BYTES) {
      return { status: 'too_large', text: '', pages: 0, sizeBytes };
    }
  } catch {
    // HEAD failed — proceed anyway
  }

  // Download the PDF buffer (gives us size control + timeout)
  let buf: Buffer;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return { status: 'fetch_error', text: '', pages: 0, sizeBytes };
    const ab = await res.arrayBuffer();
    buf = Buffer.from(ab);
    sizeBytes = buf.length;
    if (sizeBytes > MAX_PDF_BYTES) {
      return { status: 'too_large', text: '', pages: 0, sizeBytes };
    }
  } catch {
    return { status: 'fetch_error', text: '', pages: 0, sizeBytes };
  }

  // Extract text via PDFParse v2 using Uint8Array buffer
  try {
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    const data = await parser.getText();
    const text = sanitizeText((data as { text?: string }).text ?? '');
    if (text.length < MIN_TEXT_LEN) {
      // Image-only or effectively empty PDF — OCR candidate
      return { status: 'empty', text, pages: 0, sizeBytes };
    }
    return { status: 'ok', text, pages: 0, sizeBytes };
  } catch {
    return { status: 'parse_error', text: '', pages: 0, sizeBytes };
  }
}

// ─── DB upsert (reuses versioning pattern from fetch_cms.ts) ─────────────────

type RowInsert = {
  source_type: string;
  doc_kind: string;
  section_number: string;
  title: string | null;
  full_text: string;
  source_url: string;
  last_updated: string | null;
  scrape_date: string;
};

type UpsertResult = 'inserted' | 'unchanged' | 'versioned' | 'error';

async function upsertWithVersioning(
  sb: ReturnType<typeof createServiceClient>,
  row: RowInsert
): Promise<UpsertResult> {
  const { data: existing, error: fetchErr } = await sb
    .from('source_documents')
    .select('id, full_text, ingest_version')
    .eq('source_type', 'cms')
    .eq('section_number', row.section_number)
    .is('superseded_at', null)
    .maybeSingle();

  if (fetchErr) {
    console.error(`  DB fetch error for ${row.section_number}: ${fetchErr.message}`);
    return 'error';
  }

  if (!existing) {
    const { error } = await sb.from('source_documents').insert(row);
    if (error) { console.error(`  Insert error for ${row.section_number}: ${error.message}`); return 'error'; }
    return 'inserted';
  }

  if (existing.full_text === row.full_text) {
    await sb.from('source_documents').update({ scrape_date: row.scrape_date }).eq('id', existing.id);
    return 'unchanged';
  }

  // Content changed — supersede old, insert new version
  const { error: supErr } = await sb.from('source_documents')
    .update({ superseded_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (supErr) { console.error(`  Supersede error: ${supErr.message}`); return 'error'; }

  const { error: insErr } = await sb.from('source_documents')
    .insert({ ...row, ingest_version: (existing.ingest_version ?? 1) + 1 });
  if (insErr) { console.error(`  Version insert error: ${insErr.message}`); return 'error'; }
  return 'versioned';
}

// ─── Main ingest ──────────────────────────────────────────────────────────────

async function ingestPdfs(pdfUrls: string[]): Promise<void> {
  console.log('\n=== CMS.gov PDF Ingestion ===');
  console.log(`Target: ${pdfUrls.length} PDFs | Max size: ${MAX_PDF_BYTES / 1024 / 1024}MB | Delay: ${DELAY_MS}ms`);

  const sb = createServiceClient();
  const scrapeDate = new Date().toISOString().split('T')[0];

  // Pre-load already-ingested CMSPDF section numbers
  console.log('Loading already-ingested CMS PDF section numbers...');
  const existingSections = new Set<string>();
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from('source_documents')
      .select('section_number')
      .eq('source_type', 'cms')
      .like('section_number', 'CMSPDF:%')
      .is('superseded_at', null)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    data.forEach(r => { if (r.section_number) existingSections.add(r.section_number); });
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`  Resuming: ${existingSections.size} already ingested, ${pdfUrls.length - existingSections.size} remaining.`);

  let inserted = 0, unchanged = 0, versioned = 0, skipped = 0;
  let tooLarge = 0, fetchError = 0, parseError = 0, imagePdf = 0, errors = 0;

  for (let i = 0; i < pdfUrls.length; i++) {
    const url = pdfUrls[i];

    if (i % 50 === 0 && i > 0) {
      console.log(
        `Progress: ${i}/${pdfUrls.length} | ` +
        `new=${inserted} skip=${skipped} image=${imagePdf} large=${tooLarge} err=${errors}`
      );
    }

    // Skip already ingested
    const sectionNumber = makeSectionNumber(url);
    if (!sectionNumber) { skipped++; continue; }
    if (existingSections.has(sectionNumber)) { skipped++; continue; }

    await sleep(DELAY_MS);

    const result = await fetchAndExtract(url);

    if (result.status === 'too_large') {
      tooLarge++;
      console.log(`  SKIP (${(result.sizeBytes / 1024 / 1024).toFixed(1)}MB): ${sectionNumber}`);
      continue;
    }
    if (result.status === 'fetch_error') { fetchError++; errors++; continue; }
    if (result.status === 'parse_error') { parseError++; errors++; continue; }

    const docKind = result.status === 'ok' ? 'rule' : 'empty';
    if (result.status === 'empty') imagePdf++;

    // Derive a title from the URL filename
    const filename = url.split('/').pop()?.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ') ?? null;
    const title = filename
      ? filename.charAt(0).toUpperCase() + filename.slice(1)
      : null;

    const row: RowInsert = {
      source_type: 'cms',
      doc_kind:     docKind,
      section_number: sectionNumber,
      title,
      full_text:    result.text,
      source_url:   url,
      last_updated: null,
      scrape_date:  scrapeDate,
    };

    const upsertResult = await upsertWithVersioning(sb, row);
    switch (upsertResult) {
      case 'inserted':  inserted++;  break;
      case 'unchanged': unchanged++; break;
      case 'versioned': versioned++;  break;
      case 'error':     errors++;     break;
    }
  }

  console.log('\n=== CMS.gov PDF Ingestion Complete ===');
  console.log(`  Inserted:      ${inserted}`);
  console.log(`  Unchanged:     ${unchanged}`);
  console.log(`  Updated:       ${versioned}`);
  console.log(`  Skipped:       ${skipped} (already in DB)`);
  console.log(`  Image-only:    ${imagePdf} (stored as empty, OCR pending)`);
  console.log(`  Too large:     ${tooLarge} (> ${MAX_PDF_BYTES / 1024 / 1024}MB)`);
  console.log(`  Fetch errors:  ${fetchError}`);
  console.log(`  Parse errors:  ${parseError}`);
  console.log(`  Total:         ${pdfUrls.length}`);

  if (imagePdf > 0) {
    console.log(`\n  ⚠  ${imagePdf} image-only PDFs stored as 'empty'. Run fetch_cms_pdfs_ocr.ts to OCR them.`);
  }
  if (errors > pdfUrls.length * 0.1) {
    console.warn('\n  WARNING: >10% error rate — check network/rate limiting and re-run');
  }
}

// ─── Check / OCR-check modes ──────────────────────────────────────────────────

async function runCheck(pdfUrls: string[]) {
  const sb = createServiceClient();
  const { count: ruleCount } = await sb.from('source_documents').select('*', { count: 'exact', head: true })
    .eq('source_type', 'cms').like('section_number', 'CMSPDF:%').eq('doc_kind', 'rule').is('superseded_at', null);
  const { count: emptyCount } = await sb.from('source_documents').select('*', { count: 'exact', head: true })
    .eq('source_type', 'cms').like('section_number', 'CMSPDF:%').eq('doc_kind', 'empty').is('superseded_at', null);

  console.log('\nCMS PDF completeness check:');
  console.log(`  PDF URL index:   ${pdfUrls.length.toLocaleString()}`);
  console.log(`  Text PDFs (rule):${(ruleCount ?? 0).toLocaleString()}`);
  console.log(`  Image PDFs:      ${(emptyCount ?? 0).toLocaleString()} (OCR candidates)`);
  console.log(`  Coverage:        ${Math.round(((ruleCount ?? 0) / pdfUrls.length) * 100)}%`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('NSSA CMS.gov PDF Ingestion Script');

  if (!fs.existsSync(URL_INDEX_PATH)) {
    throw new Error(`URL index not found at ${URL_INDEX_PATH}. Run fetch_cms.ts --phase=1 first.`);
  }

  const allUrls: string[] = JSON.parse(fs.readFileSync(URL_INDEX_PATH, 'utf-8'));
  const pdfUrls = allUrls.filter(isPdfUrl);
  console.log(`PDF URLs in index: ${pdfUrls.length.toLocaleString()} of ${allUrls.length.toLocaleString()} total`);

  if (isCheck || isOcrCheck) {
    await runCheck(pdfUrls);
    return;
  }

  const target = limit ? pdfUrls.slice(0, limit) : pdfUrls;
  await ingestPdfs(target);
}

main().catch(err => { console.error(err); process.exit(1); });
