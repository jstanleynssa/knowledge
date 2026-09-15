import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const FROM    = 'CELP® Partner Network <engage@arpinstitute.com>'
const NOTIFY  = 'jstanley@arpinstitute.com'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const { partner_id, sender_name, sender_email, sender_celp, message } = await req.json()

    if (!partner_id || !sender_name || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message must be 1,000 characters or fewer.' }, { status: 400 })
    }

    // Look up partner email server-side — never exposed to the client
    const supabase = admin()
    const { data: partner, error } = await supabase
      .from('celp_partners')
      .select('id, first_name, last_name, organization, email, role_label, status')
      .eq('id', partner_id)
      .eq('status', 'approved')
      .maybeSingle()

    if (error || !partner) {
      return NextResponse.json({ error: 'Partner not found.' }, { status: 404 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const celpLine = sender_celp ? `<tr><td style="padding:6px 0;color:#6b7280;width:120px;">CELP® #</td><td style="padding:6px 0;font-weight:600;">${sender_celp}</td></tr>` : ''

    // Email to the partner
    await resend.emails.send({
      from: FROM,
      to: partner.email,
      replyTo: sender_email,
      subject: `A CELP® professional wants to connect — ${sender_name}`,
      html: `
<div style="font-family:system-ui,sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:#1a4a37;color:white;padding:1rem 1.5rem;border-radius:8px 8px 0 0;">
    <p style="margin:0;font-size:13px;color:#b4d9cc;">CELP® Partner Network</p>
    <p style="margin:4px 0 0;font-weight:700;font-size:16px;">A CELP® professional wants to connect</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:1.5rem;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:1.25rem;">
      <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Name</td><td style="padding:6px 0;font-weight:600;">${sender_name}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${sender_email}" style="color:#2a6b54;">${sender_email}</a></td></tr>
      ${celpLine}
    </table>
    <div style="background:#f9fafb;border-left:3px solid #2a6b54;border-radius:4px;padding:12px 16px;margin-bottom:1.5rem;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0;">
      Reply directly to this email to respond to ${sender_name}.
      They found your listing on the <a href="https://arpinstitute.com/partners" style="color:#2a6b54;">CELP® Partner Network</a>.
    </p>
  </div>
</div>`,
    })

    // Confirmation to the CELP sender
    await resend.emails.send({
      from: FROM,
      to: sender_email,
      subject: `Your message to ${partner.organization} was sent`,
      html: `
<div style="font-family:system-ui,sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:#1a4a37;color:white;padding:1rem 1.5rem;border-radius:8px 8px 0 0;">
    <p style="margin:0;font-weight:700;font-size:16px;">Message sent</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:1.5rem;">
    <p style="font-size:15px;color:#374151;">Hi ${sender_name},</p>
    <p style="font-size:15px;color:#374151;">
      Your message to <strong>${partner.organization}</strong> (${partner.role_label}) has been delivered.
      They'll reply directly to your email.
    </p>
    <div style="background:#f9fafb;border-left:3px solid #2a6b54;border-radius:4px;padding:12px 16px;margin:1.25rem 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;font-style:italic;">"${message.replace(/\n/g, '<br>')}"</p>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0;">
      <a href="https://arpinstitute.com/partners" style="color:#2a6b54;">Browse more CELP® partners →</a>
    </p>
  </div>
</div>`,
    })

    // Notify Jason
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      subject: `CELP Partner contact — ${sender_name} → ${partner.organization}`,
      html: `<p style="font-family:system-ui,sans-serif;font-size:14px;">
        <strong>${sender_name}</strong> (${sender_email}${sender_celp ? `, CELP® ${sender_celp}` : ''})
        contacted <strong>${partner.organization}</strong> via the partner directory.
      </p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('partner-contact error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
