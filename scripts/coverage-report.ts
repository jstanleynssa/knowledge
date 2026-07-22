#!/usr/bin/env tsx
/**
 * coverage-report.ts — Knowledge Base source coverage analysis
 *
 * Shows which source documents have been cited in published reference pages,
 * which topic clusters have gaps, and what to draft next.
 *
 * Usage:
 *   npx tsx scripts/coverage-report.ts             # Console report
 *   npx tsx scripts/coverage-report.ts --json      # Also write coverage.json
 *   npx tsx scripts/coverage-report.ts --gaps-only # Only show uncovered clusters
 */

import { createServiceClient } from '@/lib/supabase';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const args = new Set(process.argv.slice(2));
const JSON_OUT   = args.has('--json');
const GAPS_ONLY  = args.has('--gaps-only');

// ─── POMS section classification ─────────────────────────────────────────────
// Advisor-relevance tiers based on POMS prefix + chapter patterns.
// Tier 1 = high value (core advisor topics)
// Tier 2 = moderate (may yield some useful pages)
// Tier 3 = low/internal (skip for drafting purposes)

const POMS_PREFIXES: Record<string, { label: string; tier: 1 | 2 | 3 }> = {
  RS:  { label: 'Retirement & Survivors Insurance',     tier: 1 },
  HI:  { label: 'Health Insurance (Medicare/IRMAA)',    tier: 1 },
  GN:  { label: 'General (Filing, Evidence, Claims)',   tier: 1 },  // filtered by chapter below
  DI:  { label: 'Disability Insurance',                 tier: 2 },
  SI:  { label: 'Supplemental Security Income',         tier: 2 },
  HA:  { label: 'Hearings, Appeals & Litigation',       tier: 2 },
  VB:  { label: 'Veterans Benefits',                    tier: 2 },
  NL:  { label: 'Notice/Letter Templates (internal)',   tier: 3 },
  RM:  { label: 'Records Management (internal)',        tier: 3 },
  HS:  { label: 'Hearings System (internal)',           tier: 3 },
  QR:  { label: 'Quality Review (internal)',            tier: 3 },
  PS:  { label: 'Policy Sites (internal)',              tier: 3 },
  SL:  { label: 'State Law (internal)',                 tier: 3 },
  PR:  { label: 'Puerto Rico Regional (operational)',   tier: 3 },
  BOS: { label: 'Boston Regional (operational)',        tier: 3 },
  NY:  { label: 'New York Regional (operational)',      tier: 3 },
  DAL: { label: 'Dallas Regional (operational)',        tier: 3 },
  SF:  { label: 'San Francisco Regional (operational)', tier: 3 },
  CHI: { label: 'Chicago Regional (operational)',       tier: 3 },
  DEN: { label: 'Denver Regional (operational)',        tier: 3 },
  KC:  { label: 'Kansas City Regional (operational)',   tier: 3 },
  PHI: { label: 'Philadelphia Regional (operational)',  tier: 3 },
  SEA: { label: 'Seattle Regional (operational)',       tier: 3 },
  ATL: { label: 'Atlanta Regional (operational)',       tier: 3 },
  DX:  { label: 'Disability Exam (operational)',        tier: 3 },
};

// Within GN, chapters 001-005 are filing/claims rules (tier 1); others are lower value
function pomsChapterTier(sectionNumber: string): 1 | 2 | 3 {
  const prefix = sectionNumber.split(' ')[0];
  if (prefix !== 'GN') return POMS_PREFIXES[prefix]?.tier ?? 3;
  const chapter = sectionNumber.split(' ')[1]?.slice(0, 3) ?? '';
  if (['001','002','003','004','005'].includes(chapter)) return 1;
  if (['006','007','008'].includes(chapter)) return 2;
  return 3;
}

// GN chapter labels for grouping
const GN_CHAPTER_LABELS: Record<string, string> = {
  '001': 'GN 001 — Applications & Filing',
  '002': 'GN 002 — Filing Requirements & Proofs',
  '003': 'GN 003 — Evidence of Age/Relationship',
  '004': 'GN 004 — Payment & Overpayments',
  '005': 'GN 005 — Reconsiderations & Appeals',
  '006': 'GN 006 — Program Integrity',
  '007': 'GN 007 — International Operations',
  '008': 'GN 008 — Special Programs',
};

