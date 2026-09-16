/**
 * POST /api/axiom/trial-expire
 *
 * Tank-callable endpoint for scheduled trial lifecycle management.
 * Protected by x-axiom-secret header (must equal AXIOM_PROVISION_SECRET).
 *
 * Two-phase operation:
 *   Phase 1 — Send reminder emails for trials expiring in 1–3 days
 *              (same logic as scripts/axiom-trial-reminder.ts)
 *   Phase 2 — Auto-expire unconverted trials (trial_ends_at < now())
 *              Sets status = 'cancelled' and sends "trial ended" email
 *
 * Response: { ok: true, reminded: M, expired: N }
 *
 * ── Automation invocation ────────────────────────────────────────────────────
 *   curl -X POST https://axiom.nssapros.com/codex/api/axiom/trial-expire \
 *     -H "x-axiom-secret: <AXIOM_PROVISION_SECRET>" \
 *     -H "Content-Type: application/json"
 *
 * Suggested schedule: once daily (e.g. 9:00 AM Eastern)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendTrialReminderEmail, sendTrialEndedEmail } from '@/lib/axiom-emails';

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret   = process.env.AXIOM_PROVISION_SECRET;
  const incoming = req.headers.get('x-axiom-secret');

  if (!secret || incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb  = createServiceClient();
  const now = new Date();

  // ── Phase 1: Reminder emails (expiring in 1–3 days, not yet reminded) ────
  const oneDayOut    = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: expiring, error: reminderQueryError } = await sb
    .from('axiom_subscribers')
    .select('email, trial_ends_at')
    .eq('status', 'trialing')
    .gte('trial_ends_at', oneDayOut.toISOString())
    .lte('trial_ends_at', threeDaysOut.toISOString())
    .is('reminder_sent_at', null);

  if (reminderQueryError) {
    console.error('[trial-expire] Reminder query error:', reminderQueryError.message);
    return NextResponse.json(
      { error: `Reminder query failed: ${reminderQueryError.message}` },
      { status: 500 }
    );
  }

  let reminded = 0;
  for (const sub of expiring ?? []) {
    const email       = sub.email as string;
    const trialEndsAt = sub.trial_ends_at as string | null;
    if (!email || !trialEndsAt) continue;

    try {
      await sendTrialReminderEmail(email, new Date(trialEndsAt));

      const { error: markError } = await sb
        .from('axiom_subscribers')
        .update({ reminder_sent_at: now.toISOString() })
        .eq('email', email);

      if (markError) {
        console.error(
          `[trial-expire] Failed to mark reminder_sent_at for ${email}:`,
          markError.message
        );
      } else {
        reminded++;
        console.log(`[trial-expire] Reminded: ${email}`);
      }
    } catch (err) {
      console.error(`[trial-expire] Reminder failed for ${email}:`, err);
    }
  }

  // ── Phase 2: Auto-expire overdue trials ───────────────────────────────────
  const { data: overdue, error: overdueQueryError } = await sb
    .from('axiom_subscribers')
    .select('email')
    .eq('status', 'trialing')
    .lt('trial_ends_at', now.toISOString());

  if (overdueQueryError) {
    console.error('[trial-expire] Expire query error:', overdueQueryError.message);
    return NextResponse.json(
      { error: `Expire query failed: ${overdueQueryError.message}` },
      { status: 500 }
    );
  }

  let expired = 0;
  for (const sub of overdue ?? []) {
    const email = sub.email as string;
    if (!email) continue;

    try {
      // Defensive: only update rows still in 'trialing' to avoid
      // double-cancelling a row that just converted while this was running
      const { error: updateError } = await sb
        .from('axiom_subscribers')
        .update({ status: 'cancelled', updated_at: now.toISOString() })
        .eq('email', email)
        .eq('status', 'trialing');

      if (updateError) {
        console.error(`[trial-expire] Failed to expire ${email}:`, updateError.message);
        continue;
      }

      await sendTrialEndedEmail(email);
      expired++;
      console.log(`[trial-expire] Expired and notified: ${email}`);
    } catch (err) {
      console.error(`[trial-expire] Error expiring ${email}:`, err);
    }
  }

  console.log(`[trial-expire] Done — reminded: ${reminded}, expired: ${expired}`);
  return NextResponse.json({ ok: true, reminded, expired });
}
