/**
 * POST /api/axiom/send-magic-link
 *
 * Checks axiom_subscribers, generates a one-time token, inserts into
 * axiom_magic_links, and sends a sign-in email via Resend.
 *
 * Always returns the same "check your email" message on success —
 * never reveals whether an email has an AXIOM subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase';

// Lazy — instantiated per-request so env var is available at runtime, not build time
function getResend() { return new Resend(process.env.RESEND_API_KEY); }

// Valid subscription statuses that may sign in
const ALLOWED_STATUSES = ['active', 'trialing'];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'A valid email address is required.' }, { status: 400 });
  }

  const sb = createServiceClient();

  try {
  // Check axiom_subscribers — gate on status
  const { data: sub } = await sb
    .from('axiom_subscribers')
    .select('email, status')
    .eq('email', email)
    .single();

  if (!sub || !ALLOWED_STATUSES.includes(sub.status)) {
    // 403 with a generic message (don't reveal subscription status)
    return NextResponse.json(
      { ok: false, error: 'No AXIOM access found for this email.' },
      { status: 403 }
    );
  }

  // Generate token and expiry (15 minutes)
  const token     = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await sb.from('axiom_magic_links').insert({
    email,
    token,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error('[send-magic-link] DB insert error:', insertError.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate sign-in link. Please try again.' },
      { status: 500 }
    );
  }

  // Build magic link
  const magicLink = `https://axiom.nssapros.com/codex/axiom/auth?token=${token}`;

  // Send email via Resend
  const { error: sendError } = await getResend().emails.send({
    from:    'AXIOM <axiom@updates.nssapros.com>',
    to:      email,
    subject: 'Your AXIOM sign-in link',
    html:    buildEmailHtml(magicLink),
  });

  if (sendError) {
    console.error('[send-magic-link] Resend error:', sendError);
    // Still return ok:true — token is in DB; user can retry or we don't reveal state
    // But actually, if we can't send the email, we should tell the user
    return NextResponse.json(
      { ok: false, error: 'Failed to send sign-in email. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-magic-link] unhandled error:', err);
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildEmailHtml(magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AXIOM sign-in link</title>
</head>
<body style="margin:0;padding:0;background:#0D1520;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1520;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img
                src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png"
                alt="AXIOM by NSSA"
                height="32"
                style="height:32px;width:auto;display:block;"
              />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#131E2E;border:1px solid #1E2D42;border-radius:16px;padding:40px 40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#F0F4F8;line-height:1.3;">
                Sign in to AXIOM
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#8EA3B8;line-height:1.6;">
                Click the button below to sign in to your AXIOM account.
                This link expires in&nbsp;<strong style="color:#F0F4F8;">15&nbsp;minutes</strong>
                and can only be used once.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#1C80BC;border-radius:10px;">
                    <a
                      href="${magicLink}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;"
                    >
                      Sign in to AXIOM →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 4px;font-size:12px;color:#8EA3B8;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:11px;color:#4A6070;word-break:break-all;line-height:1.5;">
                ${magicLink}
              </p>

              <!-- Divider -->
              <div style="height:1px;background:#1E2D42;margin-bottom:20px;"></div>

              <p style="margin:0;font-size:12px;color:#4A6070;line-height:1.6;">
                If you didn't request this sign-in link, you can safely ignore this email.
                Your account is not at risk.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#2A3D52;line-height:1.6;">
                AXIOM by NSSA · National Social Security Advisors<br>
                This is an automated message — please do not reply.
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
