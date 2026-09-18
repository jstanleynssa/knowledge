import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'LPL Financial Advisor Benefits | ARPI',
  description:
    'ARPI partner page for LPL Financial advisors. Earn the NSSA®, IRMAACP™, or CELP® credential and stand out as a retirement income specialist in the LPL network.',
}

const GREEN     = 'var(--green-dark)'
const GREEN_MID = 'var(--green-mid)'
const GREEN_XL  = 'var(--green-xlight)'
const INK       = 'var(--ink)'
const INK_MID   = 'var(--ink-mid)'
const INK_LIGHT = 'var(--ink-light)'
const BORDER    = 'var(--border)'
const BG_SOFT   = 'var(--bg-soft)'
const WHITE     = 'var(--white)'

// ── Credential data ───────────────────────────────────────────────────────────

const CREDENTIALS = [
  {
    tag: 'NSSA®',
    tagClass: 'tag-nssa',
    name: 'National Social Security Advisor',
    description:
      'Master Social Security claiming strategy -- spousal benefits, optimal filing ages, break-even analysis, and Medicare coordination -- so you can guide clients with confidence.',
    href: '/credentials/nssa',
    ce: '5.5 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'IRMAACP™',
    tagClass: 'tag-irmaa',
    name: 'IRMAA Certified Planner',
    description:
      'Understand Income-Related Monthly Adjustment Amount surcharges, appeals strategy, and the MAGI planning windows that protect clients from surprise Medicare cost increases.',
    href: '/credentials/irmaacp',
    ce: '4.0 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'CELP®',
    tagClass: 'tag-celp',
    name: 'Certified End-of-Life Planner',
    description:
      "Navigate the financial, legal, and logistical transitions that accompany end of life -- asset protection, benefit coordination, and compassionate guidance through life's hardest moments.",
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
  },
]

// ── Partnership value props ────────────────────────────────────────────────────

const VALUES = [
  {
    icon: 'chart',
    title: 'Differentiate in a Crowded Network',
    body: 'With 22,000+ advisors in the LPL network, credentials matter. The NSSA® and IRMAACP™ signal genuine retirement income specialization -- not just a general practice that happens to work with retirees.',
  },
  {
    icon: 'shield',
    title: 'Answer the Questions Clients Actually Ask',
    body: 'Social Security timing, Medicare surcharges, and late-life transitions are the topics your clients worry about most. ARPI credentials give you the expertise to answer them with authority.',
  },
  {
    icon: 'tag',
    title: 'Exclusive LPL Advisor Benefit',
    body: 'Contact LPL or reach out to ARPI directly for your member discount code. We verify membership before issuing codes to keep the benefit exclusive.',
  },
]

// ── Icon SVGs ─────────────────────────────────────────────────────────────────

const ICON_SVGS: Record<string, string> = {
  chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 20 22 20"/></svg>`,
  shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  tag: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-width="2.5"/></svg>`,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LplPartnerPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 740, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">LPL Financial Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For LPL Advisors:<br />
              Stand Out as a Retirement Income Specialist
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              LPL Financial has partnered with ARPI to offer advisors in the LPL network
              specialized credentials in Social Security, IRMAA, and end-of-life financial
              planning -- the knowledge your clients need most heading into retirement.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll?partner=lpl" className="btn-primary">Enroll as an LPL Advisor</a>
              <a href="/credentials" className="btn-outline">View All Credentials</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner intro ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div className="partner-intro">
            {/* Logo panel */}
            <div className="partner-logo">
              <img
                src="/logos/lpl.png"
                alt="LPL Financial"
                style={{ height: 84, width: 'auto', objectFit: 'contain', maxWidth: 280 }}
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
                Built for Independent Advisors
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                LPL Financial is the nation&#39;s largest independent broker-dealer, supporting
                more than 22,000 financial advisors across the country. ARPI has partnered with
                LPL to give advisors in the network access to the most rigorous retirement income
                credentials available.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 28 }}>
                The NSSA® and IRMAACP™ designations are built for advisors who work with clients
                approaching or in retirement -- the segment where Social Security strategy and
                Medicare cost management have the greatest impact on outcomes.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="/enroll?partner=lpl" className="btn-primary">Enroll Now</a>
                <a href="/contact" className="btn-outline-dark">Ask a Question</a>
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
              ARPI credentials are built for working advisors -- no filler content, no fluff.
              Just the retirement income knowledge your clients are actually asking about.
            </p>
          </div>
          <div className="partner-values">
            {VALUES.map((v, i) => (
              <div key={v.title} style={{
                background: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '32px 28px',
              }}>
                <div
                  style={{ width: 48, height: 48, background: GREEN_XL, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: GREEN }}
                  dangerouslySetInnerHTML={{ __html: ICON_SVGS[v.icon] }}
                />
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
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="section-eyebrow">ARPI Credentials</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>Choose Your Designation</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Each credential stands on its own. Earn one, two, or all three -- bundle pricing applies automatically.
            </p>
          </div>
          <div className="partner-creds credentials-grid">
            {CREDENTIALS.map(c => (
              <div key={c.tag} className="cred-card">
                <div className="cred-card-header">
                  <div className="cred-tag-row">
                    <span className={`cred-card-tag ${c.tagClass}`}>{c.tag}</span>
                  </div>
                </div>
                <div className="cred-card-body">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div className={`ce-badge ce-badge--${c.tagClass.replace('tag-', '')}`}>
                    {c.ce}
                  </div>
                </div>
                <div className="cred-card-footer-bar">
                  <div>
                    <div className="cred-price-label">Tuition</div>
                    <div className="cred-price">{c.price}</div>
                  </div>
                  <div className="cred-card-actions">
                    <a href={`/enroll?partner=lpl`} className={`btn-cred btn-cred--${c.tagClass.replace('tag-', '')}`}>
                      Enroll
                    </a>
                    <a href={c.href} className={`btn-cred-outline btn-cred-outline--${c.tagClass.replace('tag-', '')}`}>
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2>Ready to Add a Credential?</h2>
          <p>
            LPL advisors enroll at a preferred rate. Contact LPL or reach out to ARPI directly for your member discount code — we verify membership before issuing codes to keep the benefit exclusive.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll?partner=lpl" className="btn-white">Enroll as an LPL Advisor</a>
            <a href="/contact" className="btn-ghost-white">Ask a Question</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
