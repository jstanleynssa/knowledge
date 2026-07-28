'use client';

import { useState } from 'react';

// NSSA / IRMAACP brand palette
const BLUE_DARK    = '#064c7c';
const BLUE_MID     = '#1c80bc';
const BEIGE_LIGHT  = '#e1ddd2';
const BEIGE_MID    = '#cdc4ad';
const BROWN_DARK   = '#4a3c20';
const BROWN_MID    = '#82724d';
const RED_ACTION   = '#b02a34';
const TEXT         = '#0c334c';

interface Props {
  sectionIndex: number;
  label?: string;
  onFeedback: (index: number, type: 'verified' | 'flag', note?: string) => void;
  learned?: string;
  rewriting?: boolean;
  existingFeedback?: { type: 'verified' | 'flag'; reviewer_name: string; created_at: string } | null;
}

export function SectionFeedback({ sectionIndex, label = 'section', onFeedback, learned, rewriting, existingFeedback }: Props) {
  const [mode, setMode] = useState<'idle' | 'suggesting'>('idle');
  const [done, setDone] = useState<'verified' | 'flag' | null>(null);
  const [note, setNote] = useState('');

  if (done) return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: done === 'verified' ? BLUE_MID : BROWN_MID, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          {done === 'verified'
            ? <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
        {done === 'verified' ? 'Verified' : 'Suggestion saved'}
      </div>
      {/* Show who just verified — this session */}

      {/* What I learned — shown after suggestion rewrite completes */}
      {done === 'flag' && (
        rewriting
          ? <div style={{ marginTop: 6, fontSize: 12, color: BROWN_MID, fontStyle: 'italic' }}>Updating section…</div>
          : learned
            ? <div style={{
                marginTop: 8,
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 6,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 4 }}>What I learned</div>
                <div style={{ fontSize: 13, color: '#0369A1', lineHeight: 1.55 }}>{learned}</div>
              </div>
            : null
      )}
    </div>
  );

  if (mode === 'suggesting') return (
    <div style={{ marginTop: 10, background: BEIGE_LIGHT, border: `1px solid ${BEIGE_MID}`, borderRadius: 6, padding: '14px 16px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: TEXT }}>
        Suggestion for this {label}
      </p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={`What should be corrected in this ${label}?`}
        rows={3}
        style={{
          width: '100%', fontSize: 14, color: '#000',
          background: '#fff', border: `1px solid ${BEIGE_MID}`,
          borderRadius: 4, padding: '8px 10px', resize: 'vertical',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          lineHeight: 1.5, boxSizing: 'border-box', outline: 'none',
        }}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button
          onClick={() => { onFeedback(sectionIndex, 'flag', note); setDone('flag'); setMode('idle'); }}
          style={{ fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 5, border: 'none', background: BLUE_DARK, color: '#fff', cursor: 'pointer' }}
        >
          Save suggestion
        </button>
        <button
          onClick={() => { setMode('idle'); setNote(''); }}
          style={{ fontSize: 13, color: BROWN_MID, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ marginTop: 10 }}>
      {/* Prior feedback from DB — shown until reviewer acts this session */}
      {existingFeedback && (
        <div style={{
          fontSize: 11, color: existingFeedback.type === 'verified' ? BLUE_MID : BROWN_MID,
          marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {existingFeedback.type === 'verified'
            ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
          {existingFeedback.type === 'verified' ? 'Verified' : 'Suggestion'} by {existingFeedback.reviewer_name} on {fmtDate(existingFeedback.created_at)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() => { onFeedback(sectionIndex, 'verified'); setDone('verified'); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 5,
          border: `1px solid ${BLUE_DARK}`, background: 'transparent', color: BLUE_DARK, cursor: 'pointer',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 6L4.5 9L10.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Verify
      </button>
      <button
        onClick={() => setMode('suggesting')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 5,
          border: `1px solid ${BROWN_DARK}`, background: 'transparent', color: BROWN_DARK, cursor: 'pointer',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Make Suggestion
      </button>
      </div>
    </div>
  );
}
