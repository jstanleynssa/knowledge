/**
 * lib/axiom-provision.ts
 * Core AXIOM subscriber provisioning logic — shared by the provision API route
 * and the Kajabi webhook handler. Handles DB upserts and sends transactional
 * emails for each lifecycle event.
 */

import { createServiceClient } from '@/lib/supabase';
import {
  sendTrialWelcomeEmail,
  sendSubscriptionConfirmedEmail,
  sendAccessEndedEmail,
} from '@/lib/axiom-emails';

export type Action = 'provision' | 'revoke' | 'past_due' | 'trial';
export type Tier   = 'standard' | 'arpi_grad' | 'firm' | 'staff';

export interface ProvisionParams {
  action:              Action;
  email:               string;   // must be pre-normalised (lowercase + trimmed)
  tier?:               Tier;
  name?:               string;
  kajabi_purchase_id?: string;
}

export interface ProvisionResult {
  ok:          boolean;
  error?:      string;
  statusCode?: number;
}

export async function runProvision(params: ProvisionParams): Promise<ProvisionResult> {
  const { action, email, tier, name, kajabi_purchase_id } = params;
  const sb  = createServiceClient();
  const now = new Date().toISOString();

  // ── trial ─────────────────────────────────────────────────────────────────
  if (action === 'trial') {
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error } = await sb
      .from('axiom_subscribers')
      .upsert(
        {
          email,
          tier:                tier ?? 'standard',
          role:                'subscriber',
          status:              'trialing',
          trial_ends_at:       trialEndsAt.toISOString(),
          name:                name?.trim() || null,
          kajabi_purchase_id:  kajabi_purchase_id || null,
          updated_at:          now,
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[axiom/provision] trial upsert error:', error.message);
      return { ok: false, error: error.message, statusCode: 500 };
    }

    // Fire-and-forget — email errors are logged inside the sender
    sendTrialWelcomeEmail(email).catch(err =>
      console.error('[axiom/provision] trial welcome email failed:', err)
    );

    console.log(`[axiom/provision] trial started: ${email}`);
    return { ok: true };
  }

  // ── provision (new paid sub or trial→paid upgrade) ────────────────────────
  if (action === 'provision') {
    const { error } = await sb
      .from('axiom_subscribers')
      .upsert(
        {
          email,
          tier:                tier ?? 'standard',
          role:                'subscriber',
          status:              'active',
          kajabi_purchase_id:  kajabi_purchase_id || null,
          updated_at:          now,
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[axiom/provision] provision upsert error:', error.message);
      return { ok: false, error: error.message, statusCode: 500 };
    }

    sendSubscriptionConfirmedEmail(email).catch(err =>
      console.error('[axiom/provision] subscription confirmed email failed:', err)
    );

    console.log(`[axiom/provision] provisioned: ${email} (${tier ?? 'standard'})`);
    return { ok: true };
  }

  // ── revoke ────────────────────────────────────────────────────────────────
  if (action === 'revoke') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'cancelled', updated_at: now })
      .eq('email', email);

    if (error) {
      console.error('[axiom/provision] revoke error:', error.message);
      return { ok: false, error: error.message, statusCode: 500 };
    }

    sendAccessEndedEmail(email).catch(err =>
      console.error('[axiom/provision] access ended email failed:', err)
    );

    console.log(`[axiom/provision] revoked: ${email}`);
    return { ok: true };
  }

  // ── past_due ──────────────────────────────────────────────────────────────
  if (action === 'past_due') {
    const { error } = await sb
      .from('axiom_subscribers')
      .update({ status: 'past_due', updated_at: now })
      .eq('email', email);

    if (error) {
      console.error('[axiom/provision] past_due error:', error.message);
      return { ok: false, error: error.message, statusCode: 500 };
    }

    console.log(`[axiom/provision] past_due: ${email}`);
    return { ok: true };
  }

  return { ok: false, error: `Unknown action: ${action}`, statusCode: 400 };
}
