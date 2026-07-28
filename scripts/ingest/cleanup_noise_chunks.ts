/**
 * cleanup_noise_chunks.ts
 *
 * Deletes source_chunks for:
 *   [1] LOW + SKIP CMSPDF docs (from tmp/cms_pdf_scores.csv)
 *   [2] CMS HTML noise docs (Dynamic List rows, fee schedules, <150 char stubs)
 *       that slipped through before noise filter was added
 *
 * Run:  npx tsx --env-file=.env.local scripts/ingest/cleanup_noise_chunks.ts
 * Dry:  npx tsx --env-file=.env.local scripts/ingest/cleanup_noise_chunks.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const DRY_RUN = process.argv.includes('--dry-run');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteInBatches(
  sb: any,
  ids: string[],
  label: string,
  dryRun: boolean,
): Promise<number> {
  if (ids.length === 0) { console.log(`  ${label}: 0 docs — nothing to delete`); return 0; }

  // Count chunks first
  let totalChunks = 0;
  const COUNT_BATCH = 200;
  for (let i = 0; i < ids.length; i += COUNT_BATCH) {
    const batch = ids.slice(i, i + COUNT_BATCH);
    const { count } = await sb.from('source_chunks')
      .select('*', { count: 'exact', head: true })
      .in('source_document_id', batch);
    totalChunks += count ?? 0;
  }

  console.log(`  ${label}: ${ids.length} docs → ${totalChunks.toLocaleString()} chunks to delete`);
  if (dryRun || totalChunks === 0) return totalChunks;

  // Delete in batches of 100 doc IDs
  const DELETE_BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    const batch = ids.slice(i, i + DELETE_BATCH);
    const { error } = await sb.from('source_chunks').delete().in('source_document_id', batch);
    if (error) { console.error(`  Delete error (batch ${i}):`, error.message); continue; }
    deleted += batch.length;
    if (deleted % 1000 === 0 || deleted === ids.length) {
      process.stdout.write(`    ${deleted}/${ids.length} docs deleted...\n`);
    }
  }
  return totalChunks;
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (DRY_RUN) console.log('DRY RUN — counting only, no deletes\n');
  else console.log('LIVE RUN — deleting noise chunks\n');

  // ── [1] LOW + SKIP CMSPDF docs from scores CSV ────────────────────────────
  console.log('=== [1] LOW + SKIP CMSPDF docs ===');
  const csv = fs.readFileSync('tmp/cms_pdf_scores.csv', 'utf8');
  const lines = csv.trim().split('\n').slice(1);
  const lowSkipIds: string[] = [];
  const tierCount: Record<string, number> = {};
  for (const line of lines) {
    const parts = line.split(',');
    const id = parts[0];
    const tier = parts[6];
    tierCount[tier] = (tierCount[tier] ?? 0) + 1;
    if (tier === 'LOW' || tier === 'SKIP') lowSkipIds.push(id);
  }
  console.log('  Scored tiers:', JSON.stringify(tierCount));

  const freed1 = await deleteInBatches(sb, lowSkipIds, 'LOW+SKIP PDFs', DRY_RUN);

  // ── [2] CMS HTML noise docs ───────────────────────────────────────────────
  console.log('\n=== [2] CMS HTML noise docs ===');

  // Fetch all CMS HTML doc IDs + text samples (paginate id+section_number+text)
  const noiseHtmlIds: string[] = [];
  let offset = 0;
  const FETCH_BATCH = 15;

  // First pass: get all CMS HTML ids + section_numbers (no full_text — fast)
  const allHtml: Array<{ id: string; section_number: string }> = [];
  let idOffset = 0;
  while (true) {
    const { data } = await sb.from('source_documents')
      .select('id, section_number')
      .eq('source_type', 'cms').eq('doc_kind', 'rule')
      .is('superseded_at', null)
      .not('section_number', 'like', 'CMSPDF:%') // HTML only
      .range(idOffset, idOffset + 999);
    if (!data || data.length === 0) break;
    allHtml.push(...data);
    if (data.length < 1000) break;
    idOffset += 1000;
  }
  console.log(`  Total CMS HTML docs: ${allHtml.length.toLocaleString()}`);

  // Section-number noise filter (same as chunk_and_embed)
  const NOISE_SECTION_PATTERNS = ['physicianfeesc', '/fee-schedule/', 'feeschedule', '-transmittals', 'transmittal-index'];
  const sectionNoise = allHtml.filter(d => NOISE_SECTION_PATTERNS.some(p => d.section_number.toLowerCase().includes(p)));
  console.log(`  Section-pattern noise: ${sectionNoise.length} docs`);
  const sectionNoiseIds = sectionNoise.map(d => d.id);

  // Content noise: Dynamic List + <150 chars — fetch text in batches
  const nonSectionNoise = allHtml.filter(d => !NOISE_SECTION_PATTERNS.some(p => d.section_number.toLowerCase().includes(p)));
  const contentNoiseIds: string[] = [];
  for (let i = 0; i < nonSectionNoise.length; i += FETCH_BATCH) {
    const batch = nonSectionNoise.slice(i, i + FETCH_BATCH);
    const ids = batch.map(d => d.id);
    const { data } = await sb.from('source_documents').select('id, full_text').in('id', ids);
    for (const row of data ?? []) {
      if (!row.full_text) continue;
      const txt = row.full_text.trimStart();
      if (txt.startsWith('Dynamic List Information') || txt.startsWith('Dynamic List Data') || txt.length < 150) {
        contentNoiseIds.push(row.id);
      }
    }
    if (i % 2000 === 0 && i > 0) process.stdout.write(`    Scanned ${i}/${nonSectionNoise.length} HTML docs...\n`);
  }
  console.log(`  Content noise (Dynamic List / stubs): ${contentNoiseIds.length} docs`);

  const seen = new Set<string>();
  const allHtmlNoiseIds: string[] = [];
  for (const id of [...sectionNoiseIds, ...contentNoiseIds]) {
    if (!seen.has(id)) { seen.add(id); allHtmlNoiseIds.push(id); }
  }
  const freed2 = await deleteInBatches(sb, allHtmlNoiseIds, 'HTML noise', DRY_RUN);

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalFreed = freed1 + freed2;
  const gbFreed = (totalFreed * 6500 / 1e9).toFixed(2);
  console.log('\n═══════════════════════════════════════');
  console.log(`  Total chunks ${DRY_RUN ? 'to free' : 'freed'}: ${totalFreed.toLocaleString()}`);
  console.log(`  Estimated disk recovered: ~${gbFreed} GB`);
  if (!DRY_RUN) console.log('\n  Run chunk_and_embed --source=cms to embed remaining HIGH+MEDIUM docs.');
}

main().catch(console.error);
