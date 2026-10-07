import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const SUPABASE  = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources'
const PDF_URL   = `${SUPABASE}/webinars/arpi-member-call-october-2026.pdf`
const PPTX_URL  = `${SUPABASE}/webinars/arpi-member-call-october-2026.pptx`

export const metadata = {
  title: 'ARPI Monthly Member Call — October 2026',
  description: 'Recording, slides, and exclusive member offers from the October 2026 ARPI Monthly Member Meeting — IRMAA avoidance, CELP®, and your ARPI toolkit.',
  robots: { index: false },
}

// ─── Offer cards ──────────────────────────────────────────────
const offers = [
  {
    badge: '50% OFF + 7-DAY TRIAL',
    name: 'CALCULUS',
    description: 'The Social Security breakeven calculator built for financial advisors — SSA Period Life Tables, correct spousal math, unlimited saved scenarios. Start free for 7 days, then 50% off your subscription.',
    cta: 'Start Free Trial',
    url: 'https://academy.arpinstitute.com/offers/FCb2gsUD/checkout?coupon_code=ARPI50CALCULUS',
    code: 'ARPI50CALCULUS',
  },
  {
    badge: '50% OFF + FREE TRIAL',
    name: 'Retirement Advisor Pro',
    description: 'The complete IRMAA, Social Security, and Roth conversion planning suite. Start your free trial and lock in 50% off with the member code below.',
    cta: 'Start Free Trial',
    url: 'https://www.retirementadvisorpro.com/nssa',
    code: 'NSSA2026',
  },
  {
    badge: '50% OFF — NSSA MEMBERS',
    name: 'IRMAACP® Certification',
    regularPrice: '$1,195',
    salePrice: '$595',
    description: 'Earn the IRMAA Certified Planner designation. Master IRMAA diagnosis, income engineering, SSA-44 appeals, and become the go-to IRMAA expert in your market.',
    cta: 'Enroll at 50% Off',
    url: 'https://academy.arpinstitute.com/offers/mKoPXoDn/checkout',
    code: null,
  },
]

// ─── Speakers ─────────────────────────────────────────────────
const speakers = [
  {
    name: 'Jason Stanley',
    title: 'President, Advanced Retirement Planning Institute',
    bio: 'Jason Stanley leads the Advanced Retirement Planning Institute and oversees the NSSA®, IRMAACP™, and CELP® credential programs. He hosts the monthly member call and coordinates ongoing education for ARPI-credentialed advisors nationwide.',
  },
  {
    name: 'Todd Valles',
    title: 'Director of IRMAA & Medicare Education, ARPI',
    bio: 'Todd Valles draws on nearly 40 years working with annuity wholesalers and financial advisors, plus a legal background in tax and ERISA, to design the IRMAACP® curriculum and coach advisor teams nationwide on practical IRMAA avoidance strategies.',
  },
  {
    name: 'Jim Blair',
    title: 'Co-Founder, NSSA® / ARPI',
    bio: 'Jim Blair is co-founder of the National Social Security Advisor (NSSA®) designation, now part of the Advanced Retirement Planning Institute. With decades of Social Security expertise, Jim trains financial advisors on filing strategy, survivor benefits, and spousal optimization.',
  },
]

