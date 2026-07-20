'use client';

/**
 * /admin/login — Magic link login for KB reviewers and admin
 *
 * Step 1: Enter email → Supabase sends a magic link email
 * Step 2: Either click the link (redirects here via /auth/callback)
 *         OR paste the 6-digit OTP code shown in the email
 */

import { Suspense, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

// Extracts a human-readable string from any error value
function toErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  if (typeof err === 'string') return err || 'An unexpected error occurred. Please try again.';
  if (err instanceof Error) return err.message || 'An unexpected error occurred. Please try again.';
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const msg = e.message ?? e.msg ?? e.error_description ?? e.error;
    if (msg && typeof msg === 'string') return msg;
  }
  return 'An unexpected error occurred. Please try again.';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const next = searchParams.get('next') ?? '/admin/kb-review';

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'unauthorized'
      ? 'Your account does not have reviewer access.'
      : errorParam === 'auth_failed'
      ? 'Sign-in link expired or invalid. Please try again.'
      : null
  );

  const router = useRouter();

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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
      setError(toErrorMessage(error) || 'Invalid or expired code. Check the email or request a new link.');
    } else {
      router.push(next);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* Logo / title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">KB Review Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {step === 'email' ? 'Sign in with a magic link' : `We sent a link to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 — Email entry */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nssapros.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 text-white text-sm font-medium py-2 px-4 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP / code entry */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              ✓ Check your email — click the link, or paste the 6-digit code below.
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-zinc-700 mb-1">
                  6-digit code from your email
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent tracking-widest text-center text-lg font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-lg bg-zinc-900 text-white text-sm font-medium py-2 px-4 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying…' : 'Sign in'}
              </button>
            </form>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
