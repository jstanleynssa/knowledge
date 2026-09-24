'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const SUBJECTS = [
  'Course & Credential Questions',
  'Certification Support',
  'CE Credit & Reporting',
  'Partnership / B2B Inquiry',
  'AXIOM Platform',
  'CALCULUS — Team & Firm Access',
  'Media & Press',
  'Other',
]

export default function ContactPage() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', subject: searchParams.get('subject') ?? '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in your name, email, and message.')
      return
    }
    setSending(true); setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not send your message.')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Nav />
      <main>

        {/* Hero */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">Contact Us</div>
              <h1 style={{ marginBottom: 20 }}>Have Questions?<br />We&rsquo;d Love to<br />Hear From You.</h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                Whether you&rsquo;re curious about our credentials, need help with your certification,
                or want to explore a partnership —<br />our team is ready to help.
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section style={{ background: '#fff', padding: '80px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="contact-content-grid">

              {/* Contact info */}
              <div>
                <div className="section-eyebrow">Reach Us Directly</div>
                <h2 className="section-title" style={{ marginBottom: 40 }}>Get in Touch</h2>

                {[
                  {
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ),
                    label: 'Email Us',
                    content: <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-mid)', textDecoration: 'none', fontWeight: 600 }}>engage@arpinstitute.com</a>,
                    note: 'We respond within one business day.',
                  },
                  {
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.5 1.21 2 2 0 012.5 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    ),
                    label: 'Call Us',
                    content: <a href="tel:202-370-1807" style={{ color: 'var(--green-mid)', textDecoration: 'none', fontWeight: 600 }}>(202) 370-1807</a>,
                    note: 'Available Monday–Friday, 9am–5pm ET.',
                  },
                  {
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    ),
                    label: 'Mail Us',
                    content: (
                      <address style={{ fontStyle: 'normal', lineHeight: 1.7, color: 'var(--ink-mid)' }}>
                        Social Security Professionals<br />
                        1763 Columbia Road NW<br />
                        Ste 175, PMB 481983<br />
                        Washington, DC 20009
                      </address>
                    ),
                    note: null,
                  },
                ].map(({ icon, label, content, note }) => (
                  <div key={label} style={{ display: 'flex', gap: 20, marginBottom: 36, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 6,
                      background: 'var(--green-xlight)', color: 'var(--green-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-xlight)', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: '0.95rem' }}>{content}</div>
                      {note && <div style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: 4 }}>{note}</div>}
                    </div>
                  </div>
                ))}

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, marginTop: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-xlight)', marginBottom: 12 }}>Connect</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { label: 'in', title: 'LinkedIn', href: '#' },
                      { label: '𝕏', title: 'Twitter/X', href: '#' },
                      { label: 'f', title: 'Facebook', href: '#' },
                    ].map(s => (
                      <a key={s.label} href={s.href} title={s.title} className="footer-social-icon" style={{ background: 'var(--bg-soft)', color: 'var(--ink-mid)' }}>
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="contact-form-box">
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Message Sent</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: 1.75 }}>
                      Thanks for reaching out. We&rsquo;ll get back to you within one business day.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Send Us a Message</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginBottom: 28, lineHeight: 1.6 }}>Fill out the form below and we&rsquo;ll be in touch shortly.</p>

                    {[
                      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', required: true },
                      { name: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com', required: true },
                    ].map(f => (
                      <div key={f.name} style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-mid)', marginBottom: 6, letterSpacing: '0.02em' }}>
                          {f.label} {f.required && <span style={{ color: 'var(--red-dark)' }}>*</span>}
                        </label>
                        <input
                          name={f.name}
                          type={f.type}
                          value={form[f.name as keyof typeof form]}
                          onChange={change}
                          placeholder={f.placeholder}
                          style={{ width: '100%', padding: '11px 14px', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 3, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-mid)', marginBottom: 6, letterSpacing: '0.02em' }}>Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={change}
                        style={{ width: '100%', padding: '11px 14px', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 3, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      >
                        <option value="">Select a topic…</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-mid)', marginBottom: 6, letterSpacing: '0.02em' }}>
                        Message <span style={{ color: 'var(--red-dark)' }}>*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={change}
                        placeholder="How can we help?"
                        rows={5}
                        style={{ width: '100%', padding: '11px 14px', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: 3, background: '#fff', fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 120, boxSizing: 'border-box' }}
                      />
                    </div>

                    {error && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--red-dark)', marginBottom: 16 }}>{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="btn-primary"
                      style={{ width: '100%', textAlign: 'center', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer', border: 'none' }}
                    >
                      {sending ? 'Sending…' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
