/**
 * /admin/corpus-health — Corpus staleness dashboard
 *
 * Shows:
 *  - Last scrape date per source type
 *  - Sections flagged as changed (pending in corpus_update_log)
 *  - Sections not checked in >90 days (by Tier 1 prefix)
 *  - IRMAA/Medicare annual update status
 *  - Refresh command reference
 */
import Link from 'next/link';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Corpus Health — Admin' };

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const TIER1_PREFIXES = ['RS ', 'GN ', 'HI '];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function staleBadge(days: number | null, warnAt = 90, errorAt = 180) {
  if (days === null) return { label: 'Never checked', color: '#EF4444', bg: '#FEE2E2' };
  if (days >= errorAt) return { label: `${days}d ago`, color: '#991B1B', bg: '#FEE2E2' };
  if (days >= warnAt)  return { label: `${days}d ago`, color: '#92400E', bg: '#FEF3C7' };
  return { label: `${days}d ago`, color: '#065F46', bg: '#D1FAE5' };
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchHealthData() {
  const sb = createServiceClient();

  const [
    { data: sourceTypeSummary },
    { data: pendingChanges },
    { data: neverChecked },
    { data: staleTier1 },
    { data: recentlyRefreshed },
  ] = await Promise.all([
    // Last scrape date and count per source type
    Promise.resolve({ data: null }),
    // Pending change detections
    sb.from('corpus_update_log')
      .select('id, section_number, source_type, old_last_updated, new_last_updated, detected_at')
      .eq('status', 'pending')
      .order('detected_at', { ascending: false })
      .limit(50),
    // Tier 1 sections never checked
    sb.from('source_documents')
      .select('section_number, scrape_date, last_checked', { count: 'exact' })
      .eq('doc_kind', 'rule')
      .is('superseded_at', null)
      .is('last_checked', null)
      .or('section_number.like.RS %,section_number.like.GN %,section_number.like.HI %')
      .limit(10),
    // Tier 1 sections not checked in >90 days
    sb.from('source_documents')
      .select('section_number, last_checked, last_updated')
      .eq('doc_kind', 'rule')
      .is('superseded_at', null)
      .lt('last_checked', new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0])
      .or('section_number.like.RS %,section_number.like.GN %,section_number.like.HI %')
      .order('last_checked', { ascending: true })
      .limit(20),
    // Recently refreshed
    sb.from('corpus_update_log')
      .select('section_number, old_last_updated, new_last_updated, refreshed_at')
      .eq('status', 'refreshed')
      .order('refreshed_at', { ascending: false })
      .limit(20),
  ]);

  // Get per-source-type stats manually since RPC may not exist yet
  const { data: sourceStats } = await sb
    .from('source_documents')
    .select('source_type, scrape_date, last_checked')
    .eq('doc_kind', 'rule')
    .is('superseded_at', null);

  const byType: Record<string, { count: number; latestScrape: string | null; latestChecked: string | null }> = {};
  for (const row of sourceStats ?? []) {
    const t = row.source_type;
    if (!byType[t]) byType[t] = { count: 0, latestScrape: null, latestChecked: null };
    byType[t].count++;
    if (!byType[t].latestScrape || (row.scrape_date ?? '') > byType[t].latestScrape!) {
      byType[t].latestScrape = row.scrape_date;
    }
    if (row.last_checked && (!byType[t].latestChecked || row.last_checked > byType[t].latestChecked!)) {
      byType[t].latestChecked = row.last_checked;
    }
  }

  return { byType, pendingChanges: pendingChanges ?? [], neverChecked: neverChecked ?? [], staleTier1: staleTier1 ?? [], recentlyRefreshed: recentlyRefreshed ?? [] };
}

// ── Page ──────────────────────────────────────────────────────────────────────

const G = { bg: '#F9FAFB', border: '#E5E7EB', text: '#6B7280', dark: '#111827' };

