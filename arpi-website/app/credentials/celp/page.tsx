
import Script from 'next/script'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { fmt, TUITION_CELP } from '@/lib/pricing'
import CelpApplyForm from '@/components/credentials/CelpApplyForm'
import CurriculumAccordion, { type Module } from '@/components/credentials/CurriculumAccordion'
import FaqAccordion, { type FaqItem } from '@/components/credentials/FaqAccordion'
import WhoForInteractive from '@/components/credentials/WhoForInteractive'
import ReferralInteractive from '@/components/credentials/ReferralInteractive'
import CelpTwoTracks from '@/components/credentials/CelpTwoTracks'

export const metadata = {
  title: 'CELP® Certification — Certified End-of-Life Planner',
  description:
    'Earn the CELP® credential — the definitive end-of-life planning certification. Build a new practice or deepen existing client relationships by mastering the financial, legal, and family coordination work most families desperately need.',
  openGraph: {
    title: 'CELP® Certification — End-of-Life Planning',
    description: 'The credential for end-of-life financial coordination. 10 modules, CE credits filed for you, and a built-in referral ecosystem across estate law, hospice, and senior living.',
    url: 'https://arpinstitute.com/credentials/celp',
    images: [{ url: 'https://arpinstitute.com/assets/course-hero-celp.jpg', width: 1200, height: 630 }],
  },
}

// ─── Brand tokens ────────────────────────────────────────────
const PRIMARY = 'var(--green-dark)'
const DARK = 'var(--green-900)'
const LIGHT = 'var(--green-xlight)'
const MID = 'var(--green-mid)'

