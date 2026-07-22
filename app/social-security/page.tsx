/**
 * /social-security — Social Security category index
 * Lists all published Social Security reference pages, grouped by eyebrow topic.
 * Supports ?topic= query param to highlight / filter by eyebrow.
 */
import { createPublicClient } from '@/lib/supabase';
import type { ReferencePage } from '@/lib/types';
import { CategoryIndex } from '@/components/CategoryIndex';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Social Security Reference | NSSA Knowledge Base',
  description:
    'Authoritative Social Security rules for financial advisors — claiming rules, spousal benefits, survivor benefits, WEP, GPO, and more. Verified against SSA POMS.',
};

export default async function SocialSecurityIndex({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const supabase = createPublicClient();

  const { data } = await supabase
    .from('reference_pages')
    .select('id, slug, title, h1, eyebrow, meta_description, date_modified')
    .eq('category', 'social-security')
    .eq('status', 'published')
    .order('eyebrow', { ascending: true })
    .order('title', { ascending: true });

  return (
    <CategoryIndex
      category="social-security"
      categoryLabel="Social Security"
      categoryPath="/social-security"
      pages={(data ?? []) as Partial<ReferencePage>[]}
      activeTopic={topic}
      description="Authoritative rules for Social Security claiming, spousal and survivor benefits, earnings test, WEP, and GPO — verified against the SSA Program Operations Manual System (POMS)."
    />
  );
}
