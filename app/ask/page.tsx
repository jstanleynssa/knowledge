'use client';

import { useState, useRef, useEffect } from 'react';

const NAVY    = '#0D3B5C';
const SOFT    = '#4A5560';
const RULE    = '#E4E0D7';
const PAPER   = '#FBFAF7';
const CITE    = '#8A5A00';
const CITE_BG = '#F6EEDD';

type Source = { section_number: string; url: string; tag: string };
type SectionUsed = { section_number: string; title: string | null; score: number; source_url?: string };
type Unverified = { value: string; context: string; found_in_uncited?: string };

interface Answer {
  verdict: 'correct' | 'incorrect' | 'partial' | 'no_advice_to_evaluate' | 'uncertain';
  verdict_summary: string;
  answer: string;
  primary_sources: Source[];
  gaps: string[];
  clean_question: string;
  sections_used: SectionUsed[];
  verification: { passed: boolean; unverified: Unverified[] };
}

interface Turn {
  question: string;
  answer: Answer | null;
  loading?: boolean;
  error?: string;
  feedback?: 'approve' | 'correct' | 'reject' | null;
}

const VERDICT_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  correct:               { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', label: '✓ Correct' },
  incorrect:             { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', label: '✗ Incorrect' },
  partial:               { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: '⚠ Partially correct' },
  no_advice_to_evaluate: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'ℹ Reference' },
  uncertain:             { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: '? Uncertain' },
};

const EXAMPLES = [
  "Client is 8 months shy of FRA with a benefit of $3,800 at FRA. SSA office says his spouse is eligible since she is 62 for 50% of his benefit. Is that correct?",
  "62-year-old client wants to file for spousal benefits. Her own benefit is $800/mo, her husband's PIA is $2,400. What should she expect to receive?",
  "What happens to a widow's Social Security benefit if she remarries before age 60?",
  "Client has a $1,200/month government pension from non-covered employment. How will GPO affect her spousal benefit?",
];

