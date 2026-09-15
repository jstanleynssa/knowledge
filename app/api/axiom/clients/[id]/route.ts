/**
 * PATCH  /api/axiom/clients/[id]  — rename a client
 * DELETE /api/axiom/clients/[id]  — delete (conversations revert to unassigned)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

async function getEmail(): Promise<string | null> {
  try {
    const session = await createSessionClient();
    const { data: { user } } = await session.auth.getUser();
    if (!user?.email) return null;
    const email = user.email.toLowerCase();
    const sb = createServiceClient();
    const { data: sub } = await sb.from('axiom_subscribers').select('status').eq('email', email).single();
    return sub?.status === 'active' ? email : null;
  } catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const sb = createServiceClient();
  const { error } = await sb
    .from('axiom_clients')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sb = createServiceClient();
  const { error } = await sb
    .from('axiom_clients')
    .delete()
    .eq('id', id)
    .eq('user_email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