// ─── SVG Icons ───────────────────────────────────────────────
function IconBriefcase({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

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

function IconNetwork({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
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
    title: 'Purpose, Role & Scope',
    items: [
      'Why end-of-life financial planning exists',
      'What a CELP does and does not do',
      'Why this role is needed now',
      'How you deliver value to families and referral partners',
    ],
  },
  {
    title: 'Legal Document Review',
    items: [
      'Core legal documents: will, trust, POA, health directives',
      'Common gaps and errors in existing documents',
      'How to work with attorneys without practicing law',
      'Protecting the client from conflicting documents',
    ],
  },
  {
    title: 'Financial Asset Inventory',
    items: [
      'Full financial discovery process',
      'Beneficiary designation review',
      'Locating missing and forgotten accounts',
      'Creating a consolidated statement of wealth',
    ],
  },
  {
    title: 'Insurance Review & Coverage',
    items: [
      'Life insurance evaluation',
      'Long-term care planning options',
      'Final expense planning',
      'How insurance supports legacy and liquidity goals',
    ],
  },
  {
    title: 'Taxes, Costs & Probate Avoidance',
    items: [
      'Understanding what triggers probate',
      'Tax considerations: step-up basis, IRA distributions, estate taxes',
      'Cost estimates for estate settlement',
      'Strategies to reduce estate settlement costs',
    ],
  },
  {
    title: 'Family Dynamics & Dispute Prevention',
    items: [
      'Identifying risk factors in blended families',
      'Structured family meetings',
      'Creating clear heir instructions',
      'Managing emotional dynamics neutrally',
    ],
  },
  {
    title: 'Medical & Care Directives',
    items: [
      'Advance health care planning',
      'Documenting care preferences',
      'Medication and physician management',
      'Integrating medical decisions with the financial plan',
    ],
  },
  {
    title: 'Business, Property & Special Situations',
    items: [
      'Business continuation planning',
      'Real estate review',
      'Special needs trusts and disabled children',
      'High-complexity estate frameworks',
    ],
  },
  {
    title: 'Digital Estate & Technology',
    items: [
      'Digital identity and asset inventory',
      'Password management systems',
      'Social media and online presence decisions',
      'Cybersecurity during vulnerable periods',
    ],
  },
  {
    title: 'The Final Plan & Survivors Guide',
    items: [
      'Bringing all elements together into one deliverable',
      'Creating the Survivors Guide for the family',
      'The execution checklist',
      'Preparing the family for what comes next',
    ],
  },
  {
    title: 'Final Exam',
    isFinal: true,
    items: [
      '100-question multiple choice exam',
      '75% passing score required',
      'Proctored online',
      'CELP® certificate issued upon passing',
    ],
  },
]

const whyCards = [
  {
    icon: <IconBriefcase />,
    heading: 'A Career That Stands Alone',
    body: 'CELP graduates can build independent consulting practices without managing investments or selling products. Many build six-figure practices helping families organize their financial lives — the market is universal and untapped.',
  },
  {
    icon: <IconUsers />,
    heading: 'Deepen Every Client Relationship',
    body: "For existing financial professionals, CELP transforms client relationships from transactional to essential. When you help a family navigate the most difficult financial event of their lives, you become irreplaceable.",
  },
  {
    icon: <IconNetwork />,
    heading: 'The Largest Referral Network in Planning',
    body: 'CELP professionals become natural referral partners for estate attorneys, elder law attorneys, CPAs, hospice organizations, senior living communities, and funeral homes. Each profession solves one piece — you coordinate the whole.',
  },
]

const included = [
  { icon: <IconBook />, heading: 'Course Companion', desc: 'A comprehensive written guide covering all 10 modules — a permanent reference for client conversations, family meetings, and complex case work.' },
  { icon: <IconPlay />, heading: 'Expert Video Lessons', desc: 'Practitioner-led video modules walking through legal reviews, family dynamics, digital estates, and the complete Survivors Guide framework.' },
  { icon: <IconCheckCircle />, heading: 'Interactive Quizzes', desc: 'Module-by-module knowledge checks designed to reinforce concepts and build the confidence you need to lead complex family conversations.' },
  { icon: <IconFolder />, heading: 'Member Resource Library', desc: 'Client-facing checklists, Survivors Guide templates, beneficiary review worksheets, and referral partner materials.' },
  { icon: <IconAward />, heading: 'CE Credits Filed', desc: 'We file your CE credits on your behalf in eligible states — Insurance CE, CFP Board, and CPE depending on your designation.' },
  { icon: <IconMedal />, heading: 'Exam & Certification', desc: 'Proctored online exam included. CELP® certificate and digital badge issued upon passing.' },
]


const stats = [
  { number: '11,000+', label: 'Americans turn 65 every day' },
  { number: '$80T+', label: 'Great wealth transfer underway' },
  { number: '70%', label: 'Of families leave financial disorder at death' },
]

// ─── Page ─────────────────────────────────────────────────────
const faqs: FaqItem[] = [
  {
    q: 'Is this course suitable for professionals new to end-of-life planning?',
    a: 'Yes. CELP® is designed to be accessible across disciplines — financial, legal, medical, and care. Whether you are building an entirely new practice or adding a service line, the 10-module curriculum builds from fundamentals to advanced family coordination work.',
  },
  {
    q: 'Does the course include CE credits?',
    a: 'Yes. CELP® is designed to deliver CE credit eligible for Insurance CE, CFP Board credit, and CPE depending on your state and professional designation. The exact number of approved hours will be confirmed upon state filing. We handle all filing on your behalf — no paperwork required.',
  },
  {
    q: 'How long does it take to complete the course?',
    a: 'Most students complete the 10-module course in 12–16 hours. With 24/7 on-demand access, you set your own schedule.',
  },
  {
    q: 'Can I build a standalone practice with the CELP® credential?',
    a: 'Yes — and many graduates do exactly that. CELP® was designed to support independent consulting practices that do not require selling investment products or insurance. The credential and curriculum give you a complete framework for a standalone end-of-life planning business.',
  },
  {
    q: 'Do I have to be a financial professional to take this course?',
    a: 'No. CELP® is open to professionals across all disciplines who serve aging clients or families in transition — estate attorneys, CPAs, social workers, care managers, senior living consultants, hospice professionals, and those building new practices from scratch are all welcome.',
  },
  {
    q: 'How does the certification and membership fee work?',
    a: `CELP® tuition is ${fmt(TUITION_CELP)} upon acceptance. An application fee is required at submission and is fully credited toward tuition if you are accepted. Annual membership covers certification maintenance, resource access, and curriculum updates.`,
  },
  {
    q: 'What do I have to do to maintain my certification?',
    a: 'Complete annual CE requirements and renew your membership each year. We send reminders well in advance of your renewal date.',
  },
  {
    q: 'Do you file my CE credits for me?',
    a: 'Yes. We file CE credits on your behalf in eligible states. No additional paperwork required.',
  },
  {
    q: 'What is the Survivors Guide framework?',
    a: 'The Survivors Guide is the signature client deliverable of the CELP® program — a comprehensive framework you build with families to organize their financial, legal, and personal affairs before a death occurs. It becomes a core service offering of your CELP® practice.',
  },
  {
    q: 'What makes CELP® different from other estate planning credentials?',
    a: 'CELP® is not an estate planning credential — it is a coordination credential. It covers the full spectrum of what families face at end of life: legal document review, digital estates, family dynamics, tax strategy, beneficiary titling, and the complete Survivors Guide deliverable. No other credential is built for the cross-discipline coordinator role.',
  },
  {
    q: 'Will this help me build a referral network?',
    a: 'Significantly. CELP® professionals sit at the center of an ecosystem of estate attorneys, elder law attorneys, CPAs, hospice organizations, senior living communities, and funeral homes — all serving the same families but none coordinating across disciplines. You become the connector every family needs.',
  },
  {
    q: 'Can I retake the exam if I do not pass?',
    a: 'Yes. Retakes are available if you do not pass on your first attempt.',
  },
  {
    q: 'Can I list the CELP® credential on my website and email signature?',
    a: 'Yes. Upon certification, you receive branding guidelines and full authorization to display the CELP® designation on your website, business card, email signature, and all professional materials.',
  },
  {
    q: 'Do you provide ongoing support after the course?',
    a: 'Yes. CELP® members receive access to updated resource libraries, client-facing checklists, Survivors Guide templates, beneficiary review worksheets, and referral partner materials — updated annually to reflect current law and best practices.',
  },
]

export default function CELPPage() {
  return (
    <>
      <Nav />
      <main id="cred-page">

        {/* ── Hero ── */}
        <section className="course-hero">
          <div className="course-hero-left">
            <a href="/credentials" className="back-link">← All Credentials</a>
            <div className="eyebrow-row">
              <span className="eyebrow-badge">CELP® Certification</span>
              <span className="new-badge">By Application Only · Q4 2026</span>
            </div>
            <h1 className="course-h1">
              The Credential America<br />Needs Right Now
            </h1>
            <p className="course-sub">
              Certified End-of-Life Planner. An entirely new professional category built for the $80 trillion wealth transfer — and the tens of millions of families who have no one to coordinate the financial, legal, and emotional realities of the final decades of life.
            </p>
            <div className="hero-ctas">
              <a href="#apply" className="btn-primary">Apply for Consideration</a>
              <a href="#curriculum" className="btn-outline">View Curriculum</a>
            </div>
            <div className="social-proof">
              <span>✓ 5,000+ credentialed advisors</span>
              <span>✓ CE credits filed on your behalf</span>
            </div>
          </div>
          <div className="course-hero-right">
            <Image
              src="/assets/course-hero-celp.jpg"
              alt="Financial professional on laptop"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        </section>

        {/* ── Opportunity Section ── */}
        <section className="section opportunity-section">
          <div className="container opportunity-grid">
            <div className="opportunity-text">
              <p className="section-eyebrow">The Opportunity</p>
              <h2 className="section-h2">A Market No One Is Serving</h2>
              <p className="opportunity-body">
                More than 11,000 Americans reach age 65 every day. Boomers control over $69 trillion in wealth. Their children will inherit it — and almost none of them are prepared.
              </p>
              <p className="opportunity-body">
                Most families have no trust, no updated will, no consolidated accounts, and no documented wishes. When death occurs, families fall into conflict, waste money on probate, and make rushed decisions that destroy wealth built over a lifetime.
              </p>
              <p className="opportunity-body">
                No single profession coordinates the entire process. That is the gap the CELP fills.
              </p>
            </div>
            <div className="opportunity-stats">
              {stats.map((stat, i) => (
                <div key={i} className="stat-box">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Two Tracks ── */}
        <CelpTwoTracks />

        {/* ── Why Earn ── */}
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <p className="section-eyebrow">Why Earn CELP®</p>
            <h2 className="section-h2">Why Professionals Choose CELP®</h2>
            <p className="section-intro">Whether you&apos;re building a brand-new practice or adding a powerful new service line to an existing one, CELP® opens doors that no other credential can.</p>
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
        <section className="section">
          <div className="container">
            <p className="section-eyebrow">Everything You Need</p>
            <h2 className="section-h2">What&apos;s Included</h2>
            <p className="section-intro">Ten comprehensive modules, a client-ready Survivors Guide framework, ongoing resource access, CE filing, and full certification. One enrollment, complete preparation.</p>
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
              <span className="ce-units" style={{ fontSize: '1rem', letterSpacing: '0.06em' }}>CE Credit</span>
              <span className="ce-number" style={{ fontSize: '2.25rem', marginTop: 4 }}>Eligible</span>
            </div>
            <div className="ce-text">
              <p className="ce-desc">
                CELP® is designed to deliver continuing education credit eligible for Insurance CE, CFP Board credit, and CPE depending on your state and professional designation. The exact number of approved hours will be confirmed upon state filing. No CE paperwork required — we handle everything.
              </p>
              <p className="ce-filed">CE hours confirmed upon state filing · Filed on your behalf</p>
            </div>
          </div>
        </section>

        {/* ── Curriculum ── */}
        <section id="curriculum" className="section">
          <div className="container">
            <p className="section-eyebrow">The Curriculum</p>
            <h2 className="section-h2">What You&apos;ll Learn</h2>
            <p className="section-intro">
              Ten deep-dive modules covering every dimension of end-of-life financial coordination — legal documents, family dynamics, digital estates, tax strategies, and the complete Survivors Guide deliverable. Plus a proctored final exam.
            </p>
            <CurriculumAccordion modules={modules} primaryColor={PRIMARY} lightColor={LIGHT} />
          </div>
        </section>

        {/* ── Referral Network ── */}
        <ReferralInteractive />

        {/* ── Who It's For ── */}
        <WhoForInteractive />

        {/* ── Testimonials ── */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="section-eyebrow" style={{ textAlign: 'center' }}>Hear From Our Advisors</p>
            <div className="elfsight-app-0fea18cd-6017-4cd4-b52f-1c4d7d2c8c30" data-elfsight-app-lazy />
          </div>
        </section>
        <Script src="https://elfsightcdn.com/platform.js" strategy="afterInteractive" />

        {/* ── Application Process ── */}
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <p className="section-eyebrow">How It Works</p>
            <h2 className="section-h2">A Credential Reserved for Those Who Qualify</h2>
            <p className="section-intro">
              CELP® is not open enrollment. Every candidate goes through a structured application
              process designed to ensure the credential means something — to you, to your clients,
              and to every professional in your referral network.
            </p>
            <div className="celp-steps">
              {[
                {
                  n: '01',
                  title: 'Submit Your Application',
                  body: "Complete a short application outlining your professional background and why you're pursuing CELP®. An application fee is required at submission — it is fully credited toward your tuition if you are accepted.",
                },
                {
                  n: '02',
                  title: 'Entrance Assessment',
                  body: 'Accepted applicants complete a proctored entrance assessment covering foundational knowledge in estate planning, financial coordination, and end-of-life frameworks. This ensures every CELP® candidate starts from a baseline of professional competency.',
                },
                {
                  n: '03',
                  title: 'Background Review',
                  body: 'All candidates undergo a professional background review. CELP® professionals work with families during their most vulnerable moments — integrity and professional standing are non-negotiable requirements of the credential.',
                },
                {
                  n: '04',
                  title: 'Acceptance & Enrollment',
                  body: `Accepted candidates receive full access to the CELP® curriculum, the Survivors Guide framework, and earn the CELP® designation upon passing the final exam. Your application fee is credited toward your ${fmt(TUITION_CELP)} tuition.`,
                },
              ].map(({ n, title, body }) => (
                <div key={n} className="celp-step">
                  <div className="celp-step-num">{n}</div>
                  <h3 className="celp-step-title">{title}</h3>
                  <p className="celp-step-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="section-eyebrow">Tuition</p>
            <h2 className="section-h2">Investment in the CELP® Credential</h2>
            <div className="pricing-card">
              <div className="pricing-left">
                <Image src="/assets/celp-logo.png" alt="CELP®" width={160} height={52} style={{ objectFit: 'contain', maxWidth: '100%' }} />
                <p className="pricing-includes-label">What&apos;s Included</p>
                <ul className="pricing-checklist">
                  <li>Complete 10-module online course</li>
                  <li>Course Companion reference guide</li>
                  <li>Expert video lessons — watch anytime</li>
                  <li>CE credits filed upon state approval</li>
                  <li>Survivors Guide framework &amp; templates</li>
                  <li>Member resource library access</li>
                  <li>CELP® certificate &amp; digital badge</li>
                </ul>
              </div>
              <div className="pricing-right">
                <div className="pricing-hero-img">
                  <Image src="/assets/course-hero-celp.jpg" alt="CELP advisor" width={600} height={300} style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div className="pricing-right-body">
                  <div className="pricing-rows">
                    <div className="pricing-row pricing-total">
                      <span>Tuition (upon acceptance)</span>
                      <span>{fmt(TUITION_CELP)}</span>
                    </div>
                    <div className="pricing-row" style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                      <span>Application fee credited toward tuition</span>
                      <span>✓</span>
                    </div>
                  </div>
                  <a href="#apply" className="pricing-cta">Apply for Consideration</a>
                  <p className="pricing-contact">Questions? <a href="/contact">Contact us</a></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Apply for Consideration ── */}
        <section id="apply" className="section" style={{ background: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <p className="section-eyebrow">Apply</p>
            <h2 className="section-h2">Apply for Consideration</h2>
            <p className="section-intro" style={{ marginBottom: 40 }}>
              CELP® launches Q4 2026. Submit your expression of interest below and we&rsquo;ll
              be in touch with application details, timeline, and next steps as soon as
              they&rsquo;re available.
            </p>
            <CelpApplyForm />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="section-eyebrow">Common Questions</p>
            <h2 className="section-h2">Everything You Need to Know Before You Enroll</h2>
            <p className="section-intro">
              We want your CELP® experience to feel transparent and fully supported. These FAQs cover the program, certification process, CE credits, and what you can build with this credential.
            </p>
            <FaqAccordion items={faqs} primaryColor={PRIMARY} lightColor={LIGHT} />
          </div>
        </section>



      </main>

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'CELP® — Certified End-of-Life Planner Certification',
        description: 'End-of-life planning certification for financial professionals and other disciplines. Covers estate settlement, survivor coordination, legacy planning, and family financial guidance through the most complex life transitions.',
        url: 'https://arpinstitute.com/credentials/celp',
        provider: { '@type': 'Organization', name: 'ARPI — Advanced Retirement Planning Institute', url: 'https://arpinstitute.com' },
        educationalCredentialAwarded: 'CELP® — Certified End-of-Life Planner designation',
hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          offers: { '@type': 'Offer', price: String(TUITION_CELP), priceCurrency: 'USD', availability: 'https://schema.org/PreOrder', url: 'https://arpinstitute.com/credentials/celp#apply' },
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
          { '@type': 'ListItem', position: 3, name: 'CELP®', item: 'https://arpinstitute.com/credentials/celp' },
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
          margin-bottom: 20px;
          display: inline-block;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .back-link:hover { color: #fff; }
        .eyebrow-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
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
        }
        .new-badge {
          display: inline-block;
          background: ${MID};
          color: #fff;
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
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

        /* ── Opportunity Section ── */
        .opportunity-section { background: #fff; }
        .opportunity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .opportunity-body {
          font-size: 1rem;
          color: #374151;
          line-height: 1.75;
          margin: 0 0 16px;
        }
        .opportunity-body:last-child { margin-bottom: 0; }
        .opportunity-stats {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .stat-box {
          background: ${LIGHT};
          border-left: 4px solid ${MID};
          border-radius: 8px;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-number {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: ${PRIMARY};
          line-height: 1;
        }
        .stat-label {
          font-size: 0.9375rem;
          color: #374151;
          font-weight: 500;
          line-height: 1.4;
        }

        /* ── Why Cards ── */
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

        /* ── Referral Network ── */
        .referral-section { background: #f8fafc; }
        .referral-box {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 36px 40px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .referral-intro {
          font-size: 1rem;
          color: #374151;
          font-weight: 600;
          margin: 0 0 20px;
        }
        .referral-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .referral-tag {
          background: ${LIGHT};
          color: ${DARK};
          border-radius: 999px;
          padding: 7px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-block;
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
          color: var(--green-dark);
          font-weight: 700;
          flex-shrink: 0;
          font-size: 0.875rem;
        }
        .pricing-right {
          display: flex;
          flex-direction: column;
          background: var(--green-900);
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
          color: var(--green-dark);
          background: #fff; border: 2px solid var(--green-dark);
          transition: background 0.2s, color 0.2s;
          margin-bottom: 14px;
          box-sizing: border-box;
        }
        .pricing-cta:hover { background: var(--green-dark); color: #fff; }
        .pricing-contact {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          text-align: center;
        }
        .pricing-contact a { color: rgba(255,255,255,0.85); text-decoration: underline; font-weight: 500; }
        .pricing-contact a:hover { color: #fff; }

        /* ── Application Process Steps ── */
        .celp-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        .celp-step {
          background: #fff;
          border: 1px solid var(--border);
          border-top: 4px solid var(--green-mid);
          border-radius: 10px;
          padding: 28px 24px;
        }
        .celp-step-num {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--green-mid);
          margin-bottom: 10px;
        }
        .celp-step-title {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 10px;
          line-height: 1.3;
        }
        .celp-step-body {
          font-size: 0.875rem;
          color: var(--ink-light);
          line-height: 1.68;
          margin: 0;
        }
        @media (max-width: 900px) { .celp-steps { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .celp-steps { grid-template-columns: 1fr; } }

/* ── Brand color overrides (scoped for specificity) ── */
        #cred-page .btn-primary { background: var(--green-dark) !important; border-color: var(--green-dark) !important; }
        #cred-page .btn-primary:hover { background: var(--green-900) !important; border-color: var(--green-900) !important; }
        #cred-page .section-eyebrow { color: var(--green-dark) !important; }
        #cred-page .section-h2 { color: var(--green-900) !important; }
        #cred-page .pricing-cta { background: #fff !important; color: var(--green-dark) !important; border: 2px solid var(--green-dark) !important; }
        #cred-page .pricing-cta:hover { background: var(--green-dark) !important; color: #fff !important; }
        #cred-page .pricing-checklist li::before { color: var(--green-dark) !important; }

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
          .opportunity-grid { grid-template-columns: 1fr; gap: 40px; }
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
          .referral-box { padding: 24px 20px; }
        }
        @media (max-width: 540px) {
          .accordion-body { padding-left: 24px; }
          .pricing-left { padding: 28px 16px; }
          .pricing-right-body { padding: 20px 16px 28px; }
          .stat-number { font-size: 1.875rem; }
        }
      `}</style>
    </>
  )
}
