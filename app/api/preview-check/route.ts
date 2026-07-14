/**
 * Temporary diagnostic route — DELETE after debugging
 * GET /api/preview-check?id=<uuid>
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';

  const checks: Record<string, unknown> = {
    id,
    has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  try {
    const supabase = createServiceClient();
    const { data, error, status } = await supabase
      .from('reference_pages')
      .select('id, slug, status')
      .eq('id', id)
      .single();

    checks.db_status = status;
    checks.db_error = error?.message ?? null;
    checks.data = data ?? null;
  } catch (err: any) {
    checks.client_error = err?.message ?? String(err);
  }

  return NextResponse.json(checks);
}
