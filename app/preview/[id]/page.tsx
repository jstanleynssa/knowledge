/**
 * /preview/[id] — Draft page preview (noindex, service-client, any status)
 */
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { ReferencePageComponent } from '@/components/ReferencePage';
import type { ReferencePage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) notFound();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('reference_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  return <ReferencePageComponent page={data as ReferencePage} previewMode={true} />;
}
