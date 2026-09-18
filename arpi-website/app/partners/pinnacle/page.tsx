import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pinnacle Financial Services Agent Benefits | ARPI',
  description:
    'ARPI partner landing page for Pinnacle Financial Services agents. Earn the IRMAACP™ or NSSA® credential to add Medicare cost planning and Social Security expertise to your Medicare practice.',
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
      'Understand and plan around Medicare IRMAA surcharges — income thresholds, the two-year lookback, appeals strategy, and MAGI planning windows. The credential for any advisor with high-income Medicare clients.',
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
      'Master Social Security claiming strategy — spousal and survivor benefits, Medicare Part A coordination, optimal filing ages, and break-even analysis. Turn Medicare conversations into full retirement income plans.',
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
      'Navigate the financial transitions that accompany terminal illness and death — Medicare/Medicaid coordination, benefit claiming at end of life, and compassionate guidance through complex family financial decisions.',
    href: '/credentials/celp',
    ce: 'CE Eligible',
    price: 'Apply',
    featured: false,
  },
]

// ── Value props ────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: '💡',
    title: 'Turn Medicare Into a Planning Conversation',
    body: 'IRMAACP™-credentialed agents don\'t just quote Medicare plans — they help clients understand and control the cost of Medicare over time, creating deeper, longer-lasting relationships.',
  },
  {
    icon: '🏆',
    title: 'Stand Out Among Pinnacle Agents',
    body: 'A national designation separates you from the agents who only discuss premiums and networks. ARPI credentials signal comprehensive planning competence to prospects and referral sources.',
  },
  {
    icon: '🤝',
    title: 'Pinnacle Agent Benefit',
    body: 'Contact Pinnacle Financial Services or reach out to ARPI directly for your member discount code. We verify membership before issuing codes to keep the benefit exclusive.',
  },
]

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Your Credential',
    body: 'Most Pinnacle agents start with IRMAACP™ — the most directly relevant to Medicare work. Add NSSA® to round out Social Security expertise.',
  },
  {
    step: '02',
    title: 'Complete the Self-Paced Course',
    body: 'Study at your own pace with lifetime access to course content. Courses run 4–6 hours and are designed around real planning scenarios, not textbook theory.',
  },
  {
    step: '03',
    title: 'Pass the Exam',
    body: 'A proctored, open-book exam with two attempts. 70% to pass. Passing earns you the credential and the right to use the designation mark.',
  },
  {
    step: '04',
    title: 'Add It to Your Practice',
    body: 'Display your credential on your business card, email signature, and Pinnacle agent profile. Earn required CE via annual membership renewal.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PinnaclePartnerPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section className="hero" style={{ padding: '96px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">Pinnacle Financial Services Partnership</div>
            <h1 style={{ marginBottom: 20 }}>
              For Pinnacle Agents:<br />
              Credentials That Transform Your Medicare Practice
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              Pinnacle Financial Services has partnered with ARPI to help its agent network
              earn nationally recognized credentials in IRMAA planning and Social Security
              strategy — the missing layer that turns Medicare enrollment into comprehensive
              retirement guidance.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/enroll?partner=pinnacle" className="btn-primary">Enroll as a Pinnacle Agent</a>
              <a href="/credentials/irmaacp" className="btn-outline">IRMAACP™ — Start Here</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── IRMAA spotlight banner ── */}
      <div style={{
        background: 'var(--blue-xlight)',
        borderBottom: '1px solid var(--blue-light)',
        padding: '28px 0',
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: 'var(--blue-dark)',
              color: WHITE,
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              borderRadius: 3,
              flexShrink: 0,
            }}>
              Recommended for Medicare Agents
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--blue-dark)', lineHeight: 1.6, margin: 0, flex: 1 }}>
              <strong>IRMAACP™</strong> is the most relevant credential for Pinnacle agents working with
              Medicare clients. It covers IRMAA surcharges, the income lookback period,
              appeals, and MAGI planning — topics every high-income Medicare client needs guidance on.
            </p>
            <a href="/credentials/irmaacp" style={{
              background: 'var(--blue-dark)',
              color: WHITE,
              padding: '10px 20px',
              borderRadius: 3,
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Learn About IRMAACP™ →
            </a>
          </div>
        </div>
      </div>

      {/* ── Partner intro ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div className="partner-intro">
            {/* Partner logo — dark panel */}
            <div className="partner-logo">
              <img
                src="/logos/pinnacle.webp"
                alt="Pinnacle Financial Services"
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
                The Planning Layer Your Medicare Practice is Missing
              </h2>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 16 }}>
                Pinnacle Financial Services is a national FMO built on partnerships, not titles —
                dedicated to offering agents the tools, technology, and education needed to scale
                their Medicare and retirement planning businesses. ARPI credentials are a natural
                extension of that mission.
              </p>
              <p style={{ fontSize: '0.95rem', color: INK_MID, lineHeight: 1.8, marginBottom: 24 }}>
                When a Pinnacle agent adds IRMAACP™ or NSSA®, they can walk into any
                Medicare conversation and address the questions clients care about most:
                How much will Medicare actually cost me? When should I claim Social Security?
                How do I avoid the IRMAA trap? These are the questions that build loyalty.
              </p>
              {/* Member benefit callout */}
              <div style={{
                background: GREEN_XL,
                borderLeft: `4px solid ${GREEN}`,
                borderRadius: '0 6px 6px 0',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Pinnacle Agent Benefit
                </div>
                <div style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.65 }}>
                  Contact Pinnacle Financial Services or reach out to ARPI directly for your member discount code. We verify membership before issuing codes to keep the benefit exclusive.
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
              More Than a Medicare Agent
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              ARPI credentials position you as a retirement planning resource — the advisor
              clients call first and refer to most.
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
                              {i === 0 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0016 4.44 5 5 0 006 8c0 1.55.59 2.9 1.5 3.89A4.74 4.74 0 018.91 14"/></svg>` }} />}
              {i === 1 && <div style={{ width: 48, height: 48, background: 'var(--green-xlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--green-dark)' }} dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>` }} />}
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

      {/* ── How it works ── */}
      <section style={{ padding: '80px 0', background: WHITE }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-eyebrow">How It Works</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Credential in Four Steps
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
          }}>
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} style={{
                position: 'relative',
                paddingTop: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--font-merriweather), Georgia, serif',
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  color: GREEN_XL,
                  lineHeight: 1,
                  marginBottom: 16,
                  letterSpacing: '-0.03em',
                }}>
                  {h.step}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-merriweather), Georgia, serif',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 10,
                  lineHeight: 1.35,
                }}>
                  {h.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: INK_MID, lineHeight: 1.75 }}>
                  {h.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Credentials ── */}
      <section style={{ padding: '80px 0', background: BG_SOFT }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-eyebrow">ARPI Credentials</div>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              Start with IRMAACP™. Add NSSA®. Go Further with CELP®.
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Each credential adds a distinct planning capability to your Medicare practice.
              Pinnacle agents most often start with IRMAACP™.
            </p>
          </div>
          <div className="credentials-grid">
            {CREDENTIALS.map(c => (
              <div
                key={c.tag}
                className="cred-card"
                style={c.featured ? { border: `2px solid ${GREEN}`, boxShadow: '0 4px 20px rgba(42,107,84,0.12)' } : {}}
              >
                {c.featured && (
                  <div style={{
                    background: GREEN,
                    color: WHITE,
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '6px 0',
                  }}>
                    Recommended for Pinnacle Agents
                  </div>
                )}
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
            Ready to Become More Than a Medicare Agent?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
            Pinnacle agents enroll at a preferred rate. Start with IRMAACP™ and add NSSA®
            to build the most complete Medicare &amp; retirement credential stack available.
          </p>
          <div className="cta-banner-actions">
            <a href="/enroll?partner=pinnacle" className="btn-primary">Enroll as a Pinnacle Agent</a>
            <a href="/contact" className="btn-outline">Questions? Contact Us</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
