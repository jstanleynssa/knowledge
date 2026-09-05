/**
 * POST /api/axiom/provision
 * Zapier webhook endpoint for Kajabi purchase/cancellation events.
 *
 * Actions:
 *   provision  → new purchase, set status = 'active'
 *   revoke     → cancellation, set status = 'cancelled'
 *   past_due   → failed payment, set status = 'past_due'
 *
 * Required header: x-axiom-secret: <AXIOM_PROVISION_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

type Action = 'provision' | 'revoke' | 'past_due';
type Tier   = 'standard' | 'arpi_grad' | 'firm' | 'staff';

interface ProvisionBody {
  action:              Action;
  email:               string;
  tier?:               Tier;
  kajabi_purchase_id?: string;
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.AXIOM_PROVISION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const incoming = req.headers.get('x-axiom-secret');
  if (incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: ProvisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, email, tier, kajabi_purchase_id } = body;

  if (!action || !email) {
    return NextResponse.json({ error: 'Missing action or email' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sb = createServiceClient();

  // ── Handle actions ────────────────────────────────────────────────────────
  if (action === 'provision') {
    const { error } = await sb
      .from('axiom_subscribers')
      .upsert(
        {
          email:               normalizedEmail,
          tier:                tier ?? 'standard',
          role:                'subscriber',
          status:              'active',
          kajabi_purchase_id:  kajabi_purchase_id ?? null,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[axiom/provision] upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[axiom/provision] provisioned: ${normalizedEmail} (${tier ?? 'standard'})`);
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  if (action === 'revoke') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[axiom/provision] revoke error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[axiom/provision] revoked: ${normalizedEmail}`);
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  if (action === 'past_due') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[axiom/provision] past_due error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[axiom/provision] past_due: ${normalizedEmail}`);
    return NextResponse.json({ ok: true, action, email: normalizedEmail });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
