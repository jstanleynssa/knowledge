import { createClient } from '@supabase/supabase-js';

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
  return url;
}

// Public client — respects RLS (published pages only)
export function createPublicClient() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  return createClient(getUrl(), key);
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
