/**
 * /api/publish-webhook — Publish approved pages
 *
 * Called by a scheduler (cron job, Supabase pg_cron, or external trigger)
 * to drip-publish approved reference_pages rows, then trigger a Vercel rebuild.
 *
 * Auth: Bearer token in Authorization header (PUBLISH_WEBHOOK_SECRET env var)
 *
 * POST /api/publish-webhook
 * Body: {} (no body needed; processes all 'approved' rows)
 *
 * Response: { published: string[] } — slugs that were published
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Auth check
  const secret = process.env.PUBLISH_WEBHOOK_SECRET;
  const authHeader = req.headers.get('authorization') ?? '';
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch approved pages
  const { data: approved, error: fetchErr } = await supabase
    .from('reference_pages')
    .select('id, slug')
    .eq('status', 'approved');

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!approved || approved.length === 0) {
    return NextResponse.json({ published: [], message: 'No approved pages to publish' });
  }

  // Mark as published
  const ids = approved.map((r) => r.id);
  const { error: updateErr } = await supabase
    .from('reference_pages')
    .update({
      status: 'published',
      date_published: today,
      date_modified: today,
    })
    .in('id', ids);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const slugs = approved.map((r) => r.slug);
  console.log(`Published ${slugs.length} pages: ${slugs.join(', ')}`);

  // Trigger Vercel rebuild via deploy hook
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (deployHook) {
    try {
      await fetch(deployHook, { method: 'POST' });
      console.log('Vercel deploy hook triggered');
    } catch (err) {
      console.error('Deploy hook failed:', err);
      // Non-fatal: pages are marked published, rebuild will happen on next deployment
    }
  }

  return NextResponse.json({ published: slugs });
}
