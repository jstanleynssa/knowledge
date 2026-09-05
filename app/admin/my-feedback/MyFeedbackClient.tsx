'use client';

import { useState } from 'react';

const NSSA_DARK = '#13405E';
const G = { border: '#E5E7EB', bg: '#F9FAFB', text: '#6B7280' };

type FeedbackRow = {
  id: string;
  page_id: string;
  page_slug: string;
  page_title: string;
  section_type: string;
  section_index: number;
  section_heading: string | null;
  feedback_type: 'verified' | 'flag';
  note: string | null;
  created_at: string;
};

type PageGroup = {
  page_id: string;
  page_slug: string;
  page_title: string;
  entries: FeedbackRow[];
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function FeedbackEntry({ entry, reviewerName }: { entry: FeedbackRow; reviewerName: string }) {
  const [note, setNote] = useState(entry.note ?? '');
  const [feedbackType, setFeedbackType] = useState<'verified' | 'flag'>(entry.feedback_type);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const isDirty = note !== (entry.note ?? '') || feedbackType !== entry.feedback_type;

  async function handleResubmit() {
    setStatus('saving');
    try {
      const res = await fetch('/codex/api/admin/my-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id:         entry.page_id,
          page_slug:       entry.page_slug,
          page_title:      entry.page_title,
          section_type:    entry.section_type,
          section_index:   entry.section_index,
          section_heading: entry.section_heading,
          feedback_type:   feedbackType,
          note,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus('saved');
      setLastSaved(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const sectionLabel = entry.section_heading
    ? entry.section_heading
    : entry.section_type === 'faq'
      ? `FAQ item ${entry.section_index + 1}`
      : `Section ${entry.section_index + 1}`;

  return (
    <div style={{
      border: `1px solid ${feedbackType === 'flag' ? '#FDE68A' : '#BBF7D0'}`,
      borderLeft: `3px solid ${feedbackType === 'flag' ? '#D97706' : '#16A34A'}`,
      borderRadius: 6,
      padding: '14px 16px',
      background: feedbackType === 'flag' ? '#FFFBEB' : '#F0FDF4',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: G.text, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            {entry.section_type === 'faq' ? '💬 FAQ' : '📄 Body'} · {sectionLabel}
          </span>
          <div style={{ fontSize: 11, color: G.text, marginTop: 2, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            Originally submitted {fmtDate(entry.created_at)}
            {lastSaved && <span style={{ color: '#16A34A', marginLeft: 8 }}>· Updated {lastSaved}</span>}
          </div>
        </div>
        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => setFeedbackType('verified')}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              background: feedbackType === 'verified' ? '#16A34A' : '#fff',
              color: feedbackType === 'verified' ? '#fff' : G.text,
              border: `1px solid ${feedbackType === 'verified' ? '#16A34A' : G.border}`,
              fontWeight: 600,
            }}
          >✓ Verified</button>
          <button
            onClick={() => setFeedbackType('flag')}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              background: feedbackType === 'flag' ? '#D97706' : '#fff',
              color: feedbackType === 'flag' ? '#fff' : G.text,
              border: `1px solid ${feedbackType === 'flag' ? '#D97706' : G.border}`,
              fontWeight: 600,
            }}
          >⚑ Suggestion</button>
        </div>
      </div>

      {/* Note editor */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={feedbackType === 'verified' ? 'Add a note (optional)…' : 'Describe the correction needed…'}
        rows={note.length > 120 ? 5 : 3}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6,
          border: `1px solid ${G.border}`, fontSize: 13, fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          resize: 'vertical', color: '#111', background: '#fff', lineHeight: 1.5,
        }}
      />

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <button
          onClick={handleResubmit}
          disabled={status === 'saving'}
          style={{
            padding: '6px 16px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', border: 'none',
            background: isDirty ? NSSA_DARK : '#9CA3AF',
            color: '#fff',
            opacity: status === 'saving' ? 0.7 : 1,
          }}
        >
          {status === 'saving' ? 'Saving…' : 'Resubmit'}
        </button>
        {status === 'saved' && <span style={{ fontSize: 12, color: '#16A34A', fontFamily: 'inherit' }}>✓ Saved</span>}
        {status === 'error' && <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'inherit' }}>Save failed — try again</span>}
        {!isDirty && status === 'idle' && <span style={{ fontSize: 11, color: G.text, fontFamily: 'inherit' }}>No changes</span>}
      </div>
    </div>
  );
}

export function MyFeedbackClient({ reviewerName, pages }: {
  reviewerName: string;
  pages: PageGroup[];
}) {
  const totalEntries = pages.reduce((n, p) => n + p.entries.length, 0);
  const flagCount = pages.reduce((n, p) => n + p.entries.filter(e => e.feedback_type === 'flag').length, 0);
  const verifiedCount = totalEntries - flagCount;

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: NSSA_DARK, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/codex/admin/kb-review" style={{ color: '#93C5FD', textDecoration: 'none', fontSize: 13 }}>← Review Queue</a>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>My Feedback</span>
        </div>
        <span style={{ color: '#93C5FD', fontSize: 13 }}>{reviewerName}</span>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px' }}>
        {/* Summary */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Pages reviewed', value: pages.length, color: NSSA_DARK },
            { label: 'Total feedback', value: totalEntries, color: NSSA_DARK },
            { label: '✓ Verified', value: verifiedCount, color: '#16A34A' },
            { label: '⚑ Suggestions', value: flagCount, color: '#D97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 8, padding: '14px 20px', minWidth: 110 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: G.text, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Explainer */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#1E3A5F' }}>
          Edit your notes and click <strong>Resubmit</strong> to update your feedback on any section. The review team sees your most recent submission.
        </div>

        {pages.length === 0 ? (
          <div style={{ textAlign: 'center', color: G.text, padding: '60px 0', fontSize: 15 }}>
            No feedback submitted yet. Open a page in the review queue to get started.
          </div>
        ) : (
          pages.map(pg => (
            <div key={pg.page_id ?? pg.page_slug} style={{ marginBottom: 32 }}>
              {/* Page header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NSSA_DARK }}>{pg.page_title}</h2>
                <a
                  href={`/codex/admin/kb-review/${pg.page_id}`}
                  style={{ fontSize: 12, color: '#1C80BC', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Open page →
                </a>
              </div>
              {pg.entries.map(entry => (
                <FeedbackEntry key={entry.id} entry={entry} reviewerName={reviewerName} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
