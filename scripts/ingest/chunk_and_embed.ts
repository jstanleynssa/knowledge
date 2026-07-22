#!/usr/bin/env tsx
/**
 * chunk_and_embed.ts — Chunk rule documents and embed for vector search
 *
 * Runs after ingest_octoparse.ts or fetch_poms.ts.
 * Only processes source_documents WHERE doc_kind = 'rule'.
 * Never embeds 'toc' or 'empty' rows.
 *
 * Embedding model: text-embedding-3-small (1536 dims — matches schema vector(1536))
 *
 * Usage:
 *   npx tsx scripts/ingest/chunk_and_embed.ts           # Process all unembedded rule docs
 *   npx tsx scripts/ingest/chunk_and_embed.ts --force   # Re-embed everything (full refresh)
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ───────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 800;           // target chars per chunk (~200 tokens)
const CHUNK_OVERLAP = 100;        // overlap chars between chunks
const EMBED_MODEL = 'text-embedding-3-small';
const EMBED_DIMS = 1536;
const EMBED_BATCH = 20;           // embeddings per API call (max 2048 inputs; keep modest)
const UPSERT_BATCH = 50;

const args = new Set(process.argv.slice(2));
const forceRefresh = args.has('--force');

// ─── Chunking ─────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
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

  // Fetch rule documents to process
  let query = supabase
    .from('source_documents')
    .select('id, section_number, full_text')
    .eq('doc_kind', 'rule')
    .not('full_text', 'is', null);

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
    const allDocs: Array<{ id: string; section_number: string | null; full_text: string | null }> = [];
    let docOffset = 0;
    while (true) {
      const { data } = await query.range(docOffset, docOffset + 999);
      if (!data || data.length === 0) break;
      allDocs.push(...data);
      if (data.length < 1000) break;
      docOffset += 1000;
    }

    const unprocessed = allDocs.filter((d) => !alreadyChunked.has(d.id));
    console.log(`Rule docs total: ${allDocs.length} | Already embedded: ${alreadyChunked.size} unique docs | Remaining: ${unprocessed.length}`);
    await processDocs(supabase, openai, unprocessed, forceRefresh);
  } else {
    const allDocs: Array<{ id: string; section_number: string | null; full_text: string | null }> = [];
    let docOffset = 0;
    while (true) {
      const { data } = await query.range(docOffset, docOffset + 999);
      if (!data || data.length === 0) break;
      allDocs.push(...data);
      if (data.length < 1000) break;
      docOffset += 1000;
    }
    console.log(`Rule docs total: ${allDocs.length}`);
    await processDocs(supabase, openai, allDocs, forceRefresh);
  }

  console.log('\nDone.');
}

async function processDocs(
  supabase: ReturnType<typeof createServiceClient>,
  openai: OpenAI,
  docs: Array<{ id: string; section_number: string | null; full_text: string | null }>,
  force: boolean
) {
  let totalChunks = 0;
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

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (!doc.full_text) continue;

    if (i % 50 === 0 && i > 0) {
      console.log(`Progress: ${i}/${docs.length} | chunks written: ${totalChunks}`);
    }

    // Delete existing chunks if force refresh
    if (force) {
      await supabase.from('source_chunks').delete().eq('source_document_id', doc.id);
    }

    const chunks = chunkText(doc.full_text);

    // Embed in batches
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
      await sleep(50);  // gentle rate limiting
    }
  }

  await flush();
  console.log(`Embedding complete: ${totalChunks} chunks written`);
}

main().catch((err) => { console.error(err); process.exit(1); });
