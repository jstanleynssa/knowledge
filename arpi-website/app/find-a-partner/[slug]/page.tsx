// app/find-a-partner/[slug]/page.tsx
// CELP® Partner profile — SSG + 1-hour ISR.
//
// URL shape: /find-a-partner/{org}-{city}-{st}
// e.g.  /find-a-partner/sunrise-hospice-tampa-fl
//
// Legacy UUID URLs are detected and redirected to the canonical slug.
//
// Three schema blocks:
//   • Person           — individual (name, credential, address, sameAs)
//   • LocalBusiness    — org-typed (LegalService / AccountingService / etc.)
//   • BreadcrumbList   — Home › Find a CELP® Partner › Name

import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import PartnerContactForm from '@/components/partners/PartnerContactForm'
import { createClient } from '@supabase/supabase-js'
import { buildPartnerSlugIndex } from '@/lib/slug'

// Rebuild pages at most once per hour so newly-approved partners appear quickly.
export const revalidate = 3600

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
  phone: string | null
  email: string | null
}

type SlugIndex = { bySlug: Map<string, Partner>; byId: Map<string, string> }

// ── Schema type per role_id ───────────────────────────────────────────────
const SCHEMA_TYPE: Record<string, string> = {
  'estate-planning-attorneys': 'LegalService',
  'elder-law-attorneys':       'LegalService',
  'probate-attorneys':         'LegalService',
  'cpas':                      'AccountingService',
  'wealth-managers':           'FinancialService',
  'insurance-agencies':        'InsuranceAgency',
  'hospitals':                 'MedicalOrganization',
  'hospice-organizations':     'MedicalOrganization',
  'home-healthcare':           'MedicalOrganization',
  'senior-living':             'LocalBusiness',
  'funeral-homes':             'LocalBusiness',
  'physicians':                'Physician',
  'memory-care':               'MedicalOrganization',
  'veterans-organizations':    'LocalBusiness',
}

const DIRECTION_LABELS: Record<string, string> = {
  send:    'Sends referrals to CELP® professionals',
  receive: 'Receives referrals from CELP® professionals',
  both:    'Sends & receives referrals with CELP® professionals',
}

const GREEN       = '#2a6b54'
const GREEN_LIGHT = '#d9ede5'
const GRAY        = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', dark: '#1f2937' }
const AVATAR_W    = 72
const HERO_GAP    = 28
const BODY_INDENT = AVATAR_W + HERO_GAP   // 100 px — aligns body with name text
const SITE        = 'https://arpinstitute.com'
const UUID_RE     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Data ──────────────────────────────────────────────────────────────────
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAllApprovedPartners(): Promise<Partner[]> {
  const { data, error } = await admin()
    .from('celp_partners')
    .select(
      'id, role_id, role_label, first_name, last_name, organization, city, state, zip, ' +
      'clients_per_year, referral_direction, about, website, linkedin, phone, email'
    )
    .eq('status', 'approved')
    .not('approved_at', 'is', null)  // exclude seed/sample records
    .order('organization', { ascending: true })
  if (error || !data) return []
  return data as unknown as Partner[]
}

async function resolveSlug(
  slug: string
): Promise<{ partner: Partner; canonicalSlug: string } | null> {
  const partners = await getAllApprovedPartners()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { bySlug, byId } = (buildPartnerSlugIndex as any)(partners) as SlugIndex

  if (bySlug.has(slug)) return { partner: bySlug.get(slug)!, canonicalSlug: slug }

  // Legacy UUID → look up canonical slug and redirect
  if (UUID_RE.test(slug) && byId.has(slug)) {
    const canonicalSlug = byId.get(slug)!
    const partner       = bySlug.get(canonicalSlug)
    if (partner) return { partner, canonicalSlug }
  }

  return null
}

