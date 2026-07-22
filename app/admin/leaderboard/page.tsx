/**
 * /admin/leaderboard — Reviewer contribution leaderboard.
 * Shows page approvals + section verifications + suggestions per reviewer.
 * Framing: verified impact and built breadth — never speed.
 */
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NAVY = '#064c7c';
const BEIGE_LIGHT = '#e1ddd2';
const BEIGE_MID   = '#cdc4ad';
const BROWN_DARK  = '#4a3c20';
const G = { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280' };

export const dynamic = 'force-dynamic';

interface ReviewerStats {
  name: string;
  pages_approved: number;
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

export default async function LeaderboardPage() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const { data: reviewer } = await service.from('kb_reviewers').select('display_name').eq('email', user.email).single();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
  }

  // Page approvals per reviewer
  const { data: approvals } = await service
    .from('reference_pages')
    .select('approved_by, approved_at')
    .eq('status', 'published')
    .not('approved_by', 'is', null);

  // Section feedback per reviewer
  const { data: feedback } = await service
    .from('section_feedback')
    .select('reviewer_name, feedback_type, created_at');

  // Aggregate
  const statsMap = new Map<string, ReviewerStats>();

  function getOrCreate(name: string): ReviewerStats {
    if (!statsMap.has(name)) {
      statsMap.set(name, { name, pages_approved: 0, sections_verified: 0, suggestions_made: 0, total_contributions: 0, last_active: null });
    }
    return statsMap.get(name)!;
  }

  for (const row of (approvals ?? [])) {
    if (!row.approved_by) continue;
    const s = getOrCreate(row.approved_by);
    s.pages_approved++;
    if (!s.last_active || row.approved_at > s.last_active) s.last_active = row.approved_at;
  }

  for (const row of (feedback ?? [])) {
    const s = getOrCreate(row.reviewer_name);
    if (row.feedback_type === 'verified') s.sections_verified++;
    else if (row.feedback_type === 'flag') s.suggestions_made++;
    if (!s.last_active || row.created_at > s.last_active) s.last_active = row.created_at;
  }

  const stats: ReviewerStats[] = [...statsMap.values()]
    .map(s => ({ ...s, total_contributions: s.pages_approved + s.sections_verified + s.suggestions_made }))
    .sort((a, b) => b.total_contributions - a.total_contributions);

  const totals = {
    pages: stats.reduce((n, s) => n + s.pages_approved, 0),
    verified: stats.reduce((n, s) => n + s.sections_verified, 0),
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
          <a href="/admin/kb-review" style={{ color: '#8dc9ed', textDecoration: 'none', fontSize: 14 }}>← Queue</a>
          <span style={{ color: '#47a2da' }}>/</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Reviewer Contributions</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Framing note */}
        <div style={{ background: BEIGE_LIGHT, border: `1px solid ${BEIGE_MID}`, borderRadius: 8, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: BROWN_DARK, lineHeight: 1.6 }}>
          <strong>What this measures:</strong> verified authority built — every approved page and verified section represents a fact that advisors can rely on. This is about the breadth and quality of knowledge your team has confirmed, not speed.
        </div>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatPill value={totals.pages} label="Pages published" color={NAVY} />
          <StatPill value={totals.verified} label="Sections verified" color='#059669' />
          <StatPill value={totals.suggestions} label="Suggestions made" color={BROWN_DARK} />
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
