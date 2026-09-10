'use client';

/**
 * axiom.nssapros.com/join — AXIOM Beta Enrollment Form
 * Public page (no auth required). Provisions the user immediately on submit.
 */

import { useState } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG      = '#0D1520';
const SURFACE = '#131E2E';
const BORDER  = '#1E2D42';
const ACCENT  = '#1C80BC';
const TEXT    = '#F0F4F8';
const MUTED   = '#8EA3B8';
const ERROR_C = '#F87171';
const SUCCESS = '#34D399';

type Credential = 'nssa' | 'irmaacp' | 'both';

const CREDENTIALS: { value: Credential; label: string; sub: string }[] = [
  { value: 'nssa',    label: 'NSSA®',            sub: 'National Social Security Advisor' },
  { value: 'irmaacp', label: 'IRMAACP®',          sub: 'IRMAA Certified Professional' },
  { value: 'both',    label: 'Both',              sub: 'NSSA® and IRMAACP®' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  color: TEXT,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 6,
};

export default function JoinPage() {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [credential, setCredential] = useState<Credential | ''>('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [result,     setResult]     = useState<'enrolled' | 'already_enrolled' | 'reactivated' | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credential) { setError('Please select your credential.'); return; }
    setLoading(true);
    setError('');

    const res = await fetch('/codex/api/axiom/enroll', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, credential }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong. Please try again.');
      return;
    }

    setResult(json.result);
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
        style={{ height: 36, width: 'auto', marginBottom: 36 }}
      />

      <div style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '40px 48px',
        width: '100%',
        maxWidth: 440,
      }}>
        {result ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              {result === 'already_enrolled' ? '✅' : '🎉'}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>
              {result === 'already_enrolled'
                ? 'You\'re already enrolled'
                : 'You\'re in!'}
            </h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: '0 0 28px' }}>
              {result === 'already_enrolled'
                ? 'Your account is already active. Sign in to start using AXIOM.'
                : `Welcome to the AXIOM beta, ${name.split(' ')[0]}. Sign in with the email you just provided to get started.`}
            </p>
            <a
              href="https://axiom.nssapros.com/login"
              style={{
                display: 'block',
                padding: '12px',
                background: ACCENT,
                color: '#fff',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Sign in to AXIOM →
            </a>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>
                Join the AXIOM Beta
              </h1>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>
                AXIOM is an AI research tool grounded in SSA POMS, 20&nbsp;CFR, CMS, and Medicare.gov —
                every answer cited to its federal source. Beta access is free for NSSA-credentialed advisors.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(248,113,113,0.1)',
                border: `1px solid ${ERROR_C}`,
                borderRadius: 8,
                color: ERROR_C,
                fontSize: 13,
                marginBottom: 20,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  autoFocus
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: MUTED, margin: '5px 0 0' }}>
                  Use the email you&rsquo;ll sign in with.
                </p>
              </div>

              {/* Credential */}
              <div>
                <label style={labelStyle}>Your Credential</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CREDENTIALS.map(c => {
                    const selected = credential === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCredential(c.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: selected ? 'rgba(28,128,188,0.12)' : BG,
                          border: `1px solid ${selected ? ACCENT : BORDER}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        {/* Radio dot */}
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${selected ? ACCENT : BORDER}`,
                          background: selected ? ACCENT : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: selected ? TEXT : MUTED }}>
                            {c.label}
                          </div>
                          <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{c.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !name || !email || !credential}
                style={{
                  padding: '13px',
                  background: loading || !name || !email || !credential ? '#144e78' : ACCENT,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading || !name || !email || !credential ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                }}
              >
                {loading ? 'Enrolling…' : 'Request Beta Access'}
              </button>
            </form>

            <p style={{ fontSize: 12, color: MUTED, marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
              Beta access is complimentary for credentialed advisors.
              No credit card required.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
