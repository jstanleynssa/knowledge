/**
 * /admin/my-feedback — Reviewer's personal feedback history
 *
 * Shows all feedback the logged-in reviewer has submitted, grouped by page.
 * Each entry is editable and resubmittable.
 */
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { MyFeedbackClient } from './MyFeedbackClient';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export const dynamic = 'force-dynamic';

export default async function MyFeedbackPage() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login?next=/admin/my-feedback');

  const service = createServiceClient();

  // Resolve reviewer name
  let reviewerName = 'Jason Stanley';
  if (user.email !== ADMIN_EMAIL) {
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('display_name')
      .eq('email', user.email)
      .single();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
    reviewerName = reviewer.display_name;
  }

  // Fetch all feedback for this reviewer, newest first
  const { data } = await service
    .from('section_feedback')
    .select('id, page_id, page_slug, page_title, section_type, section_index, section_heading, feedback_type, note, created_at')
    .eq('reviewer_name', reviewerName)
    .order('created_at', { ascending: false });

  // Deduplicate: most recent per (page_id, section_type, section_index)
  type FeedbackRow = {
    id: string;
    page_id: string;
    page_slug: string;
    page_title: string;
    section_type: string;
    section_index: number;
    section_heading: string | null;
    feedback_type: 'verified' | 'flag';
    note: string | null;
    created_at: string;
  };

  const seen = new Set<string>();
  const latest: FeedbackRow[] = ((data ?? []) as FeedbackRow[]).filter(row => {
    const key = `${row.page_id}:${row.section_type}:${row.section_index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by page
  const pageMap = new Map<string, { page_id: string; page_slug: string; page_title: string; entries: FeedbackRow[] }>();
  for (const row of latest) {
    const key = row.page_id ?? row.page_slug;
    if (!pageMap.has(key)) {
      pageMap.set(key, { page_id: row.page_id, page_slug: row.page_slug, page_title: row.page_title, entries: [] });
    }
    pageMap.get(key)!.entries.push(row);
  }

  const pages = Array.from(pageMap.values());

  return <MyFeedbackClient reviewerName={reviewerName} pages={pages} />;
}
