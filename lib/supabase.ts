import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
  return url;
}

function getAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  return key;
}

// Public client — respects RLS (published pages only)
export function createPublicClient() {
  return createClient(getUrl(), getAnonKey());
}

// Service client — bypasses RLS; for ingest scripts + admin review UI only
// NEVER expose service role key to the browser
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(getUrl(), key, {
    auth: { persistSession: false },
  });
}

// Session client — reads/writes Supabase auth session from cookies
// Use in Server Components, Server Actions, and Route Handlers
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — cookies are read-only there.
          // The proxy will handle refreshing the session cookie.
        }
      },
    },
  });
}

// Proxy client — for use inside proxy.ts only; mutates request + response cookies
export function createProxyClient(req: NextRequest, res: NextResponse) {
  return createServerClient(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });
}
