/**
 * /admin/db-health — NSSA Knowledge Base Database Health Dashboard
 *
 * Shows:
 *  - Source document counts by source type, doc kind, embedding state, last scrape
 *  - Chunk / embedding coverage
 *  - KB reference page counts by status
 *  - Live ingest + embedder progress (via IngestProgress client component)
 */

import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { IngestProgress } from './IngestProgress';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NSSA_DARK   = '#13405E';
const NSSA_MED    = '#1C80BC';
const NSSA_LIGHT  = '#8ECAEE';
const G           = { bg: '#F9FAFB', border: '#E5E7EB', text: '#6B7280' };

export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      padding: '16px 20px', background: '#fff', borderRadius: 8,
      border: '1px solid #E5E7EB', borderTop: `3px solid ${accent ?? NSSA_MED}`,
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: NSSA_DARK }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: NSSA_DARK, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: G.text, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bg, color }}>
      {label}
    </span>
  );
}

function ProgressBar({ pct, color = NSSA_MED }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(Math.max(pct, pct > 0 ? 1 : 0), 100)}%`,
        background: color,
        borderRadius: 99,
      }} />
    </div>
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

const SOURCE_META: Record<string, { label: string; color: string; urlIndex: number | null; note?: string }> = {
  poms:      { label: 'POMS (ssa.gov)',     color: NSSA_MED,  urlIndex: 16999, note: '15,566 rule + 1,284 toc' },
  cms:       { label: 'CMS.gov',            color: '#2563EB', urlIndex: 24490 },
  medicare:  { label: 'Medicare.gov',       color: '#7C3AED', urlIndex: 406   },
  cfr:       { label: 'CFR (ecfr.gov)',     color: '#D97706', urlIndex: null  },
  handbook:  { label: 'Handbook (ssa.gov)', color: '#059669', urlIndex: null  },
};

const PAGE_STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: 'Draft',        bg: G.bg,      color: '#374151' },
  in_review:  { label: 'Needs Review', bg: '#FEF3C7', color: '#92400E' },
  approved:   { label: 'Approved',     bg: '#D1FAE5', color: '#065F46' },
  published:  { label: 'Published',    bg: '#DBEAFE', color: '#1E40AF' },
  superseded: { label: 'Superseded',   bg: '#FEE2E2', color: '#7F1D1D' },
  retired:    { label: 'Retired',      bg: G.bg,      color: G.text    },
};

async function fetchStats() {
  const sb = createServiceClient();

  // ── Per-source counts via individual COUNT queries (avoids 1000-row default limit) ──
  const SOURCES = ['poms', 'cms', 'medicare', 'cfr', 'handbook'] as const;
  const KINDS   = ['rule', 'empty', 'toc'] as const;

  type SourceStat = { total: number; rule: number; empty: number; toc: number; lastScrape: string | null };
  const sourceMap: Record<string, SourceStat> = {};

  await Promise.all(SOURCES.map(async (src) => {
    // Total active
    const { count: total } = await sb
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', src)
      .is('superseded_at', null);

    // Per-kind counts
    const kindCounts = await Promise.all(KINDS.map(kind =>
      sb.from('source_documents')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', src)
        .eq('doc_kind', kind)
        .is('superseded_at', null)
        .then(r => ({ kind, count: r.count ?? 0 }))
    ));

    // Most recent scrape date (get one row ordered desc)
    const { data: latest } = await sb
      .from('source_documents')
      .select('scrape_date')
      .eq('source_type', src)
      .is('superseded_at', null)
      .order('scrape_date', { ascending: false })
      .limit(1);

    const kc = Object.fromEntries(kindCounts.map(k => [k.kind, k.count]));
    sourceMap[src] = {
      total:      total ?? 0,
      rule:       kc['rule']  ?? 0,
      empty:      kc['empty'] ?? 0,
      toc:        kc['toc']   ?? 0,
      lastScrape: latest?.[0]?.scrape_date ?? null,
    };
  }));

  const totalDocs = SOURCES.reduce((sum, s) => sum + (sourceMap[s]?.total ?? 0), 0);
  const ruleDocs  = SOURCES.reduce((sum, s) => sum + (sourceMap[s]?.rule  ?? 0), 0);

  // ── Chunk / embedding coverage ────────────────────────────────────────────
  const { count: totalChunks } = await sb
    .from('source_chunks')
    .select('*', { count: 'exact', head: true });

  // Distinct embedded docs via RPC or a count on chunks grouped — use a
  // dedicated count query on docs that have chunks (join not available via
  // PostgREST, so we count chunk rows and estimate; use a smarter query if RPC available)
  // For now: count docs with at least one chunk by querying distinct source_document_ids.
  // We page through in batches to avoid the 1000-row cap.
  const embeddedIds = new Set<string>();
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from('source_chunks')
      .select('source_document_id')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    data.forEach(r => embeddedIds.add(r.source_document_id));
    if (data.length < 1000) break;
    offset += 1000;
  }
  const uniqueEmbedded = embeddedIds.size;
  const embeddedPct = ruleDocs > 0 ? Math.round((uniqueEmbedded / ruleDocs) * 100) : 0;

  // ── Superseded docs ───────────────────────────────────────────────────────
  const { count: supersededDocs } = await sb
    .from('source_documents')
    .select('*', { count: 'exact', head: true })
    .not('superseded_at', 'is', null);

  // ── KB reference pages by status ─────────────────────────────────────────
  const { data: pageRows } = await sb
    .from('reference_pages')
    .select('status, category')
    .limit(2000);

  const pagesByStatus: Record<string, number> = {};
  const pagesByCategory: Record<string, number> = {};
  for (const p of pageRows ?? []) {
    pagesByStatus[p.status]     = (pagesByStatus[p.status]     ?? 0) + 1;
    pagesByCategory[p.category] = (pagesByCategory[p.category] ?? 0) + 1;
  }
  const totalPages = (pageRows ?? []).length;

  return {
    sourceMap, totalDocs, totalChunks: totalChunks ?? 0, uniqueEmbedded,
    ruleDocs, embeddedPct, supersededDocs: supersededDocs ?? 0,
    pagesByStatus, pagesByCategory, totalPages,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DbHealthPage() {
  // Auth gate
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect('/admin/login');

  const stats = await fetchStats();
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: NSSA_MED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            NSSA Knowledge Base
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: NSSA_DARK, margin: 0 }}>Database Health</h1>
        </div>
        <div style={{ fontSize: 12, color: G.text }}>As of {now}</div>
      </div>

      {/* Top-line stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Source Documents" value={stats.totalDocs} sub="active (not superseded)" />
        <StatCard label="Embedded Chunks"  value={stats.totalChunks} sub="vectors in source_chunks" accent="#F59E0B" />
        <StatCard label="Embedding Coverage" value={`${stats.embeddedPct}%`} sub={`${stats.uniqueEmbedded.toLocaleString()} of ${stats.ruleDocs.toLocaleString()} rule docs`} accent="#059669" />
        <StatCard label="KB Pages"         value={stats.totalPages} sub={`${stats.pagesByStatus['published'] ?? 0} published`} accent={NSSA_DARK} />
      </div>

      {/* Source breakdown */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: NSSA_DARK, marginBottom: 16 }}>Sources</h2>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: G.bg, borderBottom: '1px solid #E5E7EB' }}>
                {['Source', 'Active Docs', 'Rule', 'Empty / ToC', 'Index Size', 'Ingested %', 'Last Scraped'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: G.text, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(SOURCE_META).map(([key, meta], i) => {
                const s = stats.sourceMap[key];
                // Use rule count for progress (toc pages are nav-only, not content)
                const numerator = s?.rule ?? 0;
                const pct = meta.urlIndex && s ? Math.min(Math.round((numerator / meta.urlIndex) * 100), 100) : null;
                return (
                  <tr key={key} style={{ borderBottom: i < Object.keys(SOURCE_META).length - 1 ? '1px solid #F3F4F6' : undefined }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: NSSA_DARK }}>{meta.label}</div>
                          {meta.note && <div style={{ fontSize: 11, color: G.text, marginTop: 1 }}>{meta.note}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: NSSA_DARK }}>{s?.total.toLocaleString() ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: NSSA_DARK, fontWeight: 500 }}>{s?.rule.toLocaleString() ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: G.text }}>
                      {s ? (
                        <span>
                          {s.empty > 0 && <span style={{ marginRight: 6 }}>{s.empty.toLocaleString()} empty</span>}
                          {s.toc > 0   && <span style={{ color: '#9CA3AF' }}>{s.toc.toLocaleString()} toc</span>}
                          {s.empty === 0 && s.toc === 0 && '—'}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: G.text }}>{meta.urlIndex?.toLocaleString() ?? '—'}</td>
                    <td style={{ padding: '12px 16px', minWidth: 160 }}>
                      {pct !== null ? (
                        <div>
                          <ProgressBar pct={pct} color={meta.color} />
                          <div style={{ fontSize: 11, color: G.text, marginTop: 3 }}>
                            {numerator.toLocaleString()} rule docs · {pct}%
                          </div>
                        </div>
                      ) : <span style={{ color: G.text }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: G.text, fontSize: 13 }}>
                      {s?.lastScrape ?? <span style={{ color: '#D1D5DB' }}>never</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {stats.supersededDocs > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: G.text }}>
            + {stats.supersededDocs.toLocaleString()} superseded (versioned) rows not shown above
          </div>
        )}
      </section>

      {/* KB Pages */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: NSSA_DARK, marginBottom: 16 }}>Knowledge Base Pages</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(PAGE_STATUS_META).map(([status, meta]) => {
            const count = stats.pagesByStatus[status] ?? 0;
            return (
              <div key={status} style={{
                padding: '14px 18px', background: '#fff', borderRadius: 8,
                border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Badge label={meta.label} bg={meta.bg} color={meta.color} />
                <span style={{ fontSize: 22, fontWeight: 700, color: count > 0 ? NSSA_DARK : '#D1D5DB' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        {Object.keys(stats.pagesByCategory).length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 13, color: G.text }}>
            {Object.entries(stats.pagesByCategory).map(([cat, n]) => (
              <span key={cat}><strong style={{ color: NSSA_DARK }}>{n}</strong> {cat}</span>
            ))}
          </div>
        )}
      </section>

      {/* Embedding coverage bar */}
      <section style={{ marginBottom: 32, padding: '20px 24px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NSSA_DARK, margin: 0 }}>Embedding Coverage</h2>
          <span style={{ fontSize: 13, color: G.text }}>{stats.uniqueEmbedded.toLocaleString()} / {stats.ruleDocs.toLocaleString()} rule docs vectorized</span>
        </div>
        <ProgressBar pct={stats.embeddedPct} color="#F59E0B" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: G.text, marginTop: 6 }}>
          <span>{stats.embeddedPct}% embedded</span>
          <span>{(stats.ruleDocs - stats.uniqueEmbedded).toLocaleString()} docs pending embedding</span>
        </div>
      </section>

      {/* Live ingest progress (client component) */}
      <IngestProgress />

      {/* Footer nav */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 24, fontSize: 13 }}>
        {[
          { href: '/admin/kb-review',  label: '← Review Queue' },
          { href: '/admin/coverage',   label: 'Coverage Report' },
          { href: '/admin/leaderboard',label: 'Leaderboard' },
        ].map(({ href, label }) => (
          <a key={href} href={href} style={{ color: NSSA_MED, textDecoration: 'none', fontWeight: 500 }}>{label}</a>
        ))}
      </div>

    </main>
  );
}
