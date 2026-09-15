
import Script from 'next/script'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { fmt, TUITION_1, CERT_1, TOTAL_1, SAVINGS_3, CE_IRMAACP } from '@/lib/pricing'
import CurriculumAccordion, { type Module } from '@/components/credentials/CurriculumAccordion'
import FaqAccordion, { type FaqItem } from '@/components/credentials/FaqAccordion'
import IrmaacpWhoForInteractive from '@/components/credentials/IrmaacpWhoForInteractive'
import NYCEDisclosure from '@/components/credentials/NYCEDisclosure'

export const metadata = {
  title: 'IRMAACP™ Certification — Medicare & IRMAA Planning for Financial Professionals',
  description:
    'Earn the IRMAACP™ credential — the definitive Medicare planning certification. Learn to project IRMAA surcharges, build appeals, and implement income strategies that save high-value clients thousands every year.',
  openGraph: {
    title: 'IRMAACP™ Certification — Medicare & IRMAA Planning',
    description: 'The definitive IRMAA planning credential. Project surcharges, build successful appeals, and implement income strategies for high-value clients.',
    url: 'https://arpinstitute.com/credentials/irmaacp',
    images: [{ url: 'https://arpinstitute.com/assets/course-hero-irmaacp.jpg', width: 1200, height: 630 }],
  },
}

// ─── Brand tokens ────────────────────────────────────────────
const PRIMARY = '#b02a34'
const DARK = '#7f1424'
const LIGHT = '#f0d4d8'
const MID = '#c13e4e'

