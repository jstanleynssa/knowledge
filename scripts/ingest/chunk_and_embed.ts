#!/usr/bin/env tsx
/**
 * chunk_and_embed.ts — Chunk rule documents and embed for vector search
 *
 * Runs after ingest_octoparse.ts, fetch_poms.ts, fetch_cms.ts, or fetch_medicare.ts.
 * Only processes source_documents WHERE doc_kind = 'rule' AND superseded_at IS NULL.
 * Never embeds 'toc', 'empty', or superseded rows.
 *
 * Table-aware chunking: text blocks wrapped in [TABLE:...]...[/TABLE] markers
 * (produced by the CMS/Medicare adapters) are treated as atomic units and never
 * split across chunk boundaries, preserving the year-label + header + row grouping
 * that makes IRMAA bracket tables useful for retrieval.
 *
 * Embedding model: text-embedding-3-small (1536 dims — matches schema vector(1536))
 *
 * Usage:
 *   npx tsx scripts/ingest/chunk_and_embed.ts                    # Incremental (unembedded only)
 *   npx tsx scripts/ingest/chunk_and_embed.ts --force            # Re-embed everything
 *   npx tsx scripts/ingest/chunk_and_embed.ts --source=cms       # Only CMS rows
 *   npx tsx scripts/ingest/chunk_and_embed.ts --source=medicare  # Only Medicare rows
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ───────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 800;           // target chars per chunk (~200 tokens)
const CHUNK_OVERLAP = 100;        // overlap chars between chunks
const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIMS = 1536;
const EMBED_BATCH = 100;          // embeddings per API call (OpenAI max: 2048; 100 balances throughput vs. latency)
const UPSERT_BATCH = 200;         // raised to match larger embed batches

const rawArgs = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const forceRefresh = rawArgs['force'] !== undefined;
const sourceFilter = typeof rawArgs['source'] === 'string' ? rawArgs['source'] : null;

// ─── Chunking ─────────────────────────────────────────────────────────────────
//
// Table-aware: text may contain [TABLE: heading]...[/TABLE] blocks from the
// CMS/Medicare adapters. These blocks are never split — they are emitted as
// atomic chunks (even if they exceed CHUNK_SIZE). All other text uses the
// standard character-based chunker with sentence-boundary adjustment.

const TABLE_BLOCK_RE = /\[TABLE:[^\]]*\][\s\S]*?\[\/TABLE\]/g;

/** Split text into interleaved prose segments and atomic table segments. */
function splitIntoSegments(text: string): Array<{ kind: 'prose' | 'table'; text: string }> {
  const segments: Array<{ kind: 'prose' | 'table'; text: string }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  TABLE_BLOCK_RE.lastIndex = 0;

  while ((match = TABLE_BLOCK_RE.exec(text)) !== null) {
    // Prose before this table
    if (match.index > cursor) {
      const prose = text.slice(cursor, match.index).trim();
      if (prose.length > 0) segments.push({ kind: 'prose', text: prose });
    }
    segments.push({ kind: 'table', text: match[0].trim() });
    cursor = match.index + match[0].length;
  }

  // Remaining prose
  if (cursor < text.length) {
    const prose = text.slice(cursor).trim();
    if (prose.length > 0) segments.push({ kind: 'prose', text: prose });
  }

  return segments;
}

/** Chunk a prose segment using character-based splitting with sentence-boundary snapping. */
function chunkProse(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    // Try to break on a sentence boundary (period + space) within tolerance window
    if (end < text.length) {
      const window = text.slice(end - 100, end + 100);
      const boundaryOffset = window.lastIndexOf('. ');
      if (boundaryOffset !== -1) {
        end = end - 100 + boundaryOffset + 2;
      }
    }

    chunks.push(text.slice(start, Math.min(end, text.length)).trim());
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks.filter((c) => c.length > 50);
}

/**
 * Main entry point: chunk full_text into embeddable segments.
 * Table blocks are kept atomic; prose is character-chunked with overlap.
 */
