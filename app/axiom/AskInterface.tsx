'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ── Design system ─────────────────────────────────────────────────────────────
const BG       = '#0D1520';
const SURFACE  = '#131E2E';
const BORDER   = '#1E2D42';
const ACCENT   = '#1C80BC';
const ACCENT_DK= '#155F8E';
const TEXT     = '#F0F4F8';
const MUTED    = '#8EA3B8';
const DIM      = '#4A6070';
const CITE     = '#5BA3D0';
const CITE_BG  = '#0D2033';

// ── Word-level diff (dark theme) ──────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi,' ').replace(/<\/p>/gi,' ').replace(/<\/li>/gi,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
function diffWords(original: string, revised: string): string {
  const a = stripHtml(original).split(' ');
  const b = stripHtml(revised).split(' ');
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const ops: Array<{type:'same'|'add'|'del';word:string}> = [];
  let i=m, j=n;
  while(i>0||j>0){
    if(i>0&&j>0&&a[i-1]===b[j-1]){ops.unshift({type:'same',word:b[j-1]});i--;j--;}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){ops.unshift({type:'add',word:b[j-1]});j--;}
    else{ops.unshift({type:'del',word:a[i-1]});i--;}
  }
  return ops.map(op=>{
    const e=op.word.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if(op.type==='same') return e;
    if(op.type==='add')  return `<ins style="background:rgba(16,185,129,0.2);color:#34D399;text-decoration:none;border-radius:2px;padding:0 1px">${e}</ins>`;
    return `<del style="background:rgba(220,38,38,0.15);color:#F87171;text-decoration:line-through;border-radius:2px;padding:0 1px">${e}</del>`;
  }).join(' ');
}

// ── Loading steps ──────────────────────────────────────────────────────
const LOADING_STEPS = [
  { label: 'Searching primary sources',  detail: 'POMS · CFR · SSA Handbook',  ms: 2500 },
  { label: 'Matching relevant sections', detail: 'Hybrid retrieval · scoring', ms: 3500 },
  { label: 'Checking verified answers',  detail: 'Expert-reviewed corpus',     ms: 2000 },
  { label: 'Grounding the response',     detail: 'o4-mini · chain-of-thought', ms: 99999 },
];

