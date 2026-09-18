import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Fidelity Advisor Benefits | ARPI',
  description:
    'ARPI partner landing page for Fidelity network advisors. Earn the NSSA®, IRMAACP™, or CELP® credential and deepen your expertise in Social Security optimization, Medicare cost planning, and end-of-life financial guidance.',
}

const GREEN      = 'var(--green-dark)'
const GREEN_MID  = 'var(--green-mid)'
const GREEN_XL   = 'var(--green-xlight)'
const INK        = 'var(--ink)'
const INK_MID    = 'var(--ink-mid)'
const INK_LIGHT  = 'var(--ink-light)'
const BORDER     = 'var(--border)'
const BG_SOFT    = 'var(--bg-soft)'
const WHITE      = 'var(--white)'

// ── Credential data ───────────────────────────────────────────────────────────

const CREDENTIALS = [
  {
    tag: 'NSSA®',
    tagClass: 'tag-nssa',
    name: 'National Social Security Advisor',
    description:
      'Master Social Security claiming strategy — spousal and survivor benefits, optimal filing ages, break-even analysis, and Medicare coordination — the foundation of every comprehensive retirement income plan.',
    href: '/credentials/nssa',
    ce: '5.5 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'IRMAACP™',
    tagClass: 'tag-irmaa',
    name: 'IRMAA Certified Planner',
    description:
      'Understand Income-Related Monthly Adjustment Amount surcharges, the two-year lookback, appeals strategy, and the MAGI planning windows that protect high-income clients from avoidable Medicare cost increases.',
    href: '/credentials/irmaacp',
    ce: '4.0 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'CELP®',
    tagClass: 'tag-celp',
    name: 'Certified End-of-Life Planner',
    description:
      'Navigate the financial transitions that accompany terminal illness and death — asset protection, benefit coordination, and compassionate guidance during the moments that define a client relationship for life.',
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
  },
]

// ── Partnership value props ────────────────────────────────────────────────────

