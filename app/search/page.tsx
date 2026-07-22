/**
 * /search?q= — Knowledge Base search results
 * Full-text search across published reference_pages.
 */
import { createPublicClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const NAVY    = '#0D3B5C';
const SOFT    = '#4A5560';
const RULE    = '#E4E0D7';
const PAPER   = '#FBFAF7';
const CITE    = '#8A5A00';
const CITE_BG = '#F6EEDD';
const IRMAA_RED = '#9B1C1C';

const css = `
*{box-sizing:border-box}
html,body{margin:0;background:${PAPER};color:#16202B}
body{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
header.masthead{border-bottom:1px solid ${RULE};padding:18px 0}
.masthead .inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kb-mark{font-weight:700;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:${NAVY};text-decoration:none}
.kb-mark span{color:${SOFT};font-weight:500}
.home-link{font-size:13px;color:${SOFT};text-decoration:none}
.home-link:hover{color:${NAVY}}
.search-bar{padding:24px 0 20px;border-bottom:1px solid ${RULE};margin-bottom:28px}
.search-form{display:flex;gap:0;border-radius:8px;border:1.5px solid ${RULE};overflow:hidden}
.search-form:focus-within{border-color:${NAVY}}
.search-input{flex:1;padding:13px 18px;font-size:16px;border:none;outline:none;background:#fff;font-family:inherit}
.search-btn{padding:0 20px;background:${NAVY};color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.search-btn:hover{background:#0A2E47}
.results-meta{font-size:14px;color:${SOFT};margin-bottom:20px}
.results-meta strong{color:#16202B}
.result-card{display:block;text-decoration:none;padding:18px 20px;background:#fff;border:1px solid ${RULE};border-radius:6px;margin-bottom:10px;transition:border-color .12s,box-shadow .12s}
.result-card:hover{border-color:${NAVY};box-shadow:0 2px 10px rgba(13,59,92,.08)}
.result-eyebrow{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px;color:${CITE}}
.result-eyebrow.irmaa{color:${IRMAA_RED}}
.result-title{font-size:18px;font-weight:600;color:${NAVY};margin:0 0 6px;line-height:1.25}
.result-desc{font-size:14px;color:${SOFT};margin:0;line-height:1.5}
.no-results{text-align:center;padding:60px 0;color:${SOFT}}
.no-results h2{font-size:22px;color:#16202B;margin:0 0 8px}
.no-results p{font-size:15px;margin:0 0 24px}
.no-results a{color:${NAVY};font-weight:600;text-decoration:none}
footer.foot{border-top:1px solid ${RULE};padding:24px 0 60px;font-size:13px;color:${SOFT};margin-top:32px}
footer.foot a{color:${NAVY};text-decoration:none}
`;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const supabase = createPublicClient();
  let results: any[] = [];

  if (query.length > 1) {
    // Search title, h1, meta_description, eyebrow using ILIKE
    const term = `%${query}%`;
    const { data } = await supabase
      .from('reference_pages')
      .select('id, slug, category, title, h1, eyebrow, meta_description')
      .eq('status', 'published')
      .or(`title.ilike.${term},h1.ilike.${term},meta_description.ilike.${term},eyebrow.ilike.${term},quick_answer.ilike.${term}`)
      .order('title')
      .limit(20);
    results = data ?? [];
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{query ? `"${query}" — NSSA Knowledge Base` : 'Search — NSSA Knowledge Base'}</title>
        <meta name="robots" content="noindex" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <header className="masthead">
          <div className="wrap inner">
            <a className="kb-mark" href="/">NSSA <span>Knowledge Base</span></a>
            <a className="home-link" href="https://www.nssapros.com">nssapros.com &rsaquo;</a>
          </div>
        </header>

        <div className="wrap">
          <div className="search-bar">
            <form className="search-form" action="/search" method="GET" role="search">
              <input
                className="search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search the knowledge base…"
                autoComplete="off"
                autoFocus
                aria-label="Search"
              />
              <button className="search-btn" type="submit">Search</button>
            </form>
          </div>

          {query.length > 1 && (
            <p className="results-meta">
              {results.length === 0
                ? <>No results for <strong>&ldquo;{query}&rdquo;</strong></>
                : <>{results.length} result{results.length !== 1 ? 's' : ''} for <strong>&ldquo;{query}&rdquo;</strong></>}
            </p>
          )}

          {results.length > 0 && results.map(page => (
            <a
              key={page.id}
              href={`/${page.category}/${page.slug}`}
              className="result-card"
            >
              {page.eyebrow && (
                <p className={`result-eyebrow${page.category === 'irmaa' ? ' irmaa' : ''}`}>
                  {page.eyebrow}
                </p>
              )}
              <p className="result-title">{page.h1 || page.title}</p>
              {page.meta_description && (
                <p className="result-desc">{page.meta_description}</p>
              )}
            </a>
          ))}

          {query.length > 1 && results.length === 0 && (
            <div className="no-results">
              <h2>No results found</h2>
              <p>Try a different search term, or browse by category.</p>
              <a href="/social-security">Social Security rules &rsaquo;</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="/irmaa">IRMAA &amp; Medicare rules &rsaquo;</a>
            </div>
          )}

          {!query && (
            <div className="no-results">
              <h2>What are you looking for?</h2>
              <p>Try searching for a topic — spousal benefits, earnings test, IRMAA appeal, WEP, and more.</p>
              <a href="/social-security">Browse Social Security &rsaquo;</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="/irmaa">Browse IRMAA &amp; Medicare &rsaquo;</a>
            </div>
          )}
        </div>

        <footer className="foot">
          <div className="wrap">
            <a href="https://www.nssapros.com">National Social Security Advisors (NSSA&reg;)</a>
            &nbsp;&mdash; these pages explain the rules; they are not individualized advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
