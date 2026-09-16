# AXIOM — Kajabi Subscription Integration Setup

Direct Kajabi → AXIOM webhook integration. No Zapier. Kajabi sends subscription
events to our endpoint, which maps them to provisioning actions and sends
transactional emails via Resend.

---

## 1. Run the Database Migration

Paste `supabase-migrations/axiom_subscriber_trial_fields.sql` into the
**Supabase SQL editor** and click **Run**. This adds four columns to
`axiom_subscribers`:

| Column | Type | Purpose |
|---|---|---|
| `name` | text | Subscriber display name from Kajabi |
| `trial_ends_at` | timestamptz | When the 7-day trial expires |
| `reminder_sent_at` | timestamptz | When the 2-day reminder email was sent |
| `kajabi_purchase_id` | text | Kajabi purchase ID for reference |

All statements use `IF NOT EXISTS` — safe to run more than once.

---

## 2. Add the Vercel Environment Variable

In the **knowledge** app's Vercel project settings
(**Settings → Environment Variables**), add:

| Variable | Value | Environments |
|---|---|---|
| `KAJABI_AXIOM_WEBHOOK_SECRET` | `31c111e56aae87ccb2e4b2a28b8a0d9bcbcd5f4d1c89d44c` | Production, Preview, Development |

> `RESEND_API_KEY` is already present. No other new variables are needed.

---

## 3. Configure the Webhook in Kajabi

1. In Kajabi, go to **Settings → Integrations → Webhooks**
2. Click **Add Webhook**
3. Set the **URL** to:
   ```
   https://axiom.nssapros.com/codex/api/axiom/kajabi-webhook
   ```
4. Set the **Secret / Token** field to:
   ```
   31c111e56aae87ccb2e4b2a28b8a0d9bcbcd5f4d1c89d44c
   ```
   Kajabi will send this in the `x-kajabi-token` request header.

5. **Subscribe to these events** (all subscription events for offer `2151386538`):

| Kajabi Event | What Happens |
|---|---|
| `purchase_created` | New purchase — trial → `trialing`, direct → `active`; welcome email sent |
| `offer_purchase` | Alternate event name for `purchase_created` |
| `subscription_activated` | Trial converted to paid → `active`; "confirmed" email sent |
| `subscription.activated` | Alternate event name |
| `subscription_deactivated` | Cancelled → `cancelled`; "access ended" email sent |
| `subscription_cancelled` | Alternate event name |
| `subscription.cancelled` | Alternate event name |
| `billing_failed` | Payment failed → `past_due` (no email) |
| `subscription_billing_failed` | Alternate event name |

> The webhook handler filters on offer ID `2151386538` for `purchase_created`
> events — it silently skips purchases for any other Kajabi offer. You can
> configure this webhook globally; it will not affect non-AXIOM purchases.

---

## 4. Event → Status Mapping

```
purchase_created  (trial=true)  → status: 'trialing'
                                  trial_ends_at: now + 7 days
                                  email: "Your 7-day AXIOM trial has started"

purchase_created  (trial=false) → status: 'active'
subscription_activated          → status: 'active'
                                  email: "Welcome to AXIOM — you're all set"

subscription_deactivated        → status: 'cancelled'
subscription_cancelled          → status: 'cancelled'
                                  email: "Your AXIOM access has ended"

billing_failed                  → status: 'past_due'
                                  (no email — handled via Kajabi dunning)
```

---

## 5. Trial Expiry Reminders (Daily Cron)

The script `scripts/axiom-trial-reminder.ts` finds trials expiring in ~2 days
(`trial_ends_at BETWEEN now()+1d AND now()+3d` and `reminder_sent_at IS NULL`),
sends a reminder email, then marks `reminder_sent_at` to prevent duplicates.

**Exact command for Tank to call (once per day, e.g. 9 AM Eastern):**

```bash
cd ~/knowledge && npx tsx --env-file=.env.local scripts/axiom-trial-reminder.ts
```

For a Vercel/production environment where env vars are injected automatically:

```bash
cd ~/knowledge && npx tsx scripts/axiom-trial-reminder.ts
```

---

## 6. Transactional Emails Summary

All emails are sent from `AXIOM <axiom@updates.nssapros.com>` via Resend
(`RESEND_API_KEY`). Dark-themed HTML (`#0D1520` background).

| Trigger | Subject |
|---|---|
| Trial starts | Your 7-day AXIOM trial has started |
| Paid subscription confirmed | Welcome to AXIOM — you're all set |
| Access revoked or cancelled | Your AXIOM access has ended |
| Trial expiring in ~2 days | Your AXIOM trial expires in 2 days |

---

## 7. Files Created

