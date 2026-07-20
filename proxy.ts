/**
 * proxy.ts — Next.js 16 route protection
 *
 * Protects /admin routes. Unauthenticated users are redirected to /admin/login.
 * /admin/login and /auth/callback are always public.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProxyClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: login page and auth callback
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

  // Only gate /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createProxyClient(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only allow admin or known reviewers
  // Use service client for kb_reviewers lookup — anon key is blocked by RLS
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const service = createServiceClient();
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!reviewer) {
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/auth/callback'],
};
