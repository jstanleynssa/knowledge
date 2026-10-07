import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const SUPABASE   = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources'
const PDF_URL    = `${SUPABASE}/webinars/irmaa-avoidance-ss-optimization.pdf`
const PPTX_URL   = `${SUPABASE}/webinars/irmaa-avoidance-ss-optimization.pptx`
const YOUTUBE_ID = 'QgdpgDC8XVU'
const courses = [
  {
    name: 'NSSA® Certification',
    regularPrice: '$1,195',
    salePrice: '$896',
    badge: '25% off',
    examFee: '$195',
    total: '$1,091',
    url: 'https://arpinstitute.com/enroll?course=nssa&partner=lpl',
  },
  {
    name: 'IRMAACP® Certification',
    regularPrice: '$1,195',
    salePrice: '$896',
    badge: '25% off',
    examFee: '$195',
    total: '$1,091',
    url: 'https://arpinstitute.com/enroll?course=irmaacp&partner=lpl',
  },
  {
    name: 'NSSA® + IRMAACP® Bundle',
    regularPrice: '$1,700',
    salePrice: '$1,275',
    badge: '25% off',
    featured: true,
    examFee: '$295',
    total: '$1,570',
    url: 'https://arpinstitute.com/enroll?course=nssa-irmaacp&partner=lpl',
  },
]

const tools = [
  {
    name: 'Retirement Advisor Pro',
    description: '25% off the annual package — a lifetime discount on the full IRMAA, Social Security, and Roth conversion planning suite.',
    code: 'irmaa-hegna',
    url: 'https://www.retirementadvisorpro.com',
    cta: 'Learn More',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    name: 'CALCULUS',
    description: '25% off your subscription — the Social Security breakeven calculator built for financial advisors. SSA Period Life Tables, correct spousal math, unlimited saved scenarios.',
    code: 'LPL25',
    url: 'https://academy.arpinstitute.com/offers/FCb2gsUD/checkout?coupon_code=LPL25',
    cta: 'Start Free Trial',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
        <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
      </svg>
    ),
  },
]

