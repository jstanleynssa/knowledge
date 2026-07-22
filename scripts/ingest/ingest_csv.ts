#!/usr/bin/env tsx
/**
 * ingest_csv.ts — Load CFR or Handbook source documents from a local CSV file
 *
 * Use when: you have a CSV export from Octoparse (or any scrape) on disk
 * and want to load it without going through the Octoparse API.
 *
 * Usage:
 *   SOURCE_TYPE=cfr      CSV_PATH=/path/to/cfr.csv      npx tsx scripts/ingest/ingest_csv.ts
 *   SOURCE_TYPE=handbook CSV_PATH=/path/to/handbook.csv  npx tsx scripts/ingest/ingest_csv.ts
 *
 * Supported source types: cfr | handbook
 * (For POMS, use ingest_octoparse.ts or fetch_poms.ts)
 */

import { createServiceClient } from '@/lib/supabase';
import type { SourceDocumentInsert, SourceType } from '@/lib/types';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const UPSERT_BATCH = 50;

// ─── CSV parser (simple — handles quoted fields with embedded newlines) ────────

async function* parseCSV(filePath: string): AsyncGenerator<Record<string, string>> {
  const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: fileStream });

  let headers: string[] = [];
  let buffer = '';
  let inQuote = false;

  for await (const line of rl) {
    buffer += (buffer ? '\n' : '') + line;

    // Count unescaped quotes to track open/close state
    for (const ch of line) {
      if (ch === '"') inQuote = !inQuote;
    }

    if (inQuote) continue; // multi-line field still open

    // Parse the complete row
    const fields = parseCSVLine(buffer);
    buffer = '';

    if (headers.length === 0) {
      headers = fields.map((h) => h.trim());
    } else {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = fields[i] ?? ''; });
      yield row;
    }
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { current += '"'; i++; }  // escaped quote
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ─── CFR normalization ────────────────────────────────────────────────────────
// Columns: Part, PartURL, Page_URL, Subpart, Regulation, Description

// § 401.5. Purpose... or §\u2009401.5.\xa0Purpose...
const CFR_SECTION_RE = /§[\s\u2009]*(\d+\.\d+)\.?\s*/u;

function normalizeCFRRow(row: Record<string, string>): SourceDocumentInsert | null {
  const regulation = row['Regulation']?.trim() ?? '';
  const description = row['Description']?.trim() ?? '';
  const pageUrl = row['Page_URL']?.trim() ?? '';
  const part = row['Part']?.trim() ?? '';

  // Skip RESERVED parts/regulations with no content
  if (!description && !regulation) return null;
  if (/RESERVED/i.test(part) && !description) return null;

  // Parse section number: § 404.5 → "20 CFR 404.5"
  let sectionNumber: string | null = null;
  let title: string | null = null;
  const sectionMatch = CFR_SECTION_RE.exec(regulation);
  if (sectionMatch) {
    sectionNumber = `20 CFR ${sectionMatch[1]}`;
    // Title: everything after the matched section pattern, cleaned up
    const afterSection = regulation
      .slice(sectionMatch.index + sectionMatch[0].length)
      .replace(/^\.\s*/, '')        // strip leading dot
      .replace(/\xa0/g, ' ')        // non-breaking space → space
      .replace(/\s+/g, ' ')
      .trim();
    title = afterSection || null;
  } else if (regulation) {
    // No parseable section number — use raw regulation as title
    title = regulation.replace(/\xa0/g, ' ').replace(/\u2009/g, ' ').trim();
  }

  const docKind = !description || description.length < 50
    ? 'empty'
    : 'rule';

  // Skip rows with no section number AND empty content
  if (!sectionNumber && docKind === 'empty') return null;

  return {
    source_type: 'cfr',
    doc_kind: docKind,
    section_number: sectionNumber,
    title,
    full_text: docKind !== 'empty' ? description : null,
    source_url: pageUrl || null,
    last_updated: null,   // CFR export doesn't include last-updated dates
    scrape_date: new Date().toISOString().split('T')[0],
  };
}

// ─── Handbook normalization ───────────────────────────────────────────────────
// Columns: Chapter, Subsection, Page_URL, Rule_Text, LastRevised

// handbook-0100.html → "HBK 0100"
const HBK_URL_RE = /handbook-(\d{4})\.html/i;

