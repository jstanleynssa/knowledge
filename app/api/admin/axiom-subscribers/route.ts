/**
 * POST /api/admin/axiom-subscribers
 * Admin-only subscriber management. Protected by proxy.ts (admin session required).
 *
 * Actions:
 *   provision  — add or reactivate a subscriber
 *   revoke     — cancel a subscriber
 *   past_due   — mark past_due
 *   update_tier — change tier without touching status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

async function requireAdmin(req: NextRequest): Promise<string | null> {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user.email;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action, email, tier, role } = body;

  if (!action || !email) {
    return NextResponse.json({ error: 'Missing action or email' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sb = createServiceClient();

  if (action === 'provision') {
    const { error } = await sb
      .from('axiom_subscribers')
      .upsert(
        {
          email:      normalizedEmail,
          name:       body.name ?? null,
          tier:       tier ?? 'standard',
          role:       role ?? 'subscriber',
          status:     'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  if (action === 'revoke') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  if (action === 'activate') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  if (action === 'update_tier') {
    if (!tier) return NextResponse.json({ error: 'Missing tier' }, { status: 400 });
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
