/**
 * /admin/leaderboard — Reviewer contribution leaderboard.
 * Shows page approvals + section verifications + suggestions per reviewer.
 * Framing: verified impact and built breadth — never speed.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { getCoverageStats } from '@/lib/coverage-stats';
import DateRangePicker from './DateRangePicker';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NAVY = '#064c7c';
const BEIGE_LIGHT = '#e1ddd2';
const BEIGE_MID   = '#cdc4ad';
const BROWN_DARK  = '#4a3c20';
const G = { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280' };

export const dynamic = 'force-dynamic';

type RangeKey = 'all' | '30d' | '7d';

const RANGE_LABELS: Record<RangeKey, string> = {
  all:  'All Time',
  '30d': 'Last 30 Days',
  '7d':  'Last 7 Days',
};

function sinceDate(range: RangeKey): string | null {
  if (range === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === '7d' ? 7 : 30));
  return d.toISOString();
}

function isoDay(dateStr: string, endOfDay = false): string {
  // Treat the date string as local midnight to avoid UTC-shift surprises.
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
  return dt.toISOString();
}

interface ReviewerStats {
  name: string;
  pages_approved: number;
  rules_covered: number;
  sections_verified: number;
  suggestions_made: number;
  total_contributions: number;
  last_active: string | null;
}

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>;
  return <span style={{ fontSize: 14, fontWeight: 700, color: G.text, width: 28, display: 'inline-block', textAlign: 'center' }}>{rank}</span>;
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 16px', background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: G.text, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range: rangeParam, from: fromParam, to: toParam } = await searchParams;

  // Custom date range takes priority over preset buttons.
  const isCustom = !!(fromParam || toParam);
  const range = (!isCustom && (['all','30d','7d'] as string[]).includes(rangeParam ?? ''))
    ? (rangeParam as RangeKey)
    : 'all';

  const since = isCustom ? (fromParam ? isoDay(fromParam)         : null) : sinceDate(range);
  const until = isCustom ? (toParam   ? isoDay(toParam, true)     : null) : null;

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const { data: reviewer } = await service.from('kb_reviewers').select('display_name').eq('email', user.email).single();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
  }

  // Page approvals per reviewer — include primary_sources to count rules covered
  let approvalsQ = service
    .from('reference_pages')
    .select('approved_by, approved_at, primary_sources')
    .eq('status', 'published')
    .not('approved_by', 'is', null);
  if (since) approvalsQ = approvalsQ.gte('approved_at', since);
  if (until) approvalsQ = approvalsQ.lte('approved_at', until);
  const { data: approvals } = await approvalsQ;

  // Per-reviewer rule sets (for deduplication)
  const rulesPerReviewer = new Map<string, Set<string>>();

  // Section feedback per reviewer (CODEX)
  let sfQ = service.from('section_feedback').select('reviewer_name, feedback_type, created_at');
  if (since) sfQ = sfQ.gte('created_at', since);
  if (until) sfQ = sfQ.lte('created_at', until);
  const { data: sectionFeedback } = await sfQ;

  // AXIOM answer feedback per reviewer
  let afQ = service.from('answer_feedback')
    .select('reviewer_name, feedback_type, created_at')
    .not('reviewer_name', 'is', null);
  if (since) afQ = afQ.gte('created_at', since);
  if (until) afQ = afQ.lte('created_at', until);
  const { data: axiomFeedback } = await afQ;

  // AXIOM verified_answers — rules cited in human-verified AI responses
  let vaQ = service.from('verified_answers').select('answered_by, primary_sources, created_at');
  if (since) vaQ = vaQ.gte('created_at', since);
  if (until) vaQ = vaQ.lte('created_at', until);
  const { data: verifiedAnswers } = await vaQ;

  const AXIOM_AUTHOR_MAP: Record<string, string> = {
    'agent-approved':  'Jason Stanley',
    'human-corrected': 'Jason Stanley',
  };

  // Aggregate
  const statsMap = new Map<string, ReviewerStats>();

  function getOrCreate(name: string): ReviewerStats {
    if (!statsMap.has(name)) {
      statsMap.set(name, { name, pages_approved: 0, rules_covered: 0, sections_verified: 0, suggestions_made: 0, total_contributions: 0, last_active: null });
    }
    return statsMap.get(name)!;
  }

  for (const row of (approvals ?? [])) {
    if (!row.approved_by) continue;
    const s = getOrCreate(row.approved_by);
    s.pages_approved++;
    if (!s.last_active || row.approved_at > s.last_active) s.last_active = row.approved_at;
    // Collect unique rule citations from this page
    if (!rulesPerReviewer.has(row.approved_by)) rulesPerReviewer.set(row.approved_by, new Set());
    const ruleSet = rulesPerReviewer.get(row.approved_by)!;
    for (const src of ((row.primary_sources as any[]) ?? [])) {
      const sn = ((src.section_number ?? src.tag) as string | undefined)?.trim();
      if (sn) ruleSet.add(sn);
    }
  }

  // CODEX section feedback
  for (const row of (sectionFeedback ?? [])) {
    const s = getOrCreate(row.reviewer_name);
    if (row.feedback_type === 'verified') s.sections_verified++;
    else if (row.feedback_type === 'flag') s.suggestions_made++;
    if (!s.last_active || row.created_at > s.last_active) s.last_active = row.created_at;
  }

  // AXIOM answer feedback (approve = verified, correct = suggestion, reject = ignored)
  for (const row of (axiomFeedback ?? [])) {
    if (!row.reviewer_name) continue;
    const s = getOrCreate(row.reviewer_name);
    if (row.feedback_type === 'approve') s.sections_verified++;
    else if (row.feedback_type === 'correct') s.suggestions_made++;
    if (!s.last_active || row.created_at > s.last_active) s.last_active = row.created_at;
  }

  // Also attribute rules from verified_answers (AXIOM-verified responses)
  for (const va of (verifiedAnswers ?? [])) {
    const reviewer = AXIOM_AUTHOR_MAP[va.answered_by] ?? va.answered_by;
    if (!reviewer) continue;
    if (!rulesPerReviewer.has(reviewer)) rulesPerReviewer.set(reviewer, new Set());
    const ruleSet = rulesPerReviewer.get(reviewer)!;
    for (const src of ((va.primary_sources as any[]) ?? [])) {
      const sn = ((src.section_number ?? src.tag) as string | undefined)?.trim();
      if (sn) ruleSet.add(sn);
    }
  }

  // Total unique rules covered system-wide (pages + AXIOM verified answers)
  const allRulesCovered = new Set([...rulesPerReviewer.values()].flatMap(s => [...s]));

  const stats: ReviewerStats[] = [...statsMap.values()]
    .map(s => ({
      ...s,
      rules_covered: rulesPerReviewer.get(s.name)?.size ?? 0,
      total_contributions: s.pages_approved + s.sections_verified + s.suggestions_made,
    }))
    .sort((a, b) =>
      b.rules_covered !== a.rules_covered
        ? b.rules_covered - a.rules_covered
        : b.sections_verified - a.sections_verified
    );

  // Use shared coverage stats for system-wide totals (consistent with other tools)
  const coverageData = await getCoverageStats();

  const totals = {
    pages:       stats.reduce((n, s) => n + s.pages_approved, 0),
    rules:       coverageData.totals.cited_total,   // canonical total from shared source
    verified:    coverageData.verifications.sections,
    axiom_ver:   coverageData.verifications.axiom,
    suggestions: stats.reduce((n, s) => n + s.suggestions_made, 0),
  };

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: NAVY, color: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin/kb-review" style={{ color: '#8dc9ed', textDecoration: 'none', fontSize: 14 }}>← Queue</Link>
          <span style={{ color: '#47a2da' }}>/</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Reviewer Contributions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Preset range buttons */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, overflow: 'hidden' }}>
            {(['all', '30d', '7d'] as RangeKey[]).map(r => (
              <Link
                key={r}
                href={`/admin/leaderboard${r === 'all' ? '' : `?range=${r}`}`}
                style={{
                  padding: '4px 13px', fontSize: 12, fontWeight: !isCustom && range === r ? 700 : 400,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  background: !isCustom && range === r ? 'rgba(255,255,255,.2)' : 'transparent',
                  color: !isCustom && range === r ? '#fff' : '#8dc9ed',
                }}
              >
                {RANGE_LABELS[r]}
              </Link>
            ))}
          </div>
          {/* Custom date range picker */}
          <DateRangePicker from={fromParam} to={toParam} />
          <Link href="/admin/coverage" style={{ color: '#8dc9ed', textDecoration: 'none', fontSize: 13 }}>Coverage ↗</Link>
          <a href="/codex/corpus-cluster.html" style={{ color: '#8dc9ed', textDecoration: 'none', fontSize: 13 }}>Corpus Matrix ↗</a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Framing note */}
        <div style={{ background: BEIGE_LIGHT, border: `1px solid ${BEIGE_MID}`, borderRadius: 8, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: BROWN_DARK, lineHeight: 1.6 }}>
          <strong>What this measures:</strong> verified authority built across our five source corpora (POMS, CFR, CMS, Medicare.gov, SSA Handbook). <strong>Rules covered</strong> counts the unique regulations and guidelines each reviewer has verified — through page approvals (CODEX) and AXIOM response approvals and corrections, both of which cite specific source rules. <strong>Sections verified</strong> tracks granular paragraph/FAQ confirmation. Breadth and quality, not speed.
        </div>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatPill value={totals.pages}       label="Pages published"          color={NAVY} />
          <StatPill value={totals.rules}       label="Rules covered"            color='#1c80bc' />
          <StatPill value={totals.verified}    label="CODEX sections verified"  color='#059669' />
          <StatPill value={totals.axiom_ver}   label="AXIOM responses verified" color='#047857' />
          <StatPill value={totals.suggestions} label="Suggestions made"         color={BROWN_DARK} />
        </div>

        {/* Leaderboard */}
        {stats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: G.text }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, margin: 0 }}>No contributions yet — approve some pages to get started.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text, width: 48 }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Reviewer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Pages Approved</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Rules Covered</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Sections Verified</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Suggestions</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: G.text }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.name} style={{ borderBottom: `1px solid ${G.border}`, background: i === 0 ? '#fafff8' : '#fff' }}>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Medal rank={i + 1} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{s.name}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: NAVY }}>{s.pages_approved}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: '#1c80bc' }}>{s.rules_covered}</span>
                      {s.rules_covered > 0 && (
                        <div style={{ fontSize: 10, color: G.text, marginTop: 2 }}>
                          of ~12,241 relevant
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: '#059669' }}>{s.sections_verified}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: BROWN_DARK }}>{s.suggestions_made}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: G.text, fontSize: 13 }}>
                      {fmtDate(s.last_active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
