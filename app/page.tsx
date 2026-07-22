/**
 * NSSA Knowledge Base homepage — knowledge.nssapros.com/
 *
 * Full-page search + category entry points.
 * Static shell; search form submits to /search?q=
 */
import { createPublicClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'NSSA Knowledge Base — Social Security & IRMAA Reference',
  description:
    'Authoritative Social Security and IRMAA rules for financial advisors and retirees — verified against SSA POMS. Search claiming rules, spousal benefits, WEP, GPO, IRMAA, and more.',
};

const NAVY  = '#0D3B5C';
const SOFT  = '#4A5560';
const RULE  = '#E4E0D7';
const PAPER = '#FBFAF7';
const CITE  = '#8A5A00';
const CITE_BG = '#F6EEDD';
const IRMAA_RED = '#9B1C1C';

const css = `
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:${PAPER};color:#16202B}
body{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:800px;margin:0 auto;padding:0 24px}
header.masthead{border-bottom:1px solid ${RULE};padding:18px 0}
.masthead .inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kb-mark{font-weight:700;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:${NAVY};text-decoration:none}
.kb-mark span{color:${SOFT};font-weight:500}
.home-link{font-size:13px;color:${SOFT};text-decoration:none}
.home-link:hover{color:${NAVY}}

/* Hero */
.hero{padding:56px 0 48px;text-align:center}
.hero h1{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:38px;line-height:1.15;margin:0 0 14px;color:${NAVY};font-weight:600;letter-spacing:-0.01em}
.hero p{font-size:17px;color:${SOFT};margin:0 auto 36px;max-width:560px;line-height:1.6}

/* Search */
.search-form{display:flex;gap:0;max-width:560px;margin:0 auto;border-radius:8px;box-shadow:0 2px 12px rgba(13,59,92,.12);overflow:hidden;border:1.5px solid ${RULE}}
.search-form:focus-within{border-color:${NAVY};box-shadow:0 2px 16px rgba(13,59,92,.18)}
.search-input{flex:1;padding:16px 20px;font-size:17px;border:none;outline:none;background:#fff;font-family:inherit;color:#16202B}
.search-input::placeholder{color:#9CA3AF}
.search-btn{padding:0 24px;background:${NAVY};color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;letter-spacing:.02em}
.search-btn:hover{background:#0A2E47}

/* Category cards */
.cats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:48px 0}
.cat-card{display:block;text-decoration:none;border-radius:8px;padding:24px;border:1px solid ${RULE};background:#fff;transition:border-color .15s,box-shadow .15s}
.cat-card:hover{border-color:${NAVY};box-shadow:0 4px 16px rgba(13,59,92,.1)}
.cat-card.irmaa:hover{border-color:${IRMAA_RED}}
.cat-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px}
.cat-ss .cat-eyebrow{color:${CITE}}
.cat-irmaa .cat-eyebrow{color:${IRMAA_RED}}
.cat-card h2{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:22px;font-weight:600;margin:0 0 8px;line-height:1.25}
.cat-ss h2{color:${NAVY}}
.cat-irmaa h2{color:${IRMAA_RED}}
.cat-card p{font-size:14px;color:${SOFT};margin:0 0 14px;line-height:1.5}
.cat-link{font-size:13px;font-weight:600;text-decoration:none}
.cat-ss .cat-link{color:${NAVY}}
.cat-irmaa .cat-link{color:${IRMAA_RED}}

/* Recent pages */
.section-head{display:flex;align-items:center;gap:12px;margin:0 0 16px}
.section-head-line{flex:1;height:1px;background:${RULE}}
.section-head-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${SOFT};white-space:nowrap}
.page-list{display:flex;flex-direction:column;gap:10px;margin-bottom:48px}
.page-row{display:flex;align-items:baseline;gap:12px;padding:12px 16px;background:#fff;border:1px solid ${RULE};border-radius:6px;text-decoration:none;transition:border-color .12s}
.page-row:hover{border-color:${NAVY}}
.page-row-title{font-size:15px;font-weight:600;color:${NAVY};flex:1}
.page-row-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${CITE};background:${CITE_BG};padding:2px 8px;border-radius:3px;white-space:nowrap}
.page-row-eyebrow.irmaa{color:#fff;background:${IRMAA_RED}}

footer.foot{border-top:1px solid ${RULE};padding:24px 0 60px;font-size:13px;color:${SOFT};margin-top:8px}
footer.foot a{color:${NAVY};text-decoration:none}
@media(max-width:600px){
  .hero h1{font-size:28px}
  .cats{grid-template-columns:1fr}
  .search-btn{padding:0 16px;font-size:14px}
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NSSA Knowledge Base — Social Security &amp; IRMAA Reference</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href="https://knowledge.nssapros.com" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <header className="masthead">
          <div className="wrap inner">
            <a className="kb-mark" href="https://knowledge.nssapros.com">
              NSSA <span>Knowledge Base</span>
            </a>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <a className="home-link" href="/ask" style={{ fontWeight: 600 }}>Ask a question &rsaquo;</a>
              <a className="home-link" href="https://www.nssapros.com">nssapros.com &rsaquo;</a>
            </div>
          </div>
        </header>

        <div className="wrap">
          <section className="hero">
            <h1>Social Security &amp; IRMAA Rules, Explained</h1>
            <p>
              Authoritative reference pages for retirees and financial professionals &mdash;
              every claim verified against the SSA Program Operations Manual System (POMS).
            </p>
            <form className="search-form" action="/search" method="GET" role="search">
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
            <a className="cat-card cat-ss" href="/social-security">
              <p className="cat-eyebrow">Reference</p>
              <h2>Social Security</h2>
              <p>Claiming rules, spousal and survivor benefits, WEP, GPO, earnings test, and benefit calculation — verified against SSA POMS.</p>
              <span className="cat-link">Browse Social Security rules &rsaquo;</span>
            </a>
            <a className="cat-card cat-irmaa irmaa" href="/irmaa">
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
                    href={`/${page.category}/${page.slug}`}
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
            A reference resource from{' '}
            <a href="https://www.nssapros.com">National Social Security Advisors (NSSA&reg;)</a>
            , the nation&apos;s first Social Security certification program for financial professionals, founded 2013.
            &nbsp;These pages explain the rules; they are not individualized advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
