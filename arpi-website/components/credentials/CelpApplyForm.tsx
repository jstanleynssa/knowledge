'use client'

import { useState } from 'react'

const GREEN = '#2a6b54'
const GREEN_LIGHT = '#d9ede5'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: '0.9rem',
  border: '1px solid var(--border)',
  borderRadius: 3,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: '#fff',
  color: 'var(--ink)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--ink-mid)',
  marginBottom: 6,
  letterSpacing: '0.02em',
}

export default function CelpApplyForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    background: '',
    interest: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.background || !form.interest) {
      setError('Please fill in all fields.')
      return
    }
    setSending(true); setError(null)
    try {
      const res = await fetch('/api/celp-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.')
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div style={{
        background: GREEN_LIGHT, border: `1px solid ${GREEN}`,
        borderRadius: 8, padding: '32px 36px', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: GREEN,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
          You&rsquo;re on the list.
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          We&rsquo;ll be in touch as CELP® moves toward its Q4 2026 launch — with application
          details, timeline, and next steps. Keep an eye on your inbox.
        </p>
      </div>
    )
  }

  return (
    <div className="contact-form-box">
      <form onSubmit={submit} noValidate>
        <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
          Express Your Interest
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginBottom: 28, lineHeight: 1.6 }}>
          Tell us a bit about yourself. This is not the formal application — it&rsquo;s your
          first step toward consideration for the inaugural CELP® cohort.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Full Name <span style={{ color: 'var(--red-dark)' }}>*</span></label>
          <input name="name" value={form.name} onChange={change} required style={inputStyle} placeholder="Jane Smith" />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email Address <span style={{ color: 'var(--red-dark)' }}>*</span></label>
          <input name="email" type="email" value={form.email} onChange={change} required style={inputStyle} placeholder="jane@example.com" />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Your Professional Background <span style={{ color: 'var(--red-dark)' }}>*</span></label>
          <input
            name="background"
            value={form.background}
            onChange={change}
            required
            style={inputStyle}
            placeholder="e.g. Estate planning attorney with 12 years of experience in elder law"
          />
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--ink-light)' }}>
            Title, industry, years of experience — a sentence is fine.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Why are you pursuing CELP®? <span style={{ color: 'var(--red-dark)' }}>*</span></label>
          <textarea
            name="interest"
            value={form.interest}
            onChange={change}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
            placeholder="What drew you to end-of-life planning, and what do you hope to do with the credential?"
          />
        </div>

        {error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--red-dark)', marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="btn-primary"
          style={{ width: '100%', textAlign: 'center', border: 'none', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
        >
          {sending ? 'Submitting…' : 'Submit Expression of Interest'}
        </button>

        <p style={{ fontSize: '0.78rem', color: 'var(--ink-xlight)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          This is not a binding application. We&rsquo;ll follow up with next steps before any
          fees or commitments are required.
        </p>
      </form>
    </div>
  )
}
