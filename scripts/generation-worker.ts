/**
 * generation-worker.ts — Local queue worker for async page generation.
 *
 * Polls the generation_jobs table for pending jobs, runs the draft pipeline
 * locally (no Vercel timeout), and updates the job record when done.
 *
 * Run via cron every minute:
 *   * * * * * cd /Users/nssaagent/knowledge && npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/generation-worker.ts >> /tmp/generation-worker.log 2>&1
 */

import { createServiceClient } from '@/lib/supabase';
import { runDraft } from '@/scripts/draft/draft_page_v2';

async function main() {
  const supabase = createServiceClient();

  // Claim one pending job atomically
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(1);

  if (!jobs || jobs.length === 0) {
    console.log(`[${new Date().toISOString()}] No pending jobs.`);
    return;
  }

  const job = jobs[0];
  console.log(`[${new Date().toISOString()}] Starting job ${job.id}: "${job.title}"`);

  // Mark running
  await supabase
    .from('generation_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id)
    .eq('status', 'pending'); // guard against double-pickup

  try {
    const result = await runDraft({
      topic:             job.topic,
      title:             job.title,
      slug:              job.slug,
      category:          job.category as 'social-security' | 'irmaa',
      skipWorkedExample: true,
    });

    // Sync codex_topics status → in_review, but ONLY if not already published.
    // A reviewer may have approved the topic while generation was running;
    // clobbering 'published' back to 'in_review' would cause the exact
    // "work disappeared" bug seen 2026-08-31.
    const { data: existingTopic } = await supabase
      .from('codex_topics')
      .select('status')
      .eq('slug', job.slug)
      .single();

    if (existingTopic?.status !== 'published') {
      await supabase
        .from('codex_topics')
        .update({ status: 'in_review' })
        .eq('slug', job.slug);
    } else {
      console.warn(
        `[worker] Job ${job.id}: codex_topics "${job.slug}" is already published. ` +
        `Skipping in_review reset to avoid overwriting approved work.`
      );
    }

    await supabase
      .from('generation_jobs')
      .update({
        status:      'done',
        page_id:     result?.id ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`[${new Date().toISOString()}] ✓ Job ${job.id} done. Page: ${result?.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${new Date().toISOString()}] ✗ Job ${job.id} failed: ${msg}`);
    await supabase
      .from('generation_jobs')
      .update({
        status:      'error',
        error:       msg,
        finished_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}

main().catch(err => {
  console.error('Worker fatal error:', err);
  process.exit(1);
});