function LoadingBubble() {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState('');
  useEffect(() => {
    if (step >= LOADING_STEPS.length - 1) return;
    const t = setTimeout(() => setStep(s => Math.min(s+1, LOADING_STEPS.length-1)), LOADING_STEPS[step].ms);
    return () => clearTimeout(t);
  }, [step]);
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d+'.'), 400);
    return () => clearInterval(t);
  }, []);
  const current = LOADING_STEPS[step];
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      <div style={{ position: 'relative', flexShrink: 0, marginTop: 2, width: 32, height: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, position: 'relative', zIndex: 1 }}>A</div>
        <svg style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40 }} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke={ACCENT} strokeWidth="2" strokeOpacity="0.15" />
          <circle cx="20" cy="20" r="18" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"
            strokeDasharray="28 85"
            style={{ animation: 'axiom-spin 1s linear infinite', transformOrigin: '20px 20px' }}
          />
        </svg>
      </div>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '4px 16px 16px 16px', padding: '14px 20px', minWidth: 280 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LOADING_STEPS.slice(0, step+1).map((s, i) => {
            const active = i === step, completed = i < step;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: completed ? ACCENT : 'transparent', border: active ? `2px solid ${ACCENT}` : completed ? 'none' : `1px solid ${BORDER}`, transition: 'all .3s' }}>
                  {completed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, animation: 'axiom-blink 1s ease-in-out infinite' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? TEXT : completed ? MUTED : DIM, transition: 'all .3s' }}>{s.label}{active ? dots : ''}</div>
                  {active && <div style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{s.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes axiom-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes axiom-blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

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
  feedbackAnalysis?: string;
  /** Set after reviewer submits a correction — triggers "Verify fix" flow */
  rerunLoading?: boolean;
  rerunAnswer?: Answer | null;
  rerunFeedback?: 'approve' | 'reject' | null;
}

const VERDICT_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  correct:               { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', label: '✓ Correct' },
  incorrect:             { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', label: '✗ Incorrect' },
  partial:               { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: '⚠ Partially correct' },
  no_advice_to_evaluate: { bg: '#1E3A52', color: '#93C5FD', border: '#2D5275', label: 'ℹ Reference' },
  uncertain:             { bg: '#1A2535', color: MUTED,     border: BORDER,    label: '? Uncertain' },
};

const EXAMPLES = [
  "Client is 8 months shy of FRA with a benefit of $3,800 at FRA. SSA office says his spouse is eligible since she is 62 for 50% of his benefit. Is that correct?",
  "62-year-old client wants to file for spousal benefits. Her own benefit is $800/mo, her husband's PIA is $2,400. What should she expect to receive?",
  "What happens to a widow's Social Security benefit if she remarries before age 60?",
  "Client has a $1,200/month government pension from non-covered employment. How will GPO affect her spousal benefit?",
];

// ── Feedback bar ──────────────────────────────────────────────────────────────
function UpdatedResponsePanel({ original, revised, onApprove, onReject }: {
  original: string; revised: string;
  onApprove: () => void; onReject: () => void;
}) {
  const [view, setView] = useState<'diff'|'clean'>('diff');
  const diffHtml = diffWords(original, revised);
  return (
    <div style={{ marginTop: 8 }}>
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#059669' }}>Updated Response</div>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
          {(['diff','clean'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: view===v ? ACCENT : SURFACE, color: view===v ? '#fff' : MUTED }}>
              {v === 'diff' ? 'Track Changes' : 'Clean'}
            </button>
          ))}
        </div>
      </div>
      {/* Answer */}
      <div style={{ background: 'rgba(16,185,129,0.05)', border: `1px solid ${view==='diff' ? BORDER : 'rgba(16,185,129,0.25)'}`, borderRadius: 8, padding: '14px 16px', fontSize: 14, color: TEXT, lineHeight: 1.65 }}>
        <div dangerouslySetInnerHTML={{ __html: view==='diff' ? diffHtml : revised }} />
      </div>
      {/* Legend */}
      {view === 'diff' && (
        <div style={{ display: 'flex', gap: 16, marginTop: 5, fontSize: 11, color: DIM }}>
          <span><ins style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', textDecoration: 'none', borderRadius: 2, padding: '0 4px' }}>Added</ins></span>
          <span><del style={{ background: 'rgba(220,38,38,0.15)', color: '#F87171', textDecoration: 'line-through', borderRadius: 2, padding: '0 4px' }}>Removed</del></span>
        </div>
      )}
      {/* Confirm/reject */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onApprove} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Confirm — fix worked
        </button>
        <button onClick={onReject} style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 6, border: `1px solid rgba(220,38,38,0.35)`, background: 'transparent', color: '#F87171', cursor: 'pointer' }}>
          Still not right
        </button>
      </div>
    </div>
  );
}

