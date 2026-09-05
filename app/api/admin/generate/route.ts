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
import { runDraft } from '@/scripts/draft/draft_page_v2';

export const maxDuration = 300; // 5 minutes — allow full draft pipeline to complete

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

  async function spawnDraft(
    topic: { slug: string; title: string; topic: string; category: string },
    sourcesFilter?: string[]
  ) {
    return runDraft({
      topic:             topic.topic,
      title:             topic.title,
      slug:              topic.slug,
      category:          topic.category as any,
      skipWorkedExample: true,
      ...(sourcesFilter && sourcesFilter.length > 0 ? { sourcesFilter: sourcesFilter as any } : {}),
    });
  }

  // ── Custom topic mode ─────────────────────────────────────────────────────
  if (body.custom) {
    const title    = (body.title as string | undefined)?.trim();
    const topic    = (body.topic as string | undefined)?.trim();
    const category = (body.category as string | undefined) ?? 'social-security';

    if (!title || !topic) {
      return NextResponse.json({ error: 'title and topic are required for custom generation.' }, { status: 400 });
    }

    // Prefer the slug passed from the topic list (codex_topics.slug).
    // Fall back to deriving from title only when no slug is supplied.
    const providedSlug = (body.slug as string | undefined)?.trim();
    const slug = providedSlug || title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    // Enqueue job — the local queue worker picks it up and runs the full pipeline.
    // This avoids the Cloudflare Worker proxy timeout on long-running generation.
    const { data: job, error: jobErr } = await service
      .from('generation_jobs')
      .insert({ title, slug, topic, category, requested_by: user.email })
      .select('id')
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Failed to enqueue generation job' }, { status: 500 });
    }

    return NextResponse.json({
      queued:  [slug],
      jobId:   job.id,
      async:   true,
      message: `"${title}" queued for generation. It will be ready to review in about a minute.`,
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
  const errors: string[] = [];
  for (const topic of candidates) {
    queued.push(topic.slug);
    try {
      await spawnDraft(topic);
    } catch (e) {
      console.error(`Draft error for ${topic.slug}:`, e);
      errors.push(topic.slug);
    }
  }

  const succeeded = queued.filter(s => !errors.includes(s));
  return NextResponse.json({
    queued: succeeded,
    remaining: TOPIC_QUEUE.filter(t => !existingSlugs.has(t.slug)).length - succeeded.length,
    message: succeeded.length > 0
      ? `Generated ${succeeded.length} page${succeeded.length !== 1 ? 's' : ''} — check the Needs Review queue.`
      : 'Generation failed — check server logs.',
  });
}
