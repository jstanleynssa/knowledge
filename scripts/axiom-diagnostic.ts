/**
 * axiom-diagnostic.ts
 *
 * Full health check on the AXIOM learning loop:
 * 1. Verified answers corpus — count, quality, duplicates, null embeddings
 * 2. Feedback pipeline integrity — answer_feedback → verified_answers
 * 3. Duplicate detection — systemic or isolated
 * 4. Retrieval smoke test — similarity scores on known questions
 * 5. Category / answered_by breakdown
 *
 * Run:
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/axiom-diagnostic.ts
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';

const sb = createServiceClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function section(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function ok(msg: string)   { console.log(`  ✓  ${msg}`); }
function warn(msg: string) { console.log(`  ⚠  ${msg}`); }
function fail(msg: string) { console.log(`  ✗  ${msg}`); }
function info(msg: string) { console.log(`     ${msg}`); }

// ── 1. Verified Answers Corpus ────────────────────────────────────────────────
async function checkVerifiedAnswers() {
  section('1. VERIFIED ANSWERS CORPUS');

  // Total count
  const { count: total } = await sb
    .from('verified_answers')
    .select('*', { count: 'exact', head: true });
  info(`Total entries: ${total}`);

  // By status
  const { data: byStatus } = await sb
    .from('verified_answers')
    .select('status')
    .then(r => ({ data: r.data }));
  const statusCounts: Record<string, number> = {};
  byStatus?.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1; });
  Object.entries(statusCounts).forEach(([s, n]) => info(`  status=${s}: ${n}`));

  // By answered_by
  const { data: bySource } = await sb
    .from('verified_answers')
    .select('answered_by');
  const sourceCounts: Record<string, number> = {};
  bySource?.forEach(r => { sourceCounts[r.answered_by] = (sourceCounts[r.answered_by] ?? 0) + 1; });
  section('   Breakdown by source');
  Object.entries(sourceCounts).sort((a,b) => b[1]-a[1]).forEach(([s, n]) => info(`  ${s}: ${n}`));

  // By category
  const { data: byCat } = await sb
    .from('verified_answers')
    .select('category');
  const catCounts: Record<string, number> = {};
  byCat?.forEach(r => { catCounts[r.category ?? 'null'] = (catCounts[r.category ?? 'null'] ?? 0) + 1; });
  Object.entries(catCounts).forEach(([c, n]) => info(`  category=${c}: ${n}`));

  // Null embeddings
  const { count: nullEmb } = await sb
    .from('verified_answers')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null);
  if (nullEmb && nullEmb > 0) {
    fail(`${nullEmb} entries have NULL embeddings — these will NEVER be retrieved`);
  } else {
    ok('All entries have embeddings');
  }

  // Null/empty answers
  const { data: emptyAnswers } = await sb
    .from('verified_answers')
    .select('id, question, answered_by, created_at')
    .or('answer.is.null,answer.eq.');
  if (emptyAnswers && emptyAnswers.length > 0) {
    fail(`${emptyAnswers.length} entries have null/empty answers:`);
    emptyAnswers.forEach(r => info(`  id=${r.id} | ${r.answered_by} | ${r.created_at} | Q: ${r.question?.slice(0,60)}...`));
  } else {
    ok('All entries have non-empty answers');
  }

  // Short answers (likely raw correction notes, not proper HTML answers)
  const { data: allAnswers } = await sb
    .from('verified_answers')
    .select('id, question, answer, answered_by, created_at')
    .eq('answered_by', 'human-corrected');
  const shortAnswers = allAnswers?.filter(r => (r.answer?.length ?? 0) < 200) ?? [];
  if (shortAnswers.length > 0) {
    warn(`${shortAnswers.length} human-corrected entries have very short answers (<200 chars) — likely raw correction notes, not structured answers:`);
    shortAnswers.forEach(r => info(`  id=${r.id} | ${r.created_at?.slice(0,10)} | Q: ${r.question?.slice(0,60)}... | A: ${r.answer?.slice(0,80)}...`));
  } else {
    ok('All human-corrected entries have substantive answers (≥200 chars)');
  }
}

// ── 2. Duplicate Detection ────────────────────────────────────────────────────
async function checkDuplicates() {
  section('2. DUPLICATE DETECTION');

  const { data: all } = await sb
    .from('verified_answers')
    .select('id, question, answered_by, created_at')
    .order('question');

  if (!all) { fail('Could not fetch records'); return; }

  // Group by first 100 chars of question
  const groups: Record<string, typeof all> = {};
  all.forEach(r => {
    const key = r.question?.slice(0, 100) ?? 'null';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const duplicated = Object.entries(groups).filter(([, rows]) => rows.length > 1);
  if (duplicated.length === 0) {
    ok('No duplicate questions found');
  } else {
    fail(`${duplicated.length} question(s) have multiple entries:`);
    duplicated.forEach(([key, rows]) => {
      warn(`  "${key.slice(0,70)}..." → ${rows.length} entries`);
      rows.forEach(r => info(`    id=${r.id} | ${r.answered_by} | ${r.created_at?.slice(0,10)}`));
    });
  }
}

// ── 3. Feedback Pipeline Integrity ────────────────────────────────────────────
async function checkFeedbackPipeline() {
  section('3. FEEDBACK PIPELINE (answer_feedback → verified_answers)');

  // Total feedback entries
  const { count: totalFb } = await sb
    .from('answer_feedback')
    .select('*', { count: 'exact', head: true });
  info(`Total answer_feedback entries: ${totalFb}`);

  // By type
  const { data: fbTypes } = await sb
    .from('answer_feedback')
    .select('feedback_type, saved_to_verified');
  const typeCounts: Record<string, number> = {};
  const savedCounts: Record<string, number> = {};
  fbTypes?.forEach(r => {
    typeCounts[r.feedback_type] = (typeCounts[r.feedback_type] ?? 0) + 1;
    if (r.saved_to_verified) savedCounts[r.feedback_type] = (savedCounts[r.feedback_type] ?? 0) + 1;
  });
  Object.entries(typeCounts).forEach(([t, n]) => {
    const saved = savedCounts[t] ?? 0;
    info(`  feedback_type=${t}: ${n} total, ${saved} marked saved_to_verified`);
  });

  // Check: entries marked saved_to_verified=true — do they actually have a verified_answers row?
  const { data: shouldBeSaved } = await sb
    .from('answer_feedback')
    .select('id, question, feedback_type, created_at')
    .eq('saved_to_verified', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!shouldBeSaved || shouldBeSaved.length === 0) {
    info('No feedback entries marked saved_to_verified=true to cross-check');
    return;
  }

  // For each, check if a verified_answers row exists with the same question
  let missingCount = 0;
  const missingEntries: typeof shouldBeSaved = [];
  for (const fb of shouldBeSaved) {
    const key = fb.question?.slice(0, 100) ?? '';
    const { count } = await sb
      .from('verified_answers')
      .select('*', { count: 'exact', head: true })
      .ilike('question', `${key.slice(0,80)}%`);
    if (!count || count === 0) {
      missingCount++;
      missingEntries.push(fb);
    }
  }

  if (missingCount > 0) {
    fail(`${missingCount} feedback entries are marked saved_to_verified=true but have NO corresponding verified_answers row:`);
    missingEntries.slice(0, 10).forEach(r =>
      warn(`  fb_id=${r.id} | type=${r.feedback_type} | ${r.created_at?.slice(0,10)} | Q: ${r.question?.slice(0,70)}...`)
    );
    if (missingEntries.length > 10) info(`  ... and ${missingEntries.length - 10} more`);
  } else {
    ok(`All checked feedback entries (n=${shouldBeSaved.length}) have a corresponding verified_answers row`);
  }

  // Recent feedback — last 10
  section('   Recent feedback (last 10)');
  const { data: recent } = await sb
    .from('answer_feedback')
    .select('id, feedback_type, saved_to_verified, created_at, question, correction_note')
    .order('created_at', { ascending: false })
    .limit(10);
  recent?.forEach(r => {
    const note = r.correction_note ? ` | note: "${r.correction_note?.slice(0,50)}..."` : '';
    info(`  ${r.created_at?.slice(0,16)} | type=${r.feedback_type} | saved=${r.saved_to_verified} | Q: ${r.question?.slice(0,50)}...${note}`);
  });
}

// ── 4. Retrieval Smoke Test ───────────────────────────────────────────────────
async function checkRetrieval() {
  section('4. RETRIEVAL SMOKE TEST (similarity scores)');

  const testQuestions = [
    {
      label: 'Spousal benefit / early filing (just fixed)',
      q: 'I have a client who is 62 and considering filing early. Her husband is 64 and is not planning to file until FRA. The Social Security office says she will still benefit from a full spousal boost. Is this accurate?',
    },
    {
      label: 'General deemed filing',
      q: 'What are the deemed filing rules for spousal benefits?',
    },
    {
      label: 'Windfall elimination provision',
      q: 'How does WEP affect a client who worked for a non-covered employer?',
    },
  ];

  for (const test of testQuestions) {
    info(`\n  Question: "${test.label}"`);
    const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: test.q });
    const embedding = embRes.data[0].embedding;

    const { data: hits } = await sb.rpc('match_verified_answers', {
      query_embedding: embedding,
      match_count: 3,
      match_threshold: 0.50,  // lower threshold to see what's close
      filter_category: 'social-security',
    });

    if (!hits || hits.length === 0) {
      warn('  No hits even at 0.50 threshold');
    } else {
      hits.forEach((h: any) => {
        const score = h.similarity?.toFixed(4);
        const flag  = h.similarity >= 0.70 ? '✓ WILL SURFACE' : '✗ below 0.70 threshold';
        info(`    ${flag} | sim=${score} | Q: ${h.question?.slice(0,70)}...`);
      });
    }
  }
}

// ── 5. Corpus Age Check ───────────────────────────────────────────────────────
async function checkCorpusAge() {
  section('5. CORPUS AGE & STALENESS');

  const { data: oldEntries } = await sb
    .from('verified_answers')
    .select('id, question, last_reviewed, created_at, answered_by')
    .order('last_reviewed', { ascending: true, nullsFirst: true })
    .limit(10);

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const stale = oldEntries?.filter(r => !r.last_reviewed || r.last_reviewed < ninetyDaysAgo) ?? [];
  if (stale.length > 0) {
    warn(`${stale.length} of oldest entries have not been reviewed in 90+ days (or never reviewed):`);
    stale.forEach(r => info(`  id=${r.id} | reviewed=${r.last_reviewed ?? 'never'} | Q: ${r.question?.slice(0,60)}...`));
  } else {
    ok('All sampled entries reviewed within 90 days');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nAXIOM SYSTEM DIAGNOSTIC');
  console.log(`Run at: ${new Date().toISOString()}`);

  await checkVerifiedAnswers();
  await checkDuplicates();
  await checkFeedbackPipeline();
  await checkRetrieval();
  await checkCorpusAge();

  section('DIAGNOSTIC COMPLETE');
}

main().catch(e => { console.error(e); process.exit(1); });
