/**
 * GET /api/admin/page-search?q=query
 *
 * Search published and draft reference pages by title/slug for the cross-reference picker.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ pages: [] });

  const service = createServiceClient();
  const { data, error } = await service
    .from('reference_pages')
    .select('id, title, slug, category, eyebrow, status')
    .in('status', ['published', 'draft', 'in_review'])
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%,eyebrow.ilike.%${q}%`)
    .order('status', { ascending: true }) // published first
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pages: data ?? [] });
}
