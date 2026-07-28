/**
 * score_cms_pdfs.ts — Relevance scoring for CMS PDF documents
 *
 * Combines:
 *   [1] Path scoring  — topic area from section_number URL path
 *   [2] Keyword density — advisor-relevant vs. billing/admin terms in text
 *
 * Outputs a breakdown by score tier so you can choose a cutoff before embedding.
 *
 * Run: npx tsx --env-file=.env.local scripts/ingest/score_cms_pdfs.ts
 * Optional: --save   → writes relevance_score + relevance_tier to source_documents
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SAVE = process.argv.includes('--save');

// ── [1] Path scoring ─────────────────────────────────────────────────────────
// Score 0–3 based on the topic area encoded in the CMS URL path.

const PATH_SCORES: Array<{ pattern: string; score: number; label: string }> = [
  // Tier 3 — Core advisor topics
  { pattern: 'enrollment-renewal',               score: 3, label: 'Enrollment & Renewal' },
  { pattern: 'eligibility-and-enrollment',       score: 3, label: 'Eligibility & Enrollment' },
  { pattern: 'coverage',                         score: 3, label: 'Coverage' },
  { pattern: 'appeals-grievances',               score: 3, label: 'Appeals & Grievances' },
  { pattern: 'appeals-and-grievances',           score: 3, label: 'Appeals & Grievances' },
  { pattern: 'coordination-benefits-recovery',   score: 3, label: 'Coordination of Benefits' },
  { pattern: 'coordination-of-benefits',         score: 3, label: 'Coordination of Benefits' },
  { pattern: 'medicare-advantage',               score: 3, label: 'Medicare Advantage' },
  { pattern: 'health-drug-plans',                score: 3, label: 'Part D / Drug Plans' },
  { pattern: 'prescription-drug-coverage',       score: 3, label: 'Part D / Drug Plans' },
  { pattern: 'medicaid-coordination',            score: 3, label: 'Medicaid Coordination' },

  // Tier 2 — Relevant, some noise
  { pattern: 'regulations-guidance',             score: 2, label: 'Regulations & Guidance' },
  { pattern: 'payment',                          score: 2, label: 'Payment (general)' },
  { pattern: 'employers-plan-sponsors',          score: 2, label: 'Employers / Plan Sponsors' },
  { pattern: 'forms-notices',                    score: 2, label: 'Forms & Notices' },
  { pattern: 'cms-forms',                        score: 2, label: 'CMS Forms' },
  { pattern: 'advantage-quality',                score: 2, label: 'MA Quality' },
  { pattern: 'medicare-medicaid-coordination',   score: 2, label: 'Medicare-Medicaid' },
  { pattern: 'health-plans',                     score: 2, label: 'Health Plans (MA)' },
  { pattern: 'medicare-general-information',     score: 2, label: 'Medicare General Info' },
  { pattern: 'medicare-fee-for-service-part-b-drugs', score: 2, label: 'Part B Drugs' },
  { pattern: 'end-stage-renal-disease',          score: 2, label: 'ESRD' },
  { pattern: 'prevention',                       score: 2, label: 'Prevention' },

  // Tier 1 — Mostly billing/admin, limited advisor value
  { pattern: 'medicare-fee-for-service-payment', score: 1, label: 'Fee-for-Service Payment' },
  { pattern: 'billing',                          score: 1, label: 'Billing' },
  { pattern: 'health-safety-standards',          score: 1, label: 'Health & Safety Standards' },
  { pattern: 'e-health',                         score: 1, label: 'e-Health / IT' },
  { pattern: 'physician-fee-schedule',           score: 1, label: 'Physician Fee Schedule' },
  { pattern: 'survey',                           score: 1, label: 'Survey & Certification' },
  { pattern: 'compliance-and-audits',            score: 1, label: 'Compliance & Audits' },
  { pattern: 'fraud-and-abuse',                  score: 1, label: 'Fraud & Abuse' },
  { pattern: 'new-medicare-card',                score: 1, label: 'New Medicare Card' },

  // Tier 0 — Admin/contractor, no advisor value
  { pattern: 'medicare-contracting',             score: 0, label: 'Medicare Contracting' },
  { pattern: 'provider-enrollment-and-certification', score: 0, label: 'Provider Enrollment' },
];

function pathScore(sectionNumber: string): { score: number; label: string } {
  const path = sectionNumber.replace(/^CMSPDF:medicare\//, '').toLowerCase();
  for (const { pattern, score, label } of PATH_SCORES) {
    if (path.startsWith(pattern) || path.includes('/' + pattern)) {
      return { score, label };
    }
  }
  return { score: 1, label: 'Other' };
}

// ── [2] Keyword density scoring ───────────────────────────────────────────────
// Score based on presence of advisor-relevant vs. billing/admin terms.

const POSITIVE_TERMS = [
  // Medicare beneficiary topics
  'irmaa', 'income-related', 'income related', 'premium adjustment',
  'part b premium', 'part d premium', 'part b enrollment', 'part d enrollment',
  'late enrollment penalty', 'enrollment period', 'special enrollment',
  'initial enrollment', 'general enrollment', 'open enrollment',
  'medigap', 'supplement', 'medicare advantage', 'medicare part',
  'beneficiary', 'enrollee', 'subscriber',
  // Appeals & determinations
  'appeal', 'grievance', 'redetermination', 'reconsideration',
  'coverage determination', 'prior authorization', 'denial',
  // Eligibility & benefits
  'eligible', 'eligibility', 'qualifying', 'qualification',
  'cobra', 'retiree', 'employer coverage', 'group health plan',
  'coordination of benefits', 'primary payer', 'secondary payer',
  'low income subsidy', 'extra help', 'lis',
  // Financial & premium
  'premium', 'deductible', 'copayment', 'coinsurance', 'out-of-pocket',
  'cost sharing', 'income threshold', 'adjusted gross income',
];

const NEGATIVE_TERMS = [
  // Billing & coding (provider-facing, not advisor-facing)
  'cpt code', 'icd-', 'icd code', 'drg ', 'diagnosis related group',
  'wage index', 'ipps', 'opps', 'apc ', 'ambulatory payment',
  'rvu', 'relative value unit', 'conversion factor',
  'cost report', 'provider agreement', 'provider enrollment',
  'certification number', 'national provider',
  // Admin / IT
  'transmittal', 'change request', 'cr #', 'cr number',
  'systems release', 'software version', 'edits and audits',
  'revenue code', 'occurrence code', 'condition code',
  'remittance advice', 'electronic data interchange', 'edi ',
];

function keywordScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  for (const term of POSITIVE_TERMS) {
    if (lower.includes(term)) score++;
  }
  for (const term of NEGATIVE_TERMS) {
    if (lower.includes(term)) score--;
  }

  return score;
}

// ── Combined score → tier ──────────────────────────────────────────────────────

function tier(pathSc: number, kwSc: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'SKIP' {
  const combined = pathSc + Math.max(-2, Math.min(3, kwSc)); // keyword contributes -2..+3
  if (combined >= 5) return 'HIGH';
  if (combined >= 3) return 'MEDIUM';
  if (combined >= 1) return 'LOW';
  return 'SKIP';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Fetching CMS PDF docs...');

  // Paginate through all CMSPDF docs (id, section_number, title + first 3000 chars of text)
  const allDocs: Array<{ id: string; section_number: string; title: string | null; full_text: string | null }> = [];
  let offset = 0;

  // First get all IDs + section_numbers (lightweight)
  while (true) {
    const { data } = await sb.from('source_documents')
      .select('id, section_number, title')
      .eq('source_type', 'cms').eq('doc_kind', 'rule')
      .is('superseded_at', null)
      .like('section_number', 'CMSPDF:%')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allDocs.push(...data.map(d => ({ ...d, full_text: null })));
    if (data.length < 1000) break;
    offset += 1000;
  }

  console.log(`Found ${allDocs.length} CMSPDF docs. Scoring...`);

  // Fetch full_text in batches of 20 for keyword scoring
  const FETCH_BATCH = 20;
  const results: Array<{
    id: string;
    section_number: string;
    title: string | null;
    pathScore: number;
    pathLabel: string;
    kwScore: number;
    tier: string;
  }> = [];

  for (let i = 0; i < allDocs.length; i += FETCH_BATCH) {
    const batch = allDocs.slice(i, i + FETCH_BATCH);
    const ids = batch.map(d => d.id);

    const { data: fetched } = await sb.from('source_documents')
      .select('id, full_text')
      .in('id', ids);

    const textMap = new Map<string, string>();
    for (const row of fetched ?? []) {
      if (row.id && row.full_text) {
        // Use first 3000 chars — enough for intro/abstract without loading full doc
        textMap.set(row.id, row.full_text.slice(0, 3000));
      }
    }

    for (const doc of batch) {
      const ps = pathScore(doc.section_number);
      const text = textMap.get(doc.id) ?? '';
      const kw = keywordScore(text);
      const t = tier(ps.score, kw);
      results.push({
        id: doc.id,
        section_number: doc.section_number,
        title: doc.title,
        pathScore: ps.score,
        pathLabel: ps.label,
        kwScore: kw,
        tier: t,
      });
    }

    if (i % 200 === 0 && i > 0) process.stdout.write(`  ${i}/${allDocs.length}...\n`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const tiers = { HIGH: [] as typeof results, MEDIUM: [] as typeof results, LOW: [] as typeof results, SKIP: [] as typeof results };
  for (const r of results) tiers[r.tier as keyof typeof tiers].push(r);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  CMS PDF RELEVANCE SCORING RESULTS');
  console.log('═══════════════════════════════════════════════════\n');

  for (const [t, docs] of Object.entries(tiers)) {
    const emoji = t === 'HIGH' ? '🟢' : t === 'MEDIUM' ? '🟡' : t === 'LOW' ? '🟠' : '🔴';
    console.log(`${emoji} ${t}: ${docs.length} docs (${Math.round(docs.length/results.length*100)}%)`);
  }

  // Breakdown by path label for HIGH+MEDIUM
  console.log('\n── Topic area breakdown (HIGH + MEDIUM) ──────────');
  const topicCounts: Record<string, { high: number; medium: number; low: number; skip: number }> = {};
  for (const r of results) {
    const k = r.pathLabel;
    if (!topicCounts[k]) topicCounts[k] = { high: 0, medium: 0, low: 0, skip: 0 };
    topicCounts[k][r.tier.toLowerCase() as 'high'|'medium'|'low'|'skip']++;
  }
  const rows = Object.entries(topicCounts).sort((a, b) => (b[1].high + b[1].medium) - (a[1].high + a[1].medium));
  for (const [label, counts] of rows) {
    const total = counts.high + counts.medium + counts.low + counts.skip;
    console.log(`  ${label.padEnd(32)} H:${String(counts.high).padStart(4)}  M:${String(counts.medium).padStart(4)}  L:${String(counts.low).padStart(4)}  S:${String(counts.skip).padStart(4)}  (${total})`);
  }

  // Sample HIGH docs
  console.log('\n── Sample HIGH relevance docs ─────────────────────');
  tiers.HIGH.slice(0, 8).forEach(r => {
    console.log(`  [${r.pathLabel}] path=${r.pathScore} kw=${r.kwScore} "${r.title?.slice(0,70) ?? r.section_number.slice(0,70)}"`);
  });

  // Sample SKIP docs
  console.log('\n── Sample SKIP docs ────────────────────────────────');
  tiers.SKIP.slice(0, 8).forEach(r => {
    console.log(`  [${r.pathLabel}] path=${r.pathScore} kw=${r.kwScore} "${r.title?.slice(0,70) ?? r.section_number.slice(0,70)}"`);
  });

  // Disk estimate
  const AVG_CHUNKS_PER_PDF = 85;
  const BYTES_PER_CHUNK = 6500;
  for (const [t, docs] of [['HIGH', tiers.HIGH], ['HIGH+MEDIUM', [...tiers.HIGH, ...tiers.MEDIUM]]] as const) {
    const chunks = docs.length * AVG_CHUNKS_PER_PDF;
    const gb = (chunks * BYTES_PER_CHUNK / 1e9).toFixed(1);
    console.log(`\n  ${t} (${docs.length} docs): ~${chunks.toLocaleString()} chunks → ~${gb} GB`);
  }
  console.log(`  ALL PDFs (${results.length} docs): ~${(results.length * AVG_CHUNKS_PER_PDF * BYTES_PER_CHUNK / 1e9).toFixed(1)} GB`);

  // Write full results to CSV for inspection
  const csv = ['id,section_number,title,pathScore,pathLabel,kwScore,tier',
    ...results.map(r => `${r.id},"${r.section_number}","${(r.title??'').replace(/"/g,'""')}",${r.pathScore},"${r.pathLabel}",${r.kwScore},${r.tier}`)
  ].join('\n');
  fs.writeFileSync('tmp/cms_pdf_scores.csv', csv);
  console.log('\n  Full results written to tmp/cms_pdf_scores.csv');

  if (SAVE) {
    console.log('\nSaving scores to source_documents...');
    // Would need a relevance_score column — skipping for now, just report
    console.log('(--save not yet implemented — add relevance_score column first)');
  }
}

main().catch(console.error);
