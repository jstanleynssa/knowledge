import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const key = process.env.RESEND_API_KEY
    if (!key) {
      // No key configured — log and return success so UI works during development
      console.log('Contact form submission (no Resend key):', { name, email, subject, message })
      return NextResponse.json({ ok: true })
    }

    const resend = new Resend(key)
    await resend.emails.send({
      from: 'ARPI Contact Form <noreply@arpinstitute.com>',
      to: 'engage@arpinstitute.com',
      replyTo: email,
      subject: `[ARPI Contact] ${subject || 'General Inquiry'} — ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Could not send your message.' }, { status: 500 })
  }
}