// "Last Revised: Apr. 18, 2006" → "2006-04-18"
const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseLastRevised(raw: string): string | null {
  if (!raw) return null;
  // "Last Revised: Apr. 18, 2006" or "Last Revised: April 18, 2006"
  const m = raw.match(/(\w{3,})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTH_MAP[m[1].toLowerCase().slice(0, 3)];
  if (!month) return null;
  const day = m[2].padStart(2, '0');
  return `${m[3]}-${month}-${day}`;
}

function normalizeHandbookRow(row: Record<string, string>): SourceDocumentInsert | null {
  const pageUrl = row['Page_URL']?.trim() ?? '';
  const subsection = row['Subsection']?.trim() ?? '';
  const ruleText = row['Rule_Text']?.trim() ?? '';
  const lastRevised = row['LastRevised']?.trim() ?? '';

  // Derive section number from URL
  const urlMatch = HBK_URL_RE.exec(pageUrl);
  const sectionNumber = urlMatch ? `HBK ${urlMatch[1]}` : null;

  // Skip if no URL match and no content
  if (!sectionNumber && !ruleText) return null;

  const docKind = !ruleText || ruleText.length < 30 ? 'empty' : 'rule';

  return {
    source_type: 'handbook',
    doc_kind: docKind,
    section_number: sectionNumber,
    title: subsection || null,
    full_text: docKind !== 'empty' ? ruleText : null,
    source_url: pageUrl || null,
    last_updated: parseLastRevised(lastRevised),
    scrape_date: new Date().toISOString().split('T')[0],
  };
}

// ─── Upsert batch ─────────────────────────────────────────────────────────────

function deduplicateBatch(rows: SourceDocumentInsert[]): SourceDocumentInsert[] {
  // When multiple CSV rows share the same (source_type, section_number),
  // merge them by concatenating full_text so Postgres doesn't see two updates
  // to the same row in a single upsert statement.
  const seen = new Map<string, SourceDocumentInsert>();
  for (const row of rows) {
    const key = `${row.source_type}::${row.section_number ?? '__null__'}`;
    const existing = seen.get(key);
    if (existing) {
      // Merge: append new text if both have content
      if (row.full_text && existing.full_text) {
        existing.full_text += '\n\n' + row.full_text;
      } else if (row.full_text) {
        existing.full_text = row.full_text;
      }
      // Prefer non-empty title
      if (!existing.title && row.title) existing.title = row.title;
      // Upgrade doc_kind if we now have real content
      if (existing.doc_kind === 'empty' && row.doc_kind === 'rule') {
        existing.doc_kind = 'rule';
      }
    } else {
      seen.set(key, { ...row });
    }
  }
  return Array.from(seen.values());
}

async function upsertBatch(
  supabase: ReturnType<typeof createServiceClient>,
  rows: SourceDocumentInsert[],
  changedSections: Set<string>
) {
  // Deduplicate within batch to avoid Postgres "cannot affect row a second time" error
  const deduped = deduplicateBatch(rows);

  // Change detection: if section_number exists in DB with different content, flag it
  const sections = deduped.map((r) => r.section_number).filter(Boolean) as string[];
  if (sections.length > 0) {
    const { data: existing } = await supabase
      .from('source_documents')
      .select('section_number, full_text, last_updated')
      .in('section_number', sections);

    const existingMap = new Map((existing ?? []).map((r) => [r.section_number, r]));
    for (const row of deduped) {
      if (!row.section_number) continue;
      const ex = existingMap.get(row.section_number);
      if (ex && (ex.full_text !== row.full_text || ex.last_updated !== row.last_updated)) {
        changedSections.add(row.section_number);
      }
    }
  }

  const { error } = await supabase
    .from('source_documents')
    .upsert(deduped, { onConflict: 'source_type,section_number', ignoreDuplicates: false });

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
    if (error) console.error(`Flag error for ${sn}:`, error.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sourceType = (process.env.SOURCE_TYPE ?? '').toLowerCase() as SourceType;
  const csvPath = process.env.CSV_PATH ?? '';

  if (!csvPath) throw new Error('CSV_PATH not set');
  if (!['cfr', 'handbook'].includes(sourceType)) {
    throw new Error(`SOURCE_TYPE must be 'cfr' or 'handbook', got '${sourceType}'`);
  }

  const normalizer = sourceType === 'cfr' ? normalizeCFRRow : normalizeHandbookRow;

  console.log(`\nIngesting ${sourceType.toUpperCase()} from: ${csvPath}`);
  const supabase = createServiceClient();
  const changedSections = new Set<string>();

  const batch: SourceDocumentInsert[] = [];
  let total = 0, skipped = 0, errors = 0;

  for await (const row of parseCSV(csvPath)) {
    try {
      const normalized = normalizer(row);
      if (!normalized) { skipped++; continue; }
      batch.push(normalized);

      if (batch.length >= UPSERT_BATCH) {
        await upsertBatch(supabase, batch.splice(0, UPSERT_BATCH), changedSections);
      }
      total++;

      if (total % 100 === 0) {
        console.log(`Progress: ${total} ingested, ${skipped} skipped, ${errors} errors`);
      }
    } catch (err) {
      errors++;
      console.error('Row error:', err);
    }
  }

  // Flush remainder
  if (batch.length > 0) {
    await upsertBatch(supabase, batch, changedSections);
  }

  await flagChangedPages(supabase, changedSections);

  console.log(`\n✅ Done — ${total} ingested, ${skipped} skipped, ${errors} errors`);
  console.log(`   Changed sections flagged for re-review: ${changedSections.size}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
