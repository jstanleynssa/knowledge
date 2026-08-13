'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { QueuedTopic } from '@/lib/topic-queue';

export type SourceStats = Record<
  'poms' | 'cfr' | 'handbook' | 'cms' | 'medicare',
  { cited: number; relevant: number; total: number }
>;

const NSSA_DARK  = '#13405E';
const NSSA_MED   = '#1C80BC';
const G = { text: '#6b7280', border: '#e5e7eb', bg: '#f9fafb' };

type Mode = 'queue' | 'custom';

interface Props {
  /** Ungenerated topics from the queue, filtered to what this reviewer can see. */
  topics: QueuedTopic[];
  /** Citation + corpus stats per source, from the page server component. */
  sourceStats?: SourceStats;
}

const PROGRESS_STEPS = [
  'Retrieving relevant source sections…',
  'Retrieving relevant source sections…',
  'Grounding draft in federal law…',
  'Grounding draft in federal law…',
  'Running self-verification…',
  'Saving to review queue…',
];

export function GenerateButton({ topics, sourceStats }: Props) {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState<Mode>('queue');
  const [progressStep, setProgressStep] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, []);
  const [catFilter, setCatFilter] = useState<'all' | 'social-security' | 'irmaa'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Custom topic fields
  const [customTitle,    setCustomTitle]    = useState('');
  const [customTopic,    setCustomTopic]    = useState('');
  const [customCategory, setCustomCategory] = useState<'social-security' | 'irmaa'>('social-security');
  const [customSources,  setCustomSources]  = useState<string[]>([]);

  function toggleSource(src: string) {
    setCustomSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  }

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
    setProgressStep(0);
    // Cycle through progress messages every 20s
    progressTimer.current = setInterval(() => {
      setProgressStep(s => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 20000);
    try {
      let body: Record<string, unknown>;
      if (mode === 'custom') {
        if (!customTitle.trim() || !customTopic.trim()) {
          setStatus('error');
          setMessage('Please fill in both the title and the topic description.');
          return;
        }
        body = {
          custom:   true,
          title:    customTitle.trim(),
          topic:    customTopic.trim(),
          category: customCategory,
          ...(customSources.length > 0 ? { sources: customSources } : {}),
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

      const res  = await fetch('/codex/api/admin/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      if (progressTimer.current) clearInterval(progressTimer.current);
      setStatus('done');
      setSelected(new Set());
      setCustomTitle('');
      setCustomTopic('');

      // Navigate directly to the generated page if we have its ID
      if (data.pageId) {
        setOpen(false);
        router.push(`/admin/kb-review/${data.pageId}`);
      } else {
        setMessage(data.message ?? `Page generated. Check the Needs Review queue.`);
      }
    } catch (e: any) {
      if (progressTimer.current) clearInterval(progressTimer.current);
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
          border: '1px solid #8ECAEE', background: 'transparent', color: '#8ECAEE',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        + Generate Pages
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
                        boxSizing: 'border-box', color: '#111', background: '#fff',
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
                        color: '#111', background: '#fff',
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

                  {/* ── Reference Source picker ─────────────────────────── */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 2 }}>
                      Reference source
                    </label>
                    <p style={{ fontSize: 11, color: G.text, marginBottom: 8, lineHeight: 1.4 }}>
                      Restrict retrieval to specific corpora. Leave all unchecked to use the
                      category default (POMS + CFR + Handbook for SS; all sources for IRMAA).
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {([
                        { key: 'poms'    , label: 'POMS'         },
                        { key: 'cfr'    , label: 'CFR · 20'     },
                        { key: 'handbook', label: 'SSA Handbook' },
                        { key: 'cms'    , label: 'CMS'           },
                        { key: 'medicare', label: 'Medicare.gov' },
                      ] as const).map(({ key, label }) => {
                        const active = customSources.includes(key);
                        const stats  = sourceStats?.[key];
                        const pct    = stats && stats.relevant > 0
                          ? ((stats.cited / stats.relevant) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <button
                            key={key}
                            onClick={() => toggleSource(key)}
                            style={{
                              fontSize: 12, padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${active ? NSSA_DARK : G.border}`,
                              background: active ? NSSA_DARK : '#fff',
                              color: active ? '#fff' : '#374151',
                              cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                              gap: 4, minWidth: 130, textAlign: 'left',
                            }}
                          >
                            {/* Name row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                              {active && <span style={{ fontSize: 10 }}>✓</span>}
                              {label}
                              {stats && (
                                <span style={{
                                  fontSize: 10, fontWeight: 600,
                                  color: active
                                    ? (parseFloat(pct) > 0 ? '#7dd3fc' : 'rgba(255,255,255,.5)')
                                    : (parseFloat(pct) > 0 ? NSSA_MED : G.text),
                                  marginLeft: 2,
                                }}>
                                  {pct}%
                                </span>
                              )}
                            </div>

                            {/* Stats row */}
                            {stats && (
                              <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,.75)' : G.text, lineHeight: 1.3 }}>
                                <span style={{ color: active ? '#7dd3fc' : (stats.cited > 0 ? NSSA_MED : G.text), fontWeight: stats.cited > 0 ? 700 : 400 }}>
                                  {stats.cited} cited
                                </span>
                                {' / '}
                                <span>~{stats.relevant.toLocaleString()} relevant</span>
                              </div>
                            )}

                            {/* Progress bar */}
                            {stats && (
                              <div style={{
                                width: '100%', height: 3, borderRadius: 2,
                                background: active ? 'rgba(255,255,255,.2)' : G.border,
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%', borderRadius: 2,
                                  width: `${Math.min(parseFloat(pct) * 20, 100)}%`,
                                  background: active ? '#7dd3fc' : NSSA_MED,
                                  transition: 'width .3s',
                                }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {customSources.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: NSSA_MED, fontWeight: 600 }}>
                        Retrieving from: {customSources.join(', ')} only
                      </div>
                    )}
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
                    {status === 'loading' ? PROGRESS_STEPS[progressStep] : status === 'done' ? '✓ Done' : 'Generate'}
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
