/**
 * ARPI Knowledge Base homepage — arpinstitute.com/codex/
 */
import { createPublicClient } from '@/lib/codex-supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Social Security & Medicare Rules Reference — POMS, IRMAA & CFR Lookup',
  description:
    'Authoritative Social Security and Medicare rules for financial advisors — verified against SSA POMS, CFR, CMS, and Medicare.gov. Search claiming rules, spousal benefits, WEP, GPO, IRMAA surcharges, and more.',
  keywords: [
    'social security POMS lookup',
    'IRMAA rules reference',
    'Medicare rules for financial advisors',
    'social security claiming rules',
    'spousal benefits rules',
    'WEP GPO rules',
    'social security regulation reference',
    'IRMAA surcharge rules',
    'Medicare CFR lookup',
    'social security knowledge base',
  ],
  alternates: { canonical: 'https://arpinstitute.com/codex' },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'Social Security & Medicare Rules Reference — POMS, IRMAA & CFR Lookup',
    description: 'Authoritative Social Security and Medicare rules verified against SSA POMS, CFR, CMS, and Medicare.gov. Search claiming rules, spousal benefits, WEP, GPO, IRMAA, and more.',
    url: 'https://arpinstitute.com/codex',
    images: [{ url: 'https://arpinstitute.com/assets/arpi-logo-new.png', width: 1200, height: 630, alt: 'ARPI Knowledge Base — Social Security & Medicare Reference' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Security & Medicare Rules Reference — POMS, IRMAA & CFR Lookup',
    description: 'Authoritative Social Security and Medicare rules for financial advisors. Verified against SSA POMS, CFR, CMS, and Medicare.gov.',
    images: ['https://arpinstitute.com/assets/arpi-logo-new.png'],
  },
  robots: { index: true, follow: true },
};

const NAVY      = 'var(--green-dark)';
const SS_BLUE   = 'var(--blue-400)';
const SS_DARK   = '#13405E';
const SOFT      = '#4A5560';
const RULE      = '#e5e7eb';
const PAPER     = '#ffffff';
const CITE      = '#4b5563';
const CITE_BG   = '#f3f4f6';
const IRMAA_RED = 'var(--red-dark)';

const css = `
*{box-sizing:border-box}
body{margin:0;background:${PAPER};color:#16202B;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:800px;margin:0 auto;padding:0 24px}

/* Hero — explicit white bg overrides any globals.css .hero rule */
.codex-hero{padding:56px 0 48px;text-align:center;background:#fff}
.codex-hero h1{font-family:var(--font-merriweather),Georgia,serif;font-size:38px;line-height:1.15;margin:0 0 14px;color:${NAVY};font-weight:700;letter-spacing:-0.01em}
.codex-hero p{font-size:17px;color:${SOFT};margin:0 auto 36px;max-width:580px;line-height:1.6}

/* Source badges */
.source-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:-16px 0 36px}
.source-badge{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 12px;border-radius:99px;border:1px solid ${RULE};background:#fff;color:${SOFT}}

/* Search */
.search-form{display:flex;gap:0;max-width:560px;margin:0 auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;border:1.5px solid ${RULE}}
.search-form:focus-within{border-color:var(--green-mid);box-shadow:0 2px 16px rgba(19,154,77,.15)}
.search-input{flex:1;padding:16px 20px;font-size:17px;border:none;outline:none;background:#fff;font-family:inherit;color:#16202B}
.search-input::placeholder{color:#9CA3AF}
.search-btn{padding:0 24px;background:var(--green-mid);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;letter-spacing:.02em}
.search-btn:hover{background:var(--green-dark)}

/* Category cards */
.cats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:48px 0}
.cat-card{display:block;text-decoration:none;border-radius:8px;padding:24px;border:1px solid ${RULE};background:#fff;transition:border-color .15s,box-shadow .15s}
.cat-card.cat-ss:hover{border-color:${SS_BLUE};box-shadow:0 4px 16px rgba(28,128,188,.1)}
.cat-card:hover{border-color:${NAVY};box-shadow:0 4px 16px rgba(39,111,70,.1)}
.cat-card.irmaa:hover{border-color:${IRMAA_RED}}
.cat-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px}
.cat-ss .cat-eyebrow{color:${CITE}}
.cat-irmaa .cat-eyebrow{color:${IRMAA_RED}}
.cat-card h2{font-family:var(--font-merriweather),Georgia,serif;font-size:22px;font-weight:700;margin:0 0 8px;line-height:1.25}
.cat-ss h2{color:${SS_DARK}}
.cat-irmaa h2{color:${IRMAA_RED}}
.cat-card p{font-size:14px;color:${SOFT};margin:0 0 14px;line-height:1.5}
.cat-link{font-size:13px;font-weight:600;text-decoration:none}
.cat-ss .cat-link{color:${SS_BLUE}}
.cat-irmaa .cat-link{color:${IRMAA_RED}}

/* Recent pages */
.section-head{display:flex;align-items:center;gap:12px;margin:0 0 16px}
.section-head-line{flex:1;height:1px;background:${RULE}}
.section-head-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${SOFT};white-space:nowrap}
.page-list{display:flex;flex-direction:column;gap:10px;margin-bottom:48px}
.page-row{display:flex;align-items:baseline;gap:12px;padding:12px 16px;background:#fff;border:1px solid ${RULE};border-radius:6px;text-decoration:none;transition:border-color .12s}
.page-row:hover{border-color:${SS_BLUE}}
.page-row-title{font-size:15px;font-weight:600;color:${SS_DARK};flex:1}
.page-row-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${CITE};background:${CITE_BG};padding:2px 8px;border-radius:3px;white-space:nowrap}
.page-row-eyebrow.irmaa{color:#fff;background:${IRMAA_RED}}

footer.foot{border-top:1px solid ${RULE};padding:24px 0 60px;font-size:13px;color:${SOFT};margin-top:8px}
footer.foot a{color:${NAVY};text-decoration:none}

@media(max-width:600px){
  .codex-hero h1{font-size:28px}
  .cats{grid-template-columns:1fr}
  .search-btn{padding:0 16px;font-size:14px}
  .source-badges{gap:6px}
}
`;

