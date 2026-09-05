/**
 * /admin/axiom-feedback — AXIOM beta subscriber feedback dashboard
 *
 * Shows aggregate quality stats and individual feedback entries.
 * Protected by proxy.ts (admin session required).
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'AXIOM Feedback — Admin' };

interface FeedbackRow {
  id:             string;
  user_email:     string;
  question:       string;
  answer_excerpt: string | null;
  rating:         string;
  comment:        string | null;
  created_at:     string;
}

async function fetchFeedback(): Promise<FeedbackRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_feedback')
    .select('id, user_email, question, answer_excerpt, rating, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as FeedbackRow[];
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtShortEmail(email: string) {
  return email.split('@')[0];
}

export default async function AxiomFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const all = await fetchFeedback();

  const total    = all.length;
  const positive = all.filter(r => r.rating === 'positive').length;
  const negative = all.filter(r => r.rating === 'negative').length;
  const withComment = all.filter(r => r.comment?.trim()).length;
  const pctPositive = total > 0 ? Math.round((positive / total) * 100) : null;

  // Last 7 days
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last7d   = all.filter(r => r.created_at >= cutoff7d).length;

  const rows = filter === 'positive'
    ? all.filter(r => r.rating === 'positive')
    : filter === 'negative'
    ? all.filter(r => r.rating === 'negative')
    : all;

  // Unique submitters
  const uniqueUsers = new Set(all.map(r => r.user_email)).size;

  const G = { text: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/codex/admin/kb-review" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>← Admin</Link>
          <span style={{ color: G.border }}>|</span>
          <Link href="/codex/admin/axiom-subscribers" style={{ fontSize: 13, color: G.text, textDecoration: 'none' }}>Subscribers</Link>
          <span style={{ color: G.border }}>|</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>AXIOM Feedback</h1>
        </div>
        <span style={{ fontSize: 13, color: G.text }}>{uniqueUsers} contributor{uniqueUsers !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>

        {/* ── Stats strip ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Ratings',  value: total,        color: '#374151', bg: '#F3F4F6', border: '#E5E7EB' },
            { label: '👍 Positive',    value: positive,     color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
            { label: '👎 Negative',    value: negative,     color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
            { label: '% Positive',     value: pctPositive !== null ? `${pctPositive}%` : '—', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
            { label: 'With Comment',   value: withComment,  color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD' },
            { label: 'Last 7 Days',    value: last7d,       color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '12px 20px', borderRadius: 8,
              background: s.bg, border: `1px solid ${s.border}`,
              minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: undefined,    label: `All (${total})` },
            { key: 'negative',   label: `👎 Negative (${negative})` },
            { key: 'positive',   label: `👍 Positive (${positive})` },
          ].map(tab => {
            const active = (filter ?? undefined) === tab.key;
            return (
              <Link
                key={tab.label}
                href={tab.key ? `/codex/admin/axiom-feedback?filter=${tab.key}` : '/codex/admin/axiom-feedback'}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: active ? 700 : 400,
                  textDecoration: 'none',
                  background: active ? '#1C80BC' : '#fff',
                  color: active ? '#fff' : G.text,
                  border: `1px solid ${active ? '#1C80BC' : G.border}`,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* ── Table ── */}
        {rows.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 0',
            color: G.text, fontSize: 15,
            background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10,
          }}>
            No feedback yet.{' '}
            {total > 0 && <Link href="/codex/admin/axiom-feedback" style={{ color: '#1C80BC' }}>View all →</Link>}
          </div>
        ) : (
          <div style={{ border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                  {['', 'Question', 'Comment', 'User', 'Date'].map((h, i) => (
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
                {rows.map((row, i) => (
                  <tr key={row.id} style={{
                    borderBottom: i < rows.length - 1 ? `1px solid #F3F4F6` : 'none',
                    background: '#fff',
                    verticalAlign: 'top',
                  }}>
                    {/* Rating */}
                    <td style={{ padding: '12px 14px', fontSize: 18, whiteSpace: 'nowrap' }}>
                      {row.rating === 'positive' ? '👍' : '👎'}
                    </td>

                    {/* Question + answer excerpt */}
                    <td style={{ padding: '12px 14px', maxWidth: 380 }}>
                      <div style={{ fontWeight: 500, color: '#111827', marginBottom: row.answer_excerpt ? 4 : 0 }}>
                        {row.question.slice(0, 120)}{row.question.length > 120 ? '…' : ''}
                      </div>
                      {row.answer_excerpt && (
                        <div style={{ fontSize: 12, color: G.text, lineHeight: 1.5 }}>
                          {row.answer_excerpt.slice(0, 160)}{row.answer_excerpt.length > 160 ? '…' : ''}
                        </div>
                      )}
                    </td>

                    {/* Comment */}
                    <td style={{ padding: '12px 14px', maxWidth: 260 }}>
                      {row.comment ? (
                        <span style={{ color: '#374151', fontStyle: 'italic', lineHeight: 1.5 }}>
                          &ldquo;{row.comment}&rdquo;
                        </span>
                      ) : (
                        <span style={{ color: '#D1D5DB' }}>—</span>
                      )}
                    </td>

                    {/* User */}
                    <td style={{ padding: '12px 14px', color: G.text, whiteSpace: 'nowrap' }}>
                      {fmtShortEmail(row.user_email)}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 14px', color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {fmt(row.created_at)}
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
