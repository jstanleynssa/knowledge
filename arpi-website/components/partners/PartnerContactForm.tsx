'use client'

// components/partners/PartnerContactForm.tsx
// CELP-to-partner contact form. Submits to /api/partner-contact (server-side
// email dispatch — partner email is never exposed to the browser).

import { useState, useRef } from 'react'

const GREEN = '#2a6b54'
const GRAY  = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', dark: '#1f2937' }

interface Props {
  partnerId:   string
  partnerName: string
}

export default function PartnerContactForm({ partnerId, partnerName }: Props) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [celp,    setCelp]    = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg,  setErrMsg]  = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const MAX = 1000
  const remaining = MAX - message.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending' || status === 'sent') return

    setStatus('sending')
    setErrMsg('')

    try {
      const res = await fetch('/api/partner-contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id:   partnerId,
          sender_name:  name.trim(),
          sender_email: email.trim(),
          sender_celp:  celp.trim() || undefined,
          message:      message.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrMsg(data.error ?? 'Something went wrong — please try again.')
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
      setErrMsg('Network error — please check your connection and try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div
        style={{
          background: '#f0faf5',
          border: `1px solid #a7d4bf`,
          borderRadius: '10px',
          padding: '24px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>✓</div>
        <p style={{ fontWeight: 700, color: GREEN, margin: '0 0 6px', fontSize: '1rem' }}>
          Message sent to {partnerName}
        </p>
        <p style={{ color: GRAY.text, margin: 0, fontSize: '14px' }}>
          A confirmation was sent to your email. They'll reply to you directly.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    fontSize: '15px',
    border: `1px solid ${GRAY.border}`,
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: 'white',
    outline: 'none',
    color: GRAY.dark,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: GRAY.dark,
    marginBottom: '5px',
    fontFamily: 'Inter, system-ui, sans-serif',
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        {/* Name */}
        <div>
          <label htmlFor="pc-name" style={labelStyle}>Your name <span style={{ color: '#b91c1c' }}>*</span></label>
          <input
            id="pc-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            style={inputStyle}
            disabled={status === 'sending'}
          />
        </div>
        {/* Email */}
        <div>
          <label htmlFor="pc-email" style={labelStyle}>Your email <span style={{ color: '#b91c1c' }}>*</span></label>
          <input
            id="pc-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@firm.com"
            style={inputStyle}
            disabled={status === 'sending'}
          />
        </div>
      </div>

      {/* CELP # (optional) */}
      <div style={{ marginBottom: '14px' }}>
        <label htmlFor="pc-celp" style={labelStyle}>
          CELP® designation number <span style={{ color: GRAY.text, fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="pc-celp"
          type="text"
          value={celp}
          onChange={e => setCelp(e.target.value)}
          placeholder="e.g. CELP-1234"
          style={{ ...inputStyle, maxWidth: '240px' }}
          disabled={status === 'sending'}
        />
      </div>

      {/* Message */}
      <div style={{ marginBottom: '18px' }}>
        <label htmlFor="pc-message" style={labelStyle}>Message <span style={{ color: '#b91c1c' }}>*</span></label>
        <textarea
          id="pc-message"
          required
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          maxLength={MAX}
          placeholder={`Introduce yourself and describe how you'd like to collaborate with ${partnerName}…`}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
          disabled={status === 'sending'}
        />
        <p style={{ fontSize: '12px', color: remaining < 100 ? '#b91c1c' : GRAY.text, margin: '4px 0 0', textAlign: 'right' }}>
          {remaining} characters remaining
        </p>
      </div>

      {/* Error */}
      {status === 'error' && (
        <p style={{ color: '#b91c1c', fontSize: '14px', margin: '0 0 14px', padding: '10px 14px', background: '#fef2f2', borderRadius: '7px' }}>
          {errMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || !name.trim() || !email.trim() || !message.trim()}
        style={{
          padding: '11px 26px',
          borderRadius: '8px',
          border: 'none',
          background: GREEN,
          color: 'white',
          fontWeight: 700,
          fontSize: '15px',
          fontFamily: 'Inter, system-ui, sans-serif',
          cursor: (status === 'sending' || !name.trim() || !email.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
          opacity: (status === 'sending' || !name.trim() || !email.trim() || !message.trim()) ? 0.65 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {status === 'sending' ? 'Sending…' : `Send message to ${partnerName}`}
      </button>
    </form>
  )
}
