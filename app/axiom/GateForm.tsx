'use client';

import { useState } from 'react';

const BG     = '#0D1520';
const ACCENT = '#1C80BC';
const TEXT   = '#F0F4F8';
const MUTED  = '#8EA3B8';
const BORDER = '#1E2D42';

export function AxiomGate() {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/axiom-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      setError('Incorrect password. Please try again.');
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
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
      padding: '24px',
    }}>
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png"
        alt="AXIOM by NSSA"
        height={36}
        style={{ height: 36, width: 'auto', marginBottom: 40 }}
      />

      <div style={{
        background: '#131E2E',
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '40px 48px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 18,
          fontWeight: 600,
          color: TEXT,
          margin: '0 0 8px',
        }}>
          Access Required
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
          AXIOM is currently in limited access. Enter your access code to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Access code"
            autoFocus
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: BG,
              border: `1px solid ${error ? '#e05050' : BORDER}`,
              borderRadius: 8,
              color: TEXT,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: error ? 8 : 16,
            }}
          />
          {error && (
            <p style={{ fontSize: 13, color: '#e05050', margin: '0 0 16px', textAlign: 'left' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !password ? '#144e78' : ACCENT,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
