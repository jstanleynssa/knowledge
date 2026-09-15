/**
 * GET  /api/axiom/clients  — list user's clients
 * POST /api/axiom/clients  — create a new client
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

export async function GET(req: NextRequest) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_clients')
    .select('id, name, created_at')
    .eq('user_email', email)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(req: NextRequest) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_clients')
    .upsert({ user_email: email, name: name.trim() }, { onConflict: 'user_email,name' })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
