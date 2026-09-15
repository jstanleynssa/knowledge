// pages/partners/[slug].js
// Statically generated public partner profile for the CELP® Partner Network.
// SSG + ISR — same pattern as pages/find-an-advisor/[slug].js.
// Slug shape: {org-name-slugified}-{city}-{state}

import Head from 'next/head'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { buildPartnerSlugIndex } from '@/lib/slug'

// ── Color tokens ─────────────────────────────────────────────────────────────
const GREEN = { light: '#d9ede5', mid: '#2a6b54', dark: '#1a4a37' }
const GRAY  = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', dark: '#1f2937' }
const SITE  = 'https://arpinstitute.com/partners'

// ── Contact form ─────────────────────────────────────────────────────────────
function ContactForm({ partnerId, partnerOrg, partnerFirst }) {
  const [form, setForm]     = useState({ name: '', email: '', celp: '', message: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  function set(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in your name, email, and message.')
      return
    }
    if (form.message.length > 1000) {
      setError('Message must be 1,000 characters or fewer.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/partner-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id:   partnerId,
          sender_name:  form.name,
          sender_email: form.email,
          sender_celp:  form.celp || null,
          message:      form.message,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.')
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: `1px solid ${GRAY.border}`, borderRadius: '6px',
    boxSizing: 'border-box', fontFamily: 'inherit',
    background: 'white', color: GRAY.dark, outline: 'none',
  }
  const lbl = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: GRAY.text, marginBottom: 5, letterSpacing: '0.02em',
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: GREEN.light, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={GREEN.mid} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontWeight: 700, color: GRAY.dark, margin: '0 0 6px', fontSize: '15px' }}>
          Message sent!
        </p>
        <p style={{ fontSize: '13px', color: GRAY.text, margin: 0, lineHeight: 1.5 }}>
          {partnerOrg} will be in touch at your email.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Your name<span style={{ color: '#dc2626' }}> *</span></label>
        <input name="name" value={form.name} onChange={set} required style={inp} placeholder="Jane Smith, CFP" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Your email<span style={{ color: '#dc2626' }}> *</span></label>
        <input name="email" type="email" value={form.email} onChange={set} required style={inp} placeholder="you@example.com" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>CELP® cert number <span style={{ fontWeight: 400 }}>(optional)</span></label>
        <input name="celp" value={form.celp} onChange={set} style={inp} placeholder="CELP-####" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>
          Message<span style={{ color: '#dc2626' }}> *</span>
          <span style={{ fontWeight: 400, float: 'right' }}>{form.message.length}/1000</span>
        </label>
        <textarea
          name="message" value={form.message} onChange={set} required
          maxLength={1000} rows={4}
          style={{ ...inp, resize: 'vertical', minHeight: 90 }}
          placeholder={`Hi ${partnerFirst}, I\u2019m a CELP\u00ae professional looking to connect...`}
        />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 10px' }}>{error}</p>}
      <button
        type="submit" disabled={sending}
        style={{
          width: '100%', padding: '12px 20px',
          background: sending ? GRAY.text : GREEN.mid,
          color: 'white', border: 'none', borderRadius: '6px',
          fontWeight: 700, fontSize: '14px',
          cursor: sending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {sending ? 'Sending\u2026' : `Send message to ${partnerOrg}`}
      </button>
    </form>
  )
}

const DIRECTION_LABELS = {
  send:    'Sends referrals to CELP® professionals',
  receive: 'Receives referrals from CELP® professionals',
  both:    'Sends and receives referrals',
}

// ── Build-time data ──────────────────────────────────────────────────────────
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function fetchApprovedPartners() {
  const supabase = admin()
  const { data, error } = await supabase
    .from('celp_partners')
    .select(
      'id, role_id, role_label, first_name, last_name, email, phone, organization, street_address, website, city, state, zip, lat, lng, clients_per_year, referral_direction, about, linkedin, status, created_at'
    )
    .eq('status', 'approved')
    .order('organization', { ascending: true })
  if (error) {
    console.error('Partner fetch error:', error.message)
    return []
  }
  return data || []
}

export async function getStaticPaths() {
  const partners = await fetchApprovedPartners()
  const { byId } = buildPartnerSlugIndex(partners)

  // Pre-build first 20 paths; fallback: 'blocking' handles the rest on demand.
  const paths = [...byId.values()].slice(0, 20).map(slug => ({ params: { slug } }))
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const partners = await fetchApprovedPartners()
  const { bySlug } = buildPartnerSlugIndex(partners)
  const partner = bySlug.get(params.slug)
  if (!partner) return { notFound: true }

  // Strip fields that must not be public.
  // eslint-disable-next-line no-unused-vars
  const { email: _email, edit_token: _token, ...safePartner } = partner

  return {
    props: { partner: JSON.parse(JSON.stringify(safePartner)), slug: params.slug },
    revalidate: 86400, // ISR: rebuild at most once per day
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function websiteHref(url) {
  if (!url) return null
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

function cleanWebsite(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function truncateAtWord(str, max) {
  const s = (str || '').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '') + '…'
}

function aboutToParagraphs(about) {
  if (!about) return []
  return about
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean)
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PartnerProfile({ partner, slug }) {
  const web      = websiteHref(partner.website)
  const linkedin = websiteHref(partner.linkedin)
  const canonical = `${SITE}/${slug}`
  const paragraphs = aboutToParagraphs(partner.about)

  // Address
  const addressLine = [
    partner.street_address,
    partner.city,
    `${partner.state ?? ''} ${partner.zip ?? ''}`.trim(),
  ]
    .filter(Boolean)
    .join(', ')

  const cityState = [partner.city, partner.state].filter(Boolean).join(', ')

  // SEO
  const pageTitle = `${partner.organization} — CELP® Partner | ARPI`
  const metaDesc  = truncateAtWord(
    `${partner.organization} is a CELP® Partner Network member — ${partner.role_label}${
      cityState ? ` in ${cityState}` : ''
    }. ${truncateAtWord(partner.about || '', 100)}`,
    155
  )

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Partners', href: '/partners' },
    ...(cityState ? [{ label: cityState, href: null }] : []),
    { label: partner.organization, href: null },
  ]

  // Schema.org Organization
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: partner.organization,
    url: web || canonical,
    telephone: partner.phone || undefined,
    address:
      partner.city || partner.state
        ? {
            '@type': 'PostalAddress',
            streetAddress: partner.street_address || undefined,
            addressLocality: partner.city || undefined,
            addressRegion: partner.state || undefined,
            postalCode: partner.zip || undefined,
            addressCountry: 'US',
          }
        : undefined,
    sameAs: [web, linkedin].filter(Boolean),
    employee: {
      '@type': 'Person',
      name: `${partner.first_name ?? ''} ${partner.last_name ?? ''}`.trim(),
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
      ...(b.href ? { item: `https://arpinstitute.com${b.href}` } : {}),
    })),
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="ARPI CELP® Partner Network" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </Head>

      <style>{`
        @media (max-width: 860px) {
          .partner-body-grid { grid-template-columns: 1fr !important; }
          .partner-sidebar   { position: static !important; }
          .partner-vp-grid   { grid-template-columns: 1fr !important; gap: 2px !important; }
        }
        @media (max-width: 640px) {
          .partner-hero-inner { padding: 2.5rem 1.25rem 2rem !important; }
          .partner-body-inner { padding: 2rem 1.25rem !important; }
        }
      `}</style>

      <div style={{ color: GRAY.dark }}>
        <Nav />

        {/* ── Hero ── */}
        <section style={{ background: GREEN.dark, color: 'white' }}>
          <div
            className="partner-hero-inner"
            style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem 3rem' }}
          >
            {/* Eyebrow */}
            <div
              style={{
                fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: GREEN.light, marginBottom: 16,
              }}
            >
              CELP® Partner Network
            </div>

            {/* H1 */}
            <h1
              style={{
                fontFamily: 'var(--font-merriweather), Georgia, serif',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.8rem)',
                fontWeight: 700, color: 'white',
                lineHeight: 1.2, marginTop: 0, marginBottom: 16,
              }}
            >
              {partner.organization}
            </h1>

            {/* Role badge */}
            <div style={{ marginBottom: 20 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: GREEN.light, color: GREEN.dark,
                  fontSize: '0.8rem', fontWeight: 700,
                  borderRadius: 20, padding: '4px 14px',
                }}
              >
                {partner.role_label}
              </span>
            </div>

            {/* Address */}
            {addressLine && (
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 10px' }}>
                {addressLine}
              </p>
            )}

            {/* Website */}
            {web && (
              <p style={{ margin: '0 0 8px' }}>
                <a
                  href={web}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  style={{ color: 'white', textDecoration: 'underline', fontSize: '0.95rem' }}
                >
                  {cleanWebsite(partner.website)}
                </a>
              </p>
            )}

            {/* LinkedIn */}
            {linkedin && (
              <p style={{ margin: 0 }}>
                <a
                  href={linkedin}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  style={{
                    color: GREEN.light, textDecoration: 'none',
                    fontSize: '0.9rem', fontWeight: 600,
                  }}
                >
                  LinkedIn →
                </a>
              </p>
            )}
          </div>
        </section>

        {/* ── Body ── */}
        <section style={{ background: 'white' }}>
          <div
            className="partner-body-inner"
            style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 2rem' }}
          >
            <div
              className="partner-body-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: '3rem',
                alignItems: 'start',
              }}
            >
              {/* Left: About */}
              <div>
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ marginBottom: '1.75rem' }}>
                  <ol
                    style={{
                      listStyle: 'none', padding: 0, margin: 0,
                      display: 'flex', flexWrap: 'wrap',
                      alignItems: 'center', gap: '10px',
                      fontSize: '14px', color: GRAY.text,
                    }}
                  >
                    {breadcrumbs.map((b, i) => (
                      <li
                        key={i}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                      >
                        {b.href ? (
                          <a
                            href={b.href}
                            style={{ color: GREEN.mid, textDecoration: 'none', fontWeight: 600 }}
                          >
                            {b.label}
                          </a>
                        ) : (
                          <span
                            aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}
                            style={{ color: GRAY.text }}
                          >
                            {b.label}
                          </span>
                        )}
                        {i < breadcrumbs.length - 1 && (
                          <span style={{ color: GRAY.text, userSelect: 'none', fontWeight: 600 }}>
                            &gt;
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* H2 About */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: '14px', marginBottom: '1.5rem',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '5px', height: '34px',
                      background: GREEN.mid, borderRadius: '2px', flexShrink: 0,
                    }}
                  />
                  <h2
                    style={{
                      fontSize: '1.6rem', fontWeight: 800,
                      color: GRAY.dark, margin: 0,
                    }}
                  >
                    About {partner.organization}
                  </h2>
                </div>

                {/* About paragraphs */}
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: '16px', color: '#374151',
                        lineHeight: 1.75, marginBottom: '1.1rem',
                      }}
                    >
                      {para}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: '16px', color: GRAY.text, lineHeight: 1.75 }}>
                    {partner.organization} is a member of the CELP® Partner Network.
                  </p>
                )}

                {/* Referral preferences */}
                <div
                  style={{
                    marginTop: '2.5rem',
                    paddingTop: '1.5rem',
                    borderTop: `1px solid ${GRAY.border}`,
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.05rem', fontWeight: 700,
                      color: GRAY.dark, marginBottom: '1rem', marginTop: 0,
                    }}
                  >
                    Referral Preferences
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {partner.referral_direction && (
                      <span
                        style={{
                          display: 'inline-block', fontSize: '13px', fontWeight: 600,
                          borderRadius: 4, padding: '4px 10px',
                          background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                        }}
                      >
                        {DIRECTION_LABELS[partner.referral_direction] ?? partner.referral_direction}
                      </span>
                    )}
                    {partner.clients_per_year && (
                      <span
                        style={{
                          display: 'inline-block', fontSize: '13px', fontWeight: 600,
                          borderRadius: 4, padding: '4px 10px',
                          background: GRAY.bg, color: GRAY.text,
                        }}
                      >
                        {partner.clients_per_year} clients/yr
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Connect sidebar */}
              <div
                className="partner-sidebar"
                style={{
                  position: 'sticky', top: '2rem',
                  border: `1px solid ${GRAY.border}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '1.1rem', fontWeight: 700,
                    color: GRAY.dark, marginBottom: 6, marginTop: 0,
                  }}
                >
                  Connect with {partner.organization}
                </h3>
                <p style={{ fontSize: '13px', color: GRAY.text, margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                  Reach out to explore a referral relationship.
                </p>

                {/* Quick links: phone + website */}
                {(partner.phone || web || linkedin) && (
                  <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {partner.phone && (
                      <a
                        href={`tel:${partner.phone.replace(/[^0-9+]/g, '')}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', background: GRAY.bg,
                          borderRadius: 6, color: GRAY.dark,
                          textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {partner.phone}
                      </a>
                    )}
                    {web && (
                      <a
                        href={web} target="_blank" rel="nofollow noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', background: GRAY.bg,
                          borderRadius: 6, color: GRAY.dark,
                          textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {cleanWebsite(partner.website)}
                      </a>
                    )}
                    {linkedin && (
                      <a
                        href={linkedin} target="_blank" rel="nofollow noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', background: GRAY.bg,
                          borderRadius: 6, color: GRAY.dark,
                          textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}

                {/* Divider */}
                <hr style={{ border: 'none', borderTop: `1px solid ${GRAY.border}`, margin: '1.25rem 0' }} />

                {/* Contact form */}
                <ContactForm
                  partnerId={partner.id}
                  partnerOrg={partner.organization}
                  partnerFirst={partner.first_name}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Value-prop band ── */}
        <section
          style={{
            background: '#f8f9fa',
            padding: '5rem 2rem',
            borderTop: `1px solid ${GRAY.border}`,
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div
                style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: GREEN.mid, marginBottom: 12,
                }}
              >
                Why CELP® Partners
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-merriweather), Georgia, serif',
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 700, color: '#111827',
                  lineHeight: 1.25, letterSpacing: '-0.01em',
                }}
              >
                What the CELP® Partner Network Means
              </h2>
              <p
                style={{
                  fontSize: '1rem', color: GRAY.text,
                  maxWidth: '620px', margin: '16px auto 0', lineHeight: 1.75,
                }}
              >
                CELP®-certified professionals and their trusted partners form a coordinated
                network — so families get the right expert at the right moment.
              </p>
            </div>

            <div
              className="partner-vp-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
                background: GRAY.border,
                border: `1px solid ${GRAY.border}`,
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {[
                [
                  'Coordinated Transitions',
                  "Life's financial transitions are rarely simple. CELP® Partner organizations work alongside certified professionals to ensure families have expert guidance at every step — legal, financial, and caregiving.",
                ],
                [
                  'Trusted, Vetted Partners',
                  "Every organization in the CELP® Partner Network is reviewed and approved by ARPI. Families and professionals can connect with confidence knowing they're working with a vetted partner.",
                ],
                [
                  'Referrals That Work Both Ways',
                  'The network is built on mutual referral relationships — attorneys send clients to CELP® advisors, and CELP® advisors send clients to attorneys, CPAs, and care professionals. Everyone wins when the right people are connected.',
                ],
              ].map(([title, body]) => (
                <div key={title} style={{ background: 'white', padding: '2.5rem 2rem' }}>
                  <div
                    style={{
                      width: 40, height: 3,
                      background: GREEN.mid, marginBottom: 24,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: 'var(--font-merriweather), Georgia, serif',
                      fontSize: '1.05rem', fontWeight: 700,
                      color: '#111827', marginBottom: 12, lineHeight: 1.35, marginTop: 0,
                    }}
                  >
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.75, margin: 0 }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
