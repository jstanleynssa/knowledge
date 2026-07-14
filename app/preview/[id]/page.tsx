/**
 * /preview/[id] — Draft page preview
 *
 * Renders any reference_page regardless of status, using the service client.
 * Intended for SME review in members.nssapros.com/admin/kb-review.
 * Shows a prominent "PREVIEW" banner so it's never confused with a live page.
 * Not indexed by search engines (noindex in head).
 */

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { ReferencePageComponent } from '@/components/ReferencePage';
import type { ReferencePage } from '@/lib/types';

// Always server-render — never cache preview pages
export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

const previewBannerCss = `
.preview-banner{
  position:sticky;top:0;z-index:999;
  background:#1e40af;color:#fff;
  padding:10px 24px;
  font-family:ui-sans-serif,system-ui,sans-serif;
  font-size:13px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  border-bottom:3px solid #1d4ed8;
}
.preview-banner strong{font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase}
.preview-banner .meta{color:#bfdbfe;font-size:12px}
.preview-banner .status{background:#1d4ed8;border:1px solid #3b82f6;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600}
`;

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate UUID format before hitting DB
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) notFound();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const page = data as ReferencePage;

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    approved: 'Approved — not yet published',
    published: 'Published',
    superseded: 'Superseded',
    retired: 'Retired',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: previewBannerCss }} />
      <div className="preview-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong>⚠ Preview</strong>
          <span className="meta">This page is not live. For review purposes only.</span>
        </div>
        <span className="status">{STATUS_LABELS[page.status] ?? page.status}</span>
      </div>
      <ReferencePageComponent page={page} />
    </>
  );
}