function chunkText(text: string): string[] {
  const segments = splitIntoSegments(text);
  const chunks: string[] = [];

  for (const seg of segments) {
    if (seg.kind === 'table') {
      // Table blocks are atomic — emit as a single chunk regardless of size
      if (seg.text.length > 50) chunks.push(seg.text);
    } else {
      chunks.push(...chunkProse(seg.text));
    }
  }

  return chunks;
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function embedTexts(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts,
    dimensions: EMBED_DIMS,
  });
  return res.data.map((d) => d.embedding);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log('chunk_and_embed.ts — NSSA Knowledge Base');
  console.log(`Mode: ${forceRefresh ? 'force refresh' : 'incremental (unembedded only)'}`);

  // Fetch rule documents to process.
  // Select id + section_number ONLY — full_text is fetched per-doc during processing.
  // Selecting full_text in bulk pagination fails for CMS: some docs are 500KB,
  // so 1000-row pages exceed Supabase response limits and silently truncate.
  let query = supabase
    .from('source_documents')
    .select('id, section_number')
    .eq('doc_kind', 'rule')
    .is('superseded_at', null)  // never embed superseded rows
    .not('full_text', 'is', null);

  if (sourceFilter) {
    query = query.eq('source_type', sourceFilter);
  }

  if (!forceRefresh) {
    // Fetch ALL chunked doc IDs (paginate past Supabase's 1k default limit)
    const alreadyChunked = new Set<string>();
    let chunkOffset = 0;
    while (true) {
      const { data } = await supabase
        .from('source_chunks')
        .select('source_document_id')
        .range(chunkOffset, chunkOffset + 999);
      if (!data || data.length === 0) break;
      data.forEach((r) => alreadyChunked.add(r.source_document_id));
      if (data.length < 1000) break;
      chunkOffset += 1000;
    }

    // Fetch ALL rule docs (paginate)
    const allDocs: Array<{ id: string; section_number: string | null }> = [];
    let docOffset = 0;
    while (true) {
      const { data } = await query.range(docOffset, docOffset + 999);
      if (!data || data.length === 0) break;
      allDocs.push(...data);
      if (data.length < 1000) break;
      docOffset += 1000;
    }

    const unprocessed = allDocs.filter((d) => !alreadyChunked.has(d.id));

    // ── CMS section-number noise filter ─────────────────────────────────────────
    // Filter obvious noise by section_number pattern (full_text not available here).
    // Content-based noise (Dynamic List rows, very short docs) is filtered inside
    // processDocs when full_text is fetched per-doc.
    let toEmbed = unprocessed;
    if (sourceFilter === 'cms') {
      const NOISE_SECTION_PATTERNS = [
        'physicianfeesc',     // state-level physician fee schedule tables
        '/fee-schedule/',     // fee schedule pages
        'feeschedule',        // fee schedule variants
        '-transmittals',      // transmittal index pages
        'transmittal-index',  // transmittal index pages
      ];
      const before = toEmbed.length;
      toEmbed = toEmbed.filter(d => {
        const sn = (d.section_number ?? '').toLowerCase();
        return !NOISE_SECTION_PATTERNS.some(p => sn.includes(p));
      });
      const skipped = before - toEmbed.length;
      if (skipped > 0) console.log(`CMS section-number noise filter: skipped ${skipped.toLocaleString()} docs`);
    }

    // ── CMSPDF relevance filter ────────────────────────────────────────────
    // If tmp/cms_pdf_allowed.json exists, restrict CMSPDF docs to HIGH+MEDIUM only.
    // HTML docs (section_number not starting with CMSPDF:) are always processed.
    const allowedJsonPath = 'tmp/cms_pdf_allowed.json';
    if (sourceFilter === 'cms' && fs.existsSync(allowedJsonPath)) {
      const allowedIds = new Set<string>(JSON.parse(fs.readFileSync(allowedJsonPath, 'utf8')));
      const beforeFilter = toEmbed.length;
      toEmbed = toEmbed.filter(d => {
        // Pass through all CMS HTML docs; only gate CMSPDF docs
        if (!(d.section_number ?? '').startsWith('CMSPDF:')) return true;
        return allowedIds.has(d.id);
      });
      const skippedPdfs = beforeFilter - toEmbed.length;
      console.log(`CMSPDF relevance filter: skipped ${skippedPdfs.toLocaleString()} LOW/SKIP PDF docs | ${toEmbed.length.toLocaleString()} remaining`);
    }

    console.log(`Rule docs total: ${allDocs.length} | Already embedded: ${alreadyChunked.size} unique docs | Remaining: ${toEmbed.length}`);
    await processDocs(supabase, openai, toEmbed, forceRefresh, sourceFilter === 'cms');
  } else {
    const allDocs: Array<{ id: string; section_number: string | null }> = [];
    let docOffset = 0;
    while (true) {
      const { data } = await query.range(docOffset, docOffset + 999);
      if (!data || data.length === 0) break;
      allDocs.push(...data);
      if (data.length < 1000) break;
      docOffset += 1000;
    }
    console.log(`Rule docs total: ${allDocs.length}`);
    await processDocs(supabase, openai, allDocs, forceRefresh, sourceFilter === 'cms');
  }

  console.log('\nDone.');
}