const speakers = [
  {
    name: 'Tom Hegna',
    title: 'Economist, Author & Retirement Expert',
    bio: 'Tom Hegna is an economist, author, and retirement expert featured on CNN, Forbes, The New York Times, Fox Business, Wall Street Journal, and PBS. A retired Lieutenant Colonel with over 30 years in financial services, he has delivered more than 5,000 seminars to financial professionals and is the author of "Don\'t Worry, Retire Happy!" and "Paychecks and Playchecks."',
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

export default function LplWebinarPage() {
  return (
    <>
      <Nav />
      <main>
        <style>{`
          #wb {
            --green:       #2a6b54;
            --green-dark:  #1a4a37;
            --green-light: #d9ede5;
            --ink:         #1a2433;
            --ink-mid:     #4a5568;
            --border:      #e2e8f0;
          }

          /* ── Hero ── */
          #wb .wb-hero { background: #000; padding: 64px 0 72px; }
          #wb .wb-hero-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; text-align: center; }
          #wb .wb-eyebrow {
            display: inline-block; font-size: 11px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
            color: rgba(255,255,255,0.5); margin-bottom: 16px;
          }
          #wb .wb-title {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
            color: #fff; line-height: 1.2; margin: 0 0 12px; letter-spacing: -0.01em;
          }
          #wb .wb-subtitle { font-size: 1rem; color: rgba(255,255,255,0.6); margin: 0 0 40px; }

          /* ── Shared section ── */
          #wb .wb-section-inner { max-width: 900px; margin: 0 auto; }
          #wb .wb-section-label {
            font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
            text-transform: uppercase; color: var(--green); margin: 0 0 20px;
          }

          /* ── Downloads ── */
          #wb .wb-downloads { background: #f8fafc; border-bottom: 1px solid var(--border); padding: 48px 24px; }
          #wb .wb-dl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
          #wb .wb-dl-btn {
            display: flex; align-items: center; gap: 14px;
            background: #fff; border: 1.5px solid var(--border); border-radius: 12px;
            padding: 18px 22px; text-decoration: none; color: var(--ink);
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          #wb .wb-dl-btn:hover { border-color: var(--green); box-shadow: 0 2px 12px rgba(42,107,84,0.12); }
          #wb .wb-dl-icon {
            width: 40px; height: 40px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          #wb .wb-dl-icon--pdf { background: #fef2f2; color: #dc2626; }
          #wb .wb-dl-icon--ppt { background: #fff7ed; color: #ea580c; }
          #wb .wb-dl-icon svg { width: 20px; height: 20px; }
          #wb .wb-dl-label { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
          #wb .wb-dl-meta  { font-size: 12px; color: var(--ink-mid); }

          /* ── Recording ── */
          #wb .wb-recording { padding: 64px 24px; background: #fff; border-bottom: 1px solid var(--border); }
          #wb .wb-yt-embed {
            position: relative; padding-bottom: 56.25%; height: 0;
            border-radius: 12px; overflow: hidden; background: #111;
            box-shadow: 0 4px 32px rgba(0,0,0,0.12);
          }
          #wb .wb-yt-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }

          /* ── Course Offers ── */
          #wb .wb-offers { background: var(--green-dark); padding: 64px 24px; }
          #wb .wb-offers .wb-section-label { color: rgba(255,255,255,0.55); }
          #wb .wb-offers-headline {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.3rem, 3vw, 1.85rem); font-weight: 800;
            color: #fff; margin: 0 0 8px; line-height: 1.25;
          }
          #wb .wb-offers-sub { font-size: 14px; color: rgba(255,255,255,0.65); margin: 0 0 32px; }
          #wb .wb-course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
          #wb .wb-course-card {
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px; padding: 24px; display: flex; flex-direction: column;
          }
          #wb .wb-course-card--featured {
            background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.28);
          }
          #wb .wb-course-badge {
            display: inline-block; font-size: 10px; font-weight: 700;
            letter-spacing: 0.08em; text-transform: uppercase;
            background: #10994c; color: #fff;
            padding: 3px 9px; border-radius: 99px; margin-bottom: 14px; align-self: flex-start;
          }
          #wb .wb-course-name { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 14px; line-height: 1.35; }
          #wb .wb-course-pricing { display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px; }
          #wb .wb-course-regular { font-size: 14px; color: rgba(255,255,255,0.4); text-decoration: line-through; }
          #wb .wb-course-sale { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
          #wb .wb-course-breakdown {
            font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px; line-height: 1.8;
          }
          #wb .wb-course-breakdown span { display: flex; justify-content: space-between; }
          #wb .wb-course-total {
            display: flex; justify-content: space-between; align-items: center;
            font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9);
            border-top: 1px solid rgba(255,255,255,0.15); padding-top: 8px; margin-bottom: 16px;
          }
          #wb .wb-course-cta {
            display: block; text-align: center; background: #10994c; color: #fff;
            font-size: 14px; font-weight: 700; padding: 12px 20px;
            border-radius: 8px; text-decoration: none; margin-top: auto;
            transition: background 0.15s;
          }
          #wb .wb-course-cta:hover { background: #0d7a3d; }
          #wb .wb-offers-note {
            text-align: center; font-size: 13px; color: rgba(255,255,255,0.55);
            border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 4px;
          }
          #wb .wb-offers-note strong { color: rgba(255,255,255,0.85); }

          /* ── Tools ── */
          #wb .wb-tools { background: #f8fafc; padding: 64px 24px; border-bottom: 1px solid var(--border); }
          #wb .wb-tool-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
          #wb .wb-tool-card {
            background: #fff; border: 1.5px solid var(--border); border-radius: 14px;
            padding: 28px; display: flex; flex-direction: column;
          }
          #wb .wb-tool-icon {
            width: 48px; height: 48px; background: var(--green-light); color: var(--green);
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
            margin-bottom: 16px;
          }
          #wb .wb-tool-name { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0 0 8px; }
          #wb .wb-tool-desc { font-size: 13.5px; color: var(--ink-mid); line-height: 1.6; margin: 0 0 16px; flex: 1; }
          #wb .wb-tool-code {
            display: flex; align-items: center; gap: 8px;
            background: #f0f9f4; border: 1px solid #a7d4bf; border-radius: 8px;
            padding: 10px 14px; margin-bottom: 16px;
          }
          #wb .wb-tool-code-label { font-size: 11px; font-weight: 600; color: var(--green); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
          #wb .wb-tool-code-val { font-size: 13px; font-weight: 700; color: var(--ink); font-family: monospace; letter-spacing: 0.04em; }
          #wb .wb-tool-cta {
            display: block; text-align: center; background: var(--green); color: #fff;
            font-size: 14px; font-weight: 700; padding: 12px 20px;
            border-radius: 8px; text-decoration: none; transition: background 0.15s;
          }
          #wb .wb-tool-cta:hover { background: var(--green-dark); }

          /* ── Speakers ── */
          #wb .wb-speakers { padding: 64px 24px; background: #fff; }
          #wb .wb-speaker-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 28px; }
          #wb .wb-speaker-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 28px; }
          #wb .wb-speaker-name { font-size: 1rem; font-weight: 700; color: var(--ink); margin: 0 0 4px; }
          #wb .wb-speaker-title { font-size: 12px; font-weight: 600; color: var(--green); margin: 0 0 14px; line-height: 1.4; }
          #wb .wb-speaker-bio { font-size: 13.5px; color: var(--ink-mid); line-height: 1.65; margin: 0; }

          @media (max-width: 640px) {
            #wb .wb-hero { padding: 40px 0 0; }
            #wb .wb-downloads, #wb .wb-recording, #wb .wb-offers,
            #wb .wb-tools, #wb .wb-speakers { padding: 40px 20px; }
          }
        `}</style>

        <div id="wb">

          {/* ── Hero ── */}
          <section className="wb-hero">
            <div className="wb-hero-inner">
              <span className="wb-eyebrow">ARPI Webinar · For LPL Financial Advisors</span>
              <h1 className="wb-title">IRMAA Avoidance and<br />Social Security Optimization</h1>
              <p className="wb-subtitle">With Tom Hegna, Todd Valles, and Jim Blair</p>
            </div>
          </section>

          {/* ── Recording ── */}
          <section className="wb-recording">
            <div className="wb-section-inner">
              <p className="wb-section-label">Webinar Recording</p>
              <div className="wb-yt-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${YOUTUBE_ID}`}
                  title="IRMAA Avoidance and Social Security Optimization"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

          {/* ── Speakers ── */}
          <section className="wb-speakers">
            <div className="wb-section-inner">
              <p className="wb-section-label">Featured Speakers</p>
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

          {/* ── Course Offers ── */}
          <section className="wb-offers">
            <div className="wb-section-inner">
              <p className="wb-section-label">Special Offer for LPL Advisors</p>
              <h2 className="wb-offers-headline">Enroll Now. Train on Your Schedule.</h2>
              <p className="wb-offers-sub">Exclusive pricing for LPL Financial advisors. Discount applied automatically at checkout.</p>
              <div className="wb-course-grid">
                {courses.map(c => (
                  <div key={c.name} className={`wb-course-card${c.featured ? ' wb-course-card--featured' : ''}`}>
                    <span className="wb-course-badge">{c.badge}</span>
                    <p className="wb-course-name">{c.name}</p>
                    <div className="wb-course-pricing">
                      <span className="wb-course-regular">{c.regularPrice}</span>
                      <span className="wb-course-sale">{c.salePrice}</span>
                    </div>
                    <div className="wb-course-breakdown">
                      <span><span>Course tuition</span><span>{c.salePrice}</span></span>
                      <span><span>Exam, cert &amp; membership</span><span>{c.examFee}</span></span>
                    </div>
                    <div className="wb-course-total">
                      <span>Total</span>
                      <span>{c.total}</span>
                    </div>
                    <a href={c.url} className="wb-course-cta" target="_blank" rel="noopener noreferrer">Enroll Now →</a>
                  </div>
                ))}
              </div>
              <p className="wb-offers-note">Each designation requires a separate exam, certification &amp; annual membership fee.</p>
            </div>
          </section>

          {/* ── Tools ── */}
          <section className="wb-tools">
            <div className="wb-section-inner">
              <p className="wb-section-label">Software Featured in This Webinar</p>
              <div className="wb-tool-grid">
                {tools.map(t => (
                  <div key={t.name} className="wb-tool-card">
                    <div className="wb-tool-icon">{t.icon}</div>
                    <h3 className="wb-tool-name">{t.name}</h3>
                    <p className="wb-tool-desc">{t.description}</p>
                    <div className="wb-tool-code">
                      <span className="wb-tool-code-label">Code</span>
                      <span className="wb-tool-code-val">{t.code}</span>
                    </div>
                    <a href={t.url} className="wb-tool-cta" target="_blank" rel="noopener noreferrer">{t.cta} →</a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Downloads ── */}
          <section className="wb-downloads">
            <div className="wb-section-inner">
              <p className="wb-section-label">Download the Presentation</p>
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
                    <div className="wb-dl-meta">Presentation slides · 2.9 MB</div>
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
                    <div className="wb-dl-meta">Editable .pptx · 8.9 MB</div>
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
