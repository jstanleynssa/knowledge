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

  const scriptPath = path.join(process.cwd(), 'scripts/draft/draft_page_v2.ts');
  const envFile    = path.join(process.cwd(), '.env.local');

  function spawnDraft(topic: { slug: string; title: string; topic: string; category: string }) {
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
      { cwd: process.cwd(), env, detached: true, stdio: 'ignore' },
    );
    child.unref();
  }

  // ── Custom topic mode ─────────────────────────────────────────────────────
  if (body.custom) {
    const title    = (body.title as string | undefined)?.trim();
    const topic    = (body.topic as string | undefined)?.trim();
    const category = (body.category as string | undefined) ?? 'social-security';

    if (!title || !topic) {
      return NextResponse.json({ error: 'title and topic are required for custom generation.' }, { status: 400 });
    }

    // Derive a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    spawnDraft({ slug, title, topic, category });

    return NextResponse.json({
      queued:  [slug],
      remaining: 0,
      message: `Generating "${title}" in background — it'll appear in the Needs Review queue shortly.`,
    });
  }

  // ── Queue mode: specific slugs selected by reviewer ──────────────────────
  const requestedSlugs = body.slugs as string[] | undefined;
  const category       = body.category as 'social-security' | 'irmaa' | undefined;
  const count          = Math.min(body.count ?? DEFAULT_COUNT, MAX_COUNT);

  // Find which slugs already exist in the DB
  const { data: existing } = await service
    .from('reference_pages')
    .select('slug');
  const existingSlugs = new Set((existing ?? []).map(r => r.slug));

  let candidates;
  if (requestedSlugs && requestedSlugs.length > 0) {
    // Reviewer explicitly selected specific topics — use them in order, skip already-existing
    const bySlug = new Map(TOPIC_QUEUE.map(t => [t.slug, t]));
    candidates = requestedSlugs
      .filter(s => !existingSlugs.has(s) && bySlug.has(s))
      .map(s => bySlug.get(s)!);
  } else {
    // Fallback: take next N by category from queue
    candidates = TOPIC_QUEUE.filter(t =>
      (!category || t.category === category) &&
      !existingSlugs.has(t.slug)
    ).slice(0, count);
  }

  if (candidates.length === 0) {
    return NextResponse.json({ queued: [], skipped: [], message: 'No new topics available — those may already exist.' });
  }

  const queued: string[] = [];
  for (const topic of candidates) {
    queued.push(topic.slug);
    spawnDraft(topic);
  }

  return NextResponse.json({
    queued,
    remaining: TOPIC_QUEUE.filter(t => !existingSlugs.has(t.slug)).length - queued.length,
    message:   `Generating ${queued.length} page${queued.length !== 1 ? 's' : ''} in background — they'll appear in the Needs Review queue shortly.`,
  });
}
