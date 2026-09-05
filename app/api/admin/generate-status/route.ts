/**
 * GET /api/admin/generate-status?job_id=xxx
 * Returns the status of a generation job for UI polling.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jobId = req.nextUrl.searchParams.get('job_id');
  if (!jobId) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

  const service = createServiceClient();
  const { data: job, error } = await service
    .from('generation_jobs')
    .select('id, status, page_id, error, created_at, started_at, finished_at, title')
    .eq('id', jobId)
    .single();

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json({ ok: true, job });
}
