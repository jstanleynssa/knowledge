/**
 * scripts/axiom-trial-reminder.ts
 * Sends reminder emails to AXIOM subscribers whose trials expire in ~2 days.
 *
 * Query: status='trialing' AND trial_ends_at BETWEEN now()+1d AND now()+3d
 *        AND reminder_sent_at IS NULL
 * On match: sends "Your AXIOM trial expires in 2 days" email, then sets
 *           reminder_sent_at = now() to prevent duplicate sends.
 *
 * ── Run command (OpenClaw automation / local) ─────────────────────────────
 *
 *   cd ~/knowledge && npx tsx --env-file=.env.local scripts/axiom-trial-reminder.ts
 *
 * On Vercel (scheduled function / cron), env vars are injected automatically:
 *
 *   cd ~/knowledge && npx tsx scripts/axiom-trial-reminder.ts
 *
 * Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { sendTrialReminderEmail } from '@/lib/axiom-emails';

// Uses createClient directly (not @/lib/supabase) to avoid importing next/headers
// in a non-Next.js script context.
function createDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function main(): Promise<void> {
  const sb  = createDb();
  const now = new Date();

  // Window: trials expiring between 1 day and 3 days from now (~2 days out)
  const oneDayOut    = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: expiring, error } = await sb
    .from('axiom_subscribers')
    .select('email, trial_ends_at')
    .eq('status', 'trialing')
    .gte('trial_ends_at', oneDayOut.toISOString())
    .lte('trial_ends_at', threeDaysOut.toISOString())
    .is('reminder_sent_at', null);

  if (error) {
    console.error('[trial-reminder] Query error:', error.message);
    process.exit(1);
  }

  const rows = expiring ?? [];
  console.log(`[trial-reminder] Found ${rows.length} trial(s) expiring in ~2 days`);

  for (const sub of rows) {
    const email        = sub.email as string;
    const trialEndsAt  = sub.trial_ends_at as string | null;

    if (!email || !trialEndsAt) continue;

    try {
      await sendTrialReminderEmail(email, new Date(trialEndsAt));

      const { error: updateError } = await sb
        .from('axiom_subscribers')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('email', email);

      if (updateError) {
        console.error(
          `[trial-reminder] Failed to mark reminder_sent_at for ${email}:`,
          updateError.message
        );
      } else {
        console.log(`[trial-reminder] Reminded and marked: ${email}`);
      }
    } catch (err) {
      console.error(`[trial-reminder] Error processing ${email}:`, err);
    }
  }

  console.log('[trial-reminder] Done');
}

// Run immediately when script is invoked directly
main().catch(err => {
  console.error('[trial-reminder] Fatal:', err);
  process.exit(1);
});
