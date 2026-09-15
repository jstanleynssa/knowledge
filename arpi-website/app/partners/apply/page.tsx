'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { REFERRAL_PARTNERS } from '@/lib/celp-referral-partners'

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

function Field({
  label, id, required, hint, children,
}: {
  label: string; id: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--red-dark)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--ink-light)' }}>{hint}</p>}
    </div>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', margin: '28px 0 24px', paddingTop: 24 }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-xlight)', margin: 0 }}>{title}</p>
    </div>
  )
}

function PartnerApplyPageInner() {
  const searchParams = useSearchParams()
  const roleParam = searchParams?.get('role') ?? ''

  const [form, setForm] = useState({
    role_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization: '',
    website: '',
    city: '',
    state: '',
    zip: '',
    street_address: '',
    clients_per_year: '',
    referral_send: false,
    referral_receive: false,
    about: '',
    linkedin: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (roleParam) {
      setForm(f => ({ ...f, role_id: roleParam }))
    }
  }, [roleParam])

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(f => ({ ...f, [name]: checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.role_id || !form.first_name || !form.last_name || !form.email ||
        !form.organization || !form.city || !form.state || !form.zip ||
        !form.clients_per_year || (!form.referral_send && !form.referral_receive) || !form.about) {
      setError('Please fill in all required fields and select at least one referral direction.')
      return
    }

    if (form.about.length > 500) {
      setError('About section must be 500 characters or fewer.')
      return
    }

    const referral_direction = form.referral_send && form.referral_receive
      ? 'both'
      : form.referral_send ? 'send' : 'receive'

    setSending(true)
    try {
      const res = await fetch('/api/partner-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referral_direction }),
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

  const selectedRole = REFERRAL_PARTNERS.find(p => p.id === form.role_id)

  if (done) {
    return (
      <>
        <Nav />
        <main>
          <section style={{ background: '#fff', padding: '100px 0' }}>
            <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: GREEN_LIGHT, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 24px',
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={GREEN} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111', marginBottom: 16 }}>
                Application received.
              </h1>
              <p style={{ fontSize: '16px', color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
                Thank you, {form.first_name}. We review every application personally and
                you&rsquo;ll hear back within 2–3 business days.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Want to learn more?{' '}
                <a href="https://arpinstitute.com/credentials/celp"
                   style={{ color: GREEN, fontWeight: 600 }}>
                  Explore the CELP® credential →
                </a>
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">CELP® Partner Network</div>
              <h1 style={{ marginBottom: 20 }}>
                Apply to the CELP®<br />Partner Network
              </h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                CELP®-certified professionals coordinate financial transitions for families
                during life&rsquo;s most critical moments. List your practice and connect
                with certified professionals in your area.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section style={{ background: '#fff', padding: '80px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <div className="contact-form-box">
              <form onSubmit={submit} noValidate>
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8, marginTop: 0 }}>
                  Partner Application
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginBottom: 28, lineHeight: 1.6 }}>
                  Fill out the form below and we&rsquo;ll be in touch within 2–3 business days.
                </p>

                {/* Role */}
                <Field label="Your professional role" id="role_id" required>
                  <select id="role_id" name="role_id" value={form.role_id} onChange={set} required style={inputStyle}>
                    <option value="">— Select your role —</option>
                    {REFERRAL_PARTNERS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                {selectedRole && (
                  <div style={{ background: GREEN_LIGHT, borderRadius: 4, padding: '10px 14px', fontSize: '0.82rem', color: GREEN, marginTop: -10, marginBottom: 18, lineHeight: 1.5 }}>
                    {selectedRole.headline}
                  </div>
                )}

                <SectionDivider title="Contact Information" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <Field label="First name" id="first_name" required>
                    <input id="first_name" name="first_name" value={form.first_name} onChange={set} required style={inputStyle} />
                  </Field>
                  <Field label="Last name" id="last_name" required>
                    <input id="last_name" name="last_name" value={form.last_name} onChange={set} required style={inputStyle} />
                  </Field>
                </div>
                <Field label="Email address" id="email" required>
                  <input id="email" name="email" type="email" value={form.email} onChange={set} required style={inputStyle} />
                </Field>
                <Field label="Phone number" id="phone" hint="Optional">
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={set} style={inputStyle} />
                </Field>
                <Field label="Organization / firm name" id="organization" required>
                  <input id="organization" name="organization" value={form.organization} onChange={set} required style={inputStyle} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <Field label="Website" id="website" hint="Optional">
                    <input id="website" name="website" type="url" value={form.website} onChange={set} style={inputStyle} placeholder="https://" />
                  </Field>
                  <Field label="LinkedIn profile" id="linkedin" hint="Optional">
                    <input id="linkedin" name="linkedin" value={form.linkedin} onChange={set} style={inputStyle} placeholder="https://linkedin.com/in/..." />
                  </Field>
                </div>

                <SectionDivider title="Location" />

                <Field label="Street address" id="street_address" hint="Optional — suite or unit number welcome">
                  <input id="street_address" name="street_address" value={form.street_address} onChange={set} style={inputStyle} placeholder="123 Main St" />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
                  <Field label="City" id="city" required>
                    <input id="city" name="city" value={form.city} onChange={set} required style={inputStyle} />
                  </Field>
                  <Field label="State" id="state" required>
                    <select id="state" name="state" value={form.state} onChange={set} required style={inputStyle}>
                      <option value="">— State —</option>
                      {US_STATES.map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ZIP code" id="zip" required>
                    <input id="zip" name="zip" value={form.zip} onChange={set} required maxLength={10} style={inputStyle} placeholder="00000" />
                  </Field>
                </div>

                <SectionDivider title="Practice Details" />

                <Field label="Clients / families served per year" id="clients_per_year" required>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 4 }}>
                    {(['<50', '50–200', '200–500', '500+'] as const).map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink-mid)' }}>
                        <input type="radio" name="clients_per_year" value={opt} checked={form.clients_per_year === opt} onChange={set} style={{ accentColor: GREEN, width: 15, height: 15 }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="I want to…" id="referral_direction" required hint="Select at least one">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink-mid)' }}>
                      <input type="checkbox" name="referral_receive" checked={form.referral_receive} onChange={set} style={{ accentColor: GREEN, width: 15, height: 15 }} />
                      Receive referrals from CELP® professionals
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink-mid)' }}>
                      <input type="checkbox" name="referral_send" checked={form.referral_send} onChange={set} style={{ accentColor: GREEN, width: 15, height: 15 }} />
                      Send referrals to CELP® professionals
                    </label>
                  </div>
                </Field>

                <Field label="About your practice" id="about" required hint={`${form.about.length}/500 characters`}>
                  <textarea
                    id="about" name="about" value={form.about} onChange={set} required maxLength={500} rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                    placeholder="Describe what you do, who you serve, and what makes your practice a good fit for CELP® professionals..."
                  />
                </Field>

                {error && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--red-dark)', marginBottom: 16 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary"
                  style={{ width: '100%', textAlign: 'center', border: 'none', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
                >
                  {sending ? 'Submitting…' : 'Submit Application'}
                </button>

                <p style={{ fontSize: '0.78rem', color: 'var(--ink-xlight)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
                  Applications are reviewed within 2–3 business days. Your contact information
                  will only be visible to verified CELP® members.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function PartnerApplyPage() {
  return (
    <Suspense fallback={null}>
      <PartnerApplyPageInner />
    </Suspense>
  )
}
