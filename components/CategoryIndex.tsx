/**
 * CategoryIndex — shared category landing page for /social-security and /irmaa.
 *
 * Lists published reference pages grouped by eyebrow topic.
 * Supports ?topic= to filter/highlight a single eyebrow group.
 */
import type { ReferencePage, Category } from '@/lib/types';

interface Props {
  category: Category;
  categoryLabel: string;
  categoryPath: string;
  pages: Partial<ReferencePage>[];
  activeTopic?: string;
  description: string;
}

const NAVY  = '#0D3B5C';
const CITE  = '#8A5A00';
const SOFT  = '#4A5560';
const RULE  = '#E4E0D7';
const PAPER = '#FBFAF7';
const CITE_BG = '#F6EEDD';

const css = `
*{box-sizing:border-box}
body{margin:0;background:${PAPER};color:#16202B;font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
header.masthead{border-bottom:1px solid ${RULE};padding:18px 0;margin-bottom:0}
.masthead .inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kb-mark{font-weight:700;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:${NAVY};text-decoration:none}
.kb-mark span{color:${SOFT};font-weight:500}
.home-link{font-size:13px;color:${SOFT};text-decoration:none}
.home-link:hover{color:${NAVY}}
nav.crumbs{font-size:12.5px;color:${SOFT};letter-spacing:.02em;padding:20px 0 0}
nav.crumbs a{color:${SOFT};text-decoration:none}
nav.crumbs a:hover{color:${NAVY};text-decoration:underline}
.sep{margin:0 8px;color:${RULE}}
.hero{padding:32px 0 28px}
.hero h1{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:34px;line-height:1.15;margin:0 0 10px;color:${NAVY};font-weight:600;letter-spacing:-0.01em}
.hero p{color:${SOFT};font-size:15px;margin:0;max-width:600px;line-height:1.6}
.topic-pills{display:flex;flex-wrap:wrap;gap:8px;padding:0 0 28px;border-bottom:1px solid ${RULE};margin-bottom:32px}
.pill{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid ${RULE};color:${SOFT};text-decoration:none;background:#fff;cursor:pointer;transition:all .15s}
.pill:hover,.pill.active{background:${NAVY};color:#fff;border-color:${NAVY}}
.group{margin-bottom:40px}
.group-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${CITE};background:${CITE_BG};border:1px solid #E8D9B8;display:inline-block;padding:3px 10px;border-radius:3px;margin-bottom:14px}
.page-card{display:block;padding:16px 18px;border:1px solid ${RULE};border-radius:4px;margin-bottom:10px;text-decoration:none;background:#fff;transition:border-color .15s,box-shadow .15s}
.page-card:hover{border-color:${NAVY};box-shadow:0 2px 8px rgba(13,59,92,.08)}
.card-title{font-size:16px;font-weight:600;color:${NAVY};margin:0 0 4px}
.card-desc{font-size:14px;color:${SOFT};margin:0;line-height:1.5}
.empty{color:${SOFT};font-size:15px;padding:40px 0;text-align:center}
footer.foot{border-top:1px solid ${RULE};margin-top:48px;padding:24px 0 60px;font-size:13px;color:${SOFT}}
footer.foot a{color:${NAVY};text-decoration:none}
@media(max-width:600px){.hero h1{font-size:26px}.topic-pills{gap:6px}}
`;

export function CategoryIndex({ category, categoryLabel, categoryPath, pages, activeTopic, description }: Props) {
  // Group by eyebrow; pages with no eyebrow go into 'General'
  const groups = new Map<string, Partial<ReferencePage>[]>();
  for (const page of pages) {
    const key = page.eyebrow ?? 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(page);
  }
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const allTopics = sortedGroups.map(([label]) => label);

  // If activeTopic set, only show that group
  const visibleGroups = activeTopic
    ? sortedGroups.filter(([label]) => label.toLowerCase() === activeTopic.toLowerCase())
    : sortedGroups;

  const topicHref = (topic: string) =>
    topic === activeTopic ? categoryPath : `${categoryPath}?topic=${encodeURIComponent(topic)}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <header className="masthead">
          <div className="wrap inner">
            <a className="kb-mark" href="https://knowledge.nssapros.com">
              NSSA <span>Knowledge Base</span>
            </a>
            <a className="home-link" href="https://www.nssapros.com">nssapros.com &rsaquo;</a>
          </div>
        </header>

        <div className="wrap">
          <nav className="crumbs">
            <a href="https://knowledge.nssapros.com">Knowledge Base</a>
            <span className="sep">/</span>
            {categoryLabel}
          </nav>

          <div className="hero">
            <h1>{categoryLabel}</h1>
            <p>{description}</p>
          </div>

          {/* Topic filter pills */}
          {allTopics.length > 1 && (
            <div className="topic-pills">
              {allTopics.map(topic => (
                <a
                  key={topic}
                  href={topicHref(topic)}
                  className={`pill${activeTopic?.toLowerCase() === topic.toLowerCase() ? ' active' : ''}`}
                >
                  {topic}
                </a>
              ))}
            </div>
          )}

          {/* Page groups */}
          {visibleGroups.length === 0 ? (
            <p className="empty">No pages found{activeTopic ? ` for "${activeTopic}"` : ''}.</p>
          ) : (
            visibleGroups.map(([label, groupPages]) => (
              <div key={label} className="group">
                <div className="group-label">{label}</div>
                {groupPages.map(page => (
                  <a
                    key={page.slug}
                    href={`${categoryPath}/${page.slug}`}
                    className="page-card"
                  >
                    <p className="card-title">{page.h1 || page.title}</p>
                    {page.meta_description && (
                      <p className="card-desc">{page.meta_description}</p>
                    )}
                  </a>
                ))}
              </div>
            ))
          )}
        </div>

        <footer className="foot">
          <div className="wrap">
            A reference resource from{' '}
            <a href="https://www.nssapros.com">National Social Security Advisors (NSSA&reg;)</a>
            , the nation&apos;s first Social Security certification program for financial professionals, founded 2013.
          </div>
        </footer>
      </body>
    </html>
  );
}
