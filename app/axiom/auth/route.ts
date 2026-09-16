/**
 * GET /axiom/auth?token=<uuid>
 *
 * Token verification route — validates a magic link token, marks it used,
 * signs an axiom_session JWT, and redirects to /axiom with the cookie set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { setAxiomSessionCookie } from '@/lib/axiom-auth';

const BASE_URL = 'https://axiom.nssapros.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Missing token → back to login with error
  if (!token || token.trim() === '') {
    return NextResponse.redirect(new URL('/codex/axiom/login?error=invalid', BASE_URL));
  }

  const sb = createServiceClient();

  // Look up token — must be unused and not yet expired
  const { data: row } = await sb
    .from('axiom_magic_links')
    .select('id, email, expires_at, used_at')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!row) {
    // Not found, already used, or expired
    return NextResponse.redirect(new URL('/codex/axiom/login?error=expired', BASE_URL));
  }

  // Mark token as used immediately (prevents replay)
  await sb
    .from('axiom_magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id);

  // Look up subscriber to get tier + status for the session cookie
  const { data: sub } = await sb
    .from('axiom_subscribers')
    .select('tier, status')
    .eq('email', row.email)
    .single();

  const tier   = sub?.tier   ?? 'standard';
  const status = sub?.status ?? 'active';

  // Build redirect response to /axiom
  const response = NextResponse.redirect(new URL('/codex/axiom', BASE_URL));

  // Sign and attach the session cookie
  await setAxiomSessionCookie(response, {
    email: row.email,
    tier,
    status,
  });

  return response;
}
