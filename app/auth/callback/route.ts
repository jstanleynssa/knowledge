/**
 * /api/auth/callback — PKCE magic link code exchange
 *
 * Supabase redirects here after the user clicks their magic link.
 * Exchanges the `code` param for a session, stores it in cookies,
 * then redirects to the originally requested page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin/kb-review';

  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Something went wrong — send back to login with an error
  return NextResponse.redirect(new URL('/admin/login?error=auth_failed', origin));
}