// ─── SVG Icons ───────────────────────────────────────────────
function IconUsers({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function IconDollarSign({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function IconTarget({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconBook({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function IconPlay({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}

function IconCheckCircle({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconFolder({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

function IconAward({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function IconMedal({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
  )
}


// ─── Page Data ────────────────────────────────────────────────
const modules: Module[] = [
  {
    title: 'Medicare Basics',
    items: [
      'Parts A, B, C, and D overview',
      'Enrollment periods and windows',
      'Late enrollment penalties',
      'Medicare supplement and Advantage plans',
    ],
  },
  {
    title: 'IRMAA Fundamentals',
    items: [
      'What IRMAA is and who it affects',
      'Income brackets and surcharge tiers',
      'The two-year look-back rule',
      'MAGI calculation and what counts as income',
    ],
  },
  {
    title: 'IRMAA Brackets & Calculations',
    items: [
      '2025/2026 bracket tiers for Part B and D',
      'Surcharge amounts per tier',
      'Married filing jointly vs. single vs. MFS thresholds',
      'How brackets reset annually',
    ],
  },
  {
    title: 'Life-Changing Event Appeals',
    items: [
      'SSA-44 form and process',
      'Qualifying life-changing events',
      'Documentation requirements',
      'Appeal strategy and timeline',
      'Reconsideration process',
    ],
  },
  {
    title: 'Income Planning Strategies',
    items: [
      'Roth conversions and IRMAA cliff awareness',
      'RMD timing and bracket management',
      'Tax-efficient withdrawal sequencing',
      'Capital gain harvesting',
      'Social Security coordination',
    ],
  },
  {
    title: 'Advanced IRMAA Planning',
    items: [
      'Multi-year bracket projection',
      'Proactive planning with CPAs and estate attorneys',
      'Cliff effect management',
      'High-income client frameworks',
      'Case studies',
    ],
  },
  {
    title: 'Final Exam',
    isFinal: true,
    items: [
      '75-question multiple choice exam',
      '75% passing score required',
      'Proctored online',
      'IRMAACP™ certificate issued upon passing',
    ],
  },
]

const whyCards = [
  {
    icon: <IconUsers />,
    heading: 'Access the High-Value Client Market',
    body: "IRMAA affects high earners — exactly the clients who pay the most in fees and have the most complex financial lives. Being the IRMAA expert puts you in front of premium prospects who can't afford to guess.",
  },
  {
    icon: <IconDollarSign />,
    heading: 'Measurable, Immediate ROI',
    body: 'One successful IRMAA appeal saves a client $2,000–$10,000+ per year in premiums. The credential pays for itself many times over with a single client engagement — and earns you referrals in the process.',
  },
  {
    icon: <IconTarget />,
    heading: 'A Rare Specialization',
    body: 'Very few advisors truly understand IRMAA. Earning IRMAACP™ positions you as the specialist in a market where most advisors can only refer out — and clients remember who helped them.',
  },
]

const included = [
  { icon: <IconBook />, heading: 'Course Companion', desc: 'A comprehensive written guide covering every aspect of IRMAA planning — a reference you keep and consult for years.' },
  { icon: <IconPlay />, heading: 'Expert Video Lessons', desc: 'Practitioner-led video modules breaking down brackets, appeals, and income strategies in plain language.' },
  { icon: <IconCheckCircle />, heading: 'Interactive Quizzes', desc: 'Module-by-module knowledge checks with immediate feedback to reinforce learning and exam readiness.' },
  { icon: <IconFolder />, heading: 'Member Resource Library', desc: 'Updated annually with current bracket tables, appeal forms, planning worksheets, and client-facing materials.' },
  { icon: <IconAward />, heading: 'CE Credits Filed', desc: 'We file your CE credits on your behalf in eligible states — keep your license current without extra paperwork.' },
  { icon: <IconMedal />, heading: 'Exam & Certification', desc: 'Proctored online exam included. IRMAACP™ certificate and digital badge issued upon passing.' },
]




// ─── Page ─────────────────────────────────────────────────────
const faqs: FaqItem[] = [
  {
    q: 'Is this course suitable for beginners?',
    a: 'Yes. The course starts with Medicare fundamentals before moving into IRMAA calculations, appeals, and advanced income strategies. No prior IRMAA or Medicare expertise is required.',
  },
  {
    q: 'Does the course include CE credits?',
    a: `Yes. IRMAACP™ delivers ${CE_IRMAACP} CE hours eligible for Insurance CE, CFP Board credit, and CPE depending on your state and designation. We file credits on your behalf — no paperwork required.`,
  },
  {
    q: 'How long does it take to complete the course?',
    a: 'Most advisors complete the self-paced course in 6–8 hours. With 24/7 on-demand access, you work at your own schedule.',
  },
  {
    q: 'How often is the training updated?',
    a: 'Updated annually. IRMAA bracket tables, income thresholds, and appeal rules change each year — the curriculum stays current so your client advice does too.',
  },
  {
    q: 'Is the exam difficult?',
    a: 'The exam covers all six modules with a focus on practical application — bracket calculations, appeals strategy, and income planning. Students who complete the coursework and companion guide typically pass on their first attempt. Retakes are available.',
  },
  {
    q: 'Do I have to be a financial advisor to take this course?',
    a: 'No. CPAs, insurance agents, Medicare specialists, tax professionals, retirement planners, and estate attorneys all benefit from IRMAACP™ — anyone advising clients on retirement income is eligible.',
  },
  {
    q: 'How does the certification and membership fee work?',
    a: `Course tuition is ${fmt(TUITION_1)}. Upon passing the exam, a ${fmt(CERT_1)} annual membership fee covers your certification, credential maintenance, and member resource access.`,
  },
  {
    q: 'What do I have to do to maintain my certification?',
    a: 'Complete annual CE requirements and renew your membership each year. We send renewal reminders well in advance.',
  },
  {
    q: 'Do you file my CE credits for me?',
    a: 'Yes. We file on your behalf in eligible states — no additional paperwork on your end.',
  },
  {
    q: 'Who authored this program?',
    a: 'The IRMAACP™ curriculum is led by Todd Valles, Director of IRMAA and Medicare Education at NSSA — four decades of financial services experience, including 10+ years educating advisors on Medicare and IRMAA planning, with a legal background in taxation and ERISA.',
  },
  {
    q: 'What makes IRMAACP™ different from other Medicare trainings?',
    a: 'Most Medicare training covers enrollment basics. IRMAACP™ goes much deeper — surcharge projections, multi-year bracket management, successful appeals strategy, and income positioning to minimize lifetime premiums. It is the only credential built specifically around IRMAA planning.',
  },

  {
    q: 'Will this help me attract new clients?',
    a: 'Yes — particularly high-income clients. IRMAA affects households earning $206,000+ annually — exactly the clients who generate the most revenue and have the most complex planning needs. Being the IRMAA expert puts you in front of premium prospects who cannot afford to guess.',
  },
  {
    q: 'Can I list the IRMAACP™ credential on my website and email signature?',
    a: 'Yes. Upon certification, you receive branding guidelines and are authorized to display the IRMAACP™ designation on your website, business card, email signature, and all professional materials.',
  },
  {
    q: 'Do you provide ongoing support after the course?',
    a: 'Yes. IRMAACP™ members have access to subject matter experts, updated bracket tables, appeal form libraries, and a community of credentialed peers — ongoing support for complex client scenarios.',
  },
]

export default function IRMAACPPage() {
  return (
    <>
      <Nav />
      <main id="cred-page">

        {/* ── Hero ── */}
        <section className="course-hero">
          <div className="course-hero-left">
            <a href="/credentials" className="back-link">← All Credentials</a>
            <span className="eyebrow-badge">IRMAACP™ Certification</span>
            <h1 className="course-h1">
              Medicare Expertise That Commands<br />Premium Clients
            </h1>
            <p className="course-sub">
              The definitive IRMAA and Medicare planning credential. Learn to project surcharges before they hit, build successful life-changing event appeals, and implement income strategies that save high-value clients thousands every year.
            </p>
            <div className="hero-ctas">
              <a href="/enroll?course=irmaacp" className="btn-primary">Enroll Now — {fmt(TUITION_1)}</a>
              <a href="#curriculum" className="btn-outline">View Curriculum</a>
            </div>
            <div className="social-proof">
              <span>✓ 5,000+ credentialed advisors</span>
              <span>✓ CE credits filed for you</span>
            </div>
          </div>
          <div className="course-hero-right">
            <Image
              src="/assets/course-hero-irmaacp.jpg"
              alt="Financial advisor at desktop with red screen"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        </section>

        {/* ── Why Earn ── */}
        <section className="section why-section">
          <div className="container">
            <p className="section-eyebrow">Why Earn IRMAACP™</p>
            <h2 className="section-h2">Why Advisors Choose IRMAACP™</h2>
            <p className="section-intro">IRMAA is one of the most expensive surprises in retirement — and almost no advisor is prepared to address it. That gap is your opportunity.</p>
            <div className="cards-grid">
              {whyCards.map((card, i) => (
                <div key={i} className="why-card">
                  <div className="why-card-icon">
                    {card.icon}
                  </div>
                  <h3 className="why-card-heading">{card.heading}</h3>
                  <p className="why-card-body">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What's Included ── */}
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <p className="section-eyebrow">Everything You Need</p>
            <h2 className="section-h2">What&apos;s Included</h2>
            <p className="section-intro">One enrollment. Complete access. Everything you need to master IRMAA and Medicare planning from day one through certification.</p>
            <div className="included-grid">
              {included.map((item, i) => (
                <div key={i} className="included-item">
                  <div className="included-icon">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="included-heading">{item.heading}</h3>
                    <p className="included-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CE Credits Callout ── */}
        <section className="ce-band">
          <div className="container ce-band-inner">
            <div className="ce-number-block">
              <span className="ce-number">{CE_IRMAACP}</span>
              <span className="ce-units">CE Hours</span>
            </div>
            <div className="ce-text">
              <p className="ce-desc">
                IRMAACP™ delivers {CE_IRMAACP} hours of continuing education credit. Eligible for Insurance CE, CFP Board credit, and CPE credit depending on your state and designation. No paperwork required — we handle filing on your behalf.
              </p>
              <p className="ce-filed">Filed on your behalf in most states</p>
            </div>
          </div>
        </section>

        {/* ── Curriculum ── */}
        <section id="curriculum" className="section">
          <div className="container">
            <p className="section-eyebrow">The Curriculum</p>
            <h2 className="section-h2">What You&apos;ll Learn</h2>
            <p className="section-intro">
              Six focused modules moving from Medicare fundamentals to advanced multi-year IRMAA bracket strategies — built for advisors who want to deliver immediate, measurable value to high-income clients. Includes a proctored final exam.
            </p>
            <CurriculumAccordion modules={modules} primaryColor={PRIMARY} lightColor={LIGHT} />
          </div>
        </section>

        {/* ── Who It's For ── */}
        <IrmaacpWhoForInteractive />

        {/* ── Testimonials ── */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="section-eyebrow" style={{ textAlign: 'center' }}>Hear From Our Advisors</p>
            <div className="elfsight-app-0fea18cd-6017-4cd4-b52f-1c4d7d2c8c30" data-elfsight-app-lazy />
          </div>
        </section>
        <Script src="https://elfsightcdn.com/platform.js" strategy="afterInteractive" />

        {/* ── Pricing ── */}
        <section id="pricing" className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <p className="section-eyebrow">Tuition &amp; Enrollment</p>
            <h2 className="section-h2">Simple, Transparent Pricing</h2>
            <div className="pricing-card">

              {/* Left — logo + what's included */}
              <div className="pricing-left">
                <Image
                  src="/assets/irmaa-logo.png"
                  alt="IRMAACP™"
                  width={160}
                  height={52}
                  style={{ objectFit: 'contain', maxWidth: '100%' }}
                />
                <p className="pricing-includes-label">What&apos;s Included</p>
                <ul className="pricing-checklist">
                  <li>Complete 6-module online course</li>
                  <li>Course Companion reference guide</li>
                  <li>Expert video lessons — watch anytime</li>
                  <li>4 CE credits filed in most states</li>
                  <li>Member resource library access</li>
                  <li>IRMAACP™ certificate & digital badge</li>
                </ul>
              </div>

              {/* Right — hero image + price breakdown + CTA */}
              <div className="pricing-right">
                <div className="pricing-hero-img">
                  <Image
                    src="/assets/course-hero-irmaacp.jpg"
                    alt="IRMAACP advisor at desktop"
                    width={600}
                    height={300}
                    style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                  />
                </div>
                <div className="pricing-right-body">
                  <div className="pricing-rows">
                    <div className="pricing-row">
                      <span>Course Tuition</span><span>{fmt(TUITION_1)}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Exam, Certification &amp; Annual Dues</span><span>{fmt(CERT_1)}</span>
                    </div>
                    <div className="pricing-row pricing-total">
                      <span>Total Investment</span><span>{fmt(TOTAL_1)}</span>
                    </div>
                  </div>
                  <a href="/enroll?course=irmaacp" className="pricing-cta">Enroll in IRMAACP™ Now</a>
                  <p className="pricing-contact">
                    Questions? <a href="/contact">Contact us</a>
                  </p>
                </div>
              </div>

            </div>

            {/* NY State CE Disclosure */}
            <NYCEDisclosure
              credential="IRMAACP™"
              examQuestions={75}
              ceHours={null}
              providerNumber={null}
              licenseClasses={null}
              expirationDate={null}
            />

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="section-eyebrow">Common Questions</p>
            <h2 className="section-h2">Everything You Need to Know Before You Enroll</h2>
            <p className="section-intro">
              We want your IRMAACP™ experience to feel transparent and fully supported. These FAQs cover the training format, certification process, CE credits, and membership benefits.
            </p>
            <FaqAccordion items={faqs} primaryColor={PRIMARY} lightColor={LIGHT} />
          </div>
        </section>

        {/* ── Bundle Strip ── */}
        <section className="bundle-strip">
          <div className="container bundle-inner">
            <div>
              <h3 className="bundle-heading">Save When You Bundle</h3>
              <p className="bundle-sub">Add NSSA® and CELP® and save up to {fmt(SAVINGS_3)}</p>
            </div>
            <a href="/credentials#bundles" className="btn-outline-dark">View Bundle Pricing →</a>
          </div>
        </section>

      </main>

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'IRMAACP™ — IRMAA Certified Planner Certification',
        description: 'Medicare and IRMAA planning certification for financial professionals. Covers surcharge calculations, bracket management, life-changing event appeals, and advanced income strategies for high-value clients.',
        url: 'https://arpinstitute.com/credentials/irmaacp',
        provider: { '@type': 'Organization', name: 'ARPI — Advanced Retirement Planning Institute', url: 'https://arpinstitute.com' },
        educationalCredentialAwarded: 'IRMAACP™ — IRMAA Certified Planner designation',
        numberOfCredits: CE_IRMAACP,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          offers: { '@type': 'Offer', price: String(TUITION_1), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: 'https://arpinstitute.com/enroll?course=irmaacp' },
        },
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://arpinstitute.com' },
          { '@type': 'ListItem', position: 2, name: 'Credentials', item: 'https://arpinstitute.com/credentials' },
          { '@type': 'ListItem', position: 3, name: 'IRMAACP™', item: 'https://arpinstitute.com/credentials/irmaacp' },
        ],
      })}} />

      <Footer />

      <style>{`
        /* ── Hero ── */
        .course-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 540px;
        }
        .course-hero-left {
          background: ${DARK};
          padding: 64px 48px 64px max(32px, calc((100vw - 1180px) / 2 + 32px));
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }
        .course-hero-right {
          position: relative;
          overflow: hidden;
          min-height: 400px;
        }
        .back-link {
          color: rgba(255,255,255,0.65);
          font-size: 0.85rem;
          text-decoration: none;
          margin-bottom: 24px;
          display: inline-block;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .back-link:hover { color: #fff; }
        .eyebrow-badge {
          display: inline-block;
          background: rgba(255,255,255,0.14);
          color: #fff;
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 0.775rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 22px;
          width: fit-content;
        }
        .course-h1 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.625rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.22;
          margin: 0 0 22px;
        }
        .course-sub {
          color: rgba(255,255,255,0.82);
          font-size: 1.0625rem;
          line-height: 1.72;
          margin: 0 0 36px;
          max-width: 480px;
        }
        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .social-proof {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.78);
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* ── Shared Section ── */
        .section { padding: 80px 0; }
        .section-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.5rem, 2.5vw, 2.0625rem);
          font-weight: 700;
          color: #111827;
          margin: 0 0 14px;
        }
        .section-intro {
          font-size: 1rem;
          color: #4b5563;
          line-height: 1.72;
          max-width: 660px;
          margin: 0 0 40px;
        }

        /* ── Why Cards ── */
        .why-section { background: #fff; }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .why-card {
          border-top: 4px solid ${MID};
          border-radius: 10px;
          padding: 32px 28px;
          background: #fff;
          box-shadow: 0 2px 20px rgba(0,0,0,0.07);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .why-card:hover {
          box-shadow: 0 6px 32px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }
        .why-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${LIGHT};
          color: ${PRIMARY};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .why-card-heading {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1.0375rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px;
        }
        .why-card-body {
          font-size: 0.9375rem;
          color: #4b5563;
          line-height: 1.68;
          margin: 0;
        }

        /* ── What's Included ── */
        .included-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px 40px;
        }
        .included-item {
          display: flex;
          gap: 18px;
          align-items: flex-start;
        }
        .included-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: ${LIGHT};
          color: ${PRIMARY};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .included-heading {
          font-weight: 700;
          font-size: 1rem;
          color: #111827;
          margin: 2px 0 6px;
        }
        .included-desc {
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.62;
          margin: 0;
        }

        /* ── CE Band ── */
        .ce-band {
          background: ${PRIMARY};
          padding: 60px 0;
          color: #fff;
        }
        .ce-band-inner {
          display: flex;
          align-items: center;
          gap: 52px;
        }
        .ce-number-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.16);
          border-radius: 14px;
          padding: 20px 36px;
          min-width: 120px;
        }
        .ce-number {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 4.25rem;
          font-weight: 700;
          line-height: 1;
          display: block;
        }
        .ce-units {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.8;
          margin-top: 4px;
          display: block;
        }
        .ce-desc {
          font-size: 1rem;
          line-height: 1.72;
          opacity: 0.92;
          margin: 0 0 10px;
        }
        .ce-filed {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          opacity: 0.72;
          margin: 0;
        }

        /* ── Accordion ── */
        .accordion {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .accordion-item { border-bottom: 1px solid #e5e7eb; }
        .accordion-item:last-child { border-bottom: none; }
        .accordion-header {
          width: 100%;
          background: #fff;
          border: none;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          gap: 12px;
        }
        .accordion-header:hover { background: #f9fafb; }
        .accordion-item--open .accordion-header { background: ${LIGHT}; }
        .accordion-label {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }
        .accordion-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .accordion-title {
          font-weight: 600;
          font-size: 0.9875rem;
          color: #111827;
          flex: 1;
        }
        .accordion-arrow { flex-shrink: 0; }
        .accordion-body {
          padding: 4px 24px 24px 68px;
        }
        .accordion-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .accordion-list li {
          padding: 8px 0;
          font-size: 0.9375rem;
          color: #374151;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
          line-height: 1.5;
        }
        .accordion-list li:last-child { border-bottom: none; }
        .accordion-list li::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${PRIMARY};
          flex-shrink: 0;
        }

        /* ── Who It's For ── */
        .who-section { background: ${LIGHT}; }
        .who-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .who-pill {
          padding: 9px 22px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 600;
          background: ${DARK};
          color: #fff;
          display: inline-block;
        }

        /* ── Testimonials ── */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
          margin-top: 40px;
        }
        .testimonial-card {
          border-left: 4px solid ${PRIMARY};
          padding: 28px 32px;
          background: #f8fafc;
          border-radius: 0 10px 10px 0;
          margin: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .testimonial-quote {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1.0625rem;
          color: #111827;
          line-height: 1.72;
          font-style: italic;
          margin: 0 0 18px;
        }
        .testimonial-footer {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* ── Pricing ── */
        .pricing-card {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.11);
          margin-top: 40px;
          background: #fff;
        }
        .pricing-left {
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-right: 1px solid #e5e7eb;
        }
        .pricing-includes-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 8px 0 4px;
        }
        .pricing-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }
        .pricing-checklist li {
          padding: 10px 0;
          font-size: 0.9375rem;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #f0f0f0;
        }
        .pricing-checklist li:last-child { border-bottom: none; }
        .pricing-checklist li::before {
          content: '✓';
          color: #b02a34;
          font-weight: 700;
          flex-shrink: 0;
          font-size: 0.875rem;
        }
        .pricing-right {
          display: flex;
          flex-direction: column;
          background: #7f1424;
        }
        .pricing-hero-img {
          width: 100%;
          height: 220px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pricing-right-body {
          padding: 32px 36px 36px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .pricing-rows {
          margin-bottom: 28px;
        }
        .pricing-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.78);
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .pricing-total {
          font-weight: 700;
          font-size: 1.125rem;
          color: #fff;
          border-bottom: none !important;
          padding-top: 14px;
        }
        .pricing-cta {
          display: block;
          width: 100%;
          text-align: center;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          color: #b02a34;
          background: #fff; border: 2px solid #b02a34;
          transition: background 0.2s, color 0.2s;
          margin-bottom: 14px;
          box-sizing: border-box;
        }
        .pricing-cta:hover { background: #b02a34; color: #fff; }
        .pricing-contact {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          text-align: center;
        }
        .pricing-contact a { color: rgba(255,255,255,0.85); text-decoration: underline; font-weight: 500; }
        .pricing-contact a:hover { color: #fff; }

        /* ── Bundle Strip ── */
        .bundle-strip {
          background: #111827;
          padding: 52px 0;
          color: #fff;
        }
        .bundle-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
        }
        .bundle-heading {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1.5625rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }
        .bundle-sub {
          font-size: 1rem;
          color: rgba(255,255,255,0.72);
          margin: 0;
        }

/* ── Brand color overrides (scoped for specificity) ── */
        #cred-page .btn-primary { background: #b02a34 !important; border-color: #b02a34 !important; }
        #cred-page .btn-primary:hover { background: #7f1424 !important; border-color: #7f1424 !important; }
        #cred-page .section-eyebrow { color: #b02a34 !important; }
        #cred-page .section-h2 { color: #7f1424 !important; }
        #cred-page .pricing-cta { background: #fff !important; color: #b02a34 !important; border: 2px solid #b02a34 !important; }
        #cred-page .pricing-cta:hover { background: #b02a34 !important; color: #fff !important; }
        #cred-page .pricing-checklist li::before { color: #b02a34 !important; }

        /* ── FAQ Accordion ── */
        .faq-accordion {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .faq-item { border-bottom: 1px solid #e5e7eb; }
        .faq-item:last-child { border-bottom: none; }
        .faq-question {
          width: 100%;
          background: #fff;
          border: none;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          gap: 16px;
        }
        .faq-question:hover { background: #f9fafb; }
        .faq-item--open .faq-question { background: #f9fafb; }
        .faq-q-text {
          font-weight: 600;
          font-size: 0.9875rem;
          color: #111827;
          flex: 1;
          line-height: 1.5;
        }
        .faq-chevron { flex-shrink: 0; }
        .faq-answer {
          padding: 16px 28px 20px;
          border-left: 3px solid;
        }
        .faq-answer p {
          font-size: 0.9375rem;
          color: #374151;
          line-height: 1.72;
          margin: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .cards-grid { grid-template-columns: 1fr; gap: 20px; }
          .testimonials-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .course-hero { grid-template-columns: 1fr; }
          .pricing-card { grid-template-columns: 1fr; } .pricing-left { padding: 36px 24px; border-right: none; border-bottom: 1px solid #e5e7eb; } .pricing-hero-img { height: 200px; } .pricing-right-body { padding: 28px 24px; }
          .course-hero-right { min-height: 280px; order: -1; }
          .course-hero-left { padding: 40px 24px; }
          .ce-band-inner { flex-direction: column; gap: 28px; }
          .included-grid { grid-template-columns: 1fr; }
          .bundle-inner { flex-direction: column; align-items: flex-start; }
          .section { padding: 64px 0; }
        }
        @media (max-width: 540px) {
          .accordion-body { padding-left: 24px; }
          .pricing-left { padding: 28px 16px; }
          .pricing-right-body { padding: 20px 16px 28px; }
        }
      `}</style>
    </>
  )
}