export default async function HomePage() {
  const supabase = createPublicClient();

  const { data: recent } = await supabase
    .from('reference_pages')
    .select('id, slug, category, title, h1, eyebrow')
    .eq('status', 'published')
    .order('date_published', { ascending: false })
    .limit(8);

  const pages = recent ?? [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      

      <div className="wrap">
        <section className="codex-hero">
          <h1>Social Security &amp; IRMAA Rules,<br />Verified and Explained by ARPI</h1>
          <p>
            Authoritative reference pages for retirees and financial professionals —
            every claim verified against SSA POMS, CFR Title 20, the SSA Handbook,
            CMS regulations, and Medicare.gov guidance.
          </p>

          {/* Source badges */}
          <div className="source-badges">
            {['SSA POMS', 'CFR Title 20', 'SSA Handbook', 'CMS', 'Medicare.gov'].map(s => (
              <span key={s} className="source-badge">{s}</span>
            ))}
          </div>

          <form className="search-form" action="/codex/search" method="GET" role="search">
            <input
              className="search-input"
              type="search"
              name="q"
              placeholder="Search — e.g. spousal benefits, IRMAA appeal, earnings test…"
              autoComplete="off"
              aria-label="Search the knowledge base"
            />
            <button className="search-btn" type="submit">Search</button>
          </form>
        </section>

        {/* Category cards */}
        <div className="cats">
          <a className="cat-card cat-ss" href="/codex/social-security">
            <p className="cat-eyebrow">Reference</p>
            <h2>Social Security</h2>
            <p>Claiming rules, spousal and survivor benefits, WEP, GPO, earnings test, and benefit calculation — verified against SSA POMS and CFR.</p>
            <span className="cat-link">Browse Social Security rules &rsaquo;</span>
          </a>
          <a className="cat-card cat-irmaa irmaa" href="/codex/irmaa">
            <p className="cat-eyebrow">Reference</p>
            <h2>IRMAA &amp; Medicare</h2>
            <p>Income-related Medicare surcharges, the two-year look-back rule, life-changing event appeals, and Part B and D enrollment.</p>
            <span className="cat-link">Browse IRMAA &amp; Medicare rules &rsaquo;</span>
          </a>
        </div>

        {/* Recently published */}
        {pages.length > 0 && (
          <>
            <div className="section-head">
              <div className="section-head-line" />
              <span className="section-head-label">Recently published</span>
              <div className="section-head-line" />
            </div>
            <div className="page-list">
              {pages.map(page => (
                <a
                  key={page.id}
                  href={`/codex/${page.category}/${page.slug}`}
                  className="page-row"
                >
                  <span className="page-row-title">{page.h1 || page.title}</span>
                  {page.eyebrow && (
                    <span className={`page-row-eyebrow${page.category === 'irmaa' ? ' irmaa' : ''}`}>
                      {page.eyebrow}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="foot">
        <div className="wrap">
          The Advanced Retirement Planning Institute (ARPI) Knowledge Base provides authoritative educational
          reference material based on SSA POMS, CFR Title 20, the SSA Handbook, CMS regulations, and
          Medicare.gov guidance. Not individualized legal, financial, or benefits advice &mdash;
          verify current rules with the Social Security Administration or Medicare.gov before making filing decisions.
        </div>
      </footer>
    </>
  );
}
