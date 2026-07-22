/**
 * ReferencePage — the canonical KB page template
 *
 * Design source: deemed-filing.html (SEO-audited reference page)
 * Renders any reference_pages row as a statically-generated page.
 * No client JS. CSS matches deemed-filing.html exactly.
 */

import type { ReferencePage, BodySection, FaqItem, PrimarySource } from '@/lib/types';
import { SectionFeedback } from '@/components/SectionFeedback';

// ─── CSS (matches deemed-filing.html exactly) ────────────────────────────────

const supersededCss = `
.superseded-banner{
  background:#7F1D1D;color:#FEE2E2;
  padding:14px 0;
  font-family:ui-sans-serif,system-ui,sans-serif;
  font-size:14px;
  border-bottom:3px solid #991B1B;
}
.superseded-banner .wrap{display:flex;align-items:flex-start;gap:12px}
.superseded-banner .icon{font-size:20px;flex:none;margin-top:1px}
.superseded-banner strong{color:#fff;display:block;font-size:15px;margin-bottom:2px}
.superseded-banner p{margin:0;line-height:1.5;color:#FCA5A5}
`;

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
.lead{font-weight:400;color:var(--ink)}
.faq-item .lead{font-weight:600}
.faq-item{margin:0 0 28px}
.faq-item .lead{margin-bottom:4px}
.faq-item .faq-a{margin-top:0}
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
/* Source gap — nested inside the amber source block */
.cite-gap-row{
  display:flex;gap:8px;align-items:flex-start;
  margin-top:8px;padding-top:8px;
  border-top:1px solid #FECACA;
  background:#FEF2F2;
  border-radius:2px;
  padding:7px 10px;
  color:#7F1D1D;
  font-size:13px;
  line-height:1.4;
}
.tag-gap{
  flex:none;font-weight:700;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
  color:#fff;background:#B91C1C;padding:3px 7px;border-radius:2px;margin-top:1px;
  white-space:nowrap;
}
.example{background:#F3F1EB;border-radius:2px;padding:20px 22px;margin:24px 0}
.example .lbl{font-family:ui-sans-serif,system-ui;font-size:11.5px;font-weight:700;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink-soft);margin:0 0 8px}
.example p{margin:8px 0}
.cta{background:var(--navy);color:#fff;border-radius:4px;padding:28px 28px 30px;margin:44px 0 8px}
.cta-irmaa{background:#9B1C1C}
.cta-lbl{font-family:ui-sans-serif,system-ui;font-size:11.5px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:#8FB8D4;margin:0 0 12px}
.cta-irmaa .cta-lbl{color:#FCA5A5}
.cta-head{font-size:21px;line-height:1.35;margin:0 0 8px;color:#fff;font-weight:600}
.cta-sub{font-family:ui-sans-serif,system-ui;font-size:15px;line-height:1.5;color:#C9D8E4;margin:0 0 20px}
.cta-irmaa .cta-sub{color:#FECACA}
.cta-btn{display:inline-block;font-family:ui-sans-serif,system-ui;font-size:15px;font-weight:600;
  background:#fff;color:var(--navy);text-decoration:none;padding:13px 22px;border-radius:3px;
  transition:transform .15s ease,box-shadow .15s ease}
.cta-irmaa .cta-btn{color:#9B1C1C}
.cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.18)}
.cta-btn:focus-visible{outline:3px solid #8FB8D4;outline-offset:2px}
.cta-irmaa .cta-btn:focus-visible{outline-color:#FCA5A5}
.cta-link{color:inherit;font-weight:inherit;text-decoration:underline;text-underline-offset:2px}
.cta-link:hover{opacity:.8}
.review{font-family:ui-sans-serif,system-ui;font-size:13.5px;color:var(--ink-soft);
  border-top:1px solid var(--rule);margin-top:48px;padding:20px 0 8px;line-height:1.6}
.review strong{color:var(--ink)}
footer.foot{border-top:1px solid var(--rule);margin-top:16px;padding:28px 0 60px;
  font-family:ui-sans-serif,system-ui;font-size:13px;color:var(--ink-soft)}
footer.foot a{color:var(--navy);text-decoration:none;font-weight:600}
footer.foot a:hover{text-decoration:underline}
.foot-row{display:flex;flex-wrap:wrap;gap:4px 20px;margin-bottom:8px;align-items:baseline}
.foot-co{font-weight:700;color:var(--navy)}
.foot-sep{color:#cdc4ad}
.foot-links{display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:10px}
.foot-disc{font-size:11.5px;color:#9e8f6f;border-top:1px solid var(--rule);padding-top:10px;line-height:1.6}
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

// ─── Source-gap helpers ───────────────────────────────────────────────────────

/**
 * Extract a [SOURCE GAP: ...] marker from prose/paragraph text.
 * Returns the cleaned text (marker removed) and the gap description, if any.
 */
function extractSourceGap(text: string): { clean: string; gap: string | null } {
  const match = text.match(/\[SOURCE GAP:\s*([^\]]+)\]/i);
  if (!match) return { clean: text, gap: null };
  return {
    clean: text.replace(/\[SOURCE GAP:[^\]]*\]/gi, '').trim(),
    gap: match[1].trim(),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CitationBlock({ source, gap }: { source?: PrimarySource; gap?: string | null }) {
  if (!source && !gap) return null;

  return (
    <div className="cite">
      <span className="tag">Source</span>
      <div style={{ flex: 1 }}>
        {source && (
          <span>
            <code>{source.section_number}</code>{' '}
            <a href={source.url} target="_blank" rel="noopener">
              View source &rsaquo;
            </a>
          </span>
        )}
        {gap && (
          <div className="cite-gap-row">
            <span className="tag-gap">⚠ Gap</span>
            <span>{gap}</span>
          </div>
        )}
      </div>
    </div>
  );
}



function IrmaaTable({ section }: { section: BodySection }) {
  const headers = section.headers ?? [];
  const rows    = section.rows    ?? [];
  return (
    <div className="irmaa-table-wrapper">
      {section.heading && (
        <div className="irmaa-table-title">{section.heading}</div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="irmaa-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {section.citation_ref && (
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Source: {section.citation_ref}
        </p>
      )}
    </div>
  );
}

function BodySectionBlock({ section, sourceIndex, sectionIndex, onSectionFeedback }: {
  section: BodySection;
  sourceIndex: Map<string, PrimarySource>;
  sectionIndex?: number;
  onSectionFeedback?: (index: number, type: 'verified' | 'flag', note?: string) => void;
}) {
  if (section.type === 'table') {
    return (
      <>
        <IrmaaTable section={section} />
        {sectionIndex !== undefined && onSectionFeedback && (
          <SectionFeedback sectionIndex={sectionIndex} onFeedback={onSectionFeedback} />
        )}
      </>
    );
  }
  const cite = section.citation_ref ? sourceIndex.get(section.citation_ref) : null;
  const { clean: cleanProse, gap } = extractSourceGap(section.prose);
  return (
    <>
      <h2>{section.heading}</h2>
      <p
        className="lead"
        dangerouslySetInnerHTML={{ __html: cleanProse }}
      />
      {(cite || gap) && <CitationBlock source={cite ?? undefined} gap={gap} />}
      {sectionIndex !== undefined && onSectionFeedback && (
        <SectionFeedback sectionIndex={sectionIndex} onFeedback={onSectionFeedback} />
      )}
    </>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FaqBlock({ items, onFaqFeedback }: {
  items: FaqItem[];
  onFaqFeedback?: (index: number, type: 'verified' | 'flag', note?: string) => void;
}) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <p className="lead">{capitalize(item.q)}</p>
          <p className="faq-a">{item.a}</p>
          {onFaqFeedback && (
            <SectionFeedback sectionIndex={i} label="FAQ answer" onFeedback={onFaqFeedback} />
          )}
        </div>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReferencePageProps {
  page: ReferencePage;
  previewMode?: boolean;
  /**
   * embedded — render as a scoped <div> instead of a full HTML document.
   * Use this when the component is placed inside a Next.js page shell (e.g. the
   * review page) so it doesn't produce nested <html>/<head>/<body> tags which
   * the browser silently discards, leaving only the masthead visible.
   */
  embedded?: boolean;
  /** Called when reviewer clicks Verify/Make Suggestion on a body section (review UI only). */
  onSectionFeedback?: (index: number, type: 'verified' | 'flag', note?: string) => void;
  /** Called when reviewer clicks Verify/Make Suggestion on a FAQ item (review UI only). */
  onFaqFeedback?: (index: number, type: 'verified' | 'flag', note?: string) => void;
}

// Scoped CSS for embedded (non-iframe) preview inside the Next.js shell.
// Mirrors the full CSS above but scopes body/global rules to .kb-embed-root.
const embeddedCss = `
.kb-embed-root *{box-sizing:border-box}
.kb-embed-root{
  background:var(--paper);color:var(--ink);
  font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  line-height:1.62;font-size:19px;
}
@media(max-width:600px){
  .kb-embed-root{font-size:18px}
  .kb-embed-root h1{font-size:31px}
  .kb-embed-root .answer p{font-size:18px}
  .kb-embed-root .cta{padding:22px 20px 24px}
  .kb-embed-root .cta-head{font-size:19px}
  .kb-embed-root .cta-btn{display:block;text-align:center}
}
`;

export function ReferencePageComponent({ page, previewMode, embedded, onSectionFeedback, onFaqFeedback }: ReferencePageProps) {
  const categoryLabel = page.category === 'social-security' ? 'Social Security' : 'IRMAA & Medicare';
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

  // ── CTA: anchor text pools (varied per page render for SEO anchor diversity) ──
  const SS_URL   = 'https://www.nssapros.com/social-security-training';
  const IRMAA_URL = 'https://www.nssapros.com/irmaa-medicare-training-course';

  // Each entry is a fn(action, url) → full HTML sentence so sentence structure
  // can vary naturally around the anchor text.
  type CtaFn = (action: string, url: string) => string;
  const SS_VARIANTS: CtaFn[] = [
    (a, u) => `An NSSA<sup>\u00ae</sup> advisor <a href="${u}" class="cta-link">trained in Social Security</a> ${a}.`,
    (a, u) => `An NSSA<sup>\u00ae</sup> advisor <a href="${u}" class="cta-link">with Social Security certification</a> ${a}.`,
    (a, u) => `A <a href="${u}" class="cta-link">Social Security certified</a> NSSA<sup>\u00ae</sup> advisor ${a}.`,
    (a, u) => `An NSSA<sup>\u00ae</sup> advisor <a href="${u}" class="cta-link">with Social Security training</a> ${a}.`,
    (a, u) => `An advisor with an <a href="${u}" class="cta-link">NSSA Social Security certification</a> ${a}.`,
  ];
  const IRMAA_VARIANTS: CtaFn[] = [
    (a, u) => `An advisor with <a href="${u}" class="cta-link">IRMAA certification</a> ${a}.`,
    (a, u) => `An <a href="${u}" class="cta-link">IRMAA Certified Planner<sup>\u00ae</sup></a> ${a}.`,
    (a, u) => `An advisor with <a href="${u}" class="cta-link">IRMAA training</a> ${a}.`,
    (a, u) => `An advisor with <a href="${u}" class="cta-link">Medicare planning certification</a> ${a}.`,
    (a, u) => `An advisor with <a href="${u}" class="cta-link">Medicare advisor certification</a> ${a}.`,
    (a, u) => `An advisor with <a href="${u}" class="cta-link">IRMAA and Medicare training</a> ${a}.`,
  ];

  // Eyebrow → CTA heading (consumer-facing; speaks to the retiree reading the page)
  const EYEBROW_HEADINGS: Record<string, string> = {
    // Social Security
    'Claiming Rules':             'The right time to file Social Security depends on your birthday, work history, and family situation — a small difference in timing can affect your payment for life.',
    'Spousal & Divorced Benefits': 'Spousal benefit decisions depend on both your and your spouse\'s work history — getting the sequence right can meaningfully increase your household income.',
    'Survivor Benefits':          'Survivor benefit decisions are permanent — understanding your options before you file protects your financial security.',
    'Earnings Test':              'Working while collecting Social Security affects how much you keep each month — the rules change the year you reach full retirement age.',
    'WEP & GPO':                  'WEP and GPO can significantly reduce your Social Security benefit if you have a government pension — knowing how they apply to your situation is critical.',
    'Benefit Calculation':        'Your Social Security benefit is based on your full earnings history — understanding how it\'s calculated helps you choose the best time to file.',
    'Family Benefits':            'Multiple family members may be able to receive benefits on your record — understanding the limits helps you maximize your household income.',
    'Filing & Enrollment':        'Filing at the wrong time can permanently reduce your benefit — the rules depend on your age, work history, and family situation.',
    // IRMAA
    'IRMAA Basics':               'Your Medicare premium is based on income you reported two years ago — higher earners pay significantly more, and the thresholds change each year.',
    'IRMAA Appeals':              'If your income has dropped due to a major life event, you may be able to reduce your Medicare premium — but the appeal process has strict rules.',
    'Medicare Part B':            'When you enroll in Medicare Part B — and whether you delay — affects your coverage and your premium for the rest of your life.',
    'Medicare Part D':            'IRMAA adds a surcharge to your drug plan premium based on your income from two years ago — it applies on top of whatever plan you choose.',
    'Appeals & Reconsideration':  'A Social Security denial is not final — you have the right to appeal, and most decisions can be reconsidered or heard by an administrative law judge.',
    'Medicare Enrollment':        'When you enroll in Medicare and which parts you choose affects your coverage and costs for the rest of your life.',
  };

  // Eyebrow → action phrase (what the advisor can do for the client)
  const EYEBROW_ACTIONS: Record<string, string> = {
    // Social Security
    'Claiming Rules':             'can model your exact filing decision before you file',
    'Spousal & Divorced Benefits': 'can calculate the right claiming strategy for you and your spouse',
    'Survivor Benefits':          'can help you navigate your survivor benefit options',
    'Earnings Test':              'can help you understand how your earnings affect your monthly benefit',
    'WEP & GPO':                  'can assess how WEP and GPO affect your total retirement income',
    'Benefit Calculation':        'can run a full benefit projection based on your earnings record',
    'Family Benefits':            'can identify all the benefits available to your family',
    'Filing & Enrollment':        'can guide you through every step of the filing process',
    'Appeals & Reconsideration':  'can help you navigate the Social Security appeal process',
    'Medicare Enrollment':        'can walk through your Medicare enrollment options and deadlines',
    // IRMAA
    'IRMAA Basics':               'can project your IRMAA exposure before it hits',
    'IRMAA Appeals':              'can help you build a life-changing event appeal',
    'Medicare Part B':            'can walk through your Part B enrollment window and options',
    'Medicare Part D':            'can explain how Part D IRMAA affects your drug plan costs',
  };
  const defaultSsAction   = 'can run your exact situation before you file';
  const defaultIrmaaAction = 'can review your situation before your next IRMAA determination';

  const isIrmaa   = page.category === 'irmaa';
  const ctaHeading = page.eyebrow ? (EYEBROW_HEADINGS[page.eyebrow] ?? null) : null;
  const defaultCtaHeading = isIrmaa
    ? 'Your Medicare premium is tied to your reported income — understanding IRMAA helps you plan ahead and avoid surprises.'
    : 'Social Security decisions depend on your date of birth, work history, and family situation — the right choice is specific to you.';
  const variants  = isIrmaa ? IRMAA_VARIANTS : SS_VARIANTS;
  const url       = isIrmaa ? IRMAA_URL : SS_URL;
  const action    = page.eyebrow
    ? (EYEBROW_ACTIONS[page.eyebrow] ?? (isIrmaa ? defaultIrmaaAction : defaultSsAction))
    : (isIrmaa ? defaultIrmaaAction : defaultSsAction);
  const pick      = Math.floor(Math.random() * variants.length);
  const ctaSubText = variants[pick](action, url);

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

  const isSuperseded = page.status === 'superseded';

  const previewBannerCss = previewMode ? `
.preview-banner{
  position:sticky;top:0;z-index:999;
  background:#1e40af;color:#fff;
  padding:10px 24px;
  font-family:ui-sans-serif,system-ui,sans-serif;
  font-size:13px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  border-bottom:3px solid #1d4ed8;
}
.preview-banner strong{font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase}
.preview-banner .pmeta{color:#bfdbfe;font-size:12px}
.preview-banner .pstatus{background:#1d4ed8;border:1px solid #3b82f6;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600}
` : '';

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    approved: 'Approved — not yet published',
    published: 'Published',
    superseded: 'Superseded',
    retired: 'Retired',
  };

  // ── Embedded mode: scoped <div> for use inside a Next.js page shell ─────
  if (embedded) {
    return (
      <div className="kb-embed-root">
        <style dangerouslySetInnerHTML={{ __html: css + embeddedCss + (isSuperseded ? supersededCss : '') + (previewMode ? previewBannerCss : '') }} />
        {previewMode && (
          <div className="preview-banner">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <strong>⚠ Preview</strong>
              <span className="pmeta">This page is not live — for review only</span>
            </div>
            <span className="pstatus">{STATUS_LABELS[page.status] ?? page.status}</span>
          </div>
        )}
        {isSuperseded && (
          <div className="superseded-banner">
            <div className="wrap">
              <span className="icon">⚠️</span>
              <div>
                <strong>This rule has been superseded</strong>
                <p>
                  {page.deprecation_note
                    ? page.deprecation_note
                    : 'The rule described on this page is no longer in effect. It is maintained here for reference only.'}
                  {' '}Verify current guidance on{' '}
                  <a href="https://www.ssa.gov" style={{color:'#FCA5A5'}}>ssa.gov</a> before advising clients.
                </p>
              </div>
            </div>
          </div>
        )}
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
            {page.eyebrow && (
              <><span className="sep">/</span><a href={`https://knowledge.nssapros.com${categoryPath}?topic=${encodeURIComponent(page.eyebrow)}`}>{page.eyebrow}</a></>
            )}
            <span className="sep">/</span>
            {page.title}
          </nav>
          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1>{page.h1 || page.title}</h1>
          {verifiedDate && (
            <p className="verified">Verified against SSA POMS as of {verifiedDate}</p>
          )}
          <div className="answer">
            <p className="lbl">The short answer</p>
            {(() => {
              const { clean, gap } = extractSourceGap(page.quick_answer);
              return (<>
                <p dangerouslySetInnerHTML={{ __html: clean }} />
                {gap && <CitationBlock gap={gap} />}
              </>);
            })()}
          </div>
          {page.body_sections.map((section, i) => (
            <BodySectionBlock key={i} section={section} sourceIndex={sourceIndex} sectionIndex={onSectionFeedback ? i : undefined} onSectionFeedback={onSectionFeedback} />
          ))}
          {page.worked_example && (() => {
            const we = page.worked_example!;
            const parsedParas = we.paragraphs.map(extractSourceGap);
            const gaps = parsedParas.map(p => p.gap).filter(Boolean) as string[];
            const cleanParas = parsedParas.map(p => p.clean).filter(t => t.length > 0);
            return (
              <div className="example">
                <p className="lbl">{we.label}</p>
                {cleanParas.map((para, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
                ))}
                {gaps.map((gap, i) => (
                  <CitationBlock key={i} gap={gap} />
                ))}
              </div>
            );
          })()}
          {page.faq.length > 0 && (
            <>
              <h2>Frequently asked</h2>
              <FaqBlock items={page.faq} onFaqFeedback={onFaqFeedback} />
            </>
          )}
          <aside className={`cta${isIrmaa ? ' cta-irmaa' : ''}`} aria-label="Find an advisor">
            <p className="cta-lbl">Next step</p>
            <p className="cta-head">{ctaHeading ?? defaultCtaHeading}</p>
            <p className="cta-sub" dangerouslySetInnerHTML={{ __html: ctaSubText }} />
            <a className="cta-btn" href={ctaUrl}>
              {isIrmaa ? <>Find an IRMAA Certified Planner&reg; near you</> : <>Find an NSSA&reg; advisor near you</>}
            </a>
          </aside>
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
            <div className="foot-row">
              <span className="foot-co">Social Security Professionals, LLC</span>
              <span className="foot-sep">|</span>
              <span>1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009</span>
              <span className="foot-sep">|</span>
              <span>&copy; 2026</span>
            </div>
            <div className="foot-links">
              <a href="https://www.nssapros.com/social-security-training" target="_blank" rel="noopener">Social Security Certification &rsaquo;</a>
              <a href="https://www.nssapros.com/irmaa-medicare-training-course" target="_blank" rel="noopener">IRMAA Certification &rsaquo;</a>
              <a href="https://directory.nssapros.com" target="_blank" rel="noopener">Find an Advisor &rsaquo;</a>
            </div>
            <div className="foot-disc">
              National Social Security Advisors (NSSA&reg;) is the nation&apos;s first Social Security certification
              program for financial professionals, founded 2013. The NSSA Knowledge Base provides educational reference
              material based on SSA POMS sources. Not individualized legal, financial, or benefits advice &mdash;
              verify current rules with SSA before making filing decisions.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ── Standalone HTML document (static page generation) ────────────────────
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

        {isSuperseded && <style dangerouslySetInnerHTML={{ __html: supersededCss }} />}
        {previewMode && <style dangerouslySetInnerHTML={{ __html: previewBannerCss }} />}
        <meta name="robots" content={previewMode ? 'noindex,nofollow' : 'index,follow'} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        {previewMode && (
          <div className="preview-banner">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <strong>⚠ Preview</strong>
              <span className="pmeta">This page is not live — for review only</span>
            </div>
            <span className="pstatus">{STATUS_LABELS[page.status] ?? page.status}</span>
          </div>
        )}
        {isSuperseded && (
          <div className="superseded-banner">
            <div className="wrap">
              <span className="icon">⚠️</span>
              <div>
                <strong>This rule has been superseded</strong>
                <p>
                  {page.deprecation_note
                    ? page.deprecation_note
                    : 'The rule described on this page is no longer in effect. It is maintained here for reference only.'}
                  {' '}Verify current guidance on{' '}
                  <a href="https://www.ssa.gov" style={{color:'#FCA5A5'}}>ssa.gov</a> before advising clients.
                </p>
              </div>
            </div>
          </div>
        )}
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
            {page.eyebrow && (
              <><span className="sep">/</span><a href={`https://knowledge.nssapros.com${categoryPath}?topic=${encodeURIComponent(page.eyebrow)}`}>{page.eyebrow}</a></>
            )}
            <span className="sep">/</span>
            {page.title}
          </nav>

          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1>{page.h1 || page.title}</h1>
          {verifiedDate && (
            <p className="verified">Verified against SSA POMS as of {verifiedDate}</p>
          )}

          {/* Quick answer block — definition-led, AI-cited most */}
          <div className="answer">
            <p className="lbl">The short answer</p>
            {(() => {
              const { clean, gap } = extractSourceGap(page.quick_answer);
              return (<>
                <p dangerouslySetInnerHTML={{ __html: clean }} />
                {gap && <CitationBlock gap={gap} />}
              </>);
            })()}
          </div>

          {/* Body sections */}
          {page.body_sections.map((section, i) => (
            <BodySectionBlock key={i} section={section} sourceIndex={sourceIndex} sectionIndex={onSectionFeedback ? i : undefined} onSectionFeedback={onSectionFeedback} />
          ))}

          {/* Worked example — standalone HTML document */}
          {page.worked_example && (() => {
            const we = page.worked_example!;
            const parsedParas = we.paragraphs.map(extractSourceGap);
            const gaps = parsedParas.map(p => p.gap).filter(Boolean) as string[];
            const cleanParas = parsedParas.map(p => p.clean).filter(t => t.length > 0);
            return (
              <div className="example">
                <p className="lbl">{we.label}</p>
                {cleanParas.map((para, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
                ))}
                {gaps.map((gap, i) => (
                  <CitationBlock key={i} gap={gap} />
                ))}
              </div>
            );
          })()}

          {/* FAQ */}
          {page.faq.length > 0 && (
            <>
              <h2>Frequently asked</h2>
              <FaqBlock items={page.faq} onFaqFeedback={onFaqFeedback} />
            </>
          )}

          {/* CTA — end-of-page, UTM-tagged */}
          <aside className={`cta${isIrmaa ? ' cta-irmaa' : ''}`} aria-label="Find an advisor">
            <p className="cta-lbl">Next step</p>
            <p className="cta-head">{ctaHeading ?? defaultCtaHeading}</p>
            <p className="cta-sub" dangerouslySetInnerHTML={{ __html: ctaSubText }} />
            <a className="cta-btn" href={ctaUrl}>
              {isIrmaa ? <>Find an IRMAA Certified Planner&reg; near you</> : <>Find an NSSA&reg; advisor near you</>}
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
            <div className="foot-row">
              <span className="foot-co">Social Security Professionals, LLC</span>
              <span className="foot-sep">|</span>
              <span>1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009</span>
              <span className="foot-sep">|</span>
              <span>&copy; 2026</span>
            </div>
            <div className="foot-links">
              <a href="https://www.nssapros.com/social-security-training" target="_blank" rel="noopener">Social Security Certification &rsaquo;</a>
              <a href="https://www.nssapros.com/irmaa-medicare-training-course" target="_blank" rel="noopener">IRMAA Certification &rsaquo;</a>
              <a href="https://directory.nssapros.com" target="_blank" rel="noopener">Find an Advisor &rsaquo;</a>
            </div>
            <div className="foot-disc">
              National Social Security Advisors (NSSA&reg;) is the nation&apos;s first Social Security certification
              program for financial professionals, founded 2013. The NSSA Knowledge Base provides educational reference
              material based on SSA POMS sources. Not individualized legal, financial, or benefits advice &mdash;
              verify current rules with SSA before making filing decisions.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
