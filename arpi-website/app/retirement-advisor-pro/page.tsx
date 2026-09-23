import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Retirement Advisor Pro | Recommended Tools | ARPI',
  description:
    'ARPI recommends Retirement Advisor Pro — comprehensive IRMAA, Social Security, and Roth conversion planning software for financial professionals. NSSA® and IRMAACP™ holders receive an exclusive discount.',
}

const PARTNER_URL = 'https://www.retirementadvisorpro.com/nssa'

const GREEN = 'var(--green-dark)'
const GREEN_MID = 'var(--green-mid)'
const GREEN_XL = 'var(--green-xlight)'
const INK = 'var(--ink)'
const INK_MID = 'var(--ink-mid)'
const INK_LIGHT = 'var(--ink-light)'
const BORDER = 'var(--border)'
const WHITE = 'var(--white)'
const BG = 'var(--bg-soft)'

const features = [
  {
    title: 'Social Security Planning',
    desc: 'Sophisticated claiming strategies to maximize lifetime benefits for your clients.',
    items: [
      'Benefit optimization modeling',
      'Spousal strategy analysis',
      'Break-even calculations',
      'Survivor and filing-status transition analysis',
      'Custom client presentations',
    ],
  },
  {
    title: 'IRMAA & Medicare',
    desc: 'Comprehensive Medicare planning with advanced IRMAA strategies to minimize surcharges for high-income clients.',
    items: [
      'IRMAA modeling with the two-year lookback',
      'Income threshold monitoring',
      'Medicare surcharge optimization',
      'Tax strategy integration',
      'Turnkey client websites',
    ],
  },
  {
    title: 'Roth Conversion Modeling',
    desc: 'Advanced Roth conversion scheduling to help clients optimize their tax strategies and retirement income.',
    items: [
      'Multi-year conversion scheduling',
      'Tax impact analysis',
      'Income bracket optimization',
      'Client-friendly illustrations',
    ],
  },
  {
    title: 'Client Onboarding & Reporting',
    desc: 'AI-powered onboarding and professional-grade reports that run under your firm\'s logo.',
    items: [
      'AI-powered client setup',
      'Automated data collection',
      'Client-ready reports under your firm\'s logo',
      'Presentation mode for live meetings',
      'CRM integration',
    ],
  },
]

const benefits = [
  'Reduce client consultation time by 60%',
  'Increase accuracy of retirement projections',
  'Automate complex IRMAA calculations',
  'Generate professional client reports',
  'Integrate with existing CRM systems',
  'Ensure regulatory compliance',
]

const testimonials = [
  {
    quote: 'RetirementAdvisor Pro has transformed how we serve our clients. The IRMAA planning tools alone have saved us countless hours while providing superior outcomes.',
    name: 'Nick Bour',
    firm: 'Inspire Wealth',
    location: 'Brighton, MI',
  },
  {
    quote: 'The AI-powered Social Security optimization is incredible. Our clients are seeing significantly higher lifetime benefits thanks to this platform.',
    name: 'Sarah Martinez, ChFC',
    firm: 'Retirement Solutions Group',
    location: 'Austin, TX',
  },
  {
    quote: 'The turnkey websites for IRMAA and Social Security have given our practice a competitive edge. Professional, informative, and client-friendly.',
    name: 'Drew Stevens, PhD',
    firm: 'Wisdom to Wealth',
    location: 'St. Louis, MO',
  },
]

