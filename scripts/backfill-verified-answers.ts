/**
 * backfill-verified-answers.ts
 *
 * Seeds verified_answers from all published reference_pages:
 *   - Each body_section  → { question: heading, answer: prose }
 *   - Each FAQ item      → { question: q, answer: a }
 *
 * Quick_answer seeding already happens automatically in saveAndApprove().
 * This script fills the gap: the detailed section-level and FAQ content
 * that human reviewers individually verified but was never persisted to
 * the verified_answers corpus.
 *
 * Run once:
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/backfill-verified-answers.ts
 *
 * Safe to re-run — deduplicates against existing entries by (question, category).
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const sb   = createServiceClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today  = new Date().toISOString().split('T')[0];

  // ── Fetch all published pages ─────────────────────────────────────────────
  const { data: pages, error } = await sb
    .from('reference_pages')
    .select('id, slug, h1, title, category, body_sections, faq, primary_sources, approved_by')
    .eq('status', 'published');

  if (error) throw new Error('Fetch error: ' + error.message);
  if (!pages || pages.length === 0) { console.log('No published pages.'); return; }

  console.log(`\n📄 ${pages.length} published pages found.\n`);

  // ── Build candidate pairs ─────────────────────────────────────────────────
  const pairs: Array<{
    question:        string;
    answer:          string;
    category:        string;
    primary_sources: unknown[];
    answered_by:     string;
    source_label:    string; // for logging only
  }> = [];

  for (const page of pages) {
    const answeredBy  = page.approved_by || 'reviewer-approved';
    const pageSources = page.primary_sources || [];
    const category    = page.category;

    // Body sections
    for (const section of (page.body_sections || [])) {
      const question = (section.heading || '').trim();
      const prose    = stripHtml(section.prose || '');
      if (!question || prose.length < 50) continue;

      // Prefer the section's own citation_ref; fall back to page sources
      const sources = section.citation_ref
        ? [{ section_number: section.citation_ref, url: '', tag: 'Source' }]
        : pageSources;

      pairs.push({
        question,
        answer:          section.prose, // keep HTML
        category,
        primary_sources: sources,
        answered_by:     answeredBy,
        source_label:    `${page.slug} / section`,
      });
    }

    // FAQ items
    for (const item of (page.faq || [])) {
      const question = (item.q || '').trim();
      const answer   = stripHtml(item.a || '');
      if (!question || answer.length < 30) continue;

      pairs.push({
        question,
        answer:          item.a, // keep HTML
        category,
        primary_sources: pageSources,
        answered_by:     answeredBy,
        source_label:    `${page.slug} / FAQ`,
      });
    }
  }

  console.log(`🔍 ${pairs.length} candidate pairs extracted from body sections + FAQs.`);

  // ── Deduplicate against existing corpus ───────────────────────────────────
  const { data: existing } = await sb
    .from('verified_answers')
    .select('question, category');

  const existingKeys = new Set(
    (existing || []).map(r => `${r.category}::${r.question.toLowerCase().trim()}`)
  );

  const newPairs = pairs.filter(
    p => !existingKeys.has(`${p.category}::${p.question.toLowerCase().trim()}`)
  );

  console.log(`✓ ${pairs.length - newPairs.length} already exist — skipping.`);
  console.log(`➕ ${newPairs.length} new pairs to add.\n`);

  if (newPairs.length === 0) {
    console.log('Nothing to do. Corpus is already up to date.');
    return;
  }

  // ── Embed + insert in batches of 50 ──────────────────────────────────────
  const EMBED_BATCH = 50;
  let inserted = 0;
  let errors   = 0;

  for (let i = 0; i < newPairs.length; i += EMBED_BATCH) {
    const batch = newPairs.slice(i, i + EMBED_BATCH);

    let embeddings: number[][];
    try {
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(p => p.question),
      });
      embeddings = res.data.map(d => d.embedding);
    } catch (e: any) {
      console.error(`  Embedding error at batch ${i}:`, e.message);
      errors += batch.length;
      await sleep(5000);
      continue;
    }

    const rows = batch.map((p, j) => ({
      question:        p.question,
      answer:          p.answer,
      primary_sources: p.primary_sources,
      answered_by:     p.answered_by,
      category:        p.category,
      status:          'published',
      embedding:       embeddings[j],
      last_reviewed:   today,
    }));

    const { error: insertErr } = await sb.from('verified_answers').insert(rows);

    if (insertErr) {
      console.error(`  Insert error at batch ${i}:`, insertErr.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      const pct = Math.round((inserted / newPairs.length) * 100);
      console.log(`  [${pct}%] ${inserted}/${newPairs.length} inserted`);
    }

    await sleep(100); // gentle pace
  }

  const grandTotal = (existing?.length || 0) + inserted;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Backfill complete.`);
  console.log(`  New pairs inserted:  ${inserted}`);
  if (errors > 0) console.log(`  Errors:              ${errors}`);
  console.log(`  Total corpus:        ~${grandTotal} verified pairs`);
  console.log(`  Fine-tune threshold: 300 pairs`);
  console.log(`  Status:              ${grandTotal >= 300 ? '✅ READY FOR FINE-TUNING' : `${300 - grandTotal} more pairs needed`}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
