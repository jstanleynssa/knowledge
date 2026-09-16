/**
 * axiom-auth.ts — Standalone AXIOM session auth utilities
 *
 * JWT-based cookie session, completely independent of Supabase Auth.
 * Uses jose (HS256) for signing/verifying.
 * Cookie: axiom_session — HttpOnly, Secure, SameSite=Lax, Path=/codex, MaxAge=30d
 */

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AxiomSessionPayload {
  email:  string;
  tier:   string;
  status: string;
  iat?:   number;
  exp?:   number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const AXIOM_COOKIE_NAME = 'axiom_session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const AXIOM_COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    true,
  sameSite:  'lax' as const,
  maxAge:    SESSION_TTL_SECONDS,
  path:      '/codex',
};

// ── Secret key ────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.AXIOM_SESSION_SECRET;
  if (!secret) throw new Error('AXIOM_SESSION_SECRET env var is not set');
  return new TextEncoder().encode(secret);
}

// ── Sign / Verify ─────────────────────────────────────────────────────────────

/**
 * Sign an AXIOM session payload into a JWT string.
 * Issued-at and expiry are set automatically.
 */
export async function signAxiomSession(
  payload: Pick<AxiomSessionPayload, 'email' | 'tier' | 'status'>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify a JWT string. Returns the decoded payload or null if invalid/expired.
 */
export async function verifyAxiomSession(
  token: string
): Promise<AxiomSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AxiomSessionPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ─────────────────────────────────────────────────────────────

/**
 * Sign a session JWT and set the axiom_session cookie on a NextResponse.
 */
export async function setAxiomSessionCookie(
  response: NextResponse,
  payload: Pick<AxiomSessionPayload, 'email' | 'tier' | 'status'>
): Promise<void> {
  const token = await signAxiomSession(payload);
  response.cookies.set(AXIOM_COOKIE_NAME, token, AXIOM_COOKIE_OPTIONS);
}

/**
 * Clear the axiom_session cookie (sets it to empty with maxAge=0).
 */
export function clearAxiomSessionCookie(response: NextResponse): void {
  response.cookies.set(AXIOM_COOKIE_NAME, '', {
    ...AXIOM_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

/**
 * Read and verify the axiom_session cookie from an incoming NextRequest.
 * Returns the decoded session or null.
 */
export async function getAxiomSession(
  request: NextRequest
): Promise<AxiomSessionPayload | null> {
  const token = request.cookies.get(AXIOM_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAxiomSession(token);
}
