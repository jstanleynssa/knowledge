'use client';

import { useState } from 'react';
import type { QueuedTopic } from '@/lib/topic-queue';

const NSSA_DARK  = '#13405E';
const NSSA_MED   = '#1C80BC';
const G = { text: '#6b7280', border: '#e5e7eb', bg: '#f9fafb' };

type Mode = 'queue' | 'custom';

interface Props {
  /** Ungenerated topics from the queue, filtered to what this reviewer can see. */
  topics: QueuedTopic[];
}

export function GenerateButton({ topics }: Props) {
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState<Mode>('queue');
  const [catFilter, setCatFilter] = useState<'all' | 'social-security' | 'irmaa'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Custom topic fields
  const [customTitle,    setCustomTitle]    = useState('');
  const [customTopic,    setCustomTopic]    = useState('');
  const [customCategory, setCustomCategory] = useState<'social-security' | 'irmaa'>('social-security');

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const filtered = topics.filter(t => catFilter === 'all' || t.category === catFilter);

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t.slug)));
    }
  }

  function toggle(slug: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  async function submit() {
    setStatus('loading');
    setMessage('');
    try {
      let body: Record<string, unknown>;
      if (mode === 'custom') {
        if (!customTitle.trim() || !customTopic.trim()) {
          setStatus('error');
          setMessage('Please fill in both the title and the topic description.');
          return;
        }
        body = {
          custom: true,
          title:    customTitle.trim(),
          topic:    customTopic.trim(),
          category: customCategory,
        };
      } else {
        const slugs = [...selected];
        if (slugs.length === 0) {
          setStatus('error');
          setMessage('Select at least one topic.');
          return;
        }
        body = { slugs };
      }

      const res  = await fetch('/api/admin/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      setStatus('done');
      setMessage(data.message ?? `Queued ${data.queued?.length ?? 1} page(s). Check the Needs Review tab shortly.`);
      setSelected(new Set());
      setCustomTitle('');
      setCustomTopic('');
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message ?? 'Something went wrong.');
    }
  }

  function reset() {
    setOpen(false);
    setStatus('idle');
    setMessage('');
    setSelected(new Set());
  }

  if (topics.length === 0 && mode !== 'custom') return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setStatus('idle'); setMessage(''); }}
        style={{
          fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 6,
          border: 'none', background: NSSA_DARK, color: '#fff',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        + Generate pages
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={reset} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />

          {/* Panel */}
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 500, maxHeight: '80vh',
            background: '#fff', border: `1px solid ${G.border}`,
            borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            zIndex: 50, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* Panel header */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${G.border}`, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: NSSA_DARK, marginBottom: 10 }}>
                Generate pages
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${G.border}`, borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
                {(['queue', 'custom'] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setStatus('idle'); setMessage(''); }}
                    style={{
                      padding: '5px 16px', fontSize: 13, fontWeight: mode === m ? 700 : 400,
                      border: 'none', cursor: 'pointer',
                      background: mode === m ? NSSA_DARK : '#fff',
                      color: mode === m ? '#fff' : G.text,
                    }}
                  >
                    {m === 'queue' ? `Topic queue (${topics.length})` : 'Custom topic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>

              {/* ── QUEUE MODE ─────────────────────────────────────────── */}
              {mode === 'queue' && (
                <div style={{ padding: '12px 18px' }}>
                  {/* Category filter */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {(['all', 'social-security', 'irmaa'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => { setCatFilter(c); setSelected(new Set()); }}
                        style={{
                          fontSize: 12, padding: '3px 12px', borderRadius: 20,
                          border: `1px solid ${catFilter === c ? NSSA_MED : G.border}`,
                          background: catFilter === c ? NSSA_MED : '#fff',
                          color: catFilter === c ? '#fff' : G.text,
                          cursor: 'pointer', fontWeight: catFilter === c ? 700 : 400,
                        }}
                      >
                        {c === 'all' ? 'All' : c === 'social-security' ? 'Social Security' : 'IRMAA & Medicare'}
                      </button>
                    ))}
                    <button
                      onClick={toggleAll}
                      style={{
                        marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 4,
                        border: `1px solid ${G.border}`, background: G.bg,
                        color: G.text, cursor: 'pointer',
                      }}
                    >
                      {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  {filtered.length === 0 && (
                    <p style={{ fontSize: 13, color: G.text, textAlign: 'center', padding: '16px 0' }}>
                      No ungenerated topics in this category.
                    </p>
                  )}

                  {filtered.map(t => (
                    <label
                      key={t.slug}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                        background: selected.has(t.slug) ? '#EFF6FF' : 'transparent',
                        border: `1px solid ${selected.has(t.slug) ? '#BFDBFE' : 'transparent'}`,
                        marginBottom: 4,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(t.slug)}
                        onChange={() => toggle(t.slug)}
                        style={{ marginTop: 2, flexShrink: 0, accentColor: NSSA_MED }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: G.text, marginTop: 2 }}>{t.topic}</div>
                        <span style={{
                          display: 'inline-block', marginTop: 4,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '1px 7px', borderRadius: 3,
                          background: t.category === 'irmaa' ? '#FEE2E2' : '#DBEAFE',
                          color: t.category === 'irmaa' ? '#7F1D1D' : '#1E40AF',
                        }}>
                          {t.category === 'irmaa' ? 'IRMAA' : 'Social Security'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* ── CUSTOM MODE ────────────────────────────────────────── */}
              {mode === 'custom' && (
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                      Page title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      placeholder="e.g. Social Security and Divorce"
                      style={{
                        width: '100%', fontSize: 13, padding: '7px 10px',
                        borderRadius: 6, border: `1px solid ${G.border}`,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                      Topic / research question
                    </label>
                    <textarea
                      value={customTopic}
                      onChange={e => setCustomTopic(e.target.value)}
                      rows={4}
                      placeholder="Describe what this page should cover — what question does it answer? e.g. 'How does divorce affect Social Security spousal and survivor benefits, and what are the eligibility thresholds?'"
                      style={{
                        width: '100%', fontSize: 13, padding: '7px 10px',
                        borderRadius: 6, border: `1px solid ${G.border}`,
                        boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                      Category
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['social-security', 'irmaa'] as const).map(c => (
                        <button
                          key={c}
                          onClick={() => setCustomCategory(c)}
                          style={{
                            fontSize: 12, padding: '5px 14px', borderRadius: 20,
                            border: `1px solid ${customCategory === c ? NSSA_MED : G.border}`,
                            background: customCategory === c ? NSSA_MED : '#fff',
                            color: customCategory === c ? '#fff' : G.text,
                            cursor: 'pointer', fontWeight: customCategory === c ? 700 : 400,
                          }}
                        >
                          {c === 'social-security' ? 'Social Security' : 'IRMAA & Medicare'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding: '12px 18px', borderTop: `1px solid ${G.border}`, flexShrink: 0, background: G.bg }}>
              {message && (
                <div style={{
                  fontSize: 12, marginBottom: 10, padding: '7px 10px', borderRadius: 6,
                  background: status === 'error' ? '#FEE2E2' : '#D1FAE5',
                  color: status === 'error' ? '#7F1D1D' : '#065F46',
                }}>
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: G.text }}>
                  {mode === 'queue' && selected.size > 0 && `${selected.size} topic${selected.size !== 1 ? 's' : ''} selected`}
                  {mode === 'queue' && selected.size === 0 && 'Select topics above'}
                  {mode === 'custom' && 'Will generate 1 page'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={reset}
                    style={{
                      fontSize: 13, padding: '6px 14px', borderRadius: 6,
                      border: `1px solid ${G.border}`, background: '#fff',
                      color: G.text, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={status === 'loading' || status === 'done'}
                    style={{
                      fontSize: 13, fontWeight: 700, padding: '6px 18px', borderRadius: 6,
                      border: 'none',
                      background: (status === 'loading' || status === 'done') ? '#9CA3AF' : NSSA_DARK,
                      color: '#fff',
                      cursor: (status === 'loading' || status === 'done') ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {status === 'loading' ? 'Generating…' : status === 'done' ? '✓ Queued' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
