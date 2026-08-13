/**
 * /admin/roadmap — CODEX Content Roadmap
 *
 * Prioritized topic clusters ranked by SEO opportunity score.
 * Sources: Moz Keyword Explorer (871 keywords) + Google Search Console.
 * Cross-referenced against published/in-review CODEX pages.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import roadmapData from './roadmap-data.json';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NSSA = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' };
const G    = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };

const TIER_META = {
  P1: { label: 'Priority 1', color: '#dc2626', bg: '#fee2e2', desc: 'Build now — highest ROI' },
  P2: { label: 'Priority 2', color: '#d97706', bg: '#fef3c7', desc: 'Second wave' },
  P3: { label: 'Priority 3', color: '#6b7280', bg: '#f3f4f6', desc: 'Future' },
} as const;

type Tier = keyof typeof TIER_META;

interface Keyword {
  keyword: string;
  volume: number;
  rank: number;
  difficulty: number;
}

interface Cluster {
  name: string;
  tier: Tier;
  kw_count: number;
  volume: number;
  avg_rank: number;
  avg_diff: number;
  score: number;
  top_keywords: Keyword[];
}

function DiffBar({ value }: { value: number }) {
  const color = value < 35 ? '#16a34a' : value < 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: G.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 24 }}>{value}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color = rank <= 10 ? '#16a34a' : rank <= 20 ? '#2563eb' : rank <= 30 ? '#d97706' : G.text;
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color }}>
      {rank > 0 ? `#${rank}` : '—'}
    </span>
  );
}

function Vol({ n }: { n: number }) {
  return <span>{n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString()}</span>;
}

export default async function RoadmapPage() {
  // Auth
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin/roadmap');

  const supabase = createServiceClient();

  // Load ALL pages (including drafts) to show real coverage per cluster
  const { data: pages } = await supabase
    .from('reference_pages')
    .select('id, title, slug, status, category')
    .order('status');

  // Explicit slug → cluster mapping (ground-truth, not heuristic)
  const SLUG_TO_CLUSTER: Record<string, string> = {
    'wep-explained':                   'WEP & Fairness Act',
    'government-pension-offset':       'WEP & Fairness Act',
    'earnings-test':                   'Earnings Test & Garnishment',
    'working-while-collecting':        'Earnings Test & Garnishment',
    'spousal-benefits-deemed-filing':  'Spousal & Deemed Filing',
    'divorced-spouse-benefits':        'Spousal & Deemed Filing',
    'deemed-filing':                   'Spousal & Deemed Filing',
    'social-security-taxation':        'SS Tax & Withholding',
    'social-security-credits':         'Credits & Earnings Record',
    'full-retirement-age':             'Filing Age & FRA',
    'primary-insurance-amount':        'Filing Age & FRA',
    'delayed-retirement-credits':      'Delayed Retirement Credits',
    'survivor-benefits':               'Survivor Benefits',
    'widow-vs-own-retirement':         'Survivor Benefits',
    'survivor-benefits-children':      'Survivor Benefits',
    'family-maximum-benefit':          'Benefits for Others',
    'ssdi-eligibility':                'Disability & SSDI',
    'irmaa':                           'IRMAA',
    'irmaa-income-thresholds':         'IRMAA',
    'irmaa-magi-income':               'IRMAA',
    'irmaa-look-back-period':          'IRMAA',
    'irmaa-form-ssa-44':               'IRMAA',
    'irmaa-life-changing-events':      'IRMAA',
    'irmaa-determination-notice':      'IRMAA',
    'irmaa-part-b-d-premiums':         'IRMAA',
    'medicare-part-a-coverage':        'Medicare Enrollment',
    'medicare-part-b-late-enrollment': 'Medicare Enrollment',
    'benefit-recalculation':           'Filing Age & FRA',
    'appealing-ssa-denial':            'SSA Forms & Procedures',
    'ss-filing-requirements':          'SSA Forms & Procedures',
  };

  // Build per-cluster page list
  const clusterPages: Record<string, { id: string; slug: string; title: string; status: string }[]> = {};
  for (const page of pages ?? []) {
    const cluster = SLUG_TO_CLUSTER[page.slug];
    if (cluster) {
      if (!clusterPages[cluster]) clusterPages[cluster] = [];
      clusterPages[cluster].push({ id: page.id, slug: page.slug, title: page.title, status: page.status });
    }
  }

  const clusters = roadmapData.clusters as Cluster[];
  const tiers = ['P1', 'P2', 'P3'] as Tier[];

  const totalVol   = clusters.reduce((s, c) => s + c.volume, 0);
  const totalKws   = clusters.reduce((s, c) => s + c.kw_count, 0);
  const published  = (pages ?? []).filter(p => p.status === 'published').length;
  const inReview   = (pages ?? []).filter(p => p.status === 'in_review' || p.status === 'approved').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: NSSA.dark, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/admin/kb-review" style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}>← CODEX</Link>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Content Roadmap</h1>
        </div>
        <div style={{ color: NSSA.light, fontSize: 12 }}>
          Data: Moz + GSC · Updated {roadmapData.generated}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Topics Tracked',     value: clusters.length,             color: NSSA.medium },
            { label: 'Monthly Searches',   value: `${(totalVol/1000).toFixed(1)}k`, color: '#7c3aed' },
            { label: 'Keywords Analyzed',  value: totalKws,                    color: '#0891b2' },
            { label: 'CODEX Pages Live',   value: `${published} / ${(pages ?? []).length}`,  color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: G.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* In-progress banner */}
        {inReview > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>⏳</span>
            <span style={{ fontSize: 14, color: '#92400e' }}>
              <strong>{inReview} page{inReview !== 1 ? 's' : ''}</strong> currently in review — <Link href="/admin/kb-review" style={{ color: '#92400e' }}>view queue →</Link>
            </span>
          </div>
        )}

        {/* Tier sections */}
        {tiers.map(tier => {
          const tierClusters = clusters.filter(c => c.tier === tier);
          const meta = TIER_META[tier];
          return (
            <div key={tier} style={{ marginBottom: 40 }}>

              {/* Tier header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 13, color: G.text }}>{meta.desc}</span>
              </div>

              {/* Cluster cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tierClusters.map((cluster, idx) => {
                  const clusterPageList = clusterPages[cluster.name] ?? [] as { id: string; slug: string; title: string; status: string }[];
                  const publishedCount = clusterPageList.filter((p: {status: string}) => p.status === 'published').length;
                  const inReviewCount  = clusterPageList.filter((p: {status: string}) => p.status === 'in_review' || p.status === 'approved').length;
                  const draftCount     = clusterPageList.filter((p: {status: string}) => p.status === 'draft').length;

                  return (
                    <div key={cluster.name} style={{
                      background: '#fff',
                      border: `1px solid ${G.border}`,
                      borderLeft: `4px solid ${meta.color}`,
                      borderRadius: '0 12px 12px 0',
                      padding: '20px 24px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>

                        {/* Left: name + keywords */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{cluster.name}</span>
                            {publishedCount > 0 && (
                              <span style={{ background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                                ✓ {publishedCount} published
                              </span>
                            )}
                            {inReviewCount > 0 && (
                              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                                ⏳ {inReviewCount} in review
                              </span>
                            )}
                            {draftCount > 0 && (
                              <span style={{ background: G.bg, color: G.text, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                                {draftCount} draft{draftCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {/* Page list */}
                          {clusterPageList.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                              {clusterPageList.map(p => (
                                <Link key={p.slug} href={`/admin/kb-review/${p.id}`}
                                  style={{
                                    fontSize: 11, color: p.status === 'published' ? '#065f46' : p.status === 'in_review' || p.status === 'approved' ? '#92400e' : G.text,
                                    background: p.status === 'published' ? '#f0fdf4' : p.status === 'in_review' || p.status === 'approved' ? '#fffbeb' : G.bg,
                                    border: `1px solid ${p.status === 'published' ? '#bbf7d0' : p.status === 'in_review' || p.status === 'approved' ? '#fde68a' : G.border}`,
                                    borderRadius: 6, padding: '2px 8px', textDecoration: 'none', fontWeight: 600,
                                  }}>
                                  {p.title}
                                </Link>
                              ))}
                            </div>
                          )}
                          {/* Top keyword chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {cluster.top_keywords.map(kw => (
                              <div key={kw.keyword} style={{
                                background: G.bg,
                                border: `1px solid ${G.border}`,
                                borderRadius: 6,
                                padding: '3px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}>
                                <span style={{ fontSize: 12, color: '#374151' }}>{kw.keyword}</span>
                                <span style={{ fontSize: 11, color: G.text }}>
                                  <Vol n={kw.volume} />
                                  {kw.rank > 0 && <span style={{ marginLeft: 4, color: kw.rank <= 10 ? '#16a34a' : kw.rank <= 20 ? '#2563eb' : G.text }}>#{kw.rank}</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 80px)', gap: 12, flexShrink: 0 }}>
                          {[
                            { label: 'Vol/mo',    value: <><Vol n={cluster.volume} /></>, },
                            { label: 'Keywords',  value: cluster.kw_count },
                            { label: 'Avg Rank',  value: <RankBadge rank={cluster.avg_rank} /> },
                            { label: 'Difficulty', value: <DiffBar value={cluster.avg_diff} /> },
                          ].map(m => (
                            <div key={m.label} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{m.value}</div>
                              <div style={{ fontSize: 10, color: G.text, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{m.label}</div>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Draft button for P1 topics without any page yet */}
                      {tier === 'P1' && clusterPageList.length === 0 && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${G.border}` }}>
                          <Link
                            href={`/admin/kb-review?generate=${encodeURIComponent(cluster.name)}`}
                            style={{
                              display: 'inline-block',
                              background: NSSA.medium,
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '6px 14px',
                              borderRadius: 6,
                              textDecoration: 'none',
                            }}
                          >
                            + Draft CODEX page →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer note */}
        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 20, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: G.text, margin: 0 }}>
            Opportunity score = monthly search volume × rank opportunity (positions 1–50) × inverse keyword difficulty.
            Moz data: {roadmapData.generated} · {totalKws} keywords analyzed.
          </p>
        </div>

      </div>
    </div>
  );
}