const faqs = [
  {
    q: 'Why does ARPI recommend Retirement Advisor Pro?',
    a: 'We evaluated the planning tools available to financial professionals and Retirement Advisor Pro stands out for the depth of its IRMAA modeling, Social Security optimization, and Roth conversion scheduling. It\'s a natural complement to the expertise NSSA® and IRMAACP™ holders develop — the software helps you put that knowledge to work efficiently for every client.',
  },
  {
    q: 'Is it built specifically for NSSA and IRMAACP holders?',
    a: 'No — it\'s built for any financial professional who serves clients navigating retirement income, Medicare, and Social Security decisions. We endorse it because it is an exceptionally good fit for what our credential holders do. The platform also offers an exclusive discount for NSSA® and IRMAACP™ holders through the link on this page.',
  },
  {
    q: 'What\'s included in the annual plan?',
    a: 'The annual plan includes IRMAA modeling with the two-year lookback, Roth conversion scheduling and tax impact analysis, Social Security claiming optimization, survivor and filing-status transition analysis, client-ready reports under your firm\'s logo, presentation mode for live client meetings, an onboarding session, and a rate locked for the life of your subscription.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fees. Every plan includes onboarding and training to get you running on a real client case quickly.',
  },
  {
    q: 'Can I see it in action before committing?',
    a: 'Yes. Retirement Advisor Pro also offers a case design option where their team builds out a full client case with you, brands it to your firm, and walks you through the client meeting — a good way to experience the platform end to end before going solo.',
  },
]

