'use client';

import { useState } from 'react';

const BG     = '#0D1520';
const ACCENT = '#1C80BC';
const TEXT   = '#F0F4F8';
const MUTED  = '#8EA3B8';
const BORDER = '#1E2D42';

const REVIEWERS = [
  'Jason Stanley',
  'Cindi Hill',
  'Todd Valles',
  'Jim Blair',
  'Travis Stanley',
];

export function ReviewerGate() {
  const [selected, setSelected] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Please select your name.'); return; }
    setLoading(true);
    setError('');

    const res = await fetch('/codex/api/axiom-reviewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_name: selected }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      padding: '24px',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png"
        alt="AXIOM by NSSA"
        height={28}
        style={{ height: 28, width: 'auto', marginBottom: 36 }}
      />

      <div style={{
        background: '#131E2E',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 360,
      }}>
        <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Who are you?</h2>
        <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
          Select your name so your verifications and suggestions are tracked.
        </p>

        <form onSubmit={handleSubmit}>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 7,
              border: `1px solid ${BORDER}`,
              background: '#0D1520',
              color: selected ? TEXT : MUTED,
              fontSize: 14,
              marginBottom: 16,
              outline: 'none',
              appearance: 'auto',
            }}
          >
            <option value="" disabled>Select your name…</option>
            {REVIEWERS.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {error && (
            <p style={{ color: '#F87171', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selected}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 7,
              border: 'none',
              background: ACCENT,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || !selected ? 'not-allowed' : 'pointer',
              opacity: loading || !selected ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
