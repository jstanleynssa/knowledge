/**
 * GET    /api/axiom/conversations/[id]  — load full turns for one conversation
 * PATCH  /api/axiom/conversations/[id]  — update turns + title
 * DELETE /api/axiom/conversations/[id]  — delete a conversation
 *
 * Auth: Supabase session + active axiom_subscribers + must own the conversation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

async function getSubscriberEmail(): Promise<string | null> {
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

// GET — load full conversation (including turns)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSubscriberEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_conversations')
    .select('id, title, turns, created_at, updated_at')
    .eq('id', id)
    .eq('user_email', email)   // ownership check
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ conversation: data });
}

// PATCH — save updated turns (and optionally title) after each answer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSubscriberEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { turns, title, pinned, client_id } = body;

  const updates: Record<string, unknown> = {};
  if (turns  !== undefined) updates.turns  = turns;
  if (title  !== undefined) updates.title  = (title as string).slice(0, 80);
  if (pinned    !== undefined) updates.pinned    = Boolean(pinned);
  if ('client_id' in body)    updates.client_id = client_id ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const sb = createServiceClient();
  const { error } = await sb
    .from('axiom_conversations')
    .update(updates)
    .eq('id', id)
    .eq('user_email', email);   // ownership check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a conversation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSubscriberEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sb = createServiceClient();
  const { error } = await sb
    .from('axiom_conversations')
    .delete()
    .eq('id', id)
    .eq('user_email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
