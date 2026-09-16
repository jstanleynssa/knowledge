/**
 * POST /api/axiom/sign-out
 *
 * Clears the axiom_session cookie and redirects to the login page.
 * No Supabase auth involvement — pure cookie clear.
 */

import { NextResponse } from 'next/server';
import { AXIOM_COOKIE_NAME } from '@/lib/axiom-auth';

const LOGIN_URL = 'https://axiom.nssapros.com/codex/axiom/login';

export async function POST() {
  const res = NextResponse.redirect(new URL(LOGIN_URL));
  res.cookies.set(AXIOM_COOKIE_NAME, '', {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   0,
    path:     '/codex',
  });
  return res;
}