export default function MemberCallOctober2026() {
  return (
    <>
      <Nav />
      <main>
        <style>{`
          #wbmc {
            --green:       #2a6b54;
            --green-dark:  #1a4a37;
            --green-light: #d9ede5;
            --green-xlight:#f0f9f5;
            --ink:         #1a2433;
            --ink-mid:     #4a5568;
            --border:      #e2e8f0;
          }

          /* ── Hero ── */
          #wbmc .wb-hero { background: #111827; padding: 64px 0 72px; }
          #wbmc .wb-hero-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; text-align: center; }
          #wbmc .wb-eyebrow {
            display: inline-block; font-size: 11px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
            color: rgba(255,255,255,0.5); margin-bottom: 16px;
          }
          #wbmc .wb-title {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
            color: #fff; line-height: 1.2; margin: 0 0 12px; letter-spacing: -0.01em;
          }
          #wbmc .wb-subtitle { font-size: 1rem; color: rgba(255,255,255,0.6); margin: 0; }

          /* ── Shared ── */
          #wbmc .wb-inner { max-width: 900px; margin: 0 auto; }
          #wbmc .wb-label {
            font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
            text-transform: uppercase; color: var(--green); margin: 0 0 20px;
          }
          #wbmc .wb-label--light { color: rgba(255,255,255,0.55); }

          /* ── Recording placeholder ── */
          #wbmc .wb-recording { padding: 64px 24px; background: #fff; border-bottom: 1px solid var(--border); }
          #wbmc .wb-coming-soon {
            border: 2px dashed var(--border); border-radius: 12px;
            padding: 56px 24px; text-align: center; background: #f8fafc;
          }
          #wbmc .wb-coming-soon-icon {
            width: 52px; height: 52px; background: var(--green-light); color: var(--green);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 18px;
          }
          #wbmc .wb-coming-soon h3 {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: 1.125rem; font-weight: 700; color: var(--ink); margin: 0 0 8px;
          }
          #wbmc .wb-coming-soon p { font-size: 0.9rem; color: var(--ink-mid); margin: 0; line-height: 1.6; }

          /* ── Offers ── */
          #wbmc .wb-offers { background: var(--green-dark); padding: 64px 24px; }
          #wbmc .wb-offers-headline {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.3rem, 3vw, 1.85rem); font-weight: 800;
            color: #fff; margin: 0 0 8px; line-height: 1.25;
          }
          #wbmc .wb-offers-sub { font-size: 14px; color: rgba(255,255,255,0.65); margin: 0 0 32px; }
          #wbmc .wb-offer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          #wbmc .wb-offer-card {
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px; padding: 26px; display: flex; flex-direction: column;
          }
          #wbmc .wb-offer-badge {
            display: inline-block; font-size: 10px; font-weight: 700;
            letter-spacing: 0.08em; text-transform: uppercase;
            background: #10994c; color: #fff;
            padding: 3px 9px; border-radius: 99px; margin-bottom: 16px; align-self: flex-start;
          }
          #wbmc .wb-offer-name { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 10px; line-height: 1.35; }
          #wbmc .wb-offer-pricing { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
          #wbmc .wb-offer-regular { font-size: 14px; color: rgba(255,255,255,0.4); text-decoration: line-through; }
          #wbmc .wb-offer-sale { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
          #wbmc .wb-offer-desc { font-size: 13px; color: rgba(255,255,255,0.72); line-height: 1.62; margin: 0 0 16px; flex: 1; }
          #wbmc .wb-offer-code {
            display: flex; align-items: center; gap: 8px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 8px; padding: 9px 13px; margin-bottom: 14px;
          }
          #wbmc .wb-offer-code-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
          #wbmc .wb-offer-code-val { font-size: 13px; font-weight: 700; color: #fff; font-family: monospace; letter-spacing: 0.06em; }
          #wbmc .wb-offer-cta {
            display: block; text-align: center; background: #10994c; color: #fff;
            font-size: 13.5px; font-weight: 700; padding: 12px 20px;
            border-radius: 8px; text-decoration: none; margin-top: auto;
            transition: background 0.15s;
          }
          #wbmc .wb-offer-cta:hover { background: #0d7a3d; }

          /* ── CELP section ── */
          #wbmc .wb-celp { padding: 64px 24px; background: var(--green-xlight); border-top: 1px solid var(--green-light); border-bottom: 1px solid var(--green-light); }
          #wbmc .wb-celp-headline {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.2rem, 2.5vw, 1.6rem); font-weight: 700;
            color: var(--green-dark); margin: 0 0 8px;
          }
          #wbmc .wb-celp-sub { font-size: 0.9375rem; color: var(--ink-mid); margin: 0 0 32px; line-height: 1.65; max-width: 560px; }
          #wbmc .wb-celp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          #wbmc .wb-celp-card {
            border-radius: 14px; padding: 32px; display: flex; flex-direction: column;
            text-decoration: none;
            transition: box-shadow 0.18s, transform 0.18s;
          }
          #wbmc .wb-celp-card:hover { box-shadow: 0 6px 28px rgba(26,74,55,0.15); transform: translateY(-2px); }
          #wbmc .wb-celp-card--partner {
            background: var(--green-dark); border: 1px solid var(--green-dark);
          }
          #wbmc .wb-celp-card--apply {
            background: #fff; border: 2px solid var(--green);
          }
          #wbmc .wb-celp-card-eyebrow {
            font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
            margin: 0 0 14px;
          }
          #wbmc .wb-celp-card--partner .wb-celp-card-eyebrow { color: rgba(255,255,255,0.55); }
          #wbmc .wb-celp-card--apply  .wb-celp-card-eyebrow { color: var(--green); }
          #wbmc .wb-celp-card-title {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: 1.125rem; font-weight: 700; line-height: 1.3; margin: 0 0 12px;
          }
          #wbmc .wb-celp-card--partner .wb-celp-card-title { color: #fff; }
          #wbmc .wb-celp-card--apply  .wb-celp-card-title { color: var(--green-dark); }
          #wbmc .wb-celp-card-body { font-size: 13.5px; line-height: 1.65; margin: 0 0 24px; flex: 1; }
          #wbmc .wb-celp-card--partner .wb-celp-card-body { color: rgba(255,255,255,0.75); }
          #wbmc .wb-celp-card--apply  .wb-celp-card-body { color: var(--ink-mid); }
          #wbmc .wb-celp-card-cta {
            display: inline-block; font-size: 14px; font-weight: 700;
            padding: 12px 20px; border-radius: 8px; text-align: center;
            transition: opacity 0.15s;
          }
          #wbmc .wb-celp-card-cta:hover { opacity: 0.88; }
          #wbmc .wb-celp-card--partner .wb-celp-card-cta { background: #fff; color: var(--green-dark); }
          #wbmc .wb-celp-card--apply  .wb-celp-card-cta { background: var(--green); color: #fff; }

          /* ── Speakers ── */
          #wbmc .wb-speakers { padding: 64px 24px; background: #fff; border-bottom: 1px solid var(--border); }
          #wbmc .wb-speaker-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 24px; }
          #wbmc .wb-speaker-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 26px; }
          #wbmc .wb-speaker-name { font-size: 1rem; font-weight: 700; color: var(--ink); margin: 0 0 4px; }
          #wbmc .wb-speaker-title { font-size: 12px; font-weight: 600; color: var(--green); margin: 0 0 12px; line-height: 1.4; }
          #wbmc .wb-speaker-bio { font-size: 13px; color: var(--ink-mid); line-height: 1.65; margin: 0; }

          /* ── Downloads ── */
          #wbmc .wb-downloads { background: #f8fafc; padding: 48px 24px; }
          #wbmc .wb-dl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
          #wbmc .wb-dl-btn {
            display: flex; align-items: center; gap: 14px;
            background: #fff; border: 1.5px solid var(--border); border-radius: 12px;
            padding: 18px 22px; text-decoration: none; color: var(--ink);
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          #wbmc .wb-dl-btn:hover { border-color: var(--green); box-shadow: 0 2px 12px rgba(42,107,84,0.12); }
          #wbmc .wb-dl-icon {
            width: 40px; height: 40px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          #wbmc .wb-dl-icon--pdf { background: #fef2f2; color: #dc2626; }
          #wbmc .wb-dl-icon--ppt { background: #fff7ed; color: #ea580c; }
          #wbmc .wb-dl-icon svg { width: 20px; height: 20px; }
          #wbmc .wb-dl-label { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
          #wbmc .wb-dl-meta  { font-size: 12px; color: var(--ink-mid); }

          /* ── Responsive ── */
          @media (max-width: 760px) {
            #wbmc .wb-offer-grid { grid-template-columns: 1fr; }
            #wbmc .wb-celp-grid  { grid-template-columns: 1fr; }
          }
          @media (max-width: 640px) {
            #wbmc .wb-hero { padding: 40px 0 48px; }
            #wbmc .wb-recording, #wbmc .wb-offers, #wbmc .wb-celp,
            #wbmc .wb-speakers, #wbmc .wb-downloads { padding: 40px 20px; }
          }
        `}</style>

        <div id="wbmc">

          {/* ── Hero ── */}
          <section className="wb-hero">
            <div className="wb-hero-inner">
              <span className="wb-eyebrow">ARPI Monthly Member Call · October 7, 2026</span>
              <h1 className="wb-title">IRMAA Avoidance, CELP®,<br />and Your ARPI Toolkit</h1>
              <p className="wb-subtitle">With Jason Stanley, Todd Valles, and Jim Blair</p>
            </div>
          </section>

          {/* ── Recording ── */}
          <section className="wb-recording">
            <div className="wb-inner">
              <p className="wb-label">Call Recording</p>
              <div className="wb-coming-soon">
                <div className="wb-coming-soon-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                </div>
                <h3>Recording Coming Soon</h3>
                <p>The full recording will be posted here shortly.<br />Download the slides below to follow along in the meantime.</p>
              </div>
            </div>
          </section>

          {/* ── Offers ── */}
          <section className="wb-offers">
            <div className="wb-inner">
              <p className="wb-label wb-label--light">Exclusive Member Offers</p>
              <h2 className="wb-offers-headline">Member-Only Pricing — Available Now</h2>
              <p className="wb-offers-sub">Offers featured on today&apos;s call. Links apply discounts automatically at checkout.</p>
              <div className="wb-offer-grid">
                {offers.map(o => (
                  <div key={o.name} className="wb-offer-card">
                    <span className="wb-offer-badge">{o.badge}</span>
                    <p className="wb-offer-name">{o.name}</p>
                    {o.regularPrice && o.salePrice && (
                      <div className="wb-offer-pricing">
                        <span className="wb-offer-regular">{o.regularPrice}</span>
                        <span className="wb-offer-sale">{o.salePrice}</span>
                      </div>
                    )}
                    <p className="wb-offer-desc">{o.description}</p>
                    {o.code && (
                      <div className="wb-offer-code">
                        <span className="wb-offer-code-label">Code</span>
                        <span className="wb-offer-code-val">{o.code}</span>
                      </div>
                    )}
                    <a href={o.url} className="wb-offer-cta" target="_blank" rel="noopener noreferrer">
                      {o.cta} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CELP ── */}
          <section className="wb-celp">
            <div className="wb-inner">
              <p className="wb-label">CELP® — Launching Q4 2026</p>
              <h2 className="wb-celp-headline">Two Ways to Participate in CELP®</h2>
              <p className="wb-celp-sub">
                Whether you want to receive referrals from CELP® professionals or earn the credential yourself,
                there&apos;s a path for you. Both applications are open now.
              </p>
              <div className="wb-celp-grid">
                <a href="https://arpinstitute.com/partners/apply" className="wb-celp-card wb-celp-card--partner">
                  <p className="wb-celp-card-eyebrow">For CPAs, Attorneys &amp; Other Professionals</p>
                  <h3 className="wb-celp-card-title">Join the CELP® Partner Network</h3>
                  <p className="wb-celp-card-body">
                    Receive referrals from CELP®-credentialed professionals serving families through estate settlement,
                    wealth transfer, and end-of-life planning. No credential required — apply as a partner today.
                  </p>
                  <span className="wb-celp-card-cta">Apply as a Partner →</span>
                </a>
                <a href="https://arpinstitute.com/credentials/celp#apply" className="wb-celp-card wb-celp-card--apply">
                  <p className="wb-celp-card-eyebrow">Earn the Credential</p>
                  <h3 className="wb-celp-card-title">Apply for CELP® Consideration</h3>
                  <p className="wb-celp-card-body">
                    Express your interest in the inaugural CELP® cohort. The 11-module curriculum covers legal
                    document review, family dynamics, digital estates, industry partnerships, and the complete
                    Survivors Guide framework.
                  </p>
                  <span className="wb-celp-card-cta">Apply for Consideration →</span>
                </a>
              </div>
            </div>
          </section>

          {/* ── Speakers ── */}
          <section className="wb-speakers">
            <div className="wb-inner">
              <p className="wb-label">On This Call</p>
              <div className="wb-speaker-grid">
                {speakers.map(s => (
                  <div key={s.name} className="wb-speaker-card">
                    <h3 className="wb-speaker-name">{s.name}</h3>
                    <p className="wb-speaker-title">{s.title}</p>
                    <p className="wb-speaker-bio">{s.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Downloads ── */}
          <section className="wb-downloads">
            <div className="wb-inner">
              <p className="wb-label">Download the Slides</p>
              <div className="wb-dl-grid">
                <a href={PDF_URL} className="wb-dl-btn" target="_blank" rel="noopener noreferrer">
                  <span className="wb-dl-icon wb-dl-icon--pdf">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
                    </svg>
                  </span>
                  <div>
                    <div className="wb-dl-label">Download PDF</div>
                    <div className="wb-dl-meta">Presentation slides · October 2026</div>
                  </div>
                </a>
                <a href={PPTX_URL} className="wb-dl-btn" target="_blank" rel="noopener noreferrer">
                  <span className="wb-dl-icon wb-dl-icon--ppt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
                    </svg>
                  </span>
                  <div>
                    <div className="wb-dl-label">Download PowerPoint</div>
                    <div className="wb-dl-meta">Editable .pptx · October 2026</div>
                  </div>
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
