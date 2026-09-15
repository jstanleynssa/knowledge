/**
 * /admin/axiom-beta — AXIOM Beta engagement + feedback report
 *
 * Single view of all AXIOM beta activity: subscriber engagement,
 * query volume, thumbs ratings, and answer corrections.
 *
 * Protected by proxy.ts (admin session required).
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'AXIOM Beta Report — Admin' };

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string | null;
  status: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_email: string;
  updated_at: string;
}

interface FeedbackRow {
  id: string;
  user_email: string;
  question: string;
  rating: string;
  comment: string | null;
  created_at: string;
}

interface AnswerFeedback {
  id: string;
  question: string;
  feedback_type: string;
  reviewer_name: string | null;
  correction_note: string | null;
  saved_to_verified: boolean | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function trunc(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAll() {
  const sb = createServiceClient();

  const [
    subsRes,
    convsRes,
    queryCountRes,
    feedbackRes,
    queryDateRes,
    answerFeedbackRes,
  ] = await Promise.all([
    // All subscribers
    sb.from('axiom_subscribers')
      .select('id, email, name, role, tier, status, created_at')
      .order('created_at', { ascending: false }),

    // All conversations (just email + updated_at for engagement calc)
    sb.from('axiom_conversations')
      .select('id, user_email, updated_at'),

    // Total query count
    sb.from('axiom_queries')
      .select('id', { count: 'exact', head: true }),

    // All feedback
    sb.from('axiom_feedback')
      .select('id, user_email, question, rating, comment, created_at')
      .order('created_at', { ascending: false }),

    // Query dates for volume chart (last 30 days)
    sb.from('axiom_queries')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),

    // Answer feedback corrections only
    sb.from('answer_feedback')
      .select('id, question, feedback_type, reviewer_name, correction_note, saved_to_verified, created_at')
      .eq('feedback_type', 'correct')
      .order('created_at', { ascending: false }),
  ]);

  if (subsRes.error)         throw new Error(`subscribers: ${subsRes.error.message}`);
  if (convsRes.error)        throw new Error(`conversations: ${convsRes.error.message}`);
  if (feedbackRes.error)     throw new Error(`feedback: ${feedbackRes.error.message}`);
  if (queryDateRes.error)    throw new Error(`queries: ${queryDateRes.error.message}`);
  if (answerFeedbackRes.error) throw new Error(`answer_feedback: ${answerFeedbackRes.error.message}`);

  return {
    subscribers:     (subsRes.data ?? []) as Subscriber[],
    conversations:   (convsRes.data ?? []) as Conversation[],
    totalQueries:    queryCountRes.count ?? 0,
    feedback:        (feedbackRes.data ?? []) as FeedbackRow[],
    queryDates:      (queryDateRes.data ?? []) as { created_at: string }[],
    answerFeedback:  (answerFeedbackRes.data ?? []) as AnswerFeedback[],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AxiomBetaPage() {
  const { subscribers, conversations, totalQueries, feedback, queryDates, answerFeedback } = await fetchAll();

  const G = { text: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  const NSSA = { dark: '#13405E', medium: '#1C80BC', light: '#8ECAEE' };

  // ── Derived stats ────────────────────────────────────────────────────────

  const betaSubs = subscribers.filter(s => s.role === 'subscriber');
  const totalBetaSubs = betaSubs.length;
  const totalConvs = conversations.length;
  const totalFeedback = feedback.length;

  // Engagement map: email → { convCount, lastConvDate, feedbackCount, lastFeedbackDate }
  const convsByEmail = new Map<string, { count: number; latest: string }>();
  for (const c of conversations) {
    const prev = convsByEmail.get(c.user_email);
    if (!prev || c.updated_at > prev.latest) {
      convsByEmail.set(c.user_email, { count: (prev?.count ?? 0) + 1, latest: c.updated_at });
    } else {
      convsByEmail.set(c.user_email, { count: prev.count + 1, latest: prev.latest });
    }
  }

  const feedbackByEmail = new Map<string, { count: number; latest: string }>();
  for (const f of feedback) {
    const prev = feedbackByEmail.get(f.user_email);
    if (!prev || f.created_at > prev.latest) {
      feedbackByEmail.set(f.user_email, { count: (prev?.count ?? 0) + 1, latest: f.created_at });
    } else {
      feedbackByEmail.set(f.user_email, { count: prev.count + 1, latest: prev.latest });
    }
  }

  // Build engagement rows
  const engagementRows = betaSubs.map(s => {
    const convData = convsByEmail.get(s.email);
    const fbData   = feedbackByEmail.get(s.email);
    const convCount   = convData?.count ?? 0;
    const fbCount     = fbData?.count ?? 0;

    let lastActive: string | null = null;
    if (convData?.latest && fbData?.latest) {
      lastActive = convData.latest > fbData.latest ? convData.latest : fbData.latest;
    } else if (convData?.latest) {
      lastActive = convData.latest;
    } else if (fbData?.latest) {
      lastActive = fbData.latest;
    }

    return { ...s, convCount, fbCount, lastActive };
  }).sort((a, b) => {
    if (!a.lastActive && !b.lastActive) return 0;
    if (!a.lastActive) return 1;
    if (!b.lastActive) return -1;
    return b.lastActive.localeCompare(a.lastActive);
  });

  // ── Query volume by day (last 30 days) ──────────────────────────────────

  const dayMap = new Map<string, number>();
  for (const q of queryDates) {
    const day = q.created_at.slice(0, 10); // YYYY-MM-DD
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const queryByDay = Array.from(dayMap.entries())
    .sort(([a], [b]) => b.localeCompare(a)); // newest first
  const maxDayCount = Math.max(...queryByDay.map(([, n]) => n), 1);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: G.bg,
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${G.border}`,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/admin/kb-review" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ color: G.border }}>|</span>
          <Link href="/admin/axiom-subscribers" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>
            Subscribers
          </Link>
          <span style={{ color: G.border }}>|</span>
          <Link href="/admin/axiom-feedback" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>
            Feedback
          </Link>
          <span style={{ color: G.border }}>|</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
            AXIOM Beta Report
          </h1>
        </div>
        <span style={{ fontSize: 13, color: G.text }}>
          <strong style={{ color: '#111827' }}>{totalBetaSubs}</strong> beta subscriber{totalBetaSubs !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>

        {/* ── 1. Stats strip ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 36, flexWrap: 'wrap' }}>
          {[
            { label: 'Beta Subscribers', value: totalBetaSubs, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
            { label: 'Total Queries',    value: totalQueries,  color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
            { label: 'Conversations',    value: totalConvs,    color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD' },
            { label: 'Feedback Ratings', value: totalFeedback, color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '16px 24px',
              borderRadius: 10,
              background: s.bg,
              border: `1px solid ${s.border}`,
              flex: '1 1 180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── 2. Subscriber engagement table ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
            Subscriber Engagement
          </h2>

          {engagementRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: G.text, background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10 }}>
              No beta subscribers yet.
            </div>
          ) : (
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Name', 'Email', 'Signed Up', 'Conversations', 'Feedback Given', 'Last Active'].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 14px', textAlign: i >= 3 ? 'center' : 'left',
                        fontSize: 11, fontWeight: 700, color: G.text,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engagementRows.map((row, i) => (
                    <tr key={row.id} style={{
                      borderBottom: i < engagementRows.length - 1 ? `1px solid #F3F4F6` : 'none',
                      background: '#fff',
                      verticalAlign: 'middle',
                    }}>
                      <td style={{ padding: '12px 14px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>
                        {row.name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: G.text, fontSize: 12 }}>
                        {row.email}
                      </td>
                      <td style={{ padding: '12px 14px', color: G.text, whiteSpace: 'nowrap' }}>
                        {fmtShort(row.created_at)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          minWidth: 28, padding: '2px 8px', borderRadius: 10,
                          background: row.convCount > 0 ? '#DBEAFE' : G.bg,
                          color: row.convCount > 0 ? '#1E40AF' : G.text,
                          fontWeight: row.convCount > 0 ? 700 : 400,
                          fontSize: 13,
                        }}>
                          {row.convCount}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          minWidth: 28, padding: '2px 8px', borderRadius: 10,
                          background: row.fbCount > 0 ? '#FEF3C7' : G.bg,
                          color: row.fbCount > 0 ? '#92400E' : G.text,
                          fontWeight: row.fbCount > 0 ? 700 : 400,
                          fontSize: 13,
                        }}>
                          {row.fbCount}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: row.lastActive ? '#111827' : '#D1D5DB', whiteSpace: 'nowrap' }}>
                        {row.lastActive ? fmtShort(row.lastActive) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 3. Query volume by date ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
            Query Volume — Last 30 Days
            <span style={{ fontSize: 13, fontWeight: 400, color: G.text, marginLeft: 10 }}>
              ({queryDates.length} total)
            </span>
          </h2>

          {queryByDay.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: G.text, background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10 }}>
              No queries in the last 30 days.
            </div>
          ) : (
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Date', 'Queries', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: G.text,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryByDay.map(([day, count], i) => {
                    const barPct = Math.round((count / maxDayCount) * 100);
                    const date = new Date(day + 'T12:00:00Z');
                    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                    return (
                      <tr key={day} style={{
                        borderBottom: i < queryByDay.length - 1 ? `1px solid #F3F4F6` : 'none',
                        background: '#fff',
                        verticalAlign: 'middle',
                      }}>
                        <td style={{ padding: '9px 14px', color: '#374151', whiteSpace: 'nowrap', width: 140 }}>
                          {label}
                        </td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: NSSA.dark, width: 60 }}>
                          {count}
                        </td>
                        <td style={{ padding: '9px 14px 9px 0' }}>
                          <div style={{
                            height: 16, borderRadius: 4,
                            background: NSSA.light,
                            width: `${barPct}%`,
                            minWidth: count > 0 ? 6 : 0,
                            maxWidth: '100%',
                          }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 4. Feedback log ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
            Feedback Log
            <span style={{ fontSize: 13, fontWeight: 400, color: G.text, marginLeft: 10 }}>
              ({feedback.length} ratings)
            </span>
          </h2>

          {feedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: G.text, background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10 }}>
              No feedback yet.
            </div>
          ) : (
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Date', '', 'Question', 'Comment', 'User'].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: G.text,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((row, i) => (
                    <tr key={row.id} style={{
                      borderBottom: i < feedback.length - 1 ? `1px solid #F3F4F6` : 'none',
                      background: '#fff',
                      verticalAlign: 'top',
                    }}>
                      <td style={{ padding: '11px 14px', color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmtShort(row.created_at)}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 18, whiteSpace: 'nowrap' }}>
                        {row.rating === 'positive' ? '👍' : '👎'}
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 360, color: '#111827', fontWeight: 500 }}>
                        {trunc(row.question, 80)}
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 260, color: G.text, fontStyle: 'italic' }}>
                        {row.comment ? `"${trunc(row.comment, 100)}"` : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px', color: G.text, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {row.user_email.split('@')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 5. Answer corrections ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
            Answer Corrections
            <span style={{ fontSize: 13, fontWeight: 400, color: G.text, marginLeft: 10 }}>
              ({answerFeedback.length} correction{answerFeedback.length !== 1 ? 's' : ''})
            </span>
          </h2>

          {answerFeedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: G.text, background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10 }}>
              No answer corrections yet.
            </div>
          ) : (
            <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                    {['Date', 'Reviewer', 'Question', 'Correction Note', 'Saved'].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 14px', textAlign: i === 4 ? 'center' : 'left',
                        fontSize: 11, fontWeight: 700, color: G.text,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {answerFeedback.map((row, i) => (
                    <tr key={row.id} style={{
                      borderBottom: i < answerFeedback.length - 1 ? `1px solid #F3F4F6` : 'none',
                      background: '#fff',
                      verticalAlign: 'top',
                    }}>
                      <td style={{ padding: '11px 14px', color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmtShort(row.created_at)}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {row.reviewer_name || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 300, color: '#111827', fontWeight: 500 }}>
                        {trunc(row.question, 80)}
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 320, color: G.text, fontStyle: 'italic' }}>
                        {row.correction_note
                          ? `"${trunc(row.correction_note, 120)}"`
                          : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 16 }}>
                        {row.saved_to_verified ? '✅' : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
