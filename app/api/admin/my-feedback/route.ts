/**
 * /api/admin/my-feedback
 *
 * GET  — returns all feedback submitted by the logged-in reviewer, most recent per section,
 *         grouped by page. Used by the My Feedback dashboard.
 * POST — resubmits updated feedback (inserts a new row; dedup keeps the latest).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

async function getReviewerName(userEmail: string): Promise<string | null> {
  if (userEmail === ADMIN_EMAIL) return 'Jason Stanley';
  const service = createServiceClient();
  const { data } = await service
    .from('kb_reviewers')
    .select('display_name')
    .eq('email', userEmail)
    .single();
  return data?.display_name ?? null;
}

export async function GET(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviewerName = await getReviewerName(user.email);
  if (!reviewerName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  // Fetch all feedback for this reviewer, newest first
  const { data, error } = await service
    .from('section_feedback')
    .select('id, page_id, page_slug, page_title, section_type, section_index, section_heading, feedback_type, note, created_at')
    .eq('reviewer_name', reviewerName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate: keep most recent per (page_id, section_type, section_index)
  const seen = new Set<string>();
  const latest = (data ?? []).filter(row => {
    const key = `${row.page_id}:${row.section_type}:${row.section_index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by page
  const pages = new Map<string, { page_id: string; page_slug: string; page_title: string; entries: typeof latest }>();
  for (const row of latest) {
    const key = row.page_id ?? row.page_slug;
    if (!pages.has(key)) {
      pages.set(key, { page_id: row.page_id, page_slug: row.page_slug, page_title: row.page_title, entries: [] });
    }
    pages.get(key)!.entries.push(row);
  }

  return NextResponse.json({ ok: true, reviewerName, pages: Array.from(pages.values()) });
}

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviewerName = await getReviewerName(user.email);
  if (!reviewerName) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { page_id, page_slug, page_title, section_type, section_index, section_heading, feedback_type, note } = body;

  if (!section_type || feedback_type === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();
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
