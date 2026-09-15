import { createClient } from '@supabase/supabase-js';

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

// Service client — bypasses RLS; for server-side use only
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(getUrl(), key, { auth: { persistSession: false } });
}
