import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Institutional Partners | ARPI',
  description:
    'ARPI partners with leading financial advisor networks, broker-dealers, IMOs, and professional associations to offer their members preferred access to rigorous retirement planning credentials.',
}

const GREEN     = 'var(--green-dark)'
const GREEN_MID = 'var(--green-mid)'
const GREEN_XL  = 'var(--green-xlight)'
const INK       = 'var(--ink)'
const INK_MID   = 'var(--ink-mid)'
const BORDER    = 'var(--border)'
const BG_SOFT   = 'var(--bg-soft)'
const WHITE     = 'var(--white)'

// ── Partner data ─────────────────────────────────────────────────────────────

const PARTNERS = [
  {
    name: 'IARFC',
    fullName: 'International Association of Registered Financial Consultants',
    description:
      'Professional association for RFC® and MRFC® credentialed financial consultants — advisors who have demonstrated rigorous, exam-backed competence in comprehensive financial planning.',
    logo: '/logos/iarfc.png',
    logoHeight: 52,
    href: '/partners/iarfc',
  },
  {
    name: 'Pinnacle Financial Services',
    fullName: 'Pinnacle Financial Services',
    description:
      'Insurance IMO supporting independent agents and financial advisors with annuity, life, and Medicare product access, practice management, and training.',
    logo: '/logos/pinnacle.png',
    logoHeight: 60,
    href: '/partners/pinnacle',
  },
  {
    name: 'The WIN Group',
    fullName: 'The WIN Group',
    description:
      'Insurance and annuity marketing organization serving independent advisors focused on retirement income planning, asset protection, and client distribution strategies.',
    logo: '/logos/win-group.png',
    logoHeight: 56,
    href: '/partners/win-group',
  },
  {
    name: 'LPL Financial',
    fullName: 'LPL Financial',
    description:
      "One of the nation's largest independent broker-dealers, supporting a nationwide network of independent financial advisors with clearing, custody, and comprehensive practice resources.",
    logo: '/logos/lpl.png',
    logoHeight: 52,
    href: '/partners/lpl',
  },
  {
    name: 'Osaic',
    fullName: 'Osaic (formerly Advisor Group)',
    description:
      "One of the nation's largest wealth management networks — home to 11,000+ financial professionals across independent broker-dealer and RIA models, with $700B+ in assets under administration.",
    logo: '/logos/osaic.svg',
    logoHeight: 44,
    href: '/partners/osaic',
  },
  {
    name: 'Simplicity Group',
    fullName: 'Simplicity Group',
    description:
      'Leading insurance and annuity distribution company serving independent agents, advisors, broker-dealers, and financial institutions with access to 70+ carriers and comprehensive practice support.',
    logo: '/logos/simplicity.png',
    logoHeight: 52,
    href: '/partners/simplicity',
  },
  {
    name: 'Fidelity',
    fullName: 'Fidelity Investments',
    description:
      'One of the world\'s largest financial services firms. Fidelity Institutional supports thousands of independent RIAs and financial advisors with clearing, custody, technology, and practice management solutions.',
    logo: '/logos/fidelity.png',
    logoHeight: 64,
    href: '/partners/fidelity',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartnersIndexPage() {
  return (
    <div className="partner-page">
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">Institutional Partnerships</div>
            <h1 style={{ marginBottom: 20 }}>
              Built for the Networks That Train the Best Advisors
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              ARPI partners with leading financial advisor networks, broker-dealers, IMOs, and
              professional associations to give their members preferred access to rigorous,
              exam-backed credentials in Social Security, Medicare, and end-of-life financial
              planning.
            </p>
          </div>
        </div>
      </section>

      {/* ── Partner grid ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-eyebrow">Our Partners</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Seven Founding Institutional Partners
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Each partnership gives members of that network preferred access to ARPI credentials —
              and a co-branded landing page built for their specific audience.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }} className="partners-grid">
            {PARTNERS.map(p => (
              <a
                key={p.href}
                href={p.href}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: WHITE,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }} className="partner-tile">
                  {/* Logo panel */}
                  <div style={{
                    background: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5rem 2rem',
                    height: 152,
                  }}>
                    <img
                      src={p.logo}
                      alt={p.name}
                      style={{
                        height: p.logoHeight,
                        width: 'auto',
                        maxWidth: 220,
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Card body */}
                  <div style={{
                    padding: '1.5rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}>
                    <div>
                      <h3 style={{
                        fontFamily: 'var(--font-merriweather), Georgia, serif',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: INK,
                        margin: '0 0 4px',
                        lineHeight: 1.3,
                      }}>
                        {p.name}
                      </h3>
                      {p.fullName !== p.name && (
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--ink-light)',
                          margin: 0,
                          fontStyle: 'italic',
                        }}>
                          {p.fullName}
                        </p>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: INK_MID,
                      lineHeight: 1.7,
                      margin: 0,
                      flex: 1,
                    }}>
                      {p.description}
                    </p>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: GREEN_MID,
                      marginTop: 'auto',
                    }}>
                      View partner page →
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become a partner CTA ── */}
      <section style={{ padding: '80px 0', background: BG_SOFT, borderTop: `1px solid ${BORDER}` }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap: '4rem',
            alignItems: 'center',
          }} className="partner-cta-grid">
            {/* Left: text */}
            <div>
              <div className="section-eyebrow">Become a Partner</div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>
                Interested in Bringing ARPI to Your Network?
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                If you lead a professional association, broker-dealer, IMO, RIA aggregator, or
                advisory network, ARPI offers an institutional partnership that gives your members
                preferred access to our credentials — along with a co-branded partner page built
                specifically for your audience.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 32 }}>
                We vet all partners before extending codes. Partnerships are exclusive by channel —
                your members receive a benefit that isn&rsquo;t publicly available. Reach out to
                start the conversation.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <a href="/contact" className="btn-primary">Inquire About Partnership</a>
                <a href="/credentials" className="btn-outline">View Our Credentials</a>
              </div>
            </div>

            {/* Right: what partnership includes */}
            <div style={{
              background: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '2rem',
            }}>
              <h3 style={{
                fontFamily: 'var(--font-merriweather), Georgia, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: INK,
                marginBottom: '1.25rem',
                marginTop: 0,
              }}>
                What Partnership Includes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  ['Member discount code', 'A private coupon code giving your members preferred tuition pricing — verified and kept exclusive.'],
                  ['Co-branded partner page', 'A dedicated landing page at arpinstitute.com/partners/[your-slug] written for your specific advisor audience.'],
                  ['Member benefit callout', 'Email-ready content your team can forward directly to members or advisors.'],
                  ['Annual review', 'We check in to update your page, revisit the discount structure, and explore additional ways to serve your network.'],
                ].map(([title, body]) => (
                  <div key={title} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: GREEN_XL,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: INK, marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: '0.825rem', color: INK_MID, lineHeight: 1.6 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .partners-grid { }
        .partner-tile:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        @media (max-width: 1024px) {
          .partners-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .partners-grid { grid-template-columns: 1fr !important; }
          .partner-cta-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .partner-page .hero { padding: 56px 0 44px !important; }
        }
      `}</style>

      <Footer />
    </div>
  )
}
