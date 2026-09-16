/**
 * lib/axiom-emails.ts
 * AXIOM transactional email HTML builders and Resend senders.
 *
 * Dark theme palette:
 *   bg       #0D1520   surface  #131E2E
 *   border   #1E2D42   accent   #1C80BC
 *   text     #F0F4F8   muted    #8EA3B8   dim #4A6070
 *
 * All emails are sent from: AXIOM <axiom@updates.nssapros.com>
 */

import { Resend } from 'resend';

// Lazy — instantiated per-call so RESEND_API_KEY is available at runtime, not build time
function getResend() { return new Resend(process.env.RESEND_API_KEY); }

const FROM          = 'AXIOM <axiom@updates.nssapros.com>';
const AXIOM_URL     = 'https://axiom.nssapros.com';
const SUBSCRIBE_URL = 'https://nssapros.com/offers/ggxn92RJ/checkout';
const LOGO_URL      =
  'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png';

// ── Shared HTML primitives ────────────────────────────────────────────────────

function ctaButton(url: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#1C80BC;border-radius:10px;">
          <a href="${url}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;
                    color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function divider(): string {
  return `<div style="height:1px;background:#1E2D42;margin-bottom:20px;"></div>`;
}

function wrap(title: string, cardBody: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0D1520;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#0D1520;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${LOGO_URL}" alt="AXIOM by NSSA" height="32"
                   style="height:32px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#131E2E;border:1px solid #1E2D42;border-radius:16px;
                       padding:40px 40px 36px;">
              ${cardBody}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#2A3D52;line-height:1.6;">
                AXIOM by NSSA &middot; National Social Security Advisors<br>
                This is an automated message &mdash; please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email builders ────────────────────────────────────────────────────────────

export function buildTrialWelcomeHtml(): string {
  return wrap('Your 7-day AXIOM trial has started', `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#F0F4F8;line-height:1.3;">
      Your 7-day AXIOM trial has started
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#8EA3B8;line-height:1.6;">
      Your free trial is now active. You have full access to AXIOM for the next
      <strong style="color:#F0F4F8;">7&nbsp;days</strong> &mdash; sign in below
      to get started.
    </p>

    ${ctaButton(AXIOM_URL, 'Sign in to AXIOM &rarr;')}

    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#F0F4F8;">
      3 things to try first:
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 14px;background:#0D1520;border:1px solid #1E2D42;
                   border-radius:8px;font-size:13px;color:#8EA3B8;line-height:1.6;">
          <strong style="color:#1C80BC;">1.</strong>&nbsp;
          Ask a Social Security question &mdash; get a sourced, advisor-grade answer in seconds
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:10px 14px;background:#0D1520;border:1px solid #1E2D42;
                   border-radius:8px;font-size:13px;color:#8EA3B8;line-height:1.6;">
          <strong style="color:#1C80BC;">2.</strong>&nbsp;
          Read the sourced answer &mdash; every response cites the SSA rules it draws from
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:10px 14px;background:#0D1520;border:1px solid #1E2D42;
                   border-radius:8px;font-size:13px;color:#8EA3B8;line-height:1.6;">
          <strong style="color:#1C80BC;">3.</strong>&nbsp;
          Save a conversation &mdash; bookmark answers to reference with clients later
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0;font-size:12px;color:#4A6070;line-height:1.6;">
      Your trial expires in 7 days. After that, subscribe to keep full access.
    </p>
  `);
}

export function buildSubscriptionConfirmedHtml(): string {
  return wrap("Welcome to AXIOM \u2014 you're all set", `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#F0F4F8;line-height:1.3;">
      Welcome to AXIOM &mdash; you&rsquo;re all set
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8EA3B8;line-height:1.6;">
      Your subscription is confirmed and your access continues uninterrupted.
      Sign in anytime to ask questions, browse sourced answers, and save conversations.
    </p>

    ${ctaButton(AXIOM_URL, 'Open AXIOM &rarr;')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#4A6070;line-height:1.6;">
      You&rsquo;re receiving this because you subscribed to AXIOM by NSSA.
    </p>
  `);
}

export function buildAccessEndedHtml(): string {
  return wrap('Your AXIOM access has ended', `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#F0F4F8;line-height:1.3;">
      Your AXIOM access has ended
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8EA3B8;line-height:1.6;">
      Your AXIOM subscription or trial has ended and your access has been
      deactivated. To reactivate and get back to sourced Social Security answers,
      subscribe below.
    </p>

    ${ctaButton(SUBSCRIBE_URL, 'Reactivate AXIOM &rarr;')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#4A6070;line-height:1.6;">
      If you believe this is an error, reply to this email and
      we&rsquo;ll sort it out.
    </p>
  `);
}

export function buildTrialReminderHtml(trialEndsAt: Date): string {
  const formatted = trialEndsAt.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  return wrap('Your AXIOM trial expires in 2 days', `
    <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#F0F4F8;line-height:1.3;">
      Your AXIOM trial expires in 2 days
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8EA3B8;line-height:1.6;">
      Your free trial ends on
      <strong style="color:#F0F4F8;">${formatted}</strong>.
      Subscribe now to keep your access and continue getting sourced,
      advisor-grade Social Security answers.
    </p>

    ${ctaButton(SUBSCRIBE_URL, 'Subscribe to AXIOM &rarr;')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#4A6070;line-height:1.6;">
      Questions about the subscription? Reply to this email and
      we&rsquo;ll help.
    </p>
  `);
}

// ── Senders ───────────────────────────────────────────────────────────────────

export async function sendTrialWelcomeEmail(to: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: 'Your 7-day AXIOM trial has started',
    html:    buildTrialWelcomeHtml(),
  });
  if (error) console.error('[axiom-emails] trial-welcome error:', error);
}

export async function sendSubscriptionConfirmedEmail(to: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: "Welcome to AXIOM \u2014 you're all set",
    html:    buildSubscriptionConfirmedHtml(),
  });
  if (error) console.error('[axiom-emails] subscription-confirmed error:', error);
}

export async function sendAccessEndedEmail(to: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: 'Your AXIOM access has ended',
    html:    buildAccessEndedHtml(),
  });
  if (error) console.error('[axiom-emails] access-ended error:', error);
}

export async function sendTrialReminderEmail(to: string, trialEndsAt: Date): Promise<void> {
  const { error } = await getResend().emails.send({
    from:    FROM,
    to,
    subject: 'Your AXIOM trial expires in 2 days',
    html:    buildTrialReminderHtml(trialEndsAt),
  });
  if (error) console.error('[axiom-emails] trial-reminder error:', error);
}
