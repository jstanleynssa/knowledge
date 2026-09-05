'use client';

/**
 * /axiom/login — Magic link login for AXIOM subscribers
 *
 * Step 1: Enter email → Supabase sends a magic link + OTP code
 * Step 2: Click link (auto-redirect) or enter 6-digit code
 */

import { Suspense, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';

// ── Design tokens (AXIOM dark theme) ──────────────────────────────────────────
const BG      = '#0D1520';
const SURFACE = '#131E2E';
const BORDER  = '#1E2D42';
const ACCENT  = '#1C80BC';
const TEXT     = '#F0F4F8';
const MUTED    = '#8EA3B8';
const ERROR_C  = '#F87171';

function toErrorMessage(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';
  if (typeof err === 'string') return err || 'Something went wrong.';
  if (err instanceof Error) return err.message || 'Something went wrong.';
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const msg = e.message ?? e.error_description ?? e.error;
    if (msg && typeof msg === 'string') return msg;
  }
  return 'Something went wrong. Please try again.';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam   = searchParams.get('error');
  const next         = searchParams.get('next') ?? '/axiom';

  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(
    errorParam === 'not_subscriber'
      ? 'This email doesn\'t have AXIOM access. Purchase a subscription to get started.'
      : errorParam === 'past_due'
      ? 'Your subscription has a payment issue. Please update your billing in Kajabi.'
      : errorParam === 'auth_failed'
      ? 'Sign-in link expired or invalid. Please try again.'
      : null
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/codex/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(toErrorMessage(error));
    } else {
      setStep('otp');
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    });

    setLoading(false);

    if (error) {
      setError(toErrorMessage(error));
    } else {
      // Redirect handled by auth callback; if OTP path, go directly
      window.location.href = next.startsWith('/codex') ? next : `/codex${next}`;
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: BG,
    border: `1px solid ${error ? ERROR_C : BORDER}`,
    borderRadius: 8,
    color: TEXT,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: error ? 8 : 16,
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px',
    background: disabled ? '#144e78' : ACCENT,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  });

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
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '40px 48px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        {step === 'email' ? (
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
        ) : (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: TEXT, margin: '0 0 8px' }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 4px', lineHeight: 1.6 }}>
              We sent a link to <strong style={{ color: TEXT }}>{email}</strong>.
            </p>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
              Click it to sign in, or enter the 6-digit code below.
            </p>

            {error && (
              <p style={{ fontSize: 13, color: ERROR_C, margin: '0 0 16px', textAlign: 'left' }}>
                {error}
              </p>
            )}

            <form onSubmit={handleOtpSubmit}>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="6-digit code"
                autoFocus
                maxLength={6}
                style={{ ...inputStyle, letterSpacing: '0.25em', textAlign: 'center', fontSize: 20 }}
              />
              <button type="submit" disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
                {loading ? 'Verifying…' : 'Continue'}
              </button>
            </form>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              style={{
                marginTop: 16,
                background: 'none',
                border: 'none',
                color: MUTED,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
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
