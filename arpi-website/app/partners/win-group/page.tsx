import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'WIN Group Member Benefits | ARPI',
  description:
    'ARPI partner landing page for Wealth Integrity Network (WIN Group) members. Earn the NSSA® or IRMAACP™ credential to add Social Security and Medicare planning expertise to your annuity practice.',
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
      'Become the advisor who can sequence Social Security claiming with annuity income — optimal filing ages, spousal strategies, and Medicare Part A/B coordination — before and after an annuity sale.',
    href: '/credentials/nssa',
    ce: '5.5 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'IRMAACP™',
    tagClass: 'tag-irmaa',
    name: 'IRMAA Certified Planner',
    description:
      'Help high-income clients plan around Medicare IRMAA surcharges triggered by annuity distributions and Roth conversions. A natural fit for the annuity and FIA conversations you\'re already having.',
    href: '/credentials/irmaacp',
    ce: '4.0 CFP CE',
    price: '$1,195',
  },
  {
    tag: 'CELP®',
    tagClass: 'tag-celp',
    name: 'Certified End-of-Life Planner',
    description:
      'Guide clients through the financial transitions that accompany terminal illness and death — annuity beneficiary coordination, benefit claiming, and compassionate family financial guidance.',
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
  },
]

// ── Value props ────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: '📈',
    title: 'Deepen Every Annuity Conversation',
    body: 'When you understand Social Security timing, you can show clients exactly how an FIA or income rider interacts with their benefit — a far more compelling presentation than product specs alone.',
  },
  {
    icon: '🎯',
    title: 'Differentiate in a Crowded Market',
    body: 'Most annuity agents lead with products. NSSA® and IRMAACP™ credential holders lead with planning — a positioning that builds trust, reduces price sensitivity, and wins referrals.',
  },
  {
    icon: '🤝',
    title: 'WIN Group Member Benefit',
    body: '[Placeholder] As a WIN Group member you receive a preferred enrollment rate on ARPI credentials. Verify your membership at enrollment to unlock your discount.',
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '~4,000', label: 'NSSA® Credentialed Advisors' },
  { value: '5.5', label: 'CFP CE Hours (NSSA®)' },
  { value: '$0', label: 'Annual Membership (Year 1 included)' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WinGroupPartnerPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
            {/* Partner × ARPI badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <img
                src="/logos/win-group.webp"
                alt="The WIN Group"
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
            <div className="hero-eyebrow">WIN Group Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For WIN Group Members:<br />
              Add Social Security &amp; Medicare Expertise to Your Annuity Practice
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              The Wealth Integrity Network Group has partnered with ARPI to help insurance and
              retirement planning professionals earn credentials that round out the retirement
              income conversations they&rsquo;re already leading.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll" className="btn-primary">Enroll as a WIN Group Member</a>
              <a href="/credentials" className="btn-outline">View All Credentials</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ background: GREEN, padding: '36px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            textAlign: 'center',
          }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: WHITE, lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginTop: 6, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Partner intro ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap: 64,
            alignItems: 'center',
          }}>
            {/* Text */}
            <div>
              <div className="section-eyebrow">About the Partnership</div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>
                Where Annuity Expertise Meets Retirement Planning Depth
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                WIN Group is dedicated to elevating insurance and retirement planning professionals
                with case design support, innovative marketing strategies, and elite coaching.
                ARPI credentials add another dimension to that elevation: the kind of
                credential-backed, planning-first expertise that converts skeptical prospects
                into confident clients.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 24 }}>
                Social Security claiming strategy and IRMAA management are natural complements
                to the fixed index annuity and IUL conversations WIN Group members are already
                having. ARPI credentials formalize that expertise and signal it publicly on your
                business card and advisor profiles.
              </p>
              {/* Member benefit callout */}
              <div style={{
                background: GREEN_XL,
                borderLeft: `4px solid ${GREEN}`,
                borderRadius: '0 6px 6px 0',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  WIN Group Member Benefit
                </div>
                <div style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.65 }}>
                  [Placeholder] WIN Group members receive a preferred enrollment rate on ARPI
                  credentials. Verify your membership at enrollment to unlock your discount.
                </div>
              </div>
            </div>

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
                src="/logos/win-group.webp"
                alt="The WIN Group"
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
          </div>
        </div>
      </section>

      {/* ── Why ARPI ── */}
      <section style={{ padding: '80px 0', background: BG_SOFT }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="section-eyebrow">Why ARPI</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Planning Depth That Sells
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              ARPI credentials are built around the specific planning questions retirement
              income clients ask. They make you a better advisor and a more persuasive one.
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
              Credentials Built for Retirement Income Advisors
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Each credential addresses a distinct gap in the typical annuity advisor&rsquo;s
              planning toolkit. Earn one, two, or all three.
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
            Ready to Add Credentials That Set You Apart?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
            WIN Group members enroll at a preferred rate. Start with NSSA®, IRMAACP™,
            or both — and bring credential-backed planning depth to every client conversation.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll" className="btn-primary">Enroll as a WIN Group Member</a>
            <a href="/contact" className="btn-outline">Questions? Contact Us</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