export default async function CorpusHealthPage() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email || user.email !== ADMIN_EMAIL) redirect('/admin/kb-review');

  const { byType, pendingChanges, neverChecked, staleTier1, recentlyRefreshed } = await fetchHealthData();

  const today = new Date();
  const month = today.getMonth() + 1;
  const irmaaWarning = month >= 10;

  const SOURCE_META: Record<string, { label: string; color: string }> = {
    poms:     { label: 'SSA POMS',      color: '#1C80BC' },
    cfr:      { label: '20 CFR',        color: '#D97706' },
    handbook: { label: 'SSA Handbook',  color: '#059669' },
    cms:      { label: 'CMS.gov',       color: '#7C3AED' },
    medicare: { label: 'Medicare.gov',  color: '#DC2626' },
  };

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${G.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/codex/admin/kb-review" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>← Admin</Link>
          <span style={{ color: G.border }}>|</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: G.dark }}>Corpus Health</h1>
        </div>
        <span style={{ fontSize: 12, color: G.text }}>{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>

        {/* IRMAA annual warning */}
        {irmaaWarning && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400E', fontSize: 14 }}>IRMAA Annual Update Due</p>
              <p style={{ margin: '0 0 8px', color: '#92400E', fontSize: 13, lineHeight: 1.6 }}>
                It's October or later. CMS typically announces {today.getFullYear() + 1} IRMAA thresholds in November, effective January 1.
                Run <code style={{ background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>fetch_cms.ts</code> and <code style={{ background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>fetch_medicare.ts</code> as soon as CMS publishes the new brackets.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', opacity: 0.8 }}>Advisors will ask about {today.getFullYear() + 1} thresholds during planning season — outdated answers are a real risk.</p>
            </div>
          </div>
        )}

        {/* Source type summary */}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 12 }}>Corpus Sources</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {Object.entries(SOURCE_META).map(([key, meta]) => {
            const stats = byType[key];
            const scrapeDays = daysAgo(stats?.latestScrape ?? null);
            const checkDays  = daysAgo(stats?.latestChecked ?? null);
            const badge = staleBadge(scrapeDays, 120, 365);
            return (
              <div key={key} style={{ background: '#fff', border: `1px solid ${G.border}`, borderTop: `3px solid ${meta.color}`, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{meta.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: G.dark }}>{(stats?.count ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: G.text, marginTop: 4 }}>rule sections</div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: G.text }}>Last ingested</span>
                    <span style={{ ...badge, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99 }}>{badge.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: G.text }}>Last checked</span>
                    <span style={{ color: checkDays === null ? '#EF4444' : G.text, fontSize: 10 }}>
                      {checkDays === null ? 'Never' : `${checkDays}d ago`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending changes */}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 4 }}>
          🔴 Detected Changes
          {pendingChanges.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: '#991B1B' }}>({pendingChanges.length} pending refresh)</span>}
        </h2>
        <p style={{ fontSize: 12, color: G.text, marginBottom: 12 }}>
          Sections where SSA's "Last Updated" stamp differs from our stored version.
          Run <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>SECTION="..." npx tsx --env-file .env.worker scripts/ingest/refresh-section.ts</code> to refresh individually,
          or <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>--all-pending</code> to refresh all.
        </p>

        {pendingChanges.length === 0 ? (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#065F46' }}>
            ✓ No pending changes detected. Run <code>check-poms-updates.ts</code> weekly to keep this current.
          </div>
        ) : (
          <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: G.bg }}>
                  {['Section', 'Source', 'Our Version', 'SSA Current', 'Detected'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${G.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingChanges.map((row: any, i: number) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : G.bg }}>
                    <td style={{ padding: '9px 14px', fontWeight: 600, color: '#991B1B', fontFamily: 'ui-monospace,monospace', fontSize: 12 }}>{row.section_number}</td>
                    <td style={{ padding: '9px 14px', color: G.text }}>{row.source_type.toUpperCase()}</td>
                    <td style={{ padding: '9px 14px', color: G.text, fontSize: 12 }}>{row.old_last_updated ?? '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#065F46', fontWeight: 600, fontSize: 12 }}>{row.new_last_updated}</td>
                    <td style={{ padding: '9px 14px', color: G.text, fontSize: 11 }}>{new Date(row.detected_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Never checked */}
        {neverChecked.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 4 }}>⚪ Tier 1 Sections — Never Checked</h2>
            <p style={{ fontSize: 12, color: G.text, marginBottom: 12 }}>Advisor-relevant sections (RS, GN, HI) ingested but not yet verified for changes. Run <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>check-poms-updates.ts</code> to start checking these.</p>
            <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: G.text }}>
              {neverChecked.slice(0, 5).map((d: any) => d.section_number).join(' · ')}
              {neverChecked.length > 5 && ` · +${neverChecked.length - 5} more`}
            </div>
          </>
        )}

        {/* Stale Tier 1 */}
        {staleTier1.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 4 }}>🟡 Tier 1 Sections — Stale (&gt;90 days)</h2>
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: G.bg }}>
                    {['Section', 'SSA Last Updated', 'Last Checked'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${G.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staleTier1.map((d: any, i: number) => {
                    const days = daysAgo(d.last_checked);
                    const badge = staleBadge(days, 90, 180);
                    return (
                      <tr key={d.section_number} style={{ background: i % 2 === 0 ? '#fff' : G.bg }}>
                        <td style={{ padding: '8px 14px', fontWeight: 600, color: G.dark, fontFamily: 'ui-monospace,monospace' }}>{d.section_number}</td>
                        <td style={{ padding: '8px 14px', color: G.text }}>{d.last_updated ?? '—'}</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Recently refreshed */}
        {recentlyRefreshed.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 12 }}>✓ Recently Refreshed</h2>
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: G.bg }}>
                    {['Section', 'Old Version', 'New Version', 'Refreshed'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${G.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentlyRefreshed.map((row: any, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : G.bg }}>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: G.dark, fontFamily: 'ui-monospace,monospace' }}>{row.section_number}</td>
                      <td style={{ padding: '8px 14px', color: G.text }}>{row.old_last_updated ?? '—'}</td>
                      <td style={{ padding: '8px 14px', color: '#065F46', fontWeight: 600 }}>{row.new_last_updated}</td>
                      <td style={{ padding: '8px 14px', color: G.text }}>{row.refreshed_at ? new Date(row.refreshed_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Command reference */}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: G.dark, marginBottom: 12 }}>Command Reference</h2>
        <div style={{ background: '#1a2535', borderRadius: 10, padding: '20px 24px', fontFamily: 'ui-monospace,monospace', fontSize: 12, color: '#8EA3B8', lineHeight: 2 }}>
          <div><span style={{ color: '#4A6070' }}># Detect changes (run weekly)</span></div>
          <div style={{ color: '#F0F4F8' }}>npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/check-poms-updates.ts</div>
          <br/>
          <div><span style={{ color: '#4A6070' }}># Refresh a single changed section</span></div>
          <div style={{ color: '#F0F4F8' }}>SECTION=&quot;RS 00615.201&quot; npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/refresh-section.ts</div>
          <br/>
          <div><span style={{ color: '#4A6070' }}># Refresh all pending changes at once</span></div>
          <div style={{ color: '#F0F4F8' }}>npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/refresh-section.ts --all-pending</div>
          <br/>
          <div><span style={{ color: '#4A6070' }}># Annual IRMAA refresh (run each November)</span></div>
          <div style={{ color: '#F0F4F8' }}>npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/fetch_cms.ts</div>
          <div style={{ color: '#F0F4F8' }}>npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/fetch_medicare.ts</div>
        </div>

      </div>
    </div>
  );
}
