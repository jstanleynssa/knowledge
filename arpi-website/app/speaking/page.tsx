import type { Metadata } from 'next'
import './speaking.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Speaking Engagements | ARPI',
  description:
    'Book Cindi Hill or Todd Valles for your next conference, breakout session, or advisor seminar. Expert-level presentations on Social Security strategy, IRMAA, and Medicare planning.',
  keywords: [
    'financial advisor speaker',
    'Social Security speaker',
    'IRMAA speaker',
    'Medicare speaker',
    'retirement planning speaker',
    'Cindi Hill speaker',
    'Todd Valles speaker',
    'ARPI speaking engagements',
    'conference speaker Social Security',
  ],
  alternates: { canonical: 'https://arpinstitute.com/speaking' },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'Speaking Engagements | ARPI',
    description:
      'Book Cindi Hill or Todd Valles for your next conference, breakout session, or advisor seminar.',
    url: 'https://arpinstitute.com/speaking',
    images: [{ url: 'https://arpinstitute.com/assets/arpi-logo-new.png', width: 1200, height: 630, alt: 'ARPI Speaking Engagements' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Speaking Engagements | ARPI',
    description:
      'Book Cindi Hill or Todd Valles for your next conference, breakout session, or advisor seminar.',
    images: ['https://arpinstitute.com/assets/arpi-logo-new.png'],
  },
  robots: { index: true, follow: true },
}

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const FORMATS = [
  {
    label: 'Main Stage',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    price: '$6,000',
    travel: '+ Travel',
    description: 'Keynote-level presentations designed for large general-session audiences. Authoritative, engaging delivery that positions your conference as the premier destination for retirement income education.',
    ideal: 'Annual conferences, national advisor summits, association conventions',
  },
  {
    label: 'Breakout Session',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    price: '$4,000',
    travel: '+ Travel',
    description: 'Focused, interactive sessions for smaller audiences. Deeper dives into specific topics with Q&A and real-world case discussion — ideal for attendees who want to walk away with actionable guidance.',
    ideal: 'Conference tracks, regional meetings, study groups, broker-dealer events',
  },
  {
    label: 'Seminar',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    price: '$1,500',
    travel: '+ Travel',
    description: 'Half-day or full-day training intensives for advisor teams, study groups, or firm-sponsored events. Custom curriculum, hands-on scenarios, and practical takeaways your team can use immediately.',
    ideal: 'Advisor teams, firm training days, CE credit events, wholesaler education',
  },
]

const SS_TOPICS = [
  {
    title: 'Social Security Benefit Optimization',
    description:
      'Maximize lifetime income through strategic claiming decisions — timing, spousal coordination, and the interplay of work history, PIA formulas, and delayed retirement credits. Attendees leave with a framework they can apply to any client scenario.',
  },
  {
    title: 'The Solvency of Social Security',
    description:
      'An evidence-based look at the trust fund projections, what depletion actually means, and how advisors can confidently address the question every pre-retiree is asking. Separates political noise from actuarial reality.',
  },
  {
    title: 'Spousal & Survivor Benefit Strategies',
    description:
      'Navigating the rules around spousal, survivor, and divorced-spouse benefits — and how to design claiming plans that protect clients who outlive their partners. Covers the key planning windows most advisors miss.',
  },
  {
    title: 'The Claiming Decision: Age 62, 70, and Everything In Between',
    description:
      'Breaking down the break-even math, health considerations, cash flow needs, and the tax implications that determine the optimal claiming window for each client. Practical, case-driven, and immediately applicable.',
  },
  {
    title: 'Social Security & Tax Planning: The Hidden Intersection',
    description:
      'How provisional income, the 85% taxation threshold, and Roth conversion sequencing interact with Social Security — and why ignoring this connection costs clients real money. A must-attend for advisors who integrate tax and income planning.',
  },
]

