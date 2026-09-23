// app/find-a-partner/[id]/page.tsx
// CELP® Partner profile page.
// Server-side fetch: approved partner only; 404 for unknown/unapproved ids.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { createClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────
interface Partner {
  id: string
  role_id: string
  role_label: string
  first_name: string
  last_name: string
  organization: string | null
  city: string | null
  state: string | null
  zip: string | null
  clients_per_year: string | null
  referral_direction: 'send' | 'receive' | 'both'
  about: string | null
  website: string | null
  linkedin: string | null
}

const DIRECTION_LABELS: Record<string, string> = {
  send: 'Sends referrals to CELP® professionals',
  receive: 'Receives referrals from CELP® professionals',
  both: 'Sends & receives referrals with CELP® professionals',
}

// ── Color tokens (match find-a-partner/page.tsx) ─────────────────────────
const GREEN      = '#2a6b54'
const GREEN_LIGHT = '#d9ede5'
const GRAY = {
  text:   '#6b7280',
  bg:     '#f3f4f6',
  border: '#e5e7eb',
  dark:   '#1f2937',
}

// ── Data fetch ────────────────────────────────────────────────────────────
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getPartner(id: string): Promise<Partner | null> {
  if (!UUID_RE.test(id)) return null

  const supabase = admin()
  const { data, error } = await supabase
    .from('celp_partners')
    .select(
      'id, role_id, role_label, first_name, last_name, organization, city, state, zip, clients_per_year, referral_direction, about, website, linkedin'
    )
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()

  if (error || !data) return null
  return data as Partner
}

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const partner = await getPartner(id)
  if (!partner) return { title: 'Partner Not Found' }
  const name = `${partner.first_name} ${partner.last_name}`.trim()
  const org  = partner.organization ? ` · ${partner.organization}` : ''
  return {
    title: `${name}${org} | CELP® Partner Network`,
    description: partner.about?.slice(0, 160) ?? `${partner.role_label} in the CELP® Partner Network`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function PartnerProfilePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const partner = await getPartner(id)
  if (!partner) notFound()

  const name = `${partner.first_name} ${partner.last_name}`.trim()
  const location = [partner.city, partner.state].filter(Boolean).join(', ')

  // Normalise website URL for display (strip https?:// prefix)
  const websiteDisplay = partner.website
    ? partner.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    : null
  const websiteHref = partner.website
    ? (partner.website.startsWith('http') ? partner.website : `https://${partner.website}`)
    : null

  return (
    <>
      <div style={{ color: GRAY.dark, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />

        {/* ── Hero ── */}
        <section className="hero" style={{ padding: '56px 0 48px' }}>
          <div className="container">
            {/* Back link */}
            <a
              href="/find-a-partner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: GREEN,
                fontWeight: 600,
                marginBottom: '28px',
                textDecoration: 'none',
              }}
            >
              ← Back to Partner Directory
            </a>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
              {/* Avatar placeholder */}
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: GREEN_LIGHT,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: GREEN,
                  fontWeight: 700,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  border: `2px solid ${GREEN}22`,
                }}
                aria-hidden="true"
              >
                {(partner.first_name?.[0] ?? '?').toUpperCase()}
              </div>

              <div style={{ flex: '1 1 260px' }}>
                <div className="hero-eyebrow" style={{ marginBottom: '6px' }}>CELP® Partner Network</div>
                <h1 style={{ marginBottom: '6px', lineHeight: 1.15 }}>{name}</h1>
                {partner.organization && (
                  <p style={{ fontSize: '1.125rem', color: GRAY.text, margin: '0 0 10px', fontWeight: 500 }}>
                    {partner.organization}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      padding: '3px 10px',
                      background: GREEN_LIGHT,
                      color: GREEN,
                    }}
                  >
                    {partner.role_label}
                  </span>
                  {location && (
                    <span style={{ fontSize: '14px', color: GRAY.text }}>
                      📍 {location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <section style={{ padding: '0 2rem 4rem', flex: 1 }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>

            {/* About */}
            {partner.about && (
              <div style={{ marginBottom: '2rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-merriweather), Georgia, serif',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: GRAY.dark,
                    margin: '0 0 10px',
                  }}
                >
                  About
                </h2>
                <p style={{ fontSize: '1rem', color: GRAY.dark, lineHeight: 1.7, margin: 0 }}>
                  {partner.about}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {/* Referral direction */}
              <div
                style={{
                  background: GRAY.bg,
                  borderRadius: '10px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Referral Direction
                </div>
                <div style={{ fontSize: '14px', color: GRAY.dark, fontWeight: 500 }}>
                  {DIRECTION_LABELS[partner.referral_direction] ?? partner.referral_direction}
                </div>
              </div>

              {/* Clients/year */}
              {partner.clients_per_year && (
                <div
                  style={{
                    background: GRAY.bg,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Clients / Year
                  </div>
                  <div style={{ fontSize: '14px', color: GRAY.dark, fontWeight: 500 }}>
                    {partner.clients_per_year}
                  </div>
                </div>
              )}

              {/* Location */}
              {location && (
                <div
                  style={{
                    background: GRAY.bg,
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Location
                  </div>
                  <div style={{ fontSize: '14px', color: GRAY.dark, fontWeight: 500 }}>
                    {location}
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            {(websiteHref || partner.linkedin) && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: `1.5px solid ${GRAY.border}`,
                      background: 'white',
                      color: GRAY.dark,
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    🌐 {websiteDisplay}
                  </a>
                )}
                {partner.linkedin && (
                  <a
                    href={partner.linkedin.startsWith('http') ? partner.linkedin : `https://linkedin.com/in/${partner.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: `1.5px solid ${GRAY.border}`,
                      background: 'white',
                      color: GRAY.dark,
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            )}

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: `1px solid ${GRAY.border}`, margin: '0 0 2rem' }} />

            {/* Network badge */}
            <div
              style={{
                padding: '20px 24px',
                background: GREEN_LIGHT,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.95rem', marginBottom: '4px' }}>
                  Part of the CELP® Partner Network
                </div>
                <div style={{ fontSize: '0.875rem', color: GRAY.dark }}>
                  {name} has been approved to connect with CELP®-certified professionals.
                  Are you a CELP® designee looking for referral partners?
                </div>
              </div>
              <a
                href="/find-a-partner"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: GREEN,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Browse all partners →
              </a>
            </div>

            {/* Join CTA */}
            <div
              style={{
                marginTop: '24px',
                padding: '18px 24px',
                background: GRAY.bg,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: GRAY.dark }}>
                <strong>Not listed?</strong> Join the CELP® Referral Network and start connecting with CELP® professionals.
              </p>
              <a
                href="/partners/apply"
                style={{
                  display: 'inline-block',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'white',
                  border: `1.5px solid ${GRAY.border}`,
                  color: GRAY.dark,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Apply to Join →
              </a>
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
