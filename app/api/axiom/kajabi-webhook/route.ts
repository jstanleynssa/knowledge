/**
 * POST /api/axiom/kajabi-webhook
 * Direct Kajabi subscription webhook handler for the AXIOM offer (ID: 2151386538).
 *
 * Auth: x-kajabi-token header must equal KAJABI_AXIOM_WEBHOOK_SECRET.
 *
 * Always returns 200 { ok: true } — Kajabi retries on non-2xx responses, so
 * we log errors internally rather than surfacing them as HTTP failures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runProvision } from '@/lib/axiom-provision';
import type { Action } from '@/lib/axiom-provision';

const AXIOM_OFFER_ID = '2151386538';

/**
 * Safely pluck a string value from a deeply-nested unknown object.
 * Returns '' if any segment is missing or not an object.
 */
function pluck(obj: unknown, ...path: string[]): string {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return '';
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur != null ? String(cur) : '';
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret   = process.env.KAJABI_AXIOM_WEBHOOK_SECRET;
  const incoming = req.headers.get('x-kajabi-token');

  if (!secret || incoming !== secret) {
    console.error('[kajabi-webhook] Unauthorized — bad or missing x-kajabi-token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    console.warn('[kajabi-webhook] Failed to parse JSON body');
    return NextResponse.json({ ok: true, skipped: 'unparseable body' });
  }

  const eventType =
    pluck(body, 'event') ||
    pluck(body, 'event_type') ||
    pluck(body, 'type');

  console.log(
    '[kajabi-webhook] event:', eventType,
    JSON.stringify(body).slice(0, 300)
  );

  // ── Field extraction ──────────────────────────────────────────────────────
  const email = (
    pluck(body, 'member',   'email') ||
    pluck(body, 'purchase', 'email') ||
    pluck(body, 'email')             ||
    pluck(body, 'data',     'email')
  ).toLowerCase().trim();

  const firstName =
    pluck(body, 'member',   'first_name') ||
    pluck(body, 'purchase', 'first_name');
  const lastName =
    pluck(body, 'member',   'last_name') ||
    pluck(body, 'purchase', 'last_name');
  const name = `${firstName} ${lastName}`.trim() || undefined;

  const purchaseId =
    pluck(body, 'purchase', 'id') ||
    pluck(body, 'id')             ||
    pluck(body, 'data',     'id');

  const offerId =
    pluck(body, 'purchase', 'offer_id') ||
    pluck(body, 'offer_id')             ||
    pluck(body, 'data',     'offer_id');

  // Detect trial purchase (check both purchase and data sub-objects)
  const purchaseObj =
    typeof body.purchase === 'object' && body.purchase !== null
      ? (body.purchase as Record<string, unknown>)
      : null;
  const dataObj =
    typeof body.data === 'object' && body.data !== null
      ? (body.data as Record<string, unknown>)
      : null;

  const isTrial = !!(
    purchaseObj?.trial_period ||
    purchaseObj?.is_trial     ||
    body.trial_end_at         ||
    dataObj?.trial_end_at
  );

  // ── Map event type → action ───────────────────────────────────────────────
  let action: Action | null = null;

  switch (eventType) {
    case 'purchase_created':
    case 'offer_purchase':
      // Guard: skip if this event belongs to a different offer
      if (offerId && offerId !== AXIOM_OFFER_ID) {
        console.log(
          `[kajabi-webhook] skipping — offer ${offerId} is not AXIOM (${AXIOM_OFFER_ID})`
        );
        return NextResponse.json({ ok: true, skipped: 'wrong offer' });
      }
      action = isTrial ? 'trial' : 'provision';
      break;

    case 'subscription_activated':
    case 'subscription.activated':
      // Trial converted to paid subscription
      action = 'provision';
      break;

    case 'subscription_deactivated':
    case 'subscription_cancelled':
    case 'subscription.cancelled':
      action = 'revoke';
      break;

    case 'billing_failed':
    case 'subscription_billing_failed':
      action = 'past_due';
      break;

    default:
      console.log(`[kajabi-webhook] unhandled event type: "${eventType}"`);
      return NextResponse.json({ ok: true, skipped: `unhandled event: ${eventType}` });
  }

  if (!email) {
    console.warn(`[kajabi-webhook] no email in payload for event: ${eventType}`);
    return NextResponse.json({ ok: true, skipped: 'no email in payload' });
  }

  // ── Run provisioning logic ────────────────────────────────────────────────
  try {
    const result = await runProvision({
      action,
      email,
      name,
      kajabi_purchase_id: purchaseId || undefined,
    });

    if (!result.ok) {
      console.error(
        `[kajabi-webhook] provision error for ${email} (${action}):`,
        result.error
      );
    }
  } catch (err) {
    console.error('[kajabi-webhook] unhandled error:', err);
  }

  // Always return 200 — Kajabi retries on non-2xx
  return NextResponse.json({ ok: true });
}
