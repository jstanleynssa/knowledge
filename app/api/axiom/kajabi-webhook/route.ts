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

// Kajabi pings the endpoint with a GET to verify it's live before activating
export async function GET() {
  return NextResponse.json({ ok: true, service: 'axiom-kajabi-webhook' });
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.KAJABI_AXIOM_WEBHOOK_SECRET;
  // Kajabi may send the secret in different locations depending on webhook config
  const url = req.nextUrl;
  const incoming =
    req.headers.get('x-kajabi-token') ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    url.searchParams.get('secret') ||
    url.searchParams.get('token');

  console.log('[kajabi-webhook] incoming secret present:', !!incoming, 'expected:', !!secret);

  if (!secret || incoming !== secret) {
    console.error('[kajabi-webhook] Unauthorized — bad or missing secret. Header keys:', [...req.headers.keys()].join(', '));
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

  // ── Field extraction — confirmed Kajabi payload shapes ───────────────────
  // order.created:     { order:{id, order_items:[{id:offer_id, unit_cost}]}, payment_transaction:{customer:{email}} }
  // payment.succeeded: { offer:{id}, member:{email, first_name, last_name}, payment_transaction:{} }

  const orderObj   = (body.order   ?? null) as Record<string, unknown> | null;
  const memberObj  = (body.member  ?? null) as Record<string, unknown> | null;
  const offerObj   = (body.offer   ?? null) as Record<string, unknown> | null;
  const ptObj      = (body.payment_transaction ?? null) as Record<string, unknown> | null;
  const ptCustomer = (ptObj?.customer ?? null) as Record<string, unknown> | null;
  const orderItems = Array.isArray(orderObj?.order_items)
    ? (orderObj!.order_items as Record<string, unknown>[])
    : [];
  const firstItem  = orderItems[0] ?? null;

  const email = (
    (memberObj?.email  as string) ||       // payment.succeeded
    (ptCustomer?.email as string) ||       // order.created
    pluck(body, 'email') ||
    pluck(body, 'data', 'email')
  ).toLowerCase().trim();

  const firstName = (memberObj?.first_name as string) || '';
  const lastName  = (memberObj?.last_name  as string) || '';
  const name      = `${firstName} ${lastName}`.trim() || undefined;

  const purchaseId = String(orderObj?.id || ptObj?.id || pluck(body, 'id') || '');

  const offerId = String(
    offerObj?.id   ||   // payment.succeeded
    firstItem?.id  ||   // order.created
    pluck(body, 'offer_id') || ''
  );

  // Trial: unit_cost === 0 in order.created → free trial period
  const isTrial = firstItem !== null && Number(firstItem?.unit_cost ?? -1) === 0;

  // ── Map event type → action ───────────────────────────────────────────────
  let action: Action | null = null;

  switch (eventType) {
    // Kajabi "Cart Purchase" event
    case 'order.created':
    case 'purchase_created':
    case 'offer_purchase':
      if (offerId && offerId !== AXIOM_OFFER_ID) {
        console.log(`[kajabi-webhook] skipping — offer ${offerId} !== AXIOM`);
        return NextResponse.json({ ok: true, skipped: 'wrong offer' });
      }
      action = isTrial ? 'trial' : 'provision';
      break;

    // Kajabi "Payment Successful" event
    case 'payment.succeeded':
    case 'subscription_activated':
    case 'subscription.activated':
      if (offerId && offerId !== AXIOM_OFFER_ID) {
        console.log(`[kajabi-webhook] skipping — offer ${offerId} !== AXIOM`);
        return NextResponse.json({ ok: true, skipped: 'wrong offer' });
      }
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
