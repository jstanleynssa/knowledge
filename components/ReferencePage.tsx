/**
 * ReferencePage — the canonical KB page template
 *
 * Design source: deemed-filing.html (SEO-audited reference page)
 * Renders any reference_pages row as a statically-generated page.
 * No client JS. CSS matches deemed-filing.html exactly.
 */

import type { ReferencePage, BodySection, FaqItem, PrimarySource } from '@/lib/types';

// ─── CSS (matches deemed-filing.html exactly) ────────────────────────────────

const css = `
:root{
  --paper:#FBFAF7;
  --ink:#16202B;
  --ink-soft:#4A5560;
  --rule:#E4E0D7;
  --navy:#0D3B5C;
  --cite:#8A5A00;
  --cite-bg:#F6EEDD;
  --verified:#1F6B3B;
  --maxw:720px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;background:var(--paper);color:var(--ink);
  font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  line-height:1.62;font-size:19px;
}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px}
.ui{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header.masthead{border-bottom:1px solid var(--rule);padding:18px 0;margin-bottom:8px}
.masthead .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px}
.kb-mark{font-family:ui-sans-serif,system-ui;font-weight:700;font-size:14px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--navy);text-decoration:none}
.kb-mark span{color:var(--ink-soft);font-weight:500}
.masthead a.home{font-family:ui-sans-serif,system-ui;font-size:13px;color:var(--ink-soft);text-decoration:none}
.masthead a.home:hover{color:var(--navy)}
nav.crumbs{font-family:ui-sans-serif,system-ui;font-size:12.5px;color:var(--ink-soft);
  letter-spacing:.02em;padding:20px 0 0}
nav.crumbs a{color:var(--ink-soft);text-decoration:none}
nav.crumbs a:hover{color:var(--navy);text-decoration:underline}
nav.crumbs .sep{margin:0 8px;color:var(--rule)}
.eyebrow{font-family:ui-sans-serif,system-ui;font-size:12.5px;font-weight:600;letter-spacing:.12em;
  text-transform:uppercase;color:var(--cite);margin:28px 0 10px}
h1{font-size:40px;line-height:1.1;margin:0 0 8px;color:var(--navy);font-weight:600;letter-spacing:-0.01em}
.verified{font-family:ui-sans-serif,system-ui;font-size:13px;color:var(--verified);
  display:inline-flex;align-items:center;gap:6px;margin:6px 0 0;font-weight:500}
.verified::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--verified)}
.answer{
  margin:30px 0 8px;padding:22px 24px;background:#fff;border:1px solid var(--rule);
  border-left:3px solid var(--navy);border-radius:2px;
}
.answer .lbl{font-family:ui-sans-serif,system-ui;font-size:11.5px;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:var(--ink-soft);margin:0 0 8px}
.answer p{margin:0;font-size:20px;line-height:1.5}
h2{font-size:25px;color:var(--navy);font-weight:600;margin:44px 0 4px;letter-spacing:-0.01em}
h2+.lead{margin-top:8px}
.lead{font-weight:600;color:var(--ink)}
p{margin:16px 0}
p a{color:var(--navy)}
ul.clean{margin:16px 0;padding:0;list-style:none}
ul.clean li{position:relative;padding:0 0 0 26px;margin:12px 0}
ul.clean li::before{content:"";position:absolute;left:2px;top:12px;width:8px;height:2px;background:var(--cite)}
.cite{
  font-family:ui-sans-serif,system-ui;font-size:14px;line-height:1.5;
  background:var(--cite-bg);border:1px solid #E8D9B8;border-radius:3px;
  padding:12px 14px;margin:14px 0;color:#5C4200;
  display:flex;gap:10px;align-items:flex-start;
}
.cite .tag{flex:none;font-weight:700;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:#fff;background:var(--cite);padding:3px 7px;border-radius:2px;margin-top:1px}
.cite code{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:13px;
  background:#fff;padding:1px 5px;border-radius:2px;border:1px solid #E8D9B8;white-space:nowrap}
.cite a{color:#5C4200;font-weight:600}
.example{background:#F3F1EB;border-radius:2px;padding:20px 22px;margin:24px 0}
.example .lbl{font-family:ui-sans-serif,system-ui;font-size:11.5px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink-soft);margin:0 0 8px}
.example p{margin:8px 0}
.cta{background:var(--navy);color:#fff;border-radius:4px;padding:28px 28px 30px;margin:44px 0 8px}
.cta-lbl{font-family:ui-sans-serif,system-ui;font-size:11.5px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:#8FB8D4;margin:0 0 12px}
.cta-head{font-size:21px;line-height:1.35;margin:0 0 8px;color:#fff;font-weight:600}
.cta-sub{font-family:ui-sans-serif,system-ui;font-size:15px;line-height:1.5;color:#C9D8E4;margin:0 0 20px}
.cta-btn{display:inline-block;font-family:ui-sans-serif,system-ui;font-size:15px;font-weight:600;
  background:#fff;color:var(--navy);text-decoration:none;padding:13px 22px;border-radius:3px;
  transition:transform .15s ease,box-shadow .15s ease}
.cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.18)}
.cta-btn:focus-visible{outline:3px solid #8FB8D4;outline-offset:2px}
.review{font-family:ui-sans-serif,system-ui;font-size:13.5px;color:var(--ink-soft);
  border-top:1px solid var(--rule);margin-top:48px;padding:20px 0 8px;line-height:1.6}
.review strong{color:var(--ink)}
footer.foot{border-top:1px solid var(--rule);margin-top:16px;padding:26px 0 60px;
  font-family:ui-sans-serif,system-ui;font-size:13px;color:var(--ink-soft)}
footer.foot a{color:var(--navy);text-decoration:none}
@media(max-width:600px){
  body{font-size:18px}
  h1{font-size:31px}
  .answer p{font-size:18px}
  .cta{padding:22px 20px 24px}
  .cta-head{font-size:19px}
  .cta-btn{display:block;text-align:center}
}
@media(prefers-reduced-motion:no-preference){
  .answer{animation:rise .5s ease both}
  @keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CitationBlock({ source }: { source: PrimarySource }) {
  return (
    <div className="cite">
      <span className="tag">Source</span>
      <span>
        <code>{source.section_number}</code>{' '}
        <a href={source.url} target="_blank" rel="noopener">
          View source &rsaquo;
        </a>
      </span>
    </div>
  );
}

function BodySectionBlock({ section, sourceIndex }: { section: BodySection; sourceIndex: Map<string, PrimarySource> }) {
  const cite = section.citation_ref ? sourceIndex.get(section.citation_ref) : null;
  return (
    <>
      <h2>{section.heading}</h2>
      <p
        className="lead"
        dangerouslySetInnerHTML={{ __html: section.prose }}
      />
      {cite && <CitationBlock source={cite} />}
    </>
  );
}

function FaqBlock({ items }: { items: FaqItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i}>
          <p className="lead">{item.q}</p>
          <p>{item.a}</p>
        </div>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReferencePageProps {
  page: ReferencePage;
}

export function ReferencePageComponent({ page }: ReferencePageProps) {
  const categoryLabel = page.category === 'social-security' ? 'Social Security' : 'IRMAA';
  const categoryPath = `/${page.category}`;

  // Build a lookup map from section_number → PrimarySource for inline citation
  const sourceIndex = new Map<string, PrimarySource>(
    page.primary_sources.map((s) => [s.section_number, s])
  );

  const verifiedDate = page.source_last_verified
    ? new Date(page.source_last_verified).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const ctaUrl = `https://directory.nssapros.com/?utm_source=knowledge&utm_medium=referral&utm_campaign=kb_cta&utm_content=${page.slug}`;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Article', 'TechArticle'],
        headline: page.title,
        description: page.meta_description,
        datePublished: page.date_published,
        dateModified: page.date_modified ?? page.date_published,
        author: {
          '@type': 'Organization',
          name: 'National Social Security Advisors (NSSA)',
          url: 'https://www.nssapros.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'National Social Security Advisors (NSSA)',
          url: 'https://www.nssapros.com',
          foundingDate: '2013',
          sameAs: [
            'https://www.linkedin.com/company/nssapros/',
            'https://x.com/nssapros',
            'https://www.youtube.com/@nssapros',
            'https://www.credly.com/org/nssa',
            'https://knowledge.nssapros.com',
          ],
        },
        isPartOf: {
          '@type': 'WebSite',
          name: 'NSSA Knowledge Base',
          url: 'https://knowledge.nssapros.com',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Knowledge Base', item: 'https://knowledge.nssapros.com' },
          { '@type': 'ListItem', position: 2, name: categoryLabel, item: `https://knowledge.nssapros.com${categoryPath}` },
          { '@type': 'ListItem', position: 3, name: page.title, item: `https://knowledge.nssapros.com${categoryPath}/${page.slug}` },
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{page.seo_title}</title>
        <meta name="description" content={page.meta_description} />
        <link rel="canonical" href={`https://knowledge.nssapros.com${categoryPath}/${page.slug}`} />

        {/* OpenGraph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.meta_description} />
        <meta property="og:url" content={`https://knowledge.nssapros.com${categoryPath}/${page.slug}`} />
        <meta property="og:site_name" content="NSSA Knowledge Base" />
        {page.og_image_url && <meta property="og:image" content={page.og_image_url} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.seo_title} />
        <meta name="twitter:description" content={page.meta_description} />
        {page.og_image_url && <meta name="twitter:image" content={page.og_image_url} />}

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
        />

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <header className="masthead">
          <div className="wrap">
            <a className="kb-mark" href="https://knowledge.nssapros.com">
              NSSA <span>Knowledge Base</span>
            </a>
            <a className="home" href="https://www.nssapros.com">
              nssapros.com &rsaquo;
            </a>
          </div>
        </header>

        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="https://knowledge.nssapros.com">Knowledge Base</a>
            <span className="sep">/</span>
            <a href={`https://knowledge.nssapros.com${categoryPath}`}>{categoryLabel}</a>
            <span className="sep">/</span>
            {page.title}
          </nav>

          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1>{page.title}</h1>
          {verifiedDate && (
            <p className="verified">Verified against SSA POMS as of {verifiedDate}</p>
          )}

          {/* Quick answer block — definition-led, AI-cited most */}
          <div className="answer">
            <p className="lbl">The short answer</p>
            <p dangerouslySetInnerHTML={{ __html: page.quick_answer }} />
          </div>

          {/* Body sections */}
          {page.body_sections.map((section, i) => (
            <BodySectionBlock key={i} section={section} sourceIndex={sourceIndex} />
          ))}

          {/* Worked example */}
          {page.worked_example && (
            <div className="example">
              <p className="lbl">{page.worked_example.label}</p>
              {page.worked_example.paragraphs.map((para, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
              ))}
            </div>
          )}

          {/* FAQ */}
          {page.faq.length > 0 && (
            <>
              <h2>Frequently asked</h2>
              <FaqBlock items={page.faq} />
            </>
          )}

          {/* CTA — end-of-page, UTM-tagged */}
          <aside className="cta" aria-label="Find an advisor">
            <p className="cta-lbl">Next step</p>
            <p className="cta-head">
              Social Security decisions depend on your date of birth, marital history, and work record &mdash; the right sequence is specific to you.
            </p>
            <p className="cta-sub">A certified NSSA&reg; advisor can run your exact situation before you file.</p>
            <a className="cta-btn" href={ctaUrl}>
              Find an NSSA&reg; advisor near you
            </a>
          </aside>

          {/* Review provenance */}
          <div className="review">
            {page.reviewer && (
              <>
                <strong>Reviewed by:</strong> {page.reviewer}. &nbsp;&middot;&nbsp;{' '}
              </>
            )}
            {verifiedDate && (
              <>
                <strong>Source data last verified:</strong> {verifiedDate}, against the live SSA POMS. &nbsp;&middot;&nbsp;{' '}
              </>
            )}
            This page is part of the NSSA Knowledge Base and is reviewed on a quarterly cycle for accuracy against current SSA guidance.
          </div>
        </div>

        <footer className="foot">
          <div className="wrap">
            A reference resource from{' '}
            <a href="https://www.nssapros.com">
              National Social Security Advisors (NSSA&reg;)
            </a>
            , the nation&apos;s first Social Security certification program for financial professionals,
            founded 2013. &nbsp;This page explains the rule; it is not individualized advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
