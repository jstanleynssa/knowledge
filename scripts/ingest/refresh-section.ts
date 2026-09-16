/**
 * refresh-section.ts — Re-ingest a single POMS section that has changed.
 *
 * Pipeline:
 *   1. Fetch fresh content from SSA
 *   2. Mark old source_documents row as superseded
 *   3. Insert new version
 *   4. Delete old chunks, re-chunk and re-embed
 *   5. Flag any verified_answers citing this section for re-review
 *   6. Mark corpus_update_log entry as refreshed
 *
 * Usage:
 *   SECTION="RS 00615.201" npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/refresh-section.ts
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/refresh-section.ts --all-pending
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.worker' });

const UA       = 'Tank/1.0 (NSSA Knowledge Base refresh; admin@nssapros.com)';
const POMS_BASE = 'https://secure.ssa.gov/apps10/poms.nsf/lnx';
const CHUNK_SIZE    = 800;
const CHUNK_OVERLAP = 100;
const EMBED_MODEL   = 'text-embedding-3-small';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Chunking (same logic as chunk_and_embed.ts) ──────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end < text.length) {
      const window = text.slice(end - 100, end + 100);
      const boundary = window.lastIndexOf('. ');
      if (boundary !== -1) end = end - 100 + boundary + 2;
    }
    const chunk = text.slice(start, Math.min(end, text.length)).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

// ─── POMS fetch ───────────────────────────────────────────────────────────────

function sectionToLeafId(sn: string): string | null {
  const m = sn.match(/^([A-Z]{2})\s+(\d{5})\.(\d{3})/i);
  if (!m) return null;
  return `${m[1].toLowerCase()}${m[2]}${m[3]}000`;
}

function extractFields(html: string, sectionNumber: string, leafUrl: string) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const luHidden     = html.match(/input[^>]*name="LastUpdate"[^>]*value="([^"]+)"/i);
  const luSpan       = html.match(/Effective\s+Dates?[^<]{0,5}<\/span>[^<]*([A-Z][a-z]+\s+\d{1,2},?\s*\d{4}|\d{2}\/\d{2}\/\d{4})/i);
  const lastUpdated  = luHidden?.[1] ?? luSpan?.[1] ?? null;
  const titleMatch   = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title        = titleMatch ? titleMatch[1].trim() : null;

  return { full_text: stripped.length > 100 ? stripped : null, last_updated: lastUpdated, title };
}

async function fetchPomsSection(sectionNumber: string, sourceUrl: string) {
  const leafId = sectionToLeafId(sectionNumber);
  const url    = leafId ? `${POMS_BASE}/${leafId}` : sourceUrl;

  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return { url, ...extractFields(html, sectionNumber, url) };
}

// ─── Refresh one section ──────────────────────────────────────────────────────

async function refreshSection(sectionNumber: string) {
  const supabase = createServiceClient();
  const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today    = new Date().toISOString().split('T')[0];

  console.log(`\nRefreshing: ${sectionNumber}`);

  // Fetch current DB record
  const { data: existing, error: fetchErr } = await supabase
    .from('source_documents')
    .select('id, source_url, last_updated, full_text')
    .eq('source_type', 'poms')
    .eq('section_number', sectionNumber)
    .is('superseded_at', null)
    .single();

  if (fetchErr || !existing) {
    console.error(`  Section not found in DB: ${fetchErr?.message}`);
    return;
  }

  // Fetch fresh content from SSA
  console.log(`  Fetching from SSA…`);
  let fresh: Awaited<ReturnType<typeof fetchPomsSection>>;
  try {
    fresh = await fetchPomsSection(sectionNumber, existing.source_url);
  } catch (e: any) {
    console.error(`  Fetch failed: ${e.message}`);
    return;
  }

  if (!fresh.full_text) {
    console.warn(`  No content extracted — skipping`);
    return;
  }

  // [1] Mark old row as superseded
  await supabase
    .from('source_documents')
    .update({ superseded_at: new Date().toISOString() })
    .eq('id', existing.id);
  console.log(`  Old row superseded: ${existing.id}`);

  // [2] Insert new version
  const { data: newDoc, error: insertErr } = await supabase
    .from('source_documents')
    .insert({
      source_type:   'poms',
      doc_kind:      'rule',
      section_number: sectionNumber,
      title:          fresh.title,
      full_text:      fresh.full_text,
      source_url:     fresh.url,
      last_updated:   fresh.last_updated,
      last_checked:   today,
      scrape_date:    today,
    })
    .select('id')
    .single();

  if (insertErr || !newDoc) {
    console.error(`  Insert failed: ${insertErr?.message}`);
    return;
  }
  console.log(`  New row inserted: ${newDoc.id}`);

  // [3] Delete old chunks
  const { count: deletedChunks } = await supabase
    .from('source_chunks')
    .delete({ count: 'exact' })
    .eq('source_document_id', existing.id);
  console.log(`  Deleted ${deletedChunks} old chunks`);

  // [4] Re-chunk and re-embed
  const chunks = chunkText(fresh.full_text);
  console.log(`  Generated ${chunks.length} chunks — embedding…`);

  const embRes = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: chunks,
  });

  const chunkRows = chunks.map((text, i) => ({
    source_document_id: newDoc.id,
    section_number:     sectionNumber,
    chunk_text:         text,
    embedding:          embRes.data[i].embedding,
  }));

  const { error: chunkErr } = await supabase.from('source_chunks').insert(chunkRows);
  if (chunkErr) { console.error(`  Chunk insert error: ${chunkErr.message}`); return; }
  console.log(`  ${chunkRows.length} chunks embedded and stored`);

  // [5] Flag verified_answers citing this section for re-review
  const { data: affectedAnswers } = await supabase
    .from('verified_answers')
    .select('id, question')
    .contains('primary_sources', JSON.stringify([{ section_number: sectionNumber }]));

  if (affectedAnswers && affectedAnswers.length > 0) {
    // Mark them as needing review — update status to 'draft' so they don't surface as verified
    await supabase
      .from('verified_answers')
      .update({ status: 'draft', last_reviewed: today })
      .in('id', affectedAnswers.map(a => a.id));
    console.warn(`  ⚠ ${affectedAnswers.length} verified_answers citing this section flagged for re-review`);
    affectedAnswers.forEach(a => console.warn(`    - "${a.question.slice(0, 80)}…"`));
  }

  // [6] Mark corpus_update_log as refreshed
  await supabase
    .from('corpus_update_log')
    .update({ status: 'refreshed', refreshed_at: new Date().toISOString() })
    .eq('section_number', sectionNumber)
    .eq('status', 'pending');

  console.log(`  ✓ ${sectionNumber} refreshed successfully\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();
  const allPending = process.argv.includes('--all-pending');
  const singleSection = process.env.SECTION;

  if (allPending) {
    // Refresh all pending changes from the update log
    const { data: pending } = await supabase
      .from('corpus_update_log')
      .select('section_number')
      .eq('status', 'pending')
      .order('detected_at');

    if (!pending || pending.length === 0) {
      console.log('No pending updates to refresh.');
      return;
    }

    console.log(`Refreshing ${pending.length} pending section(s)…`);
    for (const row of pending) {
      await refreshSection(row.section_number);
      await sleep(1500);
    }
  } else if (singleSection) {
    await refreshSection(singleSection);
  } else {
    console.error('Usage: SECTION="RS 00615.201" npx tsx ... refresh-section.ts');
    console.error('   or: npx tsx ... refresh-section.ts --all-pending');
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
