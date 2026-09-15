import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
const FROM = 'ARPI <engage@arpinstitute.com>'
const NOTIFY = 'jstanley@arpinstitute.com'

export async function POST(req: NextRequest) {
  try {
    const { name, email, background, interest } = await req.json()

    if (!name || !email || !background || !interest) {
      return NextResponse.json({ ok: false, error: 'Missing required fields.' }, { status: 400 })
    }

    const resend = getResend()

    // Notify Jason
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      subject: `CELP® Interest — ${name}`,
      text: [
        `New CELP® expression of interest`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Background: ${background}`,
        ``,
        `Why they're pursuing CELP®:`,
        interest,
      ].join('\n'),
    })

    // Confirmation to applicant
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'We received your CELP® interest — thank you',
      text: [
        `Hi ${name.split(' ')[0]},`,
        ``,
        `Thanks for expressing your interest in the CELP® credential. We received your submission and you're on our list.`,
        ``,
        `CELP® launches Q4 2026. As we get closer, we'll be in touch with application details, the entrance process, timeline, and next steps. Keep an eye on your inbox.`,
        ``,
        `In the meantime, you can learn more about the credential and what CELP® professionals do:`,
        `https://arpinstitute.com/credentials/celp`,
        ``,
        `— The ARPI Team`,
        `engage@arpinstitute.com`,
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('celp-interest error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to submit. Please try again.' }, { status: 500 })
  }
}