const IRMAA_TOPICS = [
  {
    title: 'IRMAA Avoidance Strategies',
    description:
      'Proactive income management to keep clients below IRMAA thresholds — Roth conversions, capital gains timing, qualified charitable distributions, and distribution sequencing to protect Medicare premiums before and after retirement.',
  },
  {
    title: 'How IRMAA Works',
    description:
      'A clear explanation of the Income-Related Monthly Adjustment Amount: the two-year lookback rule, the income brackets, the appeals process for qualifying life events, and the most common advisor mistakes that trigger unnecessary surcharges.',
  },
  {
    title: 'The Future of Medicare',
    description:
      'Medicare\'s long-term funding pressures, the policy proposals being debated in Washington, and what advisors should be monitoring to keep client guidance current and credible. Data-driven and nonpartisan.',
  },
  {
    title: 'Medicare Part D & the New Drug Cost Landscape',
    description:
      'How Part D works post-Inflation Reduction Act, the $2,000 out-of-pocket cap, formulary tiers, the Extra Help program, and how to guide clients in choosing the right drug plan at initial enrollment or during open enrollment.',
  },
  {
    title: 'Transitioning to Medicare: Avoiding the Costly Gaps',
    description:
      'The rules, pitfalls, and planning opportunities when clients move from employer-sponsored coverage to Medicare — including COBRA timing, Part B enrollment windows, late-enrollment penalties, and coordination with HSAs.',
  },
]

/* ─── Component ──────────────────────────────────────────────────────────────── */