// RS chapter labels
const RS_CHAPTER_LABELS: Record<string, string> = {
  '004': 'RS 004 — Insured Status & Quarters of Coverage',
  '005': 'RS 005 — Retirement Benefits',
  '006': 'RS 006 — Spousal & Divorced Spouse Benefits',
  '007': 'RS 007 — Child & Student Benefits',
  '008': 'RS 008 — Survivor Benefits',
  '009': 'RS 009 — Medicare Enrollment',
  '010': 'RS 010 — Earnings Test & Withholding',
  '001': 'RS 001 — Wage Credits & Coverage',
  '002': 'RS 002 — Self-Employment',
  '003': 'RS 003 — Military Service Coverage',
};

function sectionCluster(sectionNumber: string): string {
  const parts = sectionNumber.split(' ');
  const prefix = parts[0];
  const chapter = (parts[1] ?? '').slice(0, 3);

  if (prefix === 'GN') return GN_CHAPTER_LABELS[chapter] ?? `GN ${chapter} — General`;
  if (prefix === 'RS') return RS_CHAPTER_LABELS[chapter] ?? `RS ${chapter} — Retirement/Survivors`;
  if (prefix === 'HI') return `HI ${chapter} — Health Insurance / Medicare`;
  if (prefix === 'DI') return `DI ${chapter} — Disability`;
  if (prefix === 'SI') return `SI ${chapter} — SSI`;
  if (prefix === 'HA') return `HA ${chapter} — Hearings & Appeals`;
  if (prefix === 'CFR') {
    const part = parts[2]?.split('.')[0] ?? '';
    return `20 CFR ${part} — Federal Regulation`;
  }
  if (prefix === 'HBK') {
    const num = parseInt(parts[1] ?? '0', 10);
    const rangeStart = Math.floor(num / 100) * 100;
    return `Handbook §${rangeStart}–${rangeStart + 99}`;
  }
  return `${prefix} — Other`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();

  console.log('\n📊 NSSA Knowledge Base — Coverage Report');
  console.log('   ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('═'.repeat(64));

  // ── 1. Load all rule docs ──────────────────────────────────────────────────
  console.log('\nLoading source documents...');
  const allDocs: Array<{ section_number: string; source_type: string; title: string | null }> = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('source_documents')
      .select('section_number, source_type, title')
      .eq('doc_kind', 'rule')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allDocs.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`  Total rule docs: ${allDocs.length.toLocaleString()}`);

  // ── 2. Load all reference pages and extract cited section numbers ──────────
  console.log('Loading reference pages...');
  const { data: pages } = await supabase
    .from('reference_pages')
    .select('slug, title, status, primary_sources, category');

  const citedSections = new Set<string>();
  const pagesByStatus: Record<string, number> = {};
  for (const page of (pages ?? [])) {
    pagesByStatus[page.status] = (pagesByStatus[page.status] ?? 0) + 1;
    if (['published', 'approved', 'in_review'].includes(page.status)) {
      for (const src of (page.primary_sources as Array<{ section_number: string }> ?? [])) {
        if (src.section_number) citedSections.add(src.section_number);
      }
    }
  }
  // Include draft citations too (for planning visibility)
  const citedIncludingDrafts = new Set<string>(citedSections);
  for (const page of (pages ?? [])) {
    for (const src of (page.primary_sources as Array<{ section_number: string }> ?? [])) {
      if (src.section_number) citedIncludingDrafts.add(src.section_number);
    }
  }

  const totalPages = pages?.length ?? 0;
  const publishedPages = pagesByStatus['published'] ?? 0;

  console.log(`  Total reference pages: ${totalPages}`);
  console.log(`  Published: ${publishedPages} | Approved: ${pagesByStatus['approved']??0} | In review: ${pagesByStatus['in_review']??0} | Draft: ${pagesByStatus['draft']??0}`);

  // ── 3. Overall coverage ────────────────────────────────────────────────────
  const citedCount = citedIncludingDrafts.size;
  const coveragePct = allDocs.length > 0
    ? ((citedCount / allDocs.length) * 100).toFixed(1)
    : '0.0';

  console.log('\n── OVERALL COVERAGE ─────────────────────────────────────────');
  console.log(`  Cited sections (incl. drafts):  ${citedCount.toLocaleString()} / ${allDocs.length.toLocaleString()} (${coveragePct}%)`);
  console.log(`  Uncited rule docs:               ${(allDocs.length - citedCount).toLocaleString()}`);

  // ── 4. By source type ─────────────────────────────────────────────────────
  console.log('\n── BY SOURCE TYPE ───────────────────────────────────────────');
  const byType: Record<string, { total: number; cited: number }> = {};
  for (const d of allDocs) {
    if (!byType[d.source_type]) byType[d.source_type] = { total: 0, cited: 0 };
    byType[d.source_type].total++;
    if (citedIncludingDrafts.has(d.section_number)) byType[d.source_type].cited++;
  }
  for (const [type, { total, cited }] of Object.entries(byType).sort((a,b) => b[1].total - a[1].total)) {
    const pct = ((cited / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(cited/total*20)) + '░'.repeat(20 - Math.round(cited/total*20));
    console.log(`  ${type.padEnd(10)} ${bar}  ${cited.toString().padStart(5)} / ${total.toString().padStart(6)}  (${pct}%)`);
  }

  // ── 5. POMS tier breakdown ─────────────────────────────────────────────────
  console.log('\n── POMS: ADVISOR-RELEVANCE TIERS ────────────────────────────');
  const tierCounts: Record<1|2|3, { total: number; cited: number }> = {
    1: {total:0,cited:0},
    2: {total:0,cited:0},
    3: {total:0,cited:0},
  };
  for (const d of allDocs.filter(d => d.source_type === 'poms')) {
    const tier = pomsChapterTier(d.section_number);
    tierCounts[tier].total++;
    if (citedIncludingDrafts.has(d.section_number)) tierCounts[tier].cited++;
  }
  const tierLabels = { 1: 'Tier 1 — High value (draft these)', 2: 'Tier 2 — Moderate', 3: 'Tier 3 — Internal/ops (skip)' };
  for (const tier of [1,2,3] as const) {
    const { total, cited } = tierCounts[tier];
    const pct = total > 0 ? ((cited/total)*100).toFixed(1) : '0.0';
    console.log(`  ${tierLabels[tier]}`);
    console.log(`    ${cited} / ${total} sections cited (${pct}%)`);
  }

  // ── 6. Cluster-level gap analysis (Tier 1 + 2 only) ──────────────────────
  console.log('\n── COVERAGE BY TOPIC CLUSTER ────────────────────────────────');
  console.log('   (Tier 1+2 sections only — internal/ops excluded)\n');

  const clusterMap: Record<string, { total: number; cited: number; tier: number; sections: string[] }> = {};
  for (const d of allDocs) {
    const tier = d.source_type === 'poms'
      ? pomsChapterTier(d.section_number)
      : d.source_type === 'cfr' ? 1 : 1; // CFR + Handbook = tier 1
    if (tier === 3) continue;

    const cluster = sectionCluster(d.section_number);
    if (!clusterMap[cluster]) clusterMap[cluster] = { total: 0, cited: 0, tier, sections: [] };
    clusterMap[cluster].total++;
    if (citedIncludingDrafts.has(d.section_number)) {
      clusterMap[cluster].cited++;
    } else {
      clusterMap[cluster].sections.push(d.section_number); // uncited sections
    }
  }

  // Sort: uncited clusters first (most sections = biggest gap), then partially covered
  const sorted = Object.entries(clusterMap)
    .sort((a, b) => {
      const aPct = a[1].cited / a[1].total;
      const bPct = b[1].cited / b[1].total;
      if (aPct === bPct) return b[1].total - a[1].total;
      return aPct - bPct; // most uncovered first
    });

  const GAP_THRESHOLD = 0.5; // clusters less than 50% covered are "gaps"
  const gaps = sorted.filter(([_, {cited, total}]) => cited/total < GAP_THRESHOLD);
  const covered = sorted.filter(([_, {cited, total}]) => cited/total >= GAP_THRESHOLD);

  if (!GAPS_ONLY) {
    console.log('  ⚠️  GAPS (< 50% covered):');
  }
  for (const [cluster, { total, cited, sections }] of (GAPS_ONLY ? gaps : sorted)) {
    const pct = ((cited/total)*100).toFixed(0);
    const status = cited === 0 ? '  0%' : `${pct.padStart(3)}%`;
    const indicator = cited === 0 ? '🔴' : cited/total < 0.25 ? '🟡' : '🟢';
    console.log(`  ${indicator} ${status}  ${cluster}  (${cited}/${total} sections)`);
    if (cited === 0 && sections.length > 0 && !GAPS_ONLY) {
      const sample = sections.slice(0, 3).join(', ');
      const more = sections.length > 3 ? ` +${sections.length - 3} more` : '';
      console.log(`        Sample uncited: ${sample}${more}`);
    }
  }

  // ── 7. Suggested next drafts ───────────────────────────────────────────────
  console.log('\n── SUGGESTED NEXT DRAFTS ────────────────────────────────────');
  console.log('   (Largest uncovered Tier 1 clusters — highest advisor value)\n');

  const suggestions = sorted
    .filter(([_, {cited, tier}]) => cited === 0 && tier === 1)
    .sort((a,b) => b[1].total - a[1].total)
    .slice(0, 8);

  if (suggestions.length === 0) {
    console.log('  ✅ All Tier 1 clusters have at least some coverage!');
  } else {
    suggestions.forEach(([cluster, {total, sections}], i) => {
      console.log(`  ${i+1}. ${cluster}`);
      console.log(`     ${total} sections — sample: ${sections.slice(0,3).join(', ')}`);
    });
  }

  // ── 8. Summary ────────────────────────────────────────────────────────────
  console.log('\n── SUMMARY ──────────────────────────────────────────────────');
  console.log(`  Total rule docs:      ${allDocs.length.toLocaleString()}`);
  console.log(`  Advisor-relevant:     ${(tierCounts[1].total + tierCounts[2].total).toLocaleString()} (Tier 1+2)`);
  console.log(`  Internal/ops (skip):  ${tierCounts[3].total.toLocaleString()} (Tier 3)`);
  console.log(`  Published pages:      ${publishedPages}`);
  console.log(`  Draft pages:          ${pagesByStatus['draft']??0}`);
  console.log(`  Tier 1 coverage:      ${tierCounts[1].cited} / ${tierCounts[1].total} sections (${tierCounts[1].total > 0 ? ((tierCounts[1].cited/tierCounts[1].total)*100).toFixed(1) : 0}%)`);
  console.log(`  Uncovered Tier 1:     ${tierCounts[1].total - tierCounts[1].cited} sections across ${gaps.filter(([_,{tier}]) => tier===1).length} clusters`);
  console.log('');

  // ── 9. JSON output ────────────────────────────────────────────────────────
  if (JSON_OUT) {
    const report = {
      generated_at: new Date().toISOString(),
      totals: {
        rule_docs: allDocs.length,
        advisor_relevant: tierCounts[1].total + tierCounts[2].total,
        internal_ops: tierCounts[3].total,
        published_pages: publishedPages,
        draft_pages: pagesByStatus['draft'] ?? 0,
        cited_sections: citedCount,
        coverage_pct: parseFloat(coveragePct),
      },
      by_source: byType,
      tier_1: { total: tierCounts[1].total, cited: tierCounts[1].cited },
      tier_2: { total: tierCounts[2].total, cited: tierCounts[2].cited },
      tier_3: { total: tierCounts[3].total, cited: tierCounts[3].cited },
      clusters: Object.fromEntries(
        sorted.map(([cluster, data]) => [cluster, {
          total: data.total,
          cited: data.cited,
          coverage_pct: parseFloat(((data.cited/data.total)*100).toFixed(1)),
          tier: data.tier,
          uncited_sample: data.sections.slice(0, 5),
        }])
      ),
      suggested_next: suggestions.map(([cluster, {total, sections}]) => ({
        cluster,
        section_count: total,
        sample_sections: sections.slice(0, 5),
      })),
    };
    fs.writeFileSync('coverage.json', JSON.stringify(report, null, 2));
    console.log('  📄 coverage.json written\n');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