const VALUES = [
  {
    title: 'Rigorous, Exam-Backed Credentials',
    body: 'The NSSA® and IRMAACP™ require passing a formal exam — not just completing coursework. For advisors operating under a fiduciary standard, credentials that represent earned expertise carry more weight with clients and withstand more scrutiny.',
    icon: 0,
  },
  {
    title: '9.5 CFP CE Credits Across Two Credentials',
    body: 'The NSSA® offers 5.5 CFP CE credits; the IRMAACP™ adds 4.0. Together they cover the retirement income planning topics advisors encounter most — Social Security optimization and Medicare cost management — in a format that satisfies continuing education requirements.',
    icon: 1,
  },
  {
    title: 'An Exclusive Benefit for Fidelity Network Advisors',
    body: 'Fidelity advisors receive 25% off tuition on any ARPI credential. Use code FIDELITY25 at checkout on arpinstitute.com/enroll.',
    icon: 2,
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FidelityPartnerPage() {
  return (
    <div className="partner-page">
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 740, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">Fidelity Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For Fidelity Network Advisors:<br />
              Specialized Credentials in the Topics Your Clients Raise Most
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              Fidelity has partnered with ARPI to give its advisor network preferred access
              to specialized credentials in Social Security optimization, Medicare cost
              planning, and end-of-life financial guidance — the retirement income planning
              expertise that separates a comprehensive plan from a good investment portfolio.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll?partner=fidelity" className="btn-primary">Enroll as a Fidelity Advisor</a>
              <a href="/credentials" className="btn-outline">View All Credentials</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner intro ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div className="pp-intro" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap: 64,
            alignItems: 'center',
          }}>
            {/* Partner logo — dark panel */}
            <div style={{
              background: '#111827',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 48px',
              gap: 20,
              minHeight: 240,
            }} className="pp-logo">
              <img
                src="/logos/fidelity.png"
                alt="Fidelity"
                style={{ height: 72, width: 'auto', objectFit: 'contain', maxWidth: 300 }}
              />
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
              }}>
                ARPI Partner
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="section-eyebrow">About the Partnership</div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>
                Built for Comprehensive Financial Planners
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                Fidelity serves thousands of independent advisors and RIAs who are building
                comprehensive financial plans for clients at every stage of life. ARPI credentials
                are designed to fill the two gaps that show up most in retirement income planning:
                the Social Security filing decision and the Medicare cost exposure that follows it.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 24 }}>
                Advisors who can speak to Social Security optimization, IRMAA thresholds, and
                end-of-life financial planning are better positioned to retain clients through
                the transitions that matter most — and to demonstrate the kind of expertise
                that justifies a comprehensive planning relationship.
              </p>
              {/* Member benefit callout */}
              <div style={{
                background: GREEN_XL,
                borderLeft: `4px solid ${GREEN}`,
                borderRadius: '0 6px 6px 0',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Fidelity Advisor Benefit
                </div>
                <div style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.65 }}>
                  Fidelity network advisors receive 25% off tuition on any ARPI credential. Use
                  code <strong>FIDELITY25</strong> at checkout on{' '}
                  <a href="/enroll?partner=fidelity" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>arpinstitute.com/enroll</a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why ARPI ── */}
      <section style={{ padding: '80px 0', background: BG_SOFT }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="section-eyebrow">Why ARPI</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Specialized, Practical, Recognized
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              ARPI credentials are built for working advisors — narrow scope, deep coverage,
              and CE credits that count toward CFP renewal.
            </p>
          </div>
          <div className="pp-values" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {VALUES.map((v, i) => (
              <div key={v.title} style={{
                background: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '32px 28px',
              }}>
                {i === 0 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` }} />}
                {i === 1 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>` }} />}
                {i === 2 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5"/></svg>` }} />}
                <h3 style={{
                  fontFamily: 'var(--font-merriweather), Georgia, serif',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 12,
                  lineHeight: 1.35,
                }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: INK_MID, lineHeight: 1.75 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Credentials ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-eyebrow">ARPI Credentials</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Three Credentials, One Mission
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Earn one or all three — each credential covers a distinct planning specialty
              that your clients genuinely need.
            </p>
          </div>
          <div className="credentials-grid">
            {CREDENTIALS.map(c => (
              <div key={c.tag} className="cred-card">
                <div className="cred-card-header">
                  <span className={`cred-card-tag ${c.tagClass}`}>{c.tag}</span>
                </div>
                <div className="cred-card-body">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
                <div className="cred-card-footer-bar">
                  <div>
                    <div className="cred-price-label">Tuition</div>
                    <div className="cred-price">{c.price}</div>
                    <div className="cred-price-add">{c.ce}</div>
                  </div>
                  <a href={c.href} className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2 style={{
            fontFamily: 'var(--font-merriweather), Georgia, serif',
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            fontWeight: 700,
            color: WHITE,
            marginBottom: 12,
            lineHeight: 1.25,
          }}>
            Ready to Add ARPI Credentials to Your Practice?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
            Fidelity network advisors enroll at a preferred rate. Use code{' '}
            <strong>FIDELITY25</strong> at checkout — start with Social Security, IRMAA,
            or end-of-life planning, or bundle both and save.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll?partner=fidelity" className="btn-primary">Enroll as a Fidelity Advisor</a>
            <a href="/contact" className="btn-outline">Questions? Contact Us</a>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .pp-intro { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp-logo  { padding: 36px 24px !important; min-height: 120px !important; }
          .pp-logo img { height: 48px !important; }
          .pp-values { grid-template-columns: 1fr !important; }
          .pp-creds  { grid-template-columns: 1fr !important; }
          .partner-page .cta-banner-actions { flex-direction: column !important; align-items: center !important; }
          .partner-page .cta-banner-actions a { width: 100% !important; max-width: 320px !important; text-align: center !important; }
          .partner-page .hero { padding: 56px 0 44px !important; }
          .partner-page .hero h1 { font-size: clamp(1.6rem, 6vw, 2.4rem) !important; }
        }
        @media (max-width: 480px) {
          .partner-page .hero { padding: 44px 0 36px !important; }
          .pp-intro { gap: 20px !important; }
          .pp-logo  { padding: 24px 16px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
