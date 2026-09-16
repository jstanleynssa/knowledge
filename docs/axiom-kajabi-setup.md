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
| `scripts/axiom-trial-reminder.ts` | Daily trial reminder script |
| `docs/axiom-kajabi-setup.md` | This document |
