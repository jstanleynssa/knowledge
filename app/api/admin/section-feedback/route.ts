'use server';

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
