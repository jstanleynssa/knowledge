import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — respects RLS (published pages only)
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Service client — bypasses RLS; for ingest scripts + admin review UI only
// NEVER expose service role key to the browser
export function createServiceClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set. Service client unavailable.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// Convenience: public client for use in Server Components
export const supabase = createPublicClient();
