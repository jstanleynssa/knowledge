'use client';

/**
 * /axiom/login — Magic link login for AXIOM subscribers
 *
 * Step 1: Enter email → POST /api/axiom/send-magic-link → sends magic link email
 * Step 2: "Check your email" state — no OTP code entry; link-only flow
 *
 * Completely independent of Supabase Auth / members portal.
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Design tokens (AXIOM dark theme) ──────────────────────────────────────────
const BG      = '#0D1520';
const SURFACE = '#131E2E';
const BORDER  = '#1E2D42';
const ACCENT  = '#1C80BC';
const TEXT    = '#F0F4F8';
const MUTED   = '#8EA3B8';
const ERROR_C = '#F87171';

function toErrorMessage(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';
  if (typeof err === 'string') return err || 'Something went wrong.';
  if (err instanceof Error) return err.message || 'Something went wrong.';
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const msg = e.error ?? e.message;
    if (msg && typeof msg === 'string') return msg;
  }
  return 'Something went wrong. Please try again.';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam   = searchParams.get('error');

  const [email,   setEmail]   = useState('');
  const [step,    setStep]    = useState<'email' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(
    errorParam === 'invalid'
      ? 'This sign-in link is invalid.'
      : errorParam === 'expired'
      ? 'This sign-in link has expired. Request a new one.'
      : null
  );

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res  = await fetch('/codex/api/axiom/send-magic-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        setError(toErrorMessage(data));
      } else {
        setStep('sent');
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width:       '100%',
    padding:     '12px 16px',
    background:  BG,
    border:      `1px solid ${error && step === 'email' ? ERROR_C : BORDER}`,
    borderRadius: 8,
    color:       TEXT,
    fontSize:    15,
    outline:     'none',
    boxSizing:   'border-box',
    marginBottom: error && step === 'email' ? 8 : 16,
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width:       '100%',
    padding:     '12px',
    background:  disabled ? '#144e78' : ACCENT,
    color:       '#fff',
    border:      'none',
    borderRadius: 8,
    fontSize:    15,
    fontWeight:  600,
    cursor:      disabled ? 'not-allowed' : 'pointer',
    transition:  'background 0.15s',
  });

  return (
    <div style={{
      minHeight:      '100vh',
      background:     BG,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
      padding:        '24px',
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
        background:  SURFACE,
        border:      `1px solid ${BORDER}`,
        borderRadius: 16,
        padding:     '40px 48px',
        width:       '100%',
        maxWidth:    400,
        textAlign:   'center',
      }}>

        {/* ── Step 1: Email entry ─────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: '0 0 8px' }}>
              Sign in to AXIOM
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
              Enter your email and we'll send you a sign-in link.
            </p>

            {error && (
              <p style={{ fontSize: 13, color: ERROR_C, margin: '0 0 16px', textAlign: 'left', lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading || !email} style={btnStyle(loading || !email)}>
                {loading ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Check your email ────────────────────────────────── */}
        {step === 'sent' && (
          <>
            {/* Envelope icon */}
            <div style={{
              width:          48,
              height:         48,
              borderRadius:   '50%',
              background:     'rgba(28,128,188,0.12)',
              border:         '1px solid rgba(28,128,188,0.25)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="13" rx="2" stroke="#1C80BC" strokeWidth="1.5"/>
                <path d="M2 8l9 6 9-6" stroke="#1C80BC" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: '0 0 8px' }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 4px', lineHeight: 1.6 }}>
              We sent a sign-in link to
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 20px' }}>
              {email}
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
              The link expires in 15 minutes. Click it to sign in — no code needed.
            </p>

            <button
              onClick={() => { setStep('email'); setError(null); }}
              style={{
                background:     'none',
                border:         `1px solid ${BORDER}`,
                color:          MUTED,
                fontSize:       13,
                cursor:         'pointer',
                borderRadius:   8,
                padding:        '9px 20px',
                width:          '100%',
                fontFamily:     'inherit',
              }}
            >
              Use a different email
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: MUTED, marginTop: 24, opacity: 0.6 }}>
        AXIOM access requires an active subscription.
      </p>
    </div>
  );
}

export default function AxiomLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
