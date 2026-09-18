/**
 * /codex/irmaa — IRMAA & Medicare category index
 * Lists all published IRMAA reference pages, grouped by eyebrow topic.
 */
import { createPublicClient } from '@/lib/codex-supabase';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return topic
    ? {
        title: `${topic} | IRMAA & Medicare | ARPI Knowledge Base`,
        alternates: { canonical: 'https://arpinstitute.com/codex/irmaa' },
      }
    : {
        title: 'IRMAA & Medicare Reference | ARPI Knowledge Base',
        description:
          'Authoritative IRMAA and Medicare rules for financial advisors — surcharges, the two-year look-back, life-changing event appeals, Part B and D enrollment. Verified against CMS and Medicare.gov.',
        alternates: { canonical: 'https://arpinstitute.com/codex/irmaa' },
      };
}


const IRMAA_RED  = 'var(--red-dark)';
const IRMAA_DARK = '#7f1424';

const css = `
.ci-wrap{max-width:800px;margin:0 auto;padding:48px 24px}
.ci-back{font-size:13px;color:#4A5560;text-decoration:none;display:inline-block;margin-bottom:24px}
.ci-back:hover{color:${IRMAA_RED}}
.ci-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${IRMAA_RED};margin:0 0 10px}
.ci-h1{font-family:var(--font-merriweather),Georgia,serif;font-size:32px;font-weight:700;color:${IRMAA_DARK};margin:0 0 12px;line-height:1.2}
.ci-desc{font-size:16px;color:#4A5560;max-width:600px;line-height:1.6;margin:0 0 48px}
.ci-topic{margin-bottom:36px}
.ci-topic-head{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${IRMAA_RED};margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}
.ci-list{display:flex;flex-direction:column;gap:8px}
.ci-row{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;transition:border-color .12s,box-shadow .12s}
.ci-row:hover{border-color:${IRMAA_RED};box-shadow:0 2px 8px rgba(157,23,77,.08)}
.ci-row-title{font-size:15px;font-weight:600;color:${IRMAA_DARK}}
.ci-row-arrow{font-size:16px;color:#9CA3AF;margin-left:auto;flex-shrink:0}
@media(max-width:600px){.ci-wrap{padding:32px 16px}.ci-h1{font-size:26px}}
`;

export default async function IrmaaIndex({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const activeTopic = topic ? decodeURIComponent(topic) : null;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('id, slug, title, h1, eyebrow')
    .eq('category', 'irmaa')
    .eq('status', 'published')
    .order('eyebrow', { ascending: true })
    .order('title', { ascending: true });

  const pages = data ?? [];

  // Group by eyebrow topic, then filter if ?topic= is set
  const allGroups = new Map<string, typeof pages>();
  for (const p of pages) {
    const key = p.eyebrow || 'General';
    if (!allGroups.has(key)) allGroups.set(key, []);
    allGroups.get(key)!.push(p);
  }
  const groups = activeTopic && allGroups.has(activeTopic)
    ? new Map([[activeTopic, allGroups.get(activeTopic)!]])
    : allGroups;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ci-wrap">
        {activeTopic
          ? <a href="/codex/irmaa" className="ci-back">← IRMAA &amp; Medicare</a>
          : <a href="/codex" className="ci-back">← Knowledge Base</a>}
        <p className="ci-eyebrow">IRMAA &amp; Medicare{activeTopic ? ` / ${activeTopic}` : ''}</p>
        <h1 className="ci-h1">{activeTopic ?? 'IRMAA & Medicare'}</h1>
        <p className="ci-desc">
          Income-related Medicare surcharges, the two-year look-back rule, life-changing event appeals,
          and Part B and D enrollment — verified against CMS regulations and Medicare.gov guidance.
        </p>
        {[...groups.entries()].map(([topic, topicPages]) => (
          <div key={topic} className="ci-topic">
            <div className="ci-topic-head">{topic}</div>
            <div className="ci-list">
              {topicPages.map(p => (
                <a key={p.id} href={`/codex/irmaa/${p.slug}`} className="ci-row">
                  <span className="ci-row-title">{p.h1 || p.title}</span>
                  <span className="ci-row-arrow">›</span>
                </a>
              ))}
            </div>
          </div>
        ))}
        {pages.length === 0 && (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No published pages yet.</p>
        )}
        <div style={{ marginTop: 48, paddingTop: 16, paddingBottom: 32, borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          The Advanced Retirement Planning Institute (ARPI) Knowledge Base provides authoritative educational
          reference material based on SSA POMS, CFR Title 20, the SSA Handbook, CMS regulations, and
          Medicare.gov guidance. Not individualized legal, financial, or benefits advice &mdash;
          verify current rules with the Social Security Administration or Medicare.gov before making filing decisions.
        </div>
      </div>
    </>
  );
}
