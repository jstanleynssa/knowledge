/**
 * proxy.ts — Next.js 16 route protection + host-based routing
 *
 * 1. 301 redirects knowledge.nssapros.com → www.nssapros.com/codex (SEO consolidation)
 * 2. Rewrites axiom.nssapros.com → /axiom
 * 3. Protects /admin routes — unauthenticated users redirected to /admin/login
 *
 * NOTE: With basePath '/codex', req.nextUrl.pathname includes the /codex prefix.
 * Strip it before doing path comparisons.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProxyClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const BASEPATH    = '/codex';

/** Strip basePath prefix so internal checks work normally */
function stripBase(pathname: string): string {
  return pathname.startsWith(BASEPATH) ? pathname.slice(BASEPATH.length) || '/' : pathname;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') ?? '';
  const path = stripBase(pathname);   // /codex/admin/... → /admin/...

  // ── 1. SEO redirect: knowledge.nssapros.com → www.nssapros.com/codex ────────
  // Skip if request came from our own Cloudflare Worker (avoids redirect loop)
  const isWorkerRequest = req.headers.get('x-forwarded-worker') === 'nssa-proxy';
  if (hostname === 'knowledge.nssapros.com' && !isWorkerRequest) {
    const newPath = pathname.startsWith(BASEPATH) ? pathname : `${BASEPATH}${path === '/' ? '' : path}`;
    return NextResponse.redirect(
      `https://www.nssapros.com${newPath}${req.nextUrl.search}`,
      { status: 301 }
    );
  }

  // ── 2. Subdomain routing ──────────────────────────────────────────────────
  // axiom.nssapros.com → rewrite to /axiom
  if (hostname.startsWith('axiom.') && !path.startsWith('/axiom') && !path.startsWith('/api') && !path.startsWith('/_next')) {
    const url = req.nextUrl.clone();
    // With basePath '/codex', the actual page is at /codex/axiom
    url.pathname = `${BASEPATH}/axiom`;
    url.search = req.nextUrl.search;
    return NextResponse.rewrite(url);
  }

  // ── 3. Admin auth gate ────────────────────────────────────────────────────
  // Always allow: login page and auth callback
  if (path.startsWith('/admin/login') || path.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // Only gate /admin routes
  if (!path.startsWith('/admin')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createProxyClient(req, res);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(`${BASEPATH}/admin/login`, req.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Only allow admin or known reviewers
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const service = createServiceClient();
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!reviewer) {
      return NextResponse.redirect(new URL(`${BASEPATH}/admin/login?error=unauthorized`, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};
