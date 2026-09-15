'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],
  ['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],
  ['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],
  ['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],
  ['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],
  ['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],
  ['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
]

const GREEN = '#2a6b54'
const GREEN_LIGHT = '#d9ede5'
const GREEN_MID = '#3d8a6e'
const BORDER = '#d1d5db'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '15px',
  border: `1px solid ${BORDER}`,
  borderRadius: '6px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif',
  background: 'white',
  color: '#111',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '14px',
  marginBottom: '6px',
  color: '#374151',
}

function Field({ label, id, required, hint, children }: {
  label: string; id: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor={id} style={labelStyle}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{hint}</p>}
    </div>
  )
}

interface Partner {
  role_id: string
  role_label: string
  first_name: string
  last_name: string
  email: string
  phone: string
  organization: string
  website: string
  city: string
  state: string
  zip: string
  clients_per_year: string
  referral_direction: string
  about: string
  linkedin: string
}

function EditForm() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [form, setForm] = useState<Partial<Partner>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    fetch(`/api/partner-edit?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.partner) {
          setPartner(data.partner)
          setForm({ ...data.partner })
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.first_name || !form.last_name || !form.organization || !form.city || !form.state || !form.zip) {
      setError('Please fill in all required fields.')
      return
    }

    if (form.about && form.about.length > 500) {
      setError('About section must be 500 characters or fewer.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/partner-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not save changes.')
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center', color: '#6b7280' }}>
        Loading your listing…
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 18, color: '#dc2626', fontWeight: 600 }}>Listing not found.</p>
        <p style={{ color: '#6b7280' }}>This link may be invalid or the listing is no longer active.</p>
      </div>
    )
  }

  if (saved) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: GREEN_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 12 }}>Listing updated.</h2>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Your changes have been saved. CELP® professionals will see your updated information.</p>
        <button onClick={() => { setSaved(false) }} style={{ marginTop: 20, padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          Edit again
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 8 }}>Edit your partner listing</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Changes are immediate. Your role (<strong>{partner?.role_label}</strong>) cannot be changed — contact us if needed.
      </p>

      {saved === false && error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Contact */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 24, marginTop: 0 }}>Contact Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="First name" id="first_name" required>
            <input id="first_name" name="first_name" value={form.first_name ?? ''} onChange={set} required style={inputStyle} />
          </Field>
          <Field label="Last name" id="last_name" required>
            <input id="last_name" name="last_name" value={form.last_name ?? ''} onChange={set} required style={inputStyle} />
          </Field>
        </div>
        <Field label="Phone number" id="phone" hint="Optional">
          <input id="phone" name="phone" type="tel" value={form.phone ?? ''} onChange={set} style={inputStyle} />
        </Field>
        <Field label="Organization / firm name" id="organization" required>
          <input id="organization" name="organization" value={form.organization ?? ''} onChange={set} required style={inputStyle} />
        </Field>
        <Field label="Website" id="website" hint="Optional">
          <input id="website" name="website" type="url" value={form.website ?? ''} onChange={set} style={inputStyle} placeholder="https://" />
        </Field>
        <Field label="LinkedIn profile" id="linkedin" hint="Optional">
          <input id="linkedin" name="linkedin" value={form.linkedin ?? ''} onChange={set} style={inputStyle} placeholder="https://linkedin.com/in/..." />
        </Field>
      </div>

      {/* Location */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 24, marginTop: 0 }}>Location</h2>
        <Field label="City" id="city" required>
          <input id="city" name="city" value={form.city ?? ''} onChange={set} required style={inputStyle} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 20px' }}>
          <Field label="State" id="state" required>
            <select id="state" name="state" value={form.state ?? ''} onChange={set} required style={inputStyle}>
              <option value="">— Select state —</option>
              {US_STATES.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="ZIP code" id="zip" required>
            <input id="zip" name="zip" value={form.zip ?? ''} onChange={set} required maxLength={10} style={inputStyle} />
          </Field>
        </div>
      </div>

      {/* Practice */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 24, marginTop: 0 }}>Practice Details</h2>
        <Field label="Clients / families served per year" id="clients_per_year">
          {(['<50', '50–200', '200–500', '500+'] as const).map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: 15 }}>
              <input
                type="radio"
                name="clients_per_year"
                value={opt}
                checked={form.clients_per_year === opt}
                onChange={set}
                style={{ accentColor: GREEN, width: 16, height: 16 }}
              />
              {opt}
            </label>
          ))}
        </Field>
        <Field label="I want to…" id="referral_direction">
          {(['receive', 'send', 'both'] as const).map((opt) => {
            const labels = { receive: 'Receive referrals from CELP® professionals', send: 'Send referrals to CELP® professionals', both: 'Both — send and receive' }
            return (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: 15 }}>
                <input
                  type="radio"
                  name="referral_direction"
                  value={opt}
                  checked={form.referral_direction === opt}
                  onChange={set}
                  style={{ accentColor: GREEN, width: 16, height: 16 }}
                />
                {labels[opt]}
              </label>
            )
          })}
        </Field>
        <Field label="About your practice" id="about" hint={`${(form.about ?? '').length}/500 characters`}>
          <textarea
            id="about"
            name="about"
            value={form.about ?? ''}
            onChange={set}
            maxLength={500}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{ width: '100%', padding: '14px 24px', background: saving ? '#6b7280' : GREEN_MID, color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save changes →'}
      </button>
    </form>
  )
}

export default function PartnerEditPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: '80vh', background: '#f9fafb' }}>
        <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center', color: '#6b7280' }}>Loading…</div>}>
          <EditForm />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
