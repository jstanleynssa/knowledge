/**
 * GET /api/admin/coverage-stats
 *
 * Public, unauthenticated endpoint — returns aggregate corpus coverage counts.
 * No sensitive data (just rule counts and percentages).
 *
 * Used by:
 *   - corpus-cluster.html (static visualization, fetches on load)
 *   - Any future dashboard or embed
 */
import { NextResponse } from 'next/server';
import { getCoverageStats } from '@/lib/coverage-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await getCoverageStats();
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
