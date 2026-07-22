/**
 * /irmaa — IRMAA category index
 */
import { createPublicClient } from '@/lib/supabase';
import type { ReferencePage } from '@/lib/types';
import { CategoryIndex } from '@/components/CategoryIndex';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'IRMAA & Medicare Reference | NSSA Knowledge Base',
  description:
    'Authoritative IRMAA and Medicare rules for financial advisors — income thresholds, appeals, Part B and Part D surcharges. Verified against SSA POMS.',
};

export default async function IrmaaIndex({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const supabase = createPublicClient();

  const { data } = await supabase
    .from('reference_pages')
    .select('id, slug, title, h1, eyebrow, meta_description, date_modified')
    .eq('category', 'irmaa')
    .eq('status', 'published')
    .order('eyebrow', { ascending: true })
    .order('title', { ascending: true });

  return (
    <CategoryIndex
      category="irmaa"
      categoryLabel="IRMAA & Medicare"
      categoryPath="/irmaa"
      pages={(data ?? []) as Partial<ReferencePage>[]}
      activeTopic={topic}
      description="Authoritative IRMAA income thresholds, Medicare Part B and Part D surcharges, life-changing event appeals, and enrollment rules — verified against SSA POMS."
    />
  );
}
