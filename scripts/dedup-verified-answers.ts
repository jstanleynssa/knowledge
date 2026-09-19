/**
 * dedup-verified-answers.ts
 *
 * For each question that appears more than once in verified_answers, keeps
 * the single best entry and deletes the rest.
 *
 * Selection priority within a duplicate group:
 *   1. Named expert reviewer (Jim Blair, Todd Valles, Cindi Hill, Jason Stanley)
 *      with a long answer (≥200 chars) — most recent first
 *   2. agent-approved with long answer — most recent first
 *   3. human-corrected with long answer — most recent first
 *   4. Anything remaining — most recent first
 *
 * Run:
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/dedup-verified-answers.ts
 */

import { createServiceClient } from '@/lib/supabase';

const sb = createServiceClient();

const NAMED_REVIEWERS = new Set(['Jim Blair', 'Todd Valles', 'Cindi Hill', 'Jason Stanley']);

function score(row: { answered_by: string; answer: string; created_at: string }): number {
  const answerLen = row.answer?.length ?? 0;
  const isNamed   = NAMED_REVIEWERS.has(row.answered_by);
  const isAgentApproved = row.answered_by === 'agent-approved';
  const isLong    = answerLen >= 200;

  if (isNamed    && isLong) return 4;
  if (isAgentApproved && isLong) return 3;
  if (!isAgentApproved && isLong) return 2; // human-corrected long
  if (isAgentApproved)           return 1;
  return 0; // human-corrected short — raw correction note
}

async function main() {
  console.log('Fetching all verified_answers (paginated)...');
  const all: any[] = [];
  const PAGE = 1000;
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('verified_answers')
      .select('id, question, answer, answered_by, created_at')
      .order('created_at', { ascending: false })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    page++;
  }
  console.log(`Total entries fetched: ${all.length}`);

  // Group by first 100 chars of question
  const groups = new Map<string, typeof all>();
  for (const row of all) {
    const key = (row.question ?? '').slice(0, 100);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const dupGroups = [...groups.entries()].filter(([, rows]) => rows.length > 1);
  console.log(`Duplicate groups: ${dupGroups.length}`);

  const toDelete: string[] = [];
  let keptTotal = 0;

  for (const [key, rows] of dupGroups) {
    // Sort: highest score first, then most recent
    rows.sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const winner = rows[0];
    const losers = rows.slice(1);

    console.log(`\n  Q: "${key.slice(0, 70)}..."`);
    console.log(`  ✓ KEEP  id=${winner.id} | ${winner.answered_by} | ${winner.created_at?.slice(0, 10)} | len=${winner.answer?.length}`);
    losers.forEach(r => {
      console.log(`  ✗ DEL   id=${r.id} | ${r.answered_by} | ${r.created_at?.slice(0, 10)} | len=${r.answer?.length}`);
      toDelete.push(r.id);
    });
    keptTotal++;
  }

  console.log(`\nWill delete ${toDelete.length} duplicate entries, keeping ${keptTotal} winners.`);

  if (toDelete.length === 0) { console.log('Nothing to delete.'); return; }

  // Delete in batches of 50
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);
    const { error: delErr } = await sb
      .from('verified_answers')
      .delete()
      .in('id', batch);
    if (delErr) { console.error(`Delete batch error:`, delErr.message); process.exit(1); }
    deleted += batch.length;
  }

  console.log(`\n✓ Deleted ${deleted} duplicate entries.`);

  // Final count
  const { count } = await sb.from('verified_answers').select('*', { count: 'exact', head: true });
  console.log(`Corpus now has ${count} entries.`);
}

main().catch(e => { console.error(e); process.exit(1); });
