/**
 * /admin/kb-review/[id] — SME review screen
 *
 * Server component: auth + data fetch.
 * Delegates all interaction to ReviewEditor (client component).
 */

import { notFound, redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { Category, KbReviewer, ReferencePage } from '@/lib/types';
import { ReviewEditor } from './ReviewEditor';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export const dynamic = 'force-dynamic';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) notFound();

  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;

  // Fetch the page
  const { data: page, error } = await service
    .from('reference_pages')
    .select('*')
    .eq('id', id)
    .single<ReferencePage>();

  if (error || !page) notFound();

  // Determine reviewer display name + check category access
  let reviewerName = 'Jason Stanley';

  if (!isAdmin) {
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('display_name, categories')
      .eq('email', user.email)
      .single<KbReviewer>();

    if (!reviewer) redirect('/admin/login?error=unauthorized');

    if (!(reviewer.categories as Category[]).includes(page.category as Category)) {
      redirect('/admin/kb-review');
    }

    reviewerName = reviewer.display_name;
  }

  return <ReviewEditor page={page} reviewerName={reviewerName} />;
}
