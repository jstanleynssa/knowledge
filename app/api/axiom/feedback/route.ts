/**
 * POST /api/axiom/feedback
 * Subscriber-submitted per-answer quality feedback (thumbs up/down + optional comment).
 * Requires an active Supabase session + active axiom_subscribers row.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // ── Auth: must be an authenticated subscriber ─────────────────────────────
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.email.toLowerCase();
  const sb    = createServiceClient();

  // Verify active subscription
  const { data: sub } = await sb
    .from('axiom_subscribers')
    .select('status')
    .eq('email', email)
    .single();

  if (!sub || sub.status !== 'active') {
    return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { question: string; answer_excerpt?: string; rating: string; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question, answer_excerpt, rating, comment } = body;

  if (!question || !rating || !['positive', 'negative'].includes(rating)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  const { error } = await sb.from('axiom_feedback').insert({
    user_email:     email,
    question:       question.slice(0, 2000),
    answer_excerpt: answer_excerpt ? answer_excerpt.slice(0, 500) : null,
    rating,
    comment:        comment ? comment.slice(0, 1000) : null,
  });

  if (error) {
    console.error('[axiom/feedback] insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