function FeedbackBar({ turn, onFeedback }: { turn: Turn; onFeedback: (type: 'approve' | 'correct' | 'reject', note?: string) => void }) {
  const [mode, setMode] = useState<'idle' | 'correcting'>('idle');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const TAG_OPTIONS = ['wrong section', 'wrong value', 'missing rule', 'misread scenario'];
  const BD = '#064c7c'; const BM = '#1c80bc'; const BL = '#e1ddd2';
  const BC = '#cdc4ad'; const BR = '#4a3c20'; const RM = '#b02a34';

  if (turn.feedback) {
    return (
      <div style={{ fontSize: 12, color: turn.feedback === 'approve' ? '#059669' : turn.feedback === 'correct' ? CITE : '#DC2626', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          {turn.feedback === 'approve'
            ? <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
        {turn.feedback === 'approve' ? 'Verified' : turn.feedback === 'correct' ? 'Suggestion saved' : 'Flagged for review'}
      </div>
    );
  }

  if (mode === 'correcting') {
    return (
      <div style={{ marginTop: 10, background: PAPER, border: `1px solid ${RULE}`, borderRadius: 8, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: BD }}>Make a suggestion</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {TAG_OPTIONS.map(t => (
            <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
              style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, border: `1px solid ${tags.includes(t) ? BD : BC}`, background: tags.includes(t) ? BD : '#fff', color: tags.includes(t) ? '#fff' : BR, cursor: 'pointer', fontWeight: tags.includes(t) ? 700 : 400 }}>
              {t}
            </button>
          ))}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Describe your suggestion or what should be corrected…"
          rows={3} style={{ width: '100%', fontSize: 14, color: '#000', padding: '10px 12px', borderRadius: 6, border: `1px solid ${BC}`, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as any, outline: 'none', background: '#fff', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={() => onFeedback('correct', note)} style={{ fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 6, border: 'none', background: BD, color: '#fff', cursor: 'pointer' }}>Save suggestion</button>
          <button onClick={() => onFeedback('reject', note)} style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 6, border: `1px solid ${BC}`, background: '#fff', color: RM, cursor: 'pointer' }}>Flag as wrong</button>
          <button onClick={() => { setMode('idle'); setNote(''); setTags([]); }} style={{ fontSize: 13, color: BR, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
      <button onClick={() => onFeedback('approve')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
        border: `1px solid ${BD}`, background: 'transparent', color: BD, cursor: 'pointer',
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Verify
      </button>
      <button onClick={() => setMode('correcting')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
        border: `1px solid ${BR}`, background: 'transparent', color: BR, cursor: 'pointer',
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Make Suggestion
      </button>
    </div>
  );
}


function AnswerBubble({ turn, onToggle, showSections, onFeedback }: {
  turn: Turn;
  onToggle: () => void;
  showSections: boolean;
  onFeedback: (type: 'approve' | 'correct' | 'reject', note?: string) => void;
}) {
  const a = turn.answer;
  if (!a) return null;
  const vs = VERDICT_STYLE[a.verdict] ?? VERDICT_STYLE.uncertain;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: NAVY, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
      }}>N</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Verdict pill */}
        {a.verdict !== 'no_advice_to_evaluate' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: vs.bg, border: `1px solid ${vs.border}`, borderRadius: 20,
            padding: '4px 12px', marginBottom: 10, fontSize: 12, fontWeight: 700, color: vs.color,
          }}>
            {vs.label}
            {a.verdict_summary && <span style={{ fontWeight: 400, marginLeft: 4 }}>&mdash; {a.verdict_summary}</span>}
          </div>
        )}

        {/* Answer text */}
        <div style={{
          background: '#fff', border: `1px solid ${RULE}`, borderRadius: '4px 16px 16px 16px',
          padding: '18px 22px', fontSize: 16, lineHeight: 1.7, color: '#16202B',
          fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
        }}>
          <style dangerouslySetInnerHTML={{ __html: ANSWER_CSS }} />
        <div className="answer-body" dangerouslySetInnerHTML={{ __html: a.answer }} />
        </div>

        {/* Verification flags */}
        {!a.verification.passed && a.verification.unverified.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 14px', marginTop: 8 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12, color: '#991B1B' }}>
              ⚠ {a.verification.unverified.length} value{a.verification.unverified.length !== 1 ? 's' : ''} could not be verified — treat with caution:
            </p>
            {a.verification.unverified.map((u, i) => (
              <div key={i} style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 3 }}>
                <strong>&ldquo;{u.value}&rdquo;</strong> — {u.context.slice(0, 120)}…
              </div>
            ))}
          </div>
        )}

        {/* Source gaps */}
        {a.gaps.length > 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '10px 14px', marginTop: 8 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 11, color: '#92400E', letterSpacing: '.06em', textTransform: 'uppercase' }}>Source gaps</p>
            {a.gaps.map((g, i) => <p key={i} style={{ margin: 0, fontSize: 13, color: '#78350F' }}>{g}</p>)}
          </div>
        )}

        {/* Citations */}
        {a.primary_sources.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.primary_sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: CITE_BG, border: `1px solid #E8D9B8`, borderRadius: 4,
                padding: '4px 10px', fontSize: 12, color: CITE, textDecoration: 'none', fontWeight: 600,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', background: CITE, padding: '1px 5px', borderRadius: 2 }}>src</span>
                {s.section_number} &rsaquo;
              </a>
            ))}
          </div>
        )}

        {/* Feedback */}
        <FeedbackBar turn={turn} onFeedback={onFeedback} />

        {/* Retrieved sections toggle */}
        <button onClick={onToggle} style={{
          marginTop: 8, fontSize: 11, color: '#9CA3AF', background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
        }}>
          {showSections ? 'Hide' : 'Show'} {a.sections_used.length} retrieved sections
        </button>
        {showSections && (
          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
            {a.sections_used.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0', borderBottom: `1px solid ${RULE}` }}>
                {s.source_url ? (
                  <a href={s.source_url} target="_blank" rel="noopener"
                    style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, color: NAVY, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    {s.section_number} ↗
                  </a>
                ) : (
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, color: SOFT, whiteSpace: 'nowrap' }}>{s.section_number}</span>
                )}
                <span style={{ color: SOFT, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title ?? '(no title)'}</span>
                <span style={{ color: '#D1D5DB', fontSize: 10, whiteSpace: 'nowrap' }}>{s.score.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ANSWER_CSS = `
.answer-body p { margin: 0 0 14px; }
.answer-body p:last-child { margin-bottom: 0; }
.answer-body ul, .answer-body ol { padding-left: 24px; margin: 0 0 14px; }
.answer-body li { margin-bottom: 6px; line-height: 1.6; }
.answer-body li:last-child { margin-bottom: 0; }
.answer-body strong { font-weight: 700; }
.answer-body h3, .answer-body h4 { margin: 16px 0 6px; font-size: 1em; font-weight: 700; color: #0D3B5C; }
.answer-body code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #F3F4F6; padding: 1px 5px; border-radius: 3px; }
`;

export default function AskPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [sectionsOpen, setSectionsOpen] = useState<Record<number, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // Build history for the API from completed turns
  function buildHistory() {
    return turns
      .filter(t => t.answer)
      .flatMap(t => [
        { role: 'user' as const, content: t.question },
        { role: 'assistant' as const, content: t.answer!.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
      ]);
  }

  async function handleFeedback(turnIndex: number, type: 'approve' | 'correct' | 'reject', note?: string) {
    const turn = turns[turnIndex];
    if (!turn?.answer) return;

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question:        turn.question,
        original_answer: turn.answer.answer,
        corrected_answer: type === 'correct' ? note : undefined,
        verdict:         turn.answer.verdict,
        primary_sources: turn.answer.primary_sources,
        sections_used:   turn.answer.sections_used,
        feedback_type:   type,
        correction_note: note,
        category:        (turn.answer as any).category ?? 'social-security',
      }),
    }).catch(() => {});

    setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, feedback: type } : t));
  }

  async function handleSubmit(q?: string) {
    const question = (q ?? input).trim();
    if (!question) return;
    setInput('');

    const turnIndex = turns.length;
    setTurns(prev => [...prev, { question, answer: null, loading: true }]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: buildHistory() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, answer: data, loading: false } : t));
    } catch (e) {
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, error: (e as Error).message, loading: false } : t));
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isEmpty = turns.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: PAPER, display: 'flex', flexDirection: 'column', fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${RULE}`, padding: '14px 0', flexShrink: 0, position: 'sticky', top: 0, background: PAPER, zIndex: 10 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: NAVY, textDecoration: 'none' }}>
              NSSA <span style={{ color: SOFT, fontWeight: 500 }}>Knowledge Base</span>
            </a>
            <span style={{ color: RULE }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>Research Assistant</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {turns.length > 0 && (
              <button onClick={() => { setTurns([]); setInput(''); }}
                style={{ fontSize: 12, color: SOFT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                New conversation
              </button>
            )}
            <a href="https://www.nssapros.com" style={{ fontSize: 13, color: SOFT, textDecoration: 'none' }}>nssapros.com &rsaquo;</a>
          </div>
        </div>
      </header>

      {/* Conversation area */}
      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 760, width: '100%', margin: '0 auto', padding: '28px 24px' }}>

        {/* Hero (empty state) */}
        {isEmpty && (
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 48 }}>
            <h1 style={{
              fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
              fontSize: 32, fontWeight: 600, color: NAVY, margin: '0 0 12px',
            }}>Social Security &amp; IRMAA Research</h1>
            <p style={{ fontSize: 15, color: SOFT, margin: '0 0 28px', lineHeight: 1.6 }}>
              Ask any question about Social Security or Medicare/IRMAA rules. Every answer is grounded in SSA POMS and verified against sources. Follow up as many times as you need.
            </p>

            {/* Prominent input in hero */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Describe the situation or ask your question…"
                  rows={3}
                  style={{
                    flex: 1, padding: '14px 18px', fontSize: 16, lineHeight: 1.55,
                    border: `1.5px solid ${NAVY}`, borderRadius: 10, outline: 'none',
                    resize: 'none', fontFamily: 'inherit', color: '#16202B',
                    boxShadow: '0 2px 12px rgba(13,59,92,.1)',
                  }}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  style={{
                    padding: '14px 22px', borderRadius: 10, border: 'none',
                    background: !input.trim() ? '#E5E7EB' : NAVY,
                    color: !input.trim() ? '#9CA3AF' : '#fff',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Ask &rarr;
                </button>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9CA3AF' }}>Enter to send &nbsp;·&nbsp; Grounded in SSA POMS &nbsp;·&nbsp; Not individualized advice</p>
            </div>

            {/* Examples below input */}
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: SOFT, marginBottom: 10 }}>Or try an example</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {EXAMPLES.map((q, i) => (
                <button key={i} onClick={() => handleSubmit(q)} style={{
                  textAlign: 'left', padding: '12px 16px', background: '#fff',
                  border: `1px solid ${RULE}`, borderRadius: 8, cursor: 'pointer',
                  fontSize: 14, color: NAVY, lineHeight: 1.4, fontFamily: 'inherit',
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turns */}
        {turns.map((turn, i) => (
          <div key={i}>
            {/* User question */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'flex-end' }}>
              <div style={{
                maxWidth: '85%', background: NAVY, color: '#fff', borderRadius: '16px 4px 16px 16px',
                padding: '12px 18px', fontSize: 15, lineHeight: 1.55,
              }}>
                {turn.question}
              </div>
            </div>

            {/* Loading */}
            {turn.loading && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>N</div>
                <div style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: '4px 16px 16px 16px', padding: '16px 20px', color: SOFT, fontSize: 14, fontStyle: 'italic' }}>
                  Retrieving POMS sections and grounding answer…
                </div>
              </div>
            )}

            {/* Error */}
            {turn.error && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DC2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>!</div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', color: '#991B1B', fontSize: 14 }}>{turn.error}</div>
              </div>
            )}

            {/* Answer */}
            {turn.answer && (
              <AnswerBubble
                turn={turn}
                showSections={!!sectionsOpen[i]}
                onToggle={() => setSectionsOpen(prev => ({ ...prev, [i]: !prev[i] }))}
                onFeedback={(type, note) => handleFeedback(i, type, note)}
              />
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      {!isEmpty && (
        <footer style={{ borderTop: `1px solid ${RULE}`, padding: '28px 24px 48px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <div style={{ color: SOFT, fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: NAVY }}>Social Security Professionals, LLC</span>
              <span style={{ color: '#cdc4ad' }}>|</span>
              <span>1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009</span>
              <span style={{ color: '#cdc4ad' }}>|</span>
              <span>&copy; 2026</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 8 }}>
              <a href="https://www.nssapros.com/social-security-training" target="_blank" rel="noopener" style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>Social Security Certification &rsaquo;</a>
              <a href="https://www.nssapros.com/irmaa-medicare-training-course" target="_blank" rel="noopener" style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>IRMAA Certification &rsaquo;</a>
              <a href="https://directory.nssapros.com" target="_blank" rel="noopener" style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>Find an Advisor &rsaquo;</a>
            </div>
            <div style={{ color: '#cdc4ad', fontSize: 11, borderTop: `1px solid ${RULE}`, paddingTop: 8 }}>
              NSSA Knowledge Base provides educational reference material based on SSA POMS. Not individualized legal, financial, or benefits advice. Verify current rules with SSA before making filing decisions.
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
