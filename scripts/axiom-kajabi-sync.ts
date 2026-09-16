/**
 * scripts/axiom-kajabi-sync.ts
 * Daily reconciliation: compares axiom_subscribers (active/trialing) against
 * Kajabi purchases for offer 2151386538. Revokes anyone no longer active in Kajabi.
 *
 * This is a safety-net script — it does NOT send user-facing emails on revoke.
 * The webhook path handles real-time cancellation emails; this catches stragglers
 * where Kajabi never fired the cancellation webhook.
 *
 * ── Run command (OpenClaw automation / local) ─────────────────────────────
 *
 *   cd ~/knowledge && npx tsx --env-file=.env.local scripts/axiom-kajabi-sync.ts
 *
 * ── Required env vars ─────────────────────────────────────────────────────
 *   NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY    — Service role key (bypasses RLS)
 *   KAJABI_API_KEY               — Kajabi API bearer token (NEW — see docs)
 *                                  If not set, Kajabi check is skipped with
 *                                  a warning rather than crashing.
 *
 * ── Kajabi API notes ──────────────────────────────────────────────────────
 *   Base URL:  https://api.kajabi.com/v1
 *   Auth:      Authorization: Bearer <KAJABI_API_KEY>
 *   Endpoint:  GET /purchases?contact_email={email}
 *
 *   IMPORTANT: Kajabi's contact_id filter (filter[contact_id]=<id>) silently
 *   ignores the filter and returns the full purchase list. Always filter
 *   client-side by offer_id — never trust server-side filtering.
 */

import { createClient } from '@supabase/supabase-js';

const KAJABI_API     = 'https://api.kajabi.com/v1';
const AXIOM_OFFER_ID = '2151386538';

// ── Supabase setup ────────────────────────────────────────────────────────────

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

// ── Kajabi API helpers ────────────────────────────────────────────────────────

interface KajabiPurchase {
  offer_id?:     string | number;
  offerId?:      string | number;
  status?:       string;
  member_email?: string;
  email?:        string;
  // JSON:API attributes wrapper (Kajabi returns both flat and wrapped shapes)
  attributes?: {
    offer_id?: string | number;
    status?:   string;
    email?:    string;
  };
}

/**
 * Fetch purchases for a given email from Kajabi.
 * Filters client-side by AXIOM_OFFER_ID — never trust Kajabi's server-side
 * offer_id or contact_id filter parameters.
 */
async function fetchKajabiActivePurchase(
  email: string,
  apiKey: string
): Promise<boolean> {
  // Query by contact_email; pass offer_id as a hint (may be ignored by Kajabi)
  const url =
    `${KAJABI_API}/purchases` +
    `?contact_email=${encodeURIComponent(email)}` +
    `&offer_id=${AXIOM_OFFER_ID}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.status === 404) {
    // No purchases at all for this email
    return false;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kajabi API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const data: unknown = await res.json();

  // Kajabi may return JSON:API { data: [...] } or a plain array
  const purchases: KajabiPurchase[] = Array.isArray(data)
    ? (data as KajabiPurchase[])
    : Array.isArray((data as Record<string, unknown>)?.data)
    ? ((data as Record<string, unknown>).data as KajabiPurchase[])
    : [];

  // Client-side filter: keep only purchases for the AXIOM offer that are active
  return purchases.some(p => {
    // Attributes may be on the object directly or inside p.attributes (JSON:API)
    const attrs  = p.attributes ?? p;
    const flat   = p; // top-level fields (non-JSON:API shape)
    const offerId = String(
      attrs.offer_id ?? flat.offerId ?? ''
    );
    const status  = String(attrs.status ?? '').toLowerCase();
    return offerId === AXIOM_OFFER_ID && status === 'active';
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function main(): Promise<{ checked: number; revoked: number }> {
  const apiKey = process.env.KAJABI_API_KEY;

  if (!apiKey) {
    console.warn(
      '[kajabi-sync] WARNING: KAJABI_API_KEY not set — skipping Kajabi reconciliation.\n' +
      '  Add KAJABI_API_KEY to Vercel environment variables and .env.local to enable this check.\n' +
      '  See docs/axiom-kajabi-setup.md for setup instructions.'
    );
    return { checked: 0, revoked: 0 };
  }

  const sb = createDb();

  // 1. Fetch all active/trialing subscribers from Supabase
  const { data: subscribers, error } = await sb
    .from('axiom_subscribers')
    .select('email')
    .in('status', ['active', 'trialing']);

  if (error) {
    console.error('[kajabi-sync] Failed to fetch subscribers:', error.message);
    process.exit(1);
  }

  const rows = subscribers ?? [];
  console.log(
    `[kajabi-sync] Checking ${rows.length} active/trialing subscriber(s) against Kajabi`
  );

  let checked = 0;
  let revoked  = 0;

  for (const sub of rows) {
    const email = sub.email as string;
    if (!email) continue;

    try {
      const hasActive = await fetchKajabiActivePurchase(email, apiKey);

      if (!hasActive) {
        // No active Kajabi purchase for the AXIOM offer — revoke access
        const { error: updateError } = await sb
          .from('axiom_subscribers')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('email', email);

        if (updateError) {
          console.error(
            `[kajabi-sync] Failed to revoke ${email}:`,
            updateError.message
          );
        } else {
          console.log(`[kajabi-sync] Revoked (no active Kajabi purchase): ${email}`);
          revoked++;
        }
      }

      checked++;

      // Brief pause to avoid hammering the Kajabi API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error(`[kajabi-sync] Error checking ${email}:`, err);
      // Continue with next subscriber — don't abort the whole run
    }
  }

  console.log(`[kajabi-sync] Done — ${checked} checked, ${revoked} revoked`);
  return { checked, revoked };
}

main().catch(err => {
  console.error('[kajabi-sync] Fatal:', err);
  process.exit(1);
});
