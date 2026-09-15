/**
 * GET  /api/axiom/conversations  — list user's conversations (no turns, just metadata)
 * POST /api/axiom/conversations  — create a new conversation
 *
 * Auth: Supabase session + active axiom_subscribers row.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

async function getSubscriberEmail(req: NextRequest): Promise<string | null> {
  try {
    const session = await createSessionClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user?.email) return null;
    const email = user.email.toLowerCase();
    const sb = createServiceClient();
    const { data: sub } = await sb
      .from('axiom_subscribers')
      .select('status')
      .eq('email', email)
      .single();
    return sub?.status === 'active' ? email : null;
  } catch {
    return null;
  }
}

// GET — return metadata list (no turns payload — keeps response small)
export async function GET(req: NextRequest) {
  const email = await getSubscriberEmail(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_conversations')
    .select('id, title, pinned, client_id, created_at, updated_at')
    .eq('user_email', email)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

// POST — create a new conversation, return its id
export async function POST(req: NextRequest) {
  const email = await getSubscriberEmail(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, turns } = await req.json().catch(() => ({}));
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_conversations')
    .insert({
      user_email: email,
      title:      (title ?? 'New conversation').slice(0, 80),
      turns:      turns ?? [],
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