| File | Purpose |
|---|---|
| `supabase-migrations/axiom_subscriber_trial_fields.sql` | DB migration (run in SQL editor) |
| `lib/axiom-emails.ts` | Email HTML builders + Resend senders |
| `lib/axiom-provision.ts` | Shared provisioning logic (DB + emails) |
| `app/api/axiom/provision/route.ts` | Updated internal webhook (Zapier) |
| `app/api/axiom/kajabi-webhook/route.ts` | **New** direct Kajabi webhook |
| `scripts/axiom-trial-reminder.ts` | Daily trial reminder + auto-expiry script |
| `scripts/axiom-kajabi-sync.ts` | Daily Kajabi purchase reconciliation |
| `app/api/axiom/trial-expire/route.ts` | Tank-callable trial lifecycle API endpoint |
| `docs/axiom-kajabi-setup.md` | This document |

---

## 8. Kajabi Webhook — Cart Purchase & Payment Events

Kajabi does **not** send a cancellation webhook reliably, so cancellation is
handled by the daily auto-expiry job (see §9). You only need two webhook
events to cover the purchase lifecycle:

1. In Kajabi, go to **Settings → Integrations → Webhooks**
2. Click **Add Webhook** and configure the first webhook:

   | Field | Value |
   |---|---|
   | URL | `https://axiom.nssapros.com/codex/api/axiom/kajabi-webhook` |
   | Secret / Token | `31c111e56aae87ccb2e4b2a28b8a0d9bcbcd5f4d1c89d44c` |
   | Events | **Cart purchase** (`purchase_created` / `offer_purchase`) |

3. Click **Add Webhook** again for the second:

   | Field | Value |
   |---|---|
   | URL | `https://axiom.nssapros.com/codex/api/axiom/kajabi-webhook` |
   | Secret / Token | `31c111e56aae87ccb2e4b2a28b8a0d9bcbcd5f4d1c89d44c` |
   | Events | **Payment successful** (`subscription_activated` / `subscription.activated`) |

> Both webhooks point to the same handler. The handler filters on offer ID
> `2151386538` — it silently skips events for any other Kajabi offer.

---

## 9. Trial Auto-Expiry and Kajabi Reconciliation (Daily Jobs)

Because Kajabi provides no cancellation webhook, access revocation is handled
by two scheduled jobs:

### 9a. Trial Lifecycle (auto-expiry + reminders)

The `/api/axiom/trial-expire` endpoint runs both reminder sends and
auto-expiry in a single call.

**Tank automation — invoke once daily (recommended: 9:00 AM Eastern):**

```bash
curl -X POST https://axiom.nssapros.com/codex/api/axiom/trial-expire \
  -H "x-axiom-secret: <AXIOM_PROVISION_SECRET>" \
  -H "Content-Type: application/json"
```

**What it does:**
- **Phase 1 (reminders):** Finds `trialing` subscribers whose `trial_ends_at`
  is 1–3 days out and `reminder_sent_at IS NULL`. Sends the 2-day warning
  email and stamps `reminder_sent_at`.
- **Phase 2 (auto-expire):** Finds `trialing` subscribers whose `trial_ends_at`
  is in the past. Sets `status = 'cancelled'` and sends the "trial ended" email.

**Response shape:**
```json
{ "ok": true, "reminded": 2, "expired": 1 }
```

Alternatively, the script can be run directly (local / CI):

```bash
cd ~/knowledge && npx tsx --env-file=.env.local scripts/axiom-trial-reminder.ts
```

### 9b. Kajabi Purchase Reconciliation

The script `scripts/axiom-kajabi-sync.ts` is a safety net that cross-references
every `active`/`trialing` subscriber in Supabase against Kajabi's purchases API.
If no active purchase is found for offer `2151386538`, the subscriber is revoked.

This catches cases where a Kajabi cancellation webhook was never fired — it does
**not** send user-facing emails (that's the webhook's job).

**Run command (once daily, e.g. 10:00 AM Eastern):**

```bash
cd ~/knowledge && npx tsx --env-file=.env.local scripts/axiom-kajabi-sync.ts
```

**Requires new env var `KAJABI_API_KEY`** (see §10). If the var is not set,
the script exits cleanly with a warning — it will not crash the automation.

---

## 10. New Environment Variable: KAJABI_API_KEY

The Kajabi reconciliation script (`scripts/axiom-kajabi-sync.ts`) requires a
Kajabi API bearer token that is **not** yet in the knowledge app's Vercel
environment.

**Add to Vercel** (Settings → Environment Variables → knowledge project):

| Variable | Value | Environments |
|---|---|---|
| `KAJABI_API_KEY` | Kajabi API token (obtain from Kajabi Settings → Integrations → API) | Production, Preview, Development |

**Also add to `~/knowledge/.env.local`** for local script runs:

```bash
KAJABI_API_KEY=your_token_here
```

> Until this is set, `axiom-kajabi-sync.ts` skips gracefully and logs a
> warning. The webhook path and trial auto-expiry route continue to function
> normally without it.
