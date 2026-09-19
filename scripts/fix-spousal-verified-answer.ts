/**
 * fix-spousal-verified-answer.ts
 *
 * 1. Removes the incorrect human-corrected verified_answers entry about
 *    spousal benefits / early filing that was submitted on 2026-09-18.
 * 2. Inserts a correct, citation-backed answer reflecting:
 *    - Deemed filing rules (GN 00204.035)
 *    - Separate reduction factors when spousal entitlement arises later
 *      (RS 00615.010, RS 00615.020, RS 00615.201)
 *    - SSA office advice accuracy depends on timing of spouse's filing
 *
 * Run:
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/fix-spousal-verified-answer.ts
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';

const QUESTION = `I have a client who is 62 and considering filing early. Her husband is 64 and is the higher income earner and is not planning to file until FRA. The Social Security office is telling her that she will still benefit from a full spousal boost, even if she claims early and her own benefit is reduced. Is this accurate?`;

const CORRECT_ANSWER = `<p>The SSA office's advice requires clarification — whether the client receives a full or reduced spousal benefit depends on her age relative to her own FRA at the time her husband files, not at the time she filed for her own retirement benefit.</p>

<p><strong>Her own retirement benefit:</strong> If the client files at age 62, her own retirement benefit is permanently reduced — approximately 30% for someone whose FRA is 67 (5 years / 60 months early) (RS 00615.020).</p>

<p><strong>Deemed filing and the spousal benefit:</strong> Under deemed filing rules (GN 00204.035), individuals born on or after January 2, 1954 are deemed to have filed for both their own retirement benefit and spousal benefits simultaneously. However, because the client's husband has not yet filed, she cannot become entitled to the spousal benefit at the time she files at 62 — entitlement to spousal benefits requires that the other spouse be entitled to retirement or disability benefits.</p>

<p><strong>When the husband files at FRA:</strong> When her husband files, the client will then become entitled to the spousal benefit. At that point, the excess spousal benefit — calculated as one-half of the husband's PIA minus the client's own PIA — is subject to its own separate reduction factor. That reduction is based on the number of months she is from her own FRA <em>at the time she becomes entitled to the spousal benefit</em>, not at the time she originally filed for retirement (RS 00615.010).</p>

<p><strong>What this means in practice:</strong></p>
<ul>
  <li>If the client has already reached her FRA by the time her husband files, the spousal excess has <strong>no reduction at all</strong> — the SSA office would be correct.</li>
  <li>If the client is still before her FRA when her husband files, the spousal excess is reduced, but only by the months remaining to her FRA at that later date — a smaller reduction than her own retirement benefit.</li>
  <li>A "full spousal boost" is accurate only if the timing results in her being at or past her own FRA when the husband files.</li>
</ul>

<p>In this specific scenario (client age 62, husband age 64, husband filing at FRA of 67), the client will be approximately 65 when her husband files — roughly 24 months before her own FRA of 67. The spousal excess would be reduced by approximately 13.3%, not the full 30% applied to her retirement benefit. The SSA office's statement is therefore an overstatement for this exact scenario, though the principle that the reductions are computed separately is correct (RS 00615.010, RS 00615.201).</p>`;

const PRIMARY_SOURCES = [
  {
    section_number: 'RS 00615.010',
    url: 'https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615010000',
    tag: 'Source',
  },
  {
    section_number: 'GN 00204.035',
    url: 'https://secure.ssa.gov/apps10/poms.nsf/lnx/0200204035000',
    tag: 'Source',
  },
  {
    section_number: 'RS 00615.020',
    url: 'https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615020000',
    tag: 'Source',
  },
  {
    section_number: 'RS 00615.201',
    url: 'https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615201000',
    tag: 'Source',
  },
];

async function main() {
  const sb    = createServiceClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ── 1. Find incorrect entries for this question ────────────────────────────
  console.log('Searching for existing verified_answers entries...');
  const { data: existing, error: findErr } = await sb
    .from('verified_answers')
    .select('id, question, answered_by, created_at, status')
    .ilike('question', '%client who is 62%')
    .order('created_at', { ascending: false });

  if (findErr) { console.error('Find error:', findErr.message); process.exit(1); }

  console.log(`Found ${existing?.length ?? 0} matching entries:`);
  existing?.forEach(r => {
    console.log(`  id=${r.id} | answered_by=${r.answered_by} | status=${r.status} | created=${r.created_at}`);
  });

  // ── 2. Delete all existing entries for this question ───────────────────────
  if (existing && existing.length > 0) {
    const ids = existing.map(r => r.id);
    const { error: delErr } = await sb
      .from('verified_answers')
      .delete()
      .in('id', ids);

    if (delErr) { console.error('Delete error:', delErr.message); process.exit(1); }
    console.log(`Deleted ${ids.length} existing entry/entries.`);
  } else {
    console.log('No existing entries found to delete.');
  }

  // ── 3. Embed the question ──────────────────────────────────────────────────
  console.log('Generating embedding...');
  const embRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: QUESTION,
  });
  const embedding = embRes.data[0].embedding;
  console.log(`Embedding generated (${embedding.length} dimensions).`);

  // ── 4. Insert the correct verified answer ─────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const { data: inserted, error: insErr } = await sb
    .from('verified_answers')
    .insert({
      question:        QUESTION,
      answer:          CORRECT_ANSWER,
      primary_sources: PRIMARY_SOURCES,
      answered_by:     'human-corrected',
      category:        'social-security',
      status:          'published',
      embedding,
      last_reviewed:   today,
    })
    .select('id')
    .single();

  if (insErr) { console.error('Insert error:', insErr.message); process.exit(1); }
  console.log(`✓ Correct verified answer inserted with id=${inserted?.id}`);
  console.log('Done. AXIOM will now use this entry when a similar question is asked.');
}

main().catch(e => { console.error(e); process.exit(1); });
