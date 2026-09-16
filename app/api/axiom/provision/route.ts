/**
 * POST /api/axiom/provision
 * Internal webhook endpoint for Kajabi purchase/cancellation events.
 * (Currently used by Zapier; direct Kajabi webhooks go to /api/axiom/kajabi-webhook.)
 *
 * Actions:
 *   provision  → new purchase or trial→paid upgrade; status = 'active'
 *   trial      → trial purchase; status = 'trialing', trial_ends_at = now + 7d
 *   revoke     → cancellation; status = 'cancelled'
 *   past_due   → failed payment; status = 'past_due'
 *
 * Required header: x-axiom-secret: <AXIOM_PROVISION_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { runProvision } from '@/lib/axiom-provision';
import type { Action, Tier } from '@/lib/axiom-provision';

interface ProvisionBody {
  action:              Action;
  email:               string;
  tier?:               Tier;
  name?:               string;
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

  const { action, email, tier, name, kajabi_purchase_id } = body;

  if (!action || !email) {
    return NextResponse.json({ error: 'Missing action or email' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ── Delegate to shared provisioning logic ─────────────────────────────────
  const result = await runProvision({
    action,
    email: normalizedEmail,
    tier,
    name,
    kajabi_purchase_id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode ?? 500 });
  }

  return NextResponse.json({ ok: true, action, email: normalizedEmail });
}
