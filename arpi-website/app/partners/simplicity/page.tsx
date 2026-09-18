import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Simplicity Group Advisor Benefits | ARPI',
  description:
    'ARPI partner landing page for Simplicity Group advisors. Earn the IRMAACP™, NSSA®, or CELP® credential and deepen your expertise in Medicare cost planning, Social Security optimization, and end-of-life financial guidance.',
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
    tag: 'IRMAACP™',
    tagClass: 'tag-irmaa',
    name: 'IRMAA Certified Planner',
    description:
      'Understand Income-Related Monthly Adjustment Amount surcharges, the income thresholds, the two-year lookback, and the MAGI planning windows that protect retirement income clients from surprise Medicare cost increases.',
    href: '/credentials/irmaacp',
    ce: '4.0 CFP CE',
    price: '$1,195',
    featured: true,
  },
  {
    tag: 'NSSA®',
    tagClass: 'tag-nssa',
    name: 'National Social Security Advisor',
    description:
      'Master Social Security claiming strategy — spousal and survivor benefits, optimal filing ages, break-even analysis, and how Social Security income coordinates with annuity distributions and other retirement income sources.',
    href: '/credentials/nssa',
    ce: '5.5 CFP CE',
    price: '$1,195',
    featured: false,
  },
  {
    tag: 'CELP®',
    tagClass: 'tag-celp',
    name: 'Certified End-of-Life Planner',
    description:
      'Navigate the financial transitions that accompany terminal illness and death — benefit coordination, asset protection, and compassionate guidance during the moments that define a client relationship.',
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
    featured: false,
  },
]

// ── Partnership value props ────────────────────────────────────────────────────

const VALUES = [
  {
    title: 'IRMAA Is an Annuity Distribution Problem',
    body: 'Every dollar of annuity income affects MAGI — and MAGI determines Medicare surcharges. Advisors who understand IRMAA thresholds, the two-year lookback, and how to sequence distributions can protect clients from avoidable costs. The IRMAACP™ is the credential that covers exactly this.',
    icon: 0,
  },
  {
    title: 'Social Security Shapes the Whole Income Plan',
    body: 'Social Security filing age determines how much guaranteed income a client has — which determines how much they need from annuities and other sources. Advisors who can optimize both sides of that equation build better plans and stickier client relationships.',
    icon: 1,
  },
  {
    title: 'An Exclusive Benefit for Simplicity Advisors',
    body: 'Simplicity Group advisors receive 25% off tuition on any ARPI credential. Use code SIMPLICITY25 at checkout on arpinstitute.com/enroll.',
    icon: 2,
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SimplicityPartnerPage() {
  return (
    <div className="partner-page">
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 740, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">Simplicity Group Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For Simplicity Advisors:<br />
              The Credentials Behind the Retirement Income Conversation
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              Simplicity Group has partnered with ARPI to give its advisor network preferred
              access to specialized credentials in Medicare cost planning, Social Security
              optimization, and end-of-life financial guidance — the knowledge that turns
              product sales into comprehensive retirement income plans.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll?partner=simplicity" className="btn-primary">Enroll as a Simplicity Advisor</a>
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
                src="/logos/simplicity.png"
                alt="Simplicity Group"
                style={{ height: 60, width: 'auto', objectFit: 'contain', maxWidth: 280 }}
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
                Built for Annuity and Insurance Professionals
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                Simplicity Group is one of the nation&rsquo;s leading financial product distribution
                companies, supporting independent agents, advisors, broker-dealers, and financial
                institutions with access to annuity, life, long-term care, and disability solutions
                from over 70 carriers. ARPI credentials are the natural next step for advisors who
                want to go deeper on the income and cost-planning side of the retirement conversation.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 24 }}>
                Annuity distributions affect MAGI. MAGI drives IRMAA. Social Security timing changes
                how much a client needs from everything else. Advisors who understand these
                interactions build better plans — and earn more trust doing it. ARPI gives you
                exam-tested credentials to back up that expertise.
              </p>
              {/* Member benefit callout */}
              <div style={{
                background: GREEN_XL,
                borderLeft: `4px solid ${GREEN}`,
                borderRadius: '0 6px 6px 0',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Simplicity Advisor Benefit
                </div>
                <div style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.65 }}>
                  Simplicity Group advisors receive 25% off tuition on any ARPI credential. Use code{' '}
                  <strong>SIMPLICITY25</strong> at checkout on{' '}
                  <a href="/enroll?partner=simplicity" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>arpinstitute.com/enroll</a>.
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
              The Planning Knowledge Behind the Product
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Annuity and insurance solutions are only as good as the income plan around them.
              ARPI credentials cover the planning context that makes your recommendations stick.
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
                {i === 0 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>` }} />}
                {i === 1 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` }} />}
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
            Simplicity Group advisors enroll at a preferred rate. Use code{' '}
            <strong>SIMPLICITY25</strong> at checkout — start with IRMAA, Social Security,
            or end-of-life planning, or bundle both and save.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll?partner=simplicity" className="btn-primary">Enroll as a Simplicity Advisor</a>
            <a href="/contact" className="btn-outline">Questions? Contact Us</a>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .pp-intro { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp-logo  { padding: 36px 24px !important; min-height: 120px !important; }
          .pp-logo img { height: 40px !important; }
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
