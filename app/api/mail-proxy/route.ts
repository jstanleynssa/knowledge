/**
 * POST /api/mail-proxy
 *
 * Internal proxy — lets the standalone axiom project send email via the
 * knowledge project's verified Resend API key. Protected by a shared secret.
 *
 * Body: { secret, to, subject, html }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

export async function POST(req: NextRequest) {
  let body: { secret?: string; to?: string; subject?: string; html?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.MAIL_PROXY_SECRET;
  if (!expected || body.secret !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { to, subject, html } = body;
  if (!to || !subject || !html) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { error } = await getResend().emails.send({
    from:    'AXIOM <axiom@updates.arpinstitute.com>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[mail-proxy] Resend error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
