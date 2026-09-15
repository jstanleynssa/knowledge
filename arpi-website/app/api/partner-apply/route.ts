import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getZipCoords } from '@/lib/zipcodes'
import { REFERRAL_PARTNERS } from '@/lib/celp-referral-partners'

const REQUIRED = ['role_id', 'first_name', 'last_name', 'email', 'organization', 'city', 'state', 'zip', 'clients_per_year', 'referral_direction', 'about']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    const missing = REQUIRED.filter(f => !body[f] || String(body[f]).trim() === '')
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    if (body.about && body.about.length > 500) {
      return NextResponse.json({ error: 'About section must be 500 characters or fewer.' }, { status: 400 })
    }

    // Resolve role label
    const role = REFERRAL_PARTNERS.find(p => p.id === body.role_id)
    const role_label = role?.label ?? body.role_id

    // Geocode zip
    const coords = getZipCoords(body.zip)

    // Build supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert partner record
    const { data: partner, error: insertError } = await supabase
      .from('celp_partners')
      .insert({
        role_id: body.role_id.trim(),
        role_label,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        organization: body.organization.trim(),
        website: body.website?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim().toUpperCase(),
        zip: body.zip.trim(),
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        clients_per_year: body.clients_per_year,
        referral_direction: body.referral_direction,
        about: body.about.trim(),
        linkedin: body.linkedin?.trim() || null,
        status: 'pending',
      })
      .select('id, first_name, edit_token')
      .single()

    if (insertError) {
      console.error('celp_partners insert error:', insertError)
      return NextResponse.json({ error: 'Could not save your application. Please try again.' }, { status: 500 })
    }

    // Send emails (best effort — don't fail the response if email fails)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)

      const directionLabel =
        body.referral_direction === 'both' ? 'send and receive'
        : body.referral_direction === 'send' ? 'send referrals'
        : 'receive referrals'

      // 1. Confirmation to applicant
      try {
        await resend.emails.send({
          from: 'CELP® Partner Network <engage@arpinstitute.com>',
          to: body.email.trim(),
          subject: 'Your CELP® Partner Network application is in',
          html: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
  <div style="background:#1a4a37;color:white;padding:1rem 1.5rem;border-radius:8px 8px 0 0;">
    <p style="margin:0;font-weight:700;font-size:16px;">CELP® Partner Network</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:1.5rem;">
    <p>Hi ${body.first_name},</p>
    <p>Thanks for applying to the CELP® Partner Network. We review applications personally — you'll hear back within 2–3 business days.</p>
    <p style="margin:1.5rem 0;">
      <a href="https://arpinstitute.com/credentials/celp"
         style="background:#3d8a6e;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
        Learn more about CELP® →
      </a>
    </p>
    <p style="color:#6b7280;font-size:13px;">Questions? Reply to this email.</p>
    <p style="color:#6b7280;font-size:13px;">— The ARPI Team</p>
  </div>
</div>`,
        })
      } catch (emailErr) {
        console.error('Confirmation email failed:', emailErr)
      }

      // 2. Notification to Jason
      try {
        await resend.emails.send({
          from: 'CELP® Partner Network <engage@arpinstitute.com>',
          to: 'jstanley@arpinstitute.com',
          subject: `New CELP Partner Application — ${role_label} in ${body.city}, ${body.state}`,
          html: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
  <div style="background:#1a4a37;color:white;padding:1rem 1.5rem;border-radius:8px 8px 0 0;">
    <p style="margin:0;font-weight:700;font-size:16px;">New Partner Application</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:1.5rem;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:1rem;">
      <tr><td style="padding:7px 0;color:#6b7280;width:140px;">Name</td><td style="padding:7px 0;font-weight:600;">${body.first_name} ${body.last_name}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Organization</td><td style="padding:7px 0;">${body.organization}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Role</td><td style="padding:7px 0;">${role_label}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Location</td><td style="padding:7px 0;">${body.city}, ${body.state} ${body.zip}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Email</td><td style="padding:7px 0;"><a href="mailto:${body.email}">${body.email}</a></td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Phone</td><td style="padding:7px 0;">${body.phone || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Clients/year</td><td style="padding:7px 0;">${body.clients_per_year}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;">Wants to</td><td style="padding:7px 0;">${directionLabel}</td></tr>
    </table>
    <div style="background:#f9fafb;border-radius:6px;padding:12px 16px;margin-bottom:1.5rem;">
      <p style="margin:0;font-size:13px;color:#374151;font-style:italic;">"${body.about}"</p>
    </div>
    <a href="https://members.nssapros.com/admin/partners"
       style="background:#1a4a37;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
      Review in Admin →
    </a>
  </div>
</div>`,
        })
      } catch (emailErr) {
        console.error('Notification email failed:', emailErr)
      }
    }

    return NextResponse.json({ ok: true, id: partner?.id })
  } catch (err: unknown) {
    console.error('partner-apply error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
