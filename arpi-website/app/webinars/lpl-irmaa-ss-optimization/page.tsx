import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const SUPABASE   = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources'
const PDF_URL    = `${SUPABASE}/webinars/irmaa-avoidance-ss-optimization.pdf`
const PPTX_URL   = `${SUPABASE}/webinars/irmaa-avoidance-ss-optimization.pptx`
const YOUTUBE_ID = 'QgdpgDC8XVU'
const ENROLL_URL = 'https://arpinstitute.com/enroll?partner=lpl'

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

          /* ── Enroll CTA ── */
          #wb .wb-enroll { background: var(--green-dark); padding: 64px 24px; }
          #wb .wb-enroll .wb-section-label { color: rgba(255,255,255,0.55); }
          #wb .wb-enroll-headline {
            font-family: var(--font-merriweather), Georgia, serif;
            font-size: clamp(1.3rem, 3vw, 1.85rem); font-weight: 800;
            color: #fff; margin: 0 0 12px; line-height: 1.25;
          }
          #wb .wb-enroll-sub { font-size: 15px; color: rgba(255,255,255,0.7); margin: 0 0 32px; line-height: 1.6; max-width: 560px; }
          #wb .wb-enroll-btn {
            display: inline-block; background: #10994c; color: #fff;
            font-size: 16px; font-weight: 700; padding: 16px 36px;
            border-radius: 10px; text-decoration: none;
            transition: background 0.15s;
          }
          #wb .wb-enroll-btn:hover { background: #0d7a3d; }
          #wb .wb-enroll-note {
            margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.45);
          }

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
            #wb .wb-downloads, #wb .wb-recording, #wb .wb-enroll,
            #wb .wb-tools, #wb .wb-speakers { padding: 40px 20px; }
          }
        `}</style>

        <div id="wb">

          {/* ── Hero ── */}
          <section className="wb-hero">
            <div className="wb-hero-inner">
              <span className="wb-eyebrow">For LPL Financial Advisors · ARPI Webinar</span>
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

          {/* ── Enroll CTA ── */}
          <section className="wb-enroll">
            <div className="wb-section-inner">
              <p className="wb-section-label">Exclusive LPL Advisor Benefit</p>
              <h2 className="wb-enroll-headline">Enroll Now. Train on Your Schedule.</h2>
              <p className="wb-enroll-sub">
                As an LPL Financial advisor, you have access to preferred pricing on ARPI credentials
                — the NSSA®, IRMAACP®, and bundle. Discount applied automatically at checkout.
              </p>
              <a href={ENROLL_URL} className="wb-enroll-btn">Enroll as an LPL Advisor →</a>
              <p className="wb-enroll-note">Use code <strong style={{ color: 'rgba(255,255,255,0.75)' }}>LPL25</strong> at checkout for your member discount.</p>
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
