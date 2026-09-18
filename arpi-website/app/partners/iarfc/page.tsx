import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'IARFC Member Benefits | ARPI',
  description:
    'ARPI partner landing page for IARFC members. Earn the NSSA®, IRMAACP™, or CELP® credential and deepen your expertise in Social Security, IRMAA, and end-of-life financial planning.',
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
      'Master Social Security claiming strategy — spousal benefits, optimal filing ages, break-even analysis, and Medicare coordination — so you can guide clients with confidence.',
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
      "Navigate the financial transitions that accompany terminal illness and death -- asset protection, benefit coordination, and compassionate client guidance during life's hardest moments.",
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
  },
]

// ── Partnership value props ────────────────────────────────────────────────────

const VALUES = [
  {
    icon: '🎓',
    title: 'Deepen Your Expertise',
    body: "ARPI credentials are 100% focused on the planning topics IARFC members already advise on -- Social Security, Medicare costs, and late-life transitions. You won't learn anything you won't use.",
  },
  {
    icon: '📜',
    title: 'Add Recognized Credentials',
    body: 'The NSSA® and IRMAACP™ designations are nationally recognized and appear alongside your RFC® or MRFC® as proof of specialized retirement planning competence.',
  },
  {
    icon: '🤝',
    title: 'Exclusive Member Benefit',
    body: '[Placeholder] As an IARFC member you receive a preferred enrollment rate on ARPI credentials. Contact ARPI to verify your membership and unlock your discount.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IarfcPartnerPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 740, position: 'relative', zIndex: 1 }}>
            {/* Partner × ARPI badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <img
                src="/logos/iarfc.png"
                alt="IARFC"
                style={{ height: 36, width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '1.1rem', fontWeight: 300 }}>×</span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}>ARPI</span>
            </div>
            <div className="hero-eyebrow">IARFC Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For IARFC Members:<br />
              Credentials That Match Your Clients&rsquo; Biggest Questions
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              The International Association of Registered Financial Consultants has partnered with
              ARPI to offer members specialized credentials in Social Security, IRMAA, and
              end-of-life financial planning — the topics at the heart of every retirement
              conversation.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll" className="btn-primary">Enroll as an IARFC Member</a>
              <a href="/credentials" className="btn-outline">View All Credentials</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner intro ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div style={{
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
            }}>
              <img
                src="/logos/iarfc.png"
                alt="IARFC"
                style={{ height: 56, width: 'auto', objectFit: 'contain', maxWidth: 200 }}
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
                Built for Registered Financial Consultants
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                Founded in 1984, IARFC has long stood for proven financial consultants who help
                families achieve financial security. ARPI credentials complement that mission by
                equipping advisors with the deep, exam-tested expertise their clients need most as
                they approach and navigate retirement.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 24 }}>
                Whether your clients are asking when to claim Social Security, how to avoid surprise
                Medicare surcharges, or how to handle the financial complexity of a terminal
                diagnosis — ARPI has a credential that prepares you to answer with confidence.
              </p>
              {/* Member benefit callout */}
              <div style={{
                background: GREEN_XL,
                borderLeft: `4px solid ${GREEN}`,
                borderRadius: '0 6px 6px 0',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  IARFC Member Benefit
                </div>
                <div style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.65 }}>
                  [Placeholder] IARFC members receive a preferred enrollment rate on ARPI
                  credentials. Verify your membership at enrollment to unlock your discount.
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
              ARPI credentials are built for working advisors — no filler content, no fluff.
              Just the planning knowledge your clients are actually asking about.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {VALUES.map(v => (
              <div key={v.title} style={{
                background: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '32px 28px',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{v.icon}</div>
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
            IARFC members enroll at a preferred rate. Start with Social Security, IRMAA,
            or end-of-life planning — or bundle and save.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll" className="btn-primary">Enroll as an IARFC Member</a>
            <a href="/contact" className="btn-outline">Questions? Contact Us</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