function FeedbackBar({
  turn,
  onFeedback,
  onRerun,
  onRerunFeedback,
}: {
  turn: Turn;
  onFeedback: (type: 'approve' | 'correct' | 'reject', note?: string) => void;
  onRerun: () => void;
  onRerunFeedback: (type: 'approve' | 'reject') => void;
}) {
  const [mode, setMode] = useState<'idle' | 'correcting'>('idle');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const TAG_OPTIONS = ['wrong section', 'wrong value', 'missing rule', 'misread scenario'];

  if (turn.feedback) {
    const confirmColor =
      turn.feedback === 'approve' ? '#059669' :
      turn.feedback === 'correct' ? CITE : '#DC2626';
    const confirmLabel =
      turn.feedback === 'approve' ? 'Verified' :
      turn.feedback === 'correct' ? 'Suggestion saved' : 'Flagged for review';
    return (
      <div>
        <div style={{ fontSize: 12, color: confirmColor, marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {turn.feedback === 'approve'
              ? <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>}
          </svg>
          {confirmLabel}
        </div>
        {turn.feedbackAnalysis && (
          <div style={{
            marginTop: 8,
            background: 'rgba(28,128,188,0.08)',
            border: `1px solid rgba(28,128,188,0.25)`,
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 13,
            color: CITE,
            lineHeight: 1.55,
          }}>
            <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4, color: ACCENT }}>What I learned</span>
            {turn.feedbackAnalysis}
          </div>
        )}

        {/* Verify-fix panel — only shown after a correction, not after approve/reject */}
        {turn.feedback === 'correct' && (
          <div style={{ marginTop: 12 }}>
            {turn.rerunLoading && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: 'italic' }}>Rewriting answer with your correction…</div>
            )}

            {turn.rerunAnswer && !turn.rerunFeedback && (
              <UpdatedResponsePanel
                original={turn.answer?.answer ?? ''}
                revised={turn.rerunAnswer.answer}
                onApprove={() => onRerunFeedback('approve')}
                onReject={() => onRerunFeedback('reject')}
              />
            )}

            {turn.rerunFeedback && (
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8,
                color: turn.rerunFeedback === 'approve' ? '#059669' : '#DC2626' }}>
                {turn.rerunFeedback === 'approve' ? '✓ Fix confirmed — answer added to verified corpus' : '✗ Flagged for further review'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'correcting') {
    return (
      <div style={{ marginTop: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: TEXT }}>Make a suggestion</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {TAG_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
              style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20,
                border: `1px solid ${tags.includes(t) ? ACCENT : BORDER}`,
                background: tags.includes(t) ? ACCENT : 'transparent',
                color: tags.includes(t) ? '#fff' : MUTED,
                cursor: 'pointer', fontWeight: tags.includes(t) ? 700 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Describe your suggestion or what should be corrected…"
          rows={3}
          style={{
            width: '100%', fontSize: 14, color: TEXT, padding: '10px 12px', borderRadius: 6,
            border: `1px solid ${BORDER}`, resize: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box' as const, outline: 'none',
            background: BG, lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button onClick={() => onFeedback('correct', note)} style={{ fontSize: 13, fontWeight: 700, padding: '7px 16px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer' }}>Save suggestion</button>
          <button onClick={() => onFeedback('reject', note)} style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 6, border: `1px solid rgba(220,38,38,0.4)`, background: 'transparent', color: '#F87171', cursor: 'pointer' }}>Flag as wrong</button>
          <button onClick={() => { setMode('idle'); setNote(''); setTags([]); }} style={{ fontSize: 13, color: DIM, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
      <button
        onClick={() => onFeedback('approve')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
          border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Verify
      </button>
      <button
        onClick={() => setMode('correcting')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
          border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Make Suggestion
      </button>
    </div>
  );
}

// ── Answer bubble ─────────────────────────────────────────────────────────────
function AnswerBubble({
  turn,
  onToggle,
  showSections,
  onFeedback,
  onRerun,
  onRerunFeedback,
}: {
  turn: Turn;
  onToggle: () => void;
  showSections: boolean;
  onFeedback: (type: 'approve' | 'correct' | 'reject', note?: string) => void;
  onRerun: () => void;
  onRerunFeedback: (type: 'approve' | 'reject') => void;
}) {
  const a = turn.answer;
  if (!a) return null;
  const vs = VERDICT_STYLE[a.verdict] ?? VERDICT_STYLE.uncertain;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: ACCENT, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
      }}>A</div>

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
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: '4px 16px 16px 16px',
          padding: '18px 22px',
          fontSize: 16,
          lineHeight: 1.75,
          color: TEXT,
          fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
        }}>
          <style dangerouslySetInnerHTML={{ __html: ANSWER_CSS }} />
          <div className="answer-body" dangerouslySetInnerHTML={{ __html: a.answer }} />
        </div>

        {/* Verification flags */}
        {!a.verification.passed && a.verification.unverified.length > 0 && (
          <div style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 6, padding: '10px 14px', marginTop: 8,
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 12, color: '#F87171' }}>
              ⚠ {a.verification.unverified.length} value{a.verification.unverified.length !== 1 ? 's' : ''} could not be verified — treat with caution:
            </p>
            {a.verification.unverified.map((u, i) => (
              <div key={i} style={{ fontSize: 12, color: '#FCA5A5', marginBottom: 3 }}>
                <strong>&ldquo;{u.value}&rdquo;</strong> — {u.context.slice(0, 120)}…
              </div>
            ))}
          </div>
        )}

        {/* Source gaps */}
        {a.gaps.length > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6, padding: '10px 14px', marginTop: 8,
          }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 11, color: '#FCD34D', letterSpacing: '.06em', textTransform: 'uppercase' }}>Source gaps</p>
            {a.gaps.map((g, i) => <p key={i} style={{ margin: 0, fontSize: 13, color: '#FDE68A' }}>{g}</p>)}
          </div>
        )}

        {/* Citations */}
        {a.primary_sources.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.primary_sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: CITE_BG,
                border: `1px solid #1E3A52`,
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 12,
                color: CITE,
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#fff', background: ACCENT, padding: '1px 5px', borderRadius: 2,
                }}>src</span>
                {s.section_number} &rsaquo;
              </a>
            ))}
          </div>
        )}

        {/* Feedback */}
        <FeedbackBar turn={turn} onFeedback={onFeedback} onRerun={onRerun} onRerunFeedback={onRerunFeedback} />

        {/* Retrieved sections toggle */}
        <button onClick={onToggle} style={{
          marginTop: 8, fontSize: 11, color: DIM, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
        }}>
          {showSections ? 'Hide' : 'Show'} {a.sections_used.length} retrieved sections
        </button>

        {showSections && (
          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
            {a.sections_used.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
                {s.source_url ? (
                  <a href={s.source_url} target="_blank" rel="noopener" style={{
                    fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700,
                    color: CITE, textDecoration: 'none', whiteSpace: 'nowrap',
                  }}>
                    {s.section_number} ↗
                  </a>
                ) : (
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, color: MUTED, whiteSpace: 'nowrap' }}>{s.section_number}</span>
                )}
                <span style={{ color: MUTED, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title ?? '(no title)'}</span>
                <span style={{ color: DIM, fontSize: 10, whiteSpace: 'nowrap' }}>{s.score.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Answer CSS (dark-aware) ───────────────────────────────────────────────────
const ANSWER_CSS = `
.answer-body p { margin: 0 0 14px; }
.answer-body p:last-child { margin-bottom: 0; }
.answer-body ul, .answer-body ol { padding-left: 24px; margin: 0 0 14px; }
.answer-body li { margin-bottom: 6px; line-height: 1.6; }
.answer-body li:last-child { margin-bottom: 0; }
.answer-body strong { font-weight: 700; }
.answer-body h3, .answer-body h4 { margin: 16px 0 6px; font-size: 1em; font-weight: 700; color: ${CITE}; }
.answer-body code { font-family: ui-monospace, monospace; font-size: 0.9em; background: rgba(30,45,66,0.8); padding: 1px 5px; border-radius: 3px; color: ${CITE}; }
`;

// ── Main component ────────────────────────────────────────────────────────────
export function AskInterface({ sourceSummary }: { sourceSummary?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [sectionsOpen, setSectionsOpen] = useState<Record<number, boolean>>({});
  const [headerEl, setHeaderEl] = useState<Element | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Locate the header portal target once mounted
  useEffect(() => {
    setHeaderEl(document.getElementById('axiom-header-right'));
  }, []);

  const handleReset = useCallback(() => {
    setTurns([]);
    setInput('');
    setSectionsOpen({});
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

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

    // Snapshot before any state changes
    const originalAnswer = turn.answer.answer;
    const question       = turn.question;
    const primarySources = turn.answer.primary_sources;
    const correctionNote = note ?? '';

    // Mark feedback + immediately start rewrite loading if it's a suggestion
    setTurns(prev => prev.map((t, i) => i === turnIndex ? {
      ...t,
      feedback:     type,
      rerunLoading: type === 'correct' && correctionNote.trim().length > 0,
      rerunAnswer:  null,
    } : t));

    // Save feedback in background
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question, original_answer: originalAnswer,
        corrected_answer: type === 'correct' ? correctionNote : undefined,
        verdict:          turn.answer.verdict,
        primary_sources:  primarySources,
        sections_used:    turn.answer.sections_used,
        feedback_type:    type,
        correction_note:  correctionNote,
        category:         (turn.answer as any).category ?? 'social-security',
      }),
    }).then(r => r.json()).then(data => {
      if (data.analysis) setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, feedbackAnalysis: data.analysis } : t));
    }).catch(() => {});

    // Auto-rewrite immediately on suggestion
    if (type === 'correct' && correctionNote.trim().length > 0) {
      try {
        const res = await fetch('/api/ask/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, original_answer: originalAnswer, correction_note: correctionNote, primary_sources: primarySources }),
        });
        const data = await res.json().catch(() => ({}));
        setTurns(prev => prev.map((t, i) => i === turnIndex ? {
          ...t,
          rerunLoading: false,
          // Wrap plain-text rewrite in a minimal Answer shape for the existing panel
          rerunAnswer: data.ok ? { ...turn.answer!, answer: data.answer } : null,
          feedbackAnalysis: data.learned || t.feedbackAnalysis,
        } : t));
      } catch {
        setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, rerunLoading: false } : t));
      }
    }
  }

  async function handleRerun(turnIndex: number) {
    const turn = turns[turnIndex];
    if (!turn?.question) return;
    setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, rerunLoading: true, rerunAnswer: null } : t));
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: turn.question, history: [] }),
      });
      const data = await res.json().catch(() => null);
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, rerunLoading: false, rerunAnswer: data } : t));
    } catch {
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, rerunLoading: false } : t));
    }
  }

  async function handleRerunFeedback(turnIndex: number, type: 'approve' | 'reject') {
    const turn = turns[turnIndex];
    if (!turn?.rerunAnswer) return;
    setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, rerunFeedback: type } : t));
    if (type === 'approve') {
      // Save the verified re-run answer to strengthen the corpus
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:        turn.question,
          original_answer: turn.rerunAnswer.answer,
          feedback_type:   'approve',
          category:        (turn.rerunAnswer as any).category ?? (turn.answer as any)?.category ?? 'social-security',
          primary_sources: turn.rerunAnswer.primary_sources,
          sections_used:   turn.rerunAnswer.sections_used,
          correction_note: 'Reviewer confirmed fix via verify-fix flow',
        }),
      }).catch(() => null);
    }
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
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error ?? 'The request timed out. Please try again.');
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, answer: data, loading: false } : t));
    } catch (e) {
      setTurns(prev => prev.map((t, i) => i === turnIndex ? { ...t, error: (e as Error).message, loading: false } : t));
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isEmpty = turns.length === 0;

  return (
    <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: '0 24px' }}>

      {/* Portal: "New question" button into the header when conversation is active */}
      {headerEl && turns.length > 0 && createPortal(
        <button
          onClick={handleReset}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600,
            padding: '7px 16px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'transparent', color: '#fff',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2M11 2v4.5H6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New question
        </button>,
        headerEl
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div style={{ paddingTop: 8, paddingBottom: 48 }}>

          {/* Main input */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe the situation or ask your question…"
                rows={3}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  fontSize: 16,
                  lineHeight: 1.55,
                  background: '#1E3047',
                  border: `2px solid ${ACCENT}`,
                  borderRadius: 14,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  color: TEXT,
                  boxShadow: '0 0 0 4px rgba(28,128,188,0.12)',
                }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                style={{
                  padding: '14px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: !input.trim() ? '#1A2535' : ACCENT,
                  color: !input.trim() ? DIM : '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: !input.trim() ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'background .15s',
                }}
              >
                Ask &rarr;
              </button>
            </div>
            {sourceSummary ? (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: DIM }}>{sourceSummary}</p>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: DIM }}>Enter to send &nbsp;·&nbsp; Grounded in federal regulations &nbsp;·&nbsp; Not individualized advice</p>
            )}
          </div>

        </div>
      )}

      {/* ── Conversation turns ──────────────────────────────────────────────── */}
      {turns.map((turn, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 28 : 0 }}>

          {/* User message */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '85%',
              background: ACCENT,
              color: '#fff',
              borderRadius: '16px 4px 16px 16px',
              padding: '12px 18px',
              fontSize: 15,
              lineHeight: 1.55,
            }}>
              {turn.question}
            </div>
          </div>

          {/* Loading */}
          {turn.loading && <LoadingBubble />}

          {/* Error */}
          {turn.error && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#DC2626', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>!</div>
              <div style={{
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '4px 16px 16px 16px',
                padding: '14px 18px', color: '#FCA5A5', fontSize: 14,
              }}>{turn.error}</div>
            </div>
          )}

          {/* Answer */}
          {turn.answer && (
            <AnswerBubble
              turn={turn}
              showSections={!!sectionsOpen[i]}
              onToggle={() => setSectionsOpen(prev => ({ ...prev, [i]: !prev[i] }))}
              onFeedback={(type, note) => handleFeedback(i, type, note)}
              onRerun={() => handleRerun(i)}
              onRerunFeedback={(type) => handleRerunFeedback(i, type)}
            />
          )}

          {/* Inline follow-up input — only after last completed turn */}
          {i === turns.length - 1 && (turn.answer || turn.error) && (
            <div style={{ marginLeft: 44, marginTop: 20, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Ask a follow-up question…"
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 15,
                    lineHeight: 1.5,
                    background: SURFACE,
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 10,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    color: TEXT,
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = ACCENT; }}
                  onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: !input.trim() ? '#1A2535' : ACCENT,
                    color: !input.trim() ? DIM : '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: !input.trim() ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >Ask &rarr;</button>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 11, color: DIM }}>Enter to send &nbsp;&middot;&nbsp; Shift+Enter for new line</p>
            </div>
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