export default function SpeakingPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="sp-hero">
          <div className="container">
            <div className="sp-hero-inner">
              <div className="hero-eyebrow" style={{ color: 'var(--green-light)' }}>Speaking Engagements</div>
              <h1>Bring ARPI's Expertise<br />to Your Next Event</h1>
              <p className="sp-hero-sub">
                ARPI's faculty presents to thousands of financial professionals every year — at
                national conferences, regional summits, and advisor training events. Book Cindi Hill
                or Todd Valles to deliver a presentation your attendees will reference for years.
              </p>
              <a href="/contact?subject=speaking" className="sp-hero-cta">
                Inquire About Booking
              </a>
            </div>
          </div>
        </section>

        {/* ── Engagement Formats ────────────────────────────────────────── */}
        <section className="sp-section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div className="sp-section-header">
              <div className="section-eyebrow">Engagement Formats</div>
              <h2 className="section-title">Choose the Right Format for Your Event</h2>
              <p className="section-sub" style={{ margin: '16px auto 0' }}>
                Every engagement includes full preparation, custom slide decks tailored to your
                audience, and Q&amp;A time. All fees are per speaker; travel expenses billed at cost.
              </p>
            </div>
            <div className="sp-format-grid">
              {FORMATS.map((f) => (
                <div key={f.label} className="sp-format-card">
                  <div className="sp-format-icon">{f.icon}</div>
                  <div className="sp-format-label">{f.label}</div>
                  <div className="sp-format-price">
                    {f.price}
                    <span className="sp-format-travel">{f.travel}</span>
                  </div>
                  <p className="sp-format-desc">{f.description}</p>
                  <div className="sp-format-ideal">
                    <span className="sp-format-ideal-label">Ideal for:</span> {f.ideal}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Speakers ──────────────────────────────────────────────────── */}
        <section className="sp-section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="sp-section-header">
              <div className="section-eyebrow">Our Speakers</div>
              <h2 className="section-title">Meet the Faculty</h2>
              <p className="section-sub" style={{ margin: '16px auto 0' }}>
                Practitioners who have spent their careers inside these disciplines — not generalists.
                Both speakers hold ARPI credentials and deliver curriculum the institute uses to
                certify thousands of financial advisors nationwide.
              </p>
            </div>

            {/* Cindi Hill */}
            <div className="sp-speaker-card" id="cindi-hill">
              <div className="sp-speaker-photo-wrap sp-speaker-photo-wrap--green">
                <img
                  src="/assets/speakers/cindi-hill.jpg"
                  alt="Cindi Hill — Director of Social Security Education"
                  className="sp-speaker-photo"
                />
                <div className="sp-speaker-photo-fallback" aria-hidden="true">CH</div>
              </div>
              <div className="sp-speaker-bio">
                <div className="sp-speaker-specialty sp-speaker-specialty--green">Social Security</div>
                <h3 className="sp-speaker-name">Cindi Hill</h3>
                <div className="sp-speaker-title">Director of Social Security Education, ARPI</div>
                <div className="sp-speaker-creds">CFP® · ChFC® · RICP® · CRPC® · ABFP® · NSSA®</div>
                <p className="sp-speaker-body">
                  Cindi holds one of the deepest credential stacks in retirement income planning,
                  backed by 33 years at TruStage consulting credit union investment programs and
                  advisors nationwide on IRA strategy, Social Security, and Medicare planning. A
                  national speaker at industry conferences and advisor events, she launched CKH
                  Consulting LLC in 2025 before joining ARPI to oversee the NSSA® curriculum and
                  continuing education. Her presentations balance regulatory precision with the
                  practical, client-ready language advisors actually need.
                </p>
                <a href="#ss-topics" className="sp-speaker-topics-link">
                  View Social Security Topics →
                </a>
              </div>
            </div>

            {/* Todd Valles */}
            <div className="sp-speaker-card sp-speaker-card--reverse" id="todd-valles">
              <div className="sp-speaker-photo-wrap sp-speaker-photo-wrap--blue">
                <img
                  src="/assets/speakers/todd-valles.jpg"
                  alt="Todd Valles — Director of IRMAA & Medicare Education"
                  className="sp-speaker-photo"
                />
                <div className="sp-speaker-photo-fallback" aria-hidden="true">TV</div>
              </div>
              <div className="sp-speaker-bio">
                <div className="sp-speaker-specialty sp-speaker-specialty--blue">IRMAA &amp; Medicare</div>
                <h3 className="sp-speaker-name">Todd Valles</h3>
                <div className="sp-speaker-title">Director of IRMAA &amp; Medicare Education, ARPI</div>
                <div className="sp-speaker-creds">IRMAACP®</div>
                <p className="sp-speaker-body">
                  Todd brings nearly a decade of experience as VP of Separate Account Sales at
                  T. Rowe Price, working directly with annuity wholesalers at major carriers across
                  the country. That front-line wholesaler experience — understanding precisely how
                  advisors think about annuity products alongside Medicare and income planning — is
                  the foundation of his ARPI presentations. He designs and delivers the IRMAACP™
                  certification curriculum and presents Medicare and IRMAA strategy to wholesaler
                  teams and advisor audiences nationwide. His sessions are known for making
                  complex Medicare mechanics accessible and immediately actionable.
                </p>
                <a href="#irmaa-topics" className="sp-speaker-topics-link sp-speaker-topics-link--blue">
                  View IRMAA &amp; Medicare Topics →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Topics ────────────────────────────────────────────────────── */}
        <section className="sp-section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)' }}>
          <div className="container">

            {/* Social Security Topics */}
            <div className="sp-topics-block" id="ss-topics">
              <div className="sp-topics-header sp-topics-header--green">
                <div className="sp-topics-speaker-badge">
                  <div className="sp-topics-avatar sp-topics-avatar--green">CH</div>
                  <div>
                    <div className="sp-topics-speaker-name">Cindi Hill</div>
                    <div className="sp-topics-speaker-sub">Social Security Topics</div>
                  </div>
                </div>
              </div>
              <div className="sp-topics-grid">
                {SS_TOPICS.map((t, i) => (
                  <div key={i} className="sp-topic-card sp-topic-card--green">
                    <div className="sp-topic-num">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <h4 className="sp-topic-title">{t.title}</h4>
                      <p className="sp-topic-desc">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IRMAA / Medicare Topics */}
            <div className="sp-topics-block" id="irmaa-topics" style={{ marginTop: 64 }}>
              <div className="sp-topics-header sp-topics-header--blue">
                <div className="sp-topics-speaker-badge">
                  <div className="sp-topics-avatar sp-topics-avatar--blue">TV</div>
                  <div>
                    <div className="sp-topics-speaker-name">Todd Valles</div>
                    <div className="sp-topics-speaker-sub">IRMAA &amp; Medicare Topics</div>
                  </div>
                </div>
              </div>
              <div className="sp-topics-grid">
                {IRMAA_TOPICS.map((t, i) => (
                  <div key={i} className="sp-topic-card sp-topic-card--blue">
                    <div className="sp-topic-num sp-topic-num--blue">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <h4 className="sp-topic-title">{t.title}</h4>
                      <p className="sp-topic-desc">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Booking CTA ───────────────────────────────────────────────── */}
        <section className="sp-cta-section">
          <div className="container">
            <div className="sp-cta-inner">
              <h2 className="sp-cta-heading">Ready to Book?</h2>
              <p className="sp-cta-sub">
                Tell us about your event — audience size, format, and preferred topics — and
                we'll confirm availability and send a speaker agreement within 48 hours.
              </p>
              <div className="sp-cta-actions">
                <a href="/contact?subject=speaking" className="sp-cta-primary">
                  Submit a Speaking Inquiry
                </a>
                <a href="mailto:jstanley@arpinstitute.com" className="sp-cta-secondary">
                  Email Us Directly
                </a>
              </div>
              <p className="sp-cta-note">
                All formats include a custom slide deck, pre-event call with event staff, and
                post-event CE documentation if applicable. Travel billed at cost.
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