async function processDocs(
  supabase: ReturnType<typeof createServiceClient>,
  openai: OpenAI,
  docs: Array<{ id: string; section_number: string | null }>,
  force: boolean,
  filterContentNoise = false,  // enable per-doc content noise filter for CMS
) {
  let totalChunks = 0;
  let noiseSkipped = 0;
  const chunkBuffer: Array<{
    source_document_id: string;
    section_number: string | null;
    chunk_text: string;
    embedding: number[];
  }> = [];

  async function flush() {
    if (chunkBuffer.length === 0) return;
    const batch = chunkBuffer.splice(0, chunkBuffer.length);
    const { error } = await supabase.from('source_chunks').upsert(batch);
    if (error) console.error('Chunk upsert error:', error.message);
    else totalChunks += batch.length;
  }

  // Fetch full_text in batches of 15 — balances round-trips vs. response size.
  // CMS docs can be 500KB each so batches >20 risk hitting Supabase response limits.
  const FETCH_BATCH = 15;

  for (let i = 0; i < docs.length; i += FETCH_BATCH) {
    const fetchBatch = docs.slice(i, i + FETCH_BATCH);
    const ids = fetchBatch.map(d => d.id);

    // Single round-trip for up to 15 docs
    const { data: fetched } = await supabase
      .from('source_documents')
      .select('id, full_text')
      .in('id', ids);

    const fullTextMap = new Map<string, string>();
    for (const row of fetched ?? []) {
      if (row.id && row.full_text) fullTextMap.set(row.id, row.full_text);
    }

    for (const doc of fetchBatch) {
      const fullText = fullTextMap.get(doc.id) ?? null;
      if (!fullText) continue;

      // Content-based noise filter (only for CMS — flagged by caller)
      if (filterContentNoise) {
        const txt = fullText.trimStart();
        if (txt.startsWith('Dynamic List Information') || txt.startsWith('Dynamic List Data')) {
          noiseSkipped++; continue;
        }
        if (txt.length < 150) { noiseSkipped++; continue; }
      }

      // Delete existing chunks if force refresh
      if (force) {
        await supabase.from('source_chunks').delete().eq('source_document_id', doc.id);
      }

      const chunks = chunkText(fullText);

      // Embed in batches of EMBED_BATCH chunks
      for (let b = 0; b < chunks.length; b += EMBED_BATCH) {
        const batchTexts = chunks.slice(b, b + EMBED_BATCH);
        let embeddings: number[][];
        try {
          embeddings = await embedTexts(openai, batchTexts);
        } catch (err: any) {
          if (err?.status === 429) {
            console.warn('  OpenAI rate limit — waiting 10s');
            await sleep(10_000);
            embeddings = await embedTexts(openai, batchTexts);
          } else {
            console.error(`  Embed error for doc ${doc.id}:`, err.message);
            continue;
          }
        }

        for (let j = 0; j < batchTexts.length; j++) {
          chunkBuffer.push({
            source_document_id: doc.id,
            section_number: doc.section_number,
            chunk_text: batchTexts[j],
            embedding: embeddings[j],
          });
        }

        if (chunkBuffer.length >= UPSERT_BATCH) await flush();
        await sleep(20);  // reduced from 50ms — 100-chunk batches are inherently paced by API latency
      }
    }

    if (i % 150 === 0 && i > 0) {
      console.log(`Progress: ${i}/${docs.length} | chunks written: ${totalChunks}`);
    }
  }

  await flush();
  if (noiseSkipped > 0) console.log(`Content noise filter skipped: ${noiseSkipped} docs`);
  console.log(`Embedding complete: ${totalChunks} chunks written`);
}

main().catch((err) => { console.error(err); process.exit(1); });