// ── SSG: pre-build all current approved partner slugs ─────────────────────
export async function generateStaticParams() {
  const partners = await getAllApprovedPartners()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { byId } = (buildPartnerSlugIndex as any)(partners) as SlugIndex
  return Array.from(byId.values()).map((slug) => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const result   = await resolveSlug(slug)
  if (!result) return { title: 'Partner Not Found' }

  const { partner, canonicalSlug } = result
  const name      = `${partner.first_name} ${partner.last_name}`.trim()
  const org       = partner.organization ? ` — ${partner.organization}` : ''
  const canonical = `${SITE}/find-a-partner/${canonicalSlug}`
  const desc      =
    partner.about?.slice(0, 160) ??
    `${name} is a ${partner.role_label} in the CELP® Partner Network, connecting with CELP®-certified end-of-life planning professionals.`

  return {
    title:      `${name}${org} | CELP® Partner`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type:        'profile',
      url:         canonical,
      title:       `${name}${org}`,
      description:  desc,
      siteName:    'Advanced Retirement Planning Institute',
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function normaliseWebsite(url: string | null): { href: string; label: string } | null {
  if (!url) return null
  const href  = url.startsWith('http') ? url : `https://${url}`
  const label = url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  return { href, label }
}

function normaliseLinkedIn(raw: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith('http')) return raw
  return `https://linkedin.com/in/${raw.replace(/^in\//, '')}`
}

// ── Page component ────────────────────────────────────────────────────────
export default async function PartnerProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const result   = await resolveSlug(slug)
  if (!result) notFound()

  const { partner, canonicalSlug } = result
  if (slug !== canonicalSlug) redirect(`/find-a-partner/${canonicalSlug}`)

  const name      = `${partner.first_name} ${partner.last_name}`.trim()
  const location  = [partner.city, partner.state].filter(Boolean).join(', ')
  const canonical = `${SITE}/find-a-partner/${canonicalSlug}`
  const website   = normaliseWebsite(partner.website)
  const linkedIn  = normaliseLinkedIn(partner.linkedin)
  const initial   = (partner.first_name?.[0] ?? '?').toUpperCase()
  const orgType   = SCHEMA_TYPE[partner.role_id] ?? 'LocalBusiness'
  const sameAs    = [linkedIn, website?.href ?? null].filter(Boolean)

  // ── Schema: Person ───────────────────────────────────────────────────────
  const personSchema = {
    '@context': 'https://schema.org',
    '@type':    'Person',
    name,
    url:         canonical,
    description: partner.about ?? undefined,
    telephone:   partner.phone ?? undefined,
    email:       partner.email ?? undefined,
    worksFor:    partner.organization
      ? { '@type': orgType, name: partner.organization }
      : undefined,
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name:    'CELP® Partner — Advanced Retirement Planning Institute',
      url:     `${SITE}/credentials/celp`,
    },
    address: location ? {
      '@type':          'PostalAddress',
      addressLocality:   partner.city  ?? undefined,
      addressRegion:     partner.state ?? undefined,
      postalCode:        partner.zip   ?? undefined,
      addressCountry:   'US',
    } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }

  // ── Schema: LocalBusiness (org-typed) ────────────────────────────────────
  const localBusinessSchema = partner.organization ? {
    '@context':  'https://schema.org',
    '@type':      orgType,
    name:          partner.organization,
    url:           canonical,
    description:   partner.about ?? undefined,
    telephone:     partner.phone ?? undefined,
    address: location ? {
      '@type':          'PostalAddress',
      addressLocality:   partner.city  ?? undefined,
      addressRegion:     partner.state ?? undefined,
      postalCode:        partner.zip   ?? undefined,
      addressCountry:   'US',
    } : undefined,
    employee: { '@type': 'Person', name },
    sameAs:   sameAs.length ? sameAs : undefined,
  } : null

  // ── Schema: BreadcrumbList ────────────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',                 item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Find a CELP® Partner', item: `${SITE}/find-a-partner` },
      { '@type': 'ListItem', position: 3, name },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      {localBusinessSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <style>{`
        .partner-profile-body-indent { margin-left: ${BODY_INDENT}px; }
        .partner-body-cols {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 3rem;
          align-items: start;
        }
        .partner-form-sticky { position: sticky; top: 2rem; }
        @media (max-width: 900px) {
          .partner-body-cols   { grid-template-columns: 1fr; }
          .partner-form-sticky { position: static; }
        }
        @media (max-width: 640px) {
          .partner-profile-body-indent { margin-left: 0; }
          .partner-hero-avatar         { display: none !important; }
        }
      `}</style>

      <div style={{ color: GRAY.dark, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />

        {/* ── Hero ── */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <a
              href="/find-a-partner"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: GREEN, fontWeight: 600, marginBottom: '28px', textDecoration: 'none', opacity: 0.85 }}
            >
              ← Partner Directory
            </a>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: `${HERO_GAP}px` }}>
              <div
                className="partner-hero-avatar"
                aria-hidden="true"
                style={{ width: `${AVATAR_W}px`, height: `${AVATAR_W}px`, borderRadius: '50%', background: GREEN_LIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: GREEN, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', marginTop: '6px' }}
              >
                {initial}
              </div>

              <div style={{ flex: '1 1 0', minWidth: 0, position: 'relative', zIndex: 1 }}>
                <div className="hero-eyebrow">CELP® Partner Network</div>
                <h1 style={{ marginBottom: 12 }}>{name}</h1>
                {partner.organization && (
                  <p style={{ fontSize: '1.125rem', color: GRAY.text, margin: '0 0 16px', fontWeight: 500, lineHeight: 1.4 }}>
                    {partner.organization}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, borderRadius: '4px', padding: '3px 10px', background: GREEN_LIGHT, color: GREEN }}>
                    {partner.role_label}
                  </span>
                  {location && (
                    <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, borderRadius: '4px', padding: '3px 10px', background: GRAY.bg, color: GRAY.dark }}>
                      {location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <section style={{ padding: '3rem 0 5rem', flex: 1 }}>
          <div className="container">
            <div className="partner-profile-body-indent">
              <div className="partner-body-cols">

                {/* Left: content */}
                <div>
                  {partner.about && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: GRAY.dark, margin: '0 0 10px' }}>About</h2>
                      <p style={{ fontSize: '1rem', color: GRAY.dark, lineHeight: 1.75, margin: 0 }}>{partner.about}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                    <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 600, borderRadius: '6px', padding: '5px 12px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      {DIRECTION_LABELS[partner.referral_direction] ?? partner.referral_direction}
                    </span>
                    {partner.clients_per_year && (
                      <span style={{ display: 'inline-block', fontSize: '13px', fontWeight: 600, borderRadius: '6px', padding: '5px 12px', background: GRAY.bg, color: GRAY.text }}>
                        {partner.clients_per_year} clients/yr
                      </span>
                    )}
                  </div>

                  {(partner.email || partner.phone || website || linkedIn) && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: GRAY.dark, margin: '0 0 14px' }}>Contact Information</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {partner.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', flexShrink: 0 }}>✉️</span>
                            <a href={`mailto:${partner.email}`} style={{ fontSize: '15px', color: GREEN, fontWeight: 600, textDecoration: 'none' }}>{partner.email}</a>
                          </div>
                        )}
                        {partner.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', flexShrink: 0 }}>📞</span>
                            <a href={`tel:${partner.phone.replace(/[^+\d]/g, '')}`} style={{ fontSize: '15px', color: GRAY.dark, fontWeight: 500, textDecoration: 'none' }}>{partner.phone}</a>
                          </div>
                        )}
                        {website && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', flexShrink: 0 }}>🌐</span>
                            <a href={website.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', color: GRAY.dark, fontWeight: 500, textDecoration: 'none' }}>{website.label}</a>
                          </div>
                        )}
                        {linkedIn && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077b5" aria-hidden="true" style={{ flexShrink: 0 }}>
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <a href={linkedIn} target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', color: GRAY.dark, fontWeight: 500, textDecoration: 'none' }}>LinkedIn Profile</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: sticky contact form card */}
                <div className="partner-form-sticky">
                  <div style={{ background: 'white', border: `1px solid ${GRAY.border}`, borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: GRAY.dark, margin: '0 0 6px' }}>
                      Send a Message
                    </h2>
                    <p style={{ fontSize: '13px', color: GRAY.text, margin: '0 0 18px', lineHeight: 1.55 }}>
                      Your message goes directly to {partner.first_name}.
                    </p>
                    <PartnerContactForm partnerId={partner.id} partnerName={partner.first_name} />
                  </div>
                </div>

              </div>

              {/* Network badge — full width below columns */}
              <div style={{ marginTop: '2.5rem', padding: '18px 22px', background: GREEN_LIGHT, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.875rem', marginBottom: '3px' }}>Part of the CELP® Partner Network</div>
                  <div style={{ fontSize: '0.8125rem', color: GRAY.dark }}>{name} has been approved to connect with CELP®-certified professionals.</div>
                </div>
                <a href="/find-a-partner" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '8px', background: GREEN, color: 'white', fontWeight: 700, fontSize: '0.8125rem', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Browse all partners →
                </a>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
