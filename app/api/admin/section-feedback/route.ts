import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  // Get reviewer display name
  let reviewerName = 'Jason Stanley';
  if (user.email !== ADMIN_EMAIL) {
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('display_name')
      .eq('email', user.email)
      .single();
    if (!reviewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    reviewerName = reviewer.display_name;
  }

  const body = await req.json().catch(() => ({}));
  const { page_id, page_slug, page_title, section_type, section_index, section_heading, feedback_type, note } = body;

  const { error } = await service.from('section_feedback').insert({
    page_id,
    page_slug,
    page_title,
    reviewer_name: reviewerName,
    section_type,
    section_index,
    section_heading,
    feedback_type,
    note: note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page_id = searchParams.get('page_id');
  if (!page_id) return NextResponse.json({ error: 'page_id required' }, { status: 400 });

  const service = createServiceClient();

  // Get the most recent feedback entry per (section_type, section_index)
  const { data, error } = await service
    .from('section_feedback')
    .select('section_type, section_index, feedback_type, reviewer_name, created_at')
    .eq('page_id', page_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate: keep only the most recent entry per (section_type, section_index)
  const seen = new Set<string>();
  const latest = (data ?? []).filter(row => {
    const key = `${row.section_type}:${row.section_index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ ok: true, feedback: latest });
}