export default function RetirementAdvisorProPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ── */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">ARPI Recommended Tool</div>
              <h1 style={{ marginBottom: 20 }}>Retirement Advisor Pro</h1>
              <p className="hero-sub" style={{ marginBottom: 32, maxWidth: 620 }}>
                ARPI endorses Retirement Advisor Pro as the comprehensive planning platform
                for financial professionals who serve clients navigating Social Security,
                IRMAA, and retirement income decisions. NSSA® and IRMAACP™ holders receive
                an exclusive discount through the link below.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <a
                  href={PARTNER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: '1rem', padding: '14px 32px' }}
                >
                  Get the ARPI Discount →
                </a>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-xlight)' }}>
                  Exclusive pricing for NSSA® and IRMAACP™ holders
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Value Prop ── */}
        <section style={{ padding: '64px 0', background: WHITE, borderBottom: `1px solid ${BORDER}` }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
              <div style={{ gridColumn: '1 / 3' }}>
                <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 700, color: INK, marginBottom: 16, lineHeight: 1.3 }}>
                  About an eighth of what one client is worth.
                </h2>
                <p style={{ fontSize: '1rem', color: INK_MID, lineHeight: 1.75, marginBottom: 16 }}>
                  A single $1M household is worth roughly $10,000 a year to your practice.
                  Retirement Advisor Pro is $960 annually — and it works on every client you have,
                  not just the one that paid for it.
                </p>
                <p style={{ fontSize: '1rem', color: INK_MID, lineHeight: 1.75, margin: 0 }}>
                  For NSSA® and IRMAACP™ holders, the value proposition is even sharper:
                  your credential gives you the expertise; this platform gives you the infrastructure
                  to deliver it at scale.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {benefits.map((b) => (
                  <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: GREEN_MID, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: '0.9rem', color: INK_MID, lineHeight: 1.55 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ── */}
        <section style={{ padding: '80px 0', background: BG }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="section-eyebrow">What&apos;s Included</div>
              <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>
                Everything You Need in One Platform
              </h2>
              <p style={{ fontSize: '1rem', color: INK_LIGHT, maxWidth: 560, margin: '0 auto' }}>
                Bank-level security, 24/7 support, and tools built for the complexity that
                NSSA® and IRMAACP™ credential holders encounter every day.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              {features.map((f) => (
                <div key={f.title} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '32px 28px' }}>
                  <div style={{ width: 36, height: 3, background: GREEN_MID, marginBottom: 20, borderRadius: 2 }} />
                  <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: INK, marginBottom: 10, lineHeight: 1.3 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: INK_LIGHT, lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {f.items.map((item) => (
                      <li key={item} style={{ fontSize: '0.875rem', color: INK_MID, lineHeight: 1.7, paddingLeft: 18, position: 'relative', marginBottom: 2 }}>
                        <span style={{ position: 'absolute', left: 0, color: GREEN_MID, fontWeight: 700 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section style={{ padding: '80px 0', background: WHITE }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="section-eyebrow">Pricing</div>
              <h2 className="section-title" style={{ marginTop: 8 }}>Simple, Flat-Rate Access</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 860, margin: '0 auto' }}>

              {/* Annual */}
              <div style={{ border: `2px solid ${GREEN}`, borderRadius: 12, padding: '40px 36px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: 28, background: GREEN, color: WHITE, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 4 }}>
                  Best Value
                </div>
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: INK, marginBottom: 8 }}>Annual Plan</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem', color: INK_LIGHT, textDecoration: 'line-through' }}>$1,200</span>
                  <span style={{ fontSize: '2.4rem', fontWeight: 700, color: GREEN, lineHeight: 1 }}>$960</span>
                  <span style={{ fontSize: '0.9rem', color: INK_LIGHT }}>/year</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: GREEN_MID, fontWeight: 600, marginBottom: 24 }}>20% off with your NSSA® or IRMAACP™ designation</p>
                <a href={PARTNER_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '13px 0', marginBottom: 28 }}>
                  Get Started →
                </a>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['IRMAA modeling with two-year lookback', 'Roth conversion scheduling & tax impact', 'Social Security claiming optimization', 'Survivor & filing-status transition analysis', 'Client-ready reports under your firm\'s logo', 'Presentation mode for live meetings', 'Onboarding session included', 'Rate locked for the life of your subscription'].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.875rem', color: INK_MID }}>
                      <span style={{ color: GREEN_MID, fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monthly */}
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '40px 36px' }}>
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: INK, marginBottom: 8 }}>Monthly Plan</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 700, color: INK, lineHeight: 1 }}>$139</span>
                  <span style={{ fontSize: '0.9rem', color: INK_LIGHT }}>/month</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: INK_LIGHT, marginBottom: 24 }}>$1,668 billed over a year</p>
                <a href={PARTNER_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '13px 0', marginBottom: 28, borderRadius: 8, border: `2px solid ${GREEN}`, color: GREEN, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
                  Get Started →
                </a>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['IRMAA modeling with two-year lookback', 'Roth conversion scheduling & tax impact', 'Social Security claiming optimization', 'Survivor & filing-status transition analysis', 'Client-ready reports under your firm\'s logo', 'Presentation mode for live meetings', 'Single user access'].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.875rem', color: INK_MID }}>
                      <span style={{ color: GREEN_MID, fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section style={{ padding: '80px 0', background: BG }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="section-eyebrow">What Advisors Say</div>
              <h2 className="section-title" style={{ marginTop: 8 }}>Trusted by Financial Professionals</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {testimonials.map((t) => (
                <div key={t.name} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '32px 28px' }}>
                  <p style={{ fontSize: '0.9375rem', color: INK_MID, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 24 }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <div style={{ fontWeight: 700, color: INK, fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.82rem', color: INK_LIGHT }}>{t.firm} · {t.location}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: INK_LIGHT, textAlign: 'center', marginTop: 24, maxWidth: 640, margin: '24px auto 0' }}>
              Testimonial disclosure: These statements reflect the individual experience of the advisors named and are not a guarantee of future results.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: '80px 0', background: WHITE }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="section-eyebrow">FAQ</div>
              <h2 className="section-title" style={{ marginTop: 8 }}>Common Questions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderTop: `1px solid ${BORDER}`, padding: '28px 0', ...(i === faqs.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : {}) }}>
                  <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1rem', fontWeight: 700, color: INK, marginBottom: 10 }}>{faq.q}</h3>
                  <p style={{ fontSize: '0.9375rem', color: INK_MID, lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section style={{ background: GREEN, padding: '64px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>ARPI Recommended</div>
            <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: WHITE, marginBottom: 16 }}>
              Put Your Credentials to Work
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
              ARPI endorses Retirement Advisor Pro as the planning software of choice for our
              credential holders. Get exclusive pricing through the link below.
            </p>
            <a href={PARTNER_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 8, background: WHITE, color: GREEN, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', border: `2px solid ${WHITE}` }}>
              Get the ARPI Discount →
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
