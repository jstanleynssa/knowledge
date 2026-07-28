/**
 * /admin/coverage — Knowledge Base corpus coverage report
 *
 * Shows coverage across all ingested sources: POMS, CFR, CMS, Medicare.gov, Handbook.
 * POMS cluster breakdown from coverage.json; live source counts from Supabase.
 */
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NSSA_DARK   = '#13405E';
const G           = { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280' };

export const dynamic = 'force-dynamic';

type Cluster = {
  total: number; cited: number; coverage_pct: number;
  tier: 1 | 2 | 3; label?: string; uncited_sample: string[];
};
type CoverageData = {
  generated_at: string;
  totals: { rule_docs: number; advisor_relevant: number; internal_ops: number; published_pages: number; draft_pages: number; cited_sections: number; coverage_pct: number; };
  clusters: Record<string, Cluster>;
  suggested_next: Array<{ cluster: string; label: string; total: number; sample: string[] }>;
};

const SOURCE_META: Record<string, {
  label: string; color: string; description: string;
  // Estimated % of ingested docs that are advisor-relevant (rules, guidance, coverage info)
  // Excludes: navigational pages, provider billing studies, admin notices, blank/toc docs
  relevancePct: number;
  // What "good coverage" looks like for this source
  targetNote: string;
  // Whether direct citation is the primary value or retrieval depth is
  citationMode: 'primary' | 'retrieval';
}> = {
  poms:     { label: 'POMS',         color: '#1E40AF', description: 'SSA Program Operations Manual System — the authoritative SS rules', relevancePct: 33, targetNote: 'Cover all Tier 1 topic clusters (~40 areas)', citationMode: 'primary' },
  cfr:      { label: 'CFR',          color: '#065F46', description: 'Code of Federal Regulations Title 20 — SS & Medicare law', relevancePct: 90, targetNote: 'Cite key SS/IRMAA regulatory sections', citationMode: 'primary' },
  handbook: { label: 'SSA Handbook', color: '#7C3AED', description: 'Social Security Handbook — plain-language rules', relevancePct: 100, targetNote: 'Cover all major SS benefit topics', citationMode: 'primary' },
  cms:      { label: 'CMS',          color: '#B45309', description: 'CMS.gov — Medicare programs, coverage, enrollment, IRMAA', relevancePct: 8, targetNote: 'Drives Medicare retrieval depth; direct citation grows as Medicare pages are drafted', citationMode: 'retrieval' },
  medicare: { label: 'Medicare.gov', color: '#9D174D', description: 'Medicare.gov — beneficiary plans, apps, enrollment tools', relevancePct: 25, targetNote: 'Drives Medicare retrieval depth; direct citation grows as Medicare pages are drafted', citationMode: 'retrieval' },
};

function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const fill = color ?? (pct === 0 ? '#E5E7EB' : pct < 10 ? '#FCA5A5' : pct < 40 ? '#FCD34D' : '#6EE7B7');
  return (
    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(Math.max(pct, pct > 0 ? 2 : 0), 100)}%`, background: fill, borderRadius: 4, transition: 'width .3s' }} />
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? NSSA_DARK, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: G.text, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default async function CoveragePage() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const { data: reviewer } = await service.from('kb_reviewers').select('display_name').eq('email', user.email).single();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
  }

  // ── 1. Live corpus stats from Supabase ──────────────────────────────────────
  const sourceTypes = ['poms', 'cfr', 'handbook', 'cms', 'medicare'] as const;
  const docCounts: Record<string, number> = {};
  await Promise.all(sourceTypes.map(async t => {
    const { count } = await service.from('source_documents').select('*', { count: 'exact', head: true }).eq('source_type', t);
    docCounts[t] = count ?? 0;
  }));
  const totalDocs = Object.values(docCounts).reduce((s, v) => s + v, 0);

  // ── 2. Published pages & citations ──────────────────────────────────────────
  const [{ count: publishedCount }, { count: inReviewCount }, { count: draftCount }] = await Promise.all([
    service.from('reference_pages').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    service.from('reference_pages').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
    service.from('reference_pages').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  // Count citations per source type from published pages
  const { data: pages } = await service.from('reference_pages').select('primary_sources').eq('status', 'published');
  const allSources = (pages ?? []).flatMap(p => (p.primary_sources as any[] | null) ?? []);
  const citationsBySource: Record<string, number> = { poms: 0, cfr: 0, handbook: 0, cms: 0, medicare: 0, other: 0 };
  for (const s of allSources) {
    const sec: string = s.section_number ?? '';
    if (/^(RS|GN|HI|SI|DI|RM|SM|MS|PR|PS|NL|TN)\s/i.test(sec))    citationsBySource.poms++;
    else if (/^20\s+CFR/i.test(sec))                                  citationsBySource.cfr++;
    else if (/^HBK/i.test(sec))                                       citationsBySource.handbook++;
    else if (/cms\.gov/i.test(sec) || /^CMS/i.test(sec))             citationsBySource.cms++;
    else if (/medicare\.gov/i.test(sec))                               citationsBySource.medicare++;
    else                                                               citationsBySource.other++;
  }
  const totalCitations = allSources.length;

  // ── 3. POMS coverage.json ────────────────────────────────────────────────────
  let pomsCoverage: CoverageData | null = null;
  let pomsError: string | null = null;
  try {
    const jsonPath = path.join(process.cwd(), 'coverage.json');
    pomsCoverage = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as CoverageData;
  } catch {
    pomsError = 'coverage.json not found — run: npx tsx scripts/coverage-report.ts --json';
  }

  const clusters = pomsCoverage ? Object.entries(pomsCoverage.clusters)
    .filter(([, c]) => c.tier <= 2)
    .sort((a, b) => b[1].cited !== a[1].cited ? b[1].cited - a[1].cited : b[1].total - a[1].total) : [];
  const tier1 = clusters.filter(([, c]) => c.tier === 1);
  const tier2 = clusters.filter(([, c]) => c.tier === 2);
  const pomsGeneratedAt = pomsCoverage?.generated_at
    ? new Date(pomsCoverage.generated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: NSSA_DARK, color: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin/kb-review" style={{ color: '#8ECAEE', textDecoration: 'none', fontSize: 14 }}>← Queue</a>
          <span style={{ color: '#4a7fa0' }}>/</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Corpus Coverage</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── Top stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatCard label="Total Source Documents" value={totalDocs.toLocaleString()} sub="across all corpora" />
          <StatCard label="Published Pages" value={publishedCount ?? 0} sub={`${inReviewCount ?? 0} in review · ${draftCount ?? 0} drafts`} color="#059669" />
          <StatCard label="Total Citations" value={totalCitations} sub="in published pages" />
          <StatCard label="POMS Coverage" value={pomsCoverage ? `${pomsCoverage.totals.coverage_pct}%` : '—'} sub="of advisor-relevant sections" />
        </div>

        {/* ── Corpus breakdown ── */}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Corpus Breakdown</h2>
        <p style={{ fontSize: 13, color: G.text, margin: '0 0 16px', lineHeight: 1.5 }}>
          The goal is not to cite every document — it’s to cover the rules and regulations that matter most to advisors.
          POMS, CFR, and the Handbook are the primary citation sources. CMS and Medicare.gov deepen retrieval quality
          and will be directly cited as Medicare/IRMAA pages are drafted.
        </p>
        <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                {['Source', 'Description', 'Docs Ingested', 'Est. Relevant', 'Pages Citing', 'Coverage Goal'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: G.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceTypes.map(t => {
                const meta = SOURCE_META[t];
                const docs = docCounts[t] ?? 0;
                const cites = citationsBySource[t] ?? 0;
                const relevant = Math.round(docs * meta.relevancePct / 100);
                // Pages citing this source = pages with at least one citation from this source
                const pagesCiting = (pages ?? []).filter(p =>
                  ((p.primary_sources as any[]) ?? []).some((s: any) => {
                    const sec: string = s.section_number ?? '';
                    if (t === 'poms')     return /^(RS|GN|HI|SI|DI|RM|SM|MS|PR|PS|NL|TN)\s/i.test(sec);
                    if (t === 'cfr')      return /^20\s+CFR/i.test(sec);
                    if (t === 'handbook') return /^HBK/i.test(sec);
                    if (t === 'cms')      return /cms\.gov/i.test(sec) || /^CMS/i.test(sec);
                    if (t === 'medicare') return /medicare\.gov/i.test(sec);
                    return false;
                  })
                ).length;
                const isPrimary = meta.citationMode === 'primary';
                return (
                  <tr key={t} style={{ borderBottom: `1px solid ${G.border}` }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: meta.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#374151', fontSize: 12, maxWidth: 240 }}>{meta.description}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: NSSA_DARK }}>{docs.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: G.text }}>
                      {isPrimary ? `~${relevant.toLocaleString()}` : <span style={{ fontSize: 11, color: G.text, fontStyle: 'italic' }}>retrieval depth</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 600, color: pagesCiting > 0 ? '#059669' : G.text }}>
                        {pagesCiting > 0 ? `${pagesCiting} page${pagesCiting !== 1 ? 's' : ''}` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: G.text, maxWidth: 220 }}>{meta.targetNote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── POMS cluster breakdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>POMS Citation Coverage</h2>
          {pomsGeneratedAt && <span style={{ fontSize: 12, color: G.text }}>Report generated {pomsGeneratedAt}</span>}
        </div>

        {pomsError ? (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '16px 20px', color: '#92400E', marginBottom: 28 }}>
            <strong>POMS cluster report not available</strong><br />
            <code style={{ fontSize: 12 }}>{pomsError}</code>
          </div>
        ) : pomsCoverage ? (
          <>
            {/* POMS summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <StatCard label="Total POMS Sections" value={pomsCoverage.totals.rule_docs.toLocaleString()} />
              <StatCard label="Advisor-Relevant" value={pomsCoverage.totals.advisor_relevant.toLocaleString()} sub="Tier 1 + 2" />
              <StatCard label="Sections Cited" value={pomsCoverage.totals.cited_sections} />
              <StatCard label="Zero-Coverage Tier 1" value={tier1.filter(([, c]) => c.cited === 0).length} sub="clusters with no pages yet" color="#DC2626" />
            </div>

            {/* Suggested next */}
            {(pomsCoverage.suggested_next?.length ?? 0) > 0 && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '16px 18px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#1E40AF' }}>⚡ Suggested next drafts — largest uncovered Tier 1 clusters</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {pomsCoverage.suggested_next.slice(0, 8).map((s, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #BFDBFE', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: NSSA_DARK }}>{s.cluster}</span>
                      <span style={{ color: G.text, marginLeft: 6 }}>{s.label}</span>
                      <span style={{ color: '#1E40AF', marginLeft: 6, fontWeight: 600 }}>{s.total} sections</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier 1 */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tier 1 — Core Advisor Topics ({tier1.length} clusters)
            </h3>
            <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Cluster', 'Topic', 'Coverage', 'Cited / Total', 'Sample uncited'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: G.text }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tier1.map(([key, c]) => (
                    <tr key={key} style={{ borderBottom: `1px solid ${G.border}` }}>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: NSSA_DARK, whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{key}</td>
                      <td style={{ padding: '9px 14px', color: '#374151', fontSize: 12 }}>{c.label ?? '—'}</td>
                      <td style={{ padding: '9px 14px', width: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}><ProgressBar pct={c.coverage_pct} /></div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.coverage_pct === 0 ? '#9CA3AF' : c.coverage_pct < 10 ? '#DC2626' : '#059669', minWidth: 36, textAlign: 'right' }}>{c.coverage_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', color: G.text, whiteSpace: 'nowrap' }}>{c.cited} / {c.total}</td>
                      <td style={{ padding: '9px 14px', color: G.text, fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                        {c.uncited_sample.slice(0, 3).join(', ')}{c.uncited_sample.length > 3 && '…'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tier 2 */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tier 2 — Moderate Advisor Value ({tier2.length} clusters)
            </h3>
            <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Cluster', 'Topic', 'Coverage', 'Cited / Total'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: G.text }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tier2.map(([key, c]) => (
                    <tr key={key} style={{ borderBottom: `1px solid ${G.border}` }}>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: NSSA_DARK, whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{key}</td>
                      <td style={{ padding: '9px 14px', color: '#374151', fontSize: 12 }}>{c.label ?? '—'}</td>
                      <td style={{ padding: '9px 14px', width: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}><ProgressBar pct={c.coverage_pct} /></div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.coverage_pct === 0 ? '#9CA3AF' : '#059669', minWidth: 36, textAlign: 'right' }}>{c.coverage_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', color: G.text, whiteSpace: 'nowrap' }}>{c.cited} / {c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: 12, color: G.text, textAlign: 'right' }}>
              Refresh POMS report: <code style={{ background: G.bg, padding: '2px 6px', borderRadius: 3 }}>npx tsx scripts/coverage-report.ts --json</code>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
