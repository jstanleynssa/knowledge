/**
 * lib/coverage-stats.ts
 *
 * Single source of truth for corpus coverage data.
 * Used by: /admin/coverage, /admin/leaderboard, /admin/kb-review (GenerateButton),
 *          /api/admin/coverage-stats (public JSON endpoint → corpus-cluster.html).
 *
 * Definitions
 * ───────────
 * cited_pages   unique section_numbers in primary_sources of published reference_pages
 * cited_axiom   unique section_numbers in primary_sources of verified_answers
 * cited_total   union of both — the complete set of rules humans have explicitly verified
 * relevant      advisor-relevant rules estimated per corpus (POMS from coverage.json; others %)
 */

import { createServiceClient } from './supabase';

export type SourceKey = 'poms' | 'cfr' | 'handbook' | 'cms' | 'medicare';

export interface SourceStat {
  label:       string;
  total_docs:  number;   // all rows in source_documents for this source_type
  relevant:    number;   // estimated advisor-relevant rules
  cited_pages: number;   // unique rules cited in published CODEX pages
  cited_axiom: number;   // unique rules cited in AXIOM verified_answers
  cited_total: number;   // union of cited_pages + cited_axiom
  pct_pages:   number;   // cited_pages / relevant × 100
  pct_total:   number;   // cited_total / relevant × 100
}

export interface CoverageStats {
  sources:       Record<SourceKey, SourceStat>;
  totals: {
    docs:         number;
    relevant:     number;
    cited_pages:  number;
    cited_total:  number;
  };
  verifications: {
    sections:     number;   // section_feedback type=verified
    axiom:        number;   // answer_feedback type=approve with reviewer_name
    total:        number;
  };
  generated_at:  string;
}

// ── Relevance estimates ────────────────────────────────────────────────────────
// POMS: from coverage.json (advisor_relevant count).
// Others: percentage of rule_docs that are advisor-relevant (per coverage page meta).
const RELEVANT: Record<SourceKey, number> = {
  poms:     8549,   // from coverage.json generated 2026-07-17
  cfr:      1783,   // 90 % of 1,981 rule docs
  handbook:  860,   // 100 %
  cms:       807,   //  4 % of 20,195 rule docs
  medicare:  242,   // 60 % of 396 rule docs
};

const LABELS: Record<SourceKey, string> = {
  poms:     'POMS',
  cfr:      'CFR · 20',
  handbook: 'SSA Handbook',
  cms:      'CMS',
  medicare: 'Medicare.gov',
};

const ALL_SOURCES: SourceKey[] = ['poms', 'cfr', 'handbook', 'cms', 'medicare'];

// ── Section-number → source classifier ────────────────────────────────────────
export function classifySection(sn: string): SourceKey | null {
  if (/^(RS|GN|HI|SI|DI|RM|SM|MS|NL|TN|EM)\s/i.test(sn)) return 'poms';
  if (/^20\s+CFR/i.test(sn) || /^CFR/i.test(sn))           return 'cfr';
  if (/^HBK/i.test(sn))                                      return 'handbook';
  if (/^CMS:/i.test(sn))                                     return 'cms';
  if (/^MCR:/i.test(sn))                                     return 'medicare';
  return null;
}

function extractSections(primarySources: unknown): string[] {
  if (!Array.isArray(primarySources)) return [];
  const out: string[] = [];
  for (const s of primarySources) {
    const sn = ((s as any).section_number ?? (s as any).tag ?? '').trim();
    if (sn) out.push(sn);
  }
  return out;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function getCoverageStats(): Promise<CoverageStats> {
  const sb = createServiceClient();

  // All queries in parallel
  const [
    { data: publishedPages },
    { data: verifiedAnswers },
    { data: sfVerified },
    { data: afApproved },
    ...docCountResults
  ] = await Promise.all([
    sb.from('reference_pages').select('primary_sources').eq('status', 'published'),
    sb.from('verified_answers').select('primary_sources'),
    sb.from('section_feedback').select('id', { count: 'exact', head: false }).eq('feedback_type', 'verified'),
    sb.from('answer_feedback').select('id', { count: 'exact', head: false })
      .eq('feedback_type', 'approve').not('reviewer_name', 'is', null),
    ...ALL_SOURCES.map(src =>
      sb.from('source_documents')
        .select('id', { count: 'exact', head: true })
        .eq('source_type', src)
        .is('superseded_at', null)
    ),
  ]);

  // Doc counts
  const docCounts: Record<SourceKey, number> = {} as Record<SourceKey, number>;
  ALL_SOURCES.forEach((src, i) => {
    docCounts[src] = (docCountResults[i] as any).count ?? 0;
  });

  // Cited rules per source — from published CODEX pages
  const setsPages: Record<SourceKey, Set<string>> = {
    poms: new Set(), cfr: new Set(), handbook: new Set(), cms: new Set(), medicare: new Set(),
  };
  for (const row of (publishedPages ?? [])) {
    for (const sn of extractSections(row.primary_sources)) {
      const src = classifySection(sn);
      if (src) setsPages[src].add(sn);
    }
  }

  // Cited rules per source — from AXIOM verified_answers
  const setsAxiom: Record<SourceKey, Set<string>> = {
    poms: new Set(), cfr: new Set(), handbook: new Set(), cms: new Set(), medicare: new Set(),
  };
  for (const row of (verifiedAnswers ?? [])) {
    for (const sn of extractSections(row.primary_sources)) {
      const src = classifySection(sn);
      if (src) setsAxiom[src].add(sn);
    }
  }

  // Build per-source stats
  const sources = {} as Record<SourceKey, SourceStat>;
  let totalDocs = 0, totalRelevant = 0;
  const allCitedPages = new Set<string>();
  const allCitedTotal = new Set<string>();

  for (const src of ALL_SOURCES) {
    const relevant    = RELEVANT[src];
    const cPages      = setsPages[src].size;
    const cAxiom      = setsAxiom[src].size;
    const union       = new Set([...setsPages[src], ...setsAxiom[src]]);
    const cTotal      = union.size;

    sources[src] = {
      label:       LABELS[src],
      total_docs:  docCounts[src],
      relevant,
      cited_pages: cPages,
      cited_axiom: cAxiom,
      cited_total: cTotal,
      pct_pages:   relevant > 0 ? (cPages / relevant) * 100 : 0,
      pct_total:   relevant > 0 ? (cTotal / relevant) * 100 : 0,
    };

    totalDocs     += docCounts[src];
    totalRelevant += relevant;
    [...setsPages[src]].forEach(s => allCitedPages.add(s));
    [...union].forEach(s => allCitedTotal.add(s));
  }

  return {
    sources,
    totals: {
      docs:        totalDocs,
      relevant:    totalRelevant,
      cited_pages: allCitedPages.size,
      cited_total: allCitedTotal.size,
    },
    verifications: {
      sections: sfVerified?.length ?? 0,
      axiom:    afApproved?.length ?? 0,
      total:   (sfVerified?.length ?? 0) + (afApproved?.length ?? 0),
    },
    generated_at: new Date().toISOString(),
  };
}
