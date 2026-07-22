/**
 * POST /api/admin/generate
 *
 * Pull the next N ungenerated topics from the topic queue and spawn
 * page generation for each. Saves directly to in_review.
 *
 * Body: { category?: 'social-security' | 'irmaa', count?: number }
 * Returns: { queued: string[], skipped: string[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { TOPIC_QUEUE } from '@/lib/topic-queue';
import { spawn } from 'child_process';
import path from 'path';

const ADMIN_EMAIL    = 'jstanley@nssapros.com';
const DEFAULT_COUNT  = 5;
const MAX_COUNT      = 10; // hard ceiling — tranche discipline

export async function POST(req: NextRequest) {
  // Auth
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const { data: reviewer } = await service.from('kb_reviewers').select('display_name').eq('email', user.email).single();
    if (!reviewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const category = body.category as 'social-security' | 'irmaa' | undefined;
  const count    = Math.min(body.count ?? DEFAULT_COUNT, MAX_COUNT);

  // Find which slugs already exist in the DB
  const { data: existing } = await service
    .from('reference_pages')
    .select('slug');
  const existingSlugs = new Set((existing ?? []).map(r => r.slug));

  // Filter topic queue: right category, not yet generated
  const candidates = TOPIC_QUEUE.filter(t =>
    (!category || t.category === category) &&
    !existingSlugs.has(t.slug)
  );

  if (candidates.length === 0) {
    return NextResponse.json({ queued: [], skipped: [], message: 'No new topics available for this category.' });
  }

  const batch = candidates.slice(0, count);
  const queued: string[] = [];

  const scriptPath = path.join(process.cwd(), 'scripts/draft/draft_page_v2.ts');
  const envFile    = path.join(process.cwd(), '.env.local');

  for (const topic of batch) {
    queued.push(topic.slug);

    // Spawn each generation as a detached background process
    const env = {
      ...process.env,
      TOPIC:               topic.topic,
      TITLE:               topic.title,
      SLUG:                topic.slug,
      CATEGORY:            topic.category,
      SKIP_WORKED_EXAMPLE: 'true',
    };

    const child = spawn(
      'npx',
      ['tsx', '--tsconfig', 'tsconfig.json', `--env-file=${envFile}`, scriptPath],
      {
        cwd:      process.cwd(),
        env,
        detached: true,
        stdio:    'ignore',
      }
    );
    child.unref(); // don't wait for it
  }

  return NextResponse.json({
    queued,
    remaining: candidates.length - batch.length,
    message:   `Generating ${batch.length} page${batch.length !== 1 ? 's' : ''} in background — they'll appear in the queue shortly.`,
  });
}
