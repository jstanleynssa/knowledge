/**
 * /admin/topics — CODEX Master Topic List (180 pages)
 * Data-driven: loads from codex_topics table. Reviewer assignable inline.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { GenerateButton } from './TopicActions';
import { ReviewerSelect } from './ReviewerSelect';

export const dynamic = 'force-dynamic';

const NSSA = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' };
const G    = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  published:  { bg: '#d1fae5', color: '#065f46', label: 'Published' },
  in_review:  { bg: '#fef3c7', color: '#92400e', label: 'Ready to Review' },
  draft:      { bg: '#fef3c7', color: '#92400e', label: 'Ready to Review' },
  AI:         { bg: '#f0f9ff', color: '#0369a1', label: 'To Be Generated' },
  SME:        { bg: '#f0f9ff', color: '#0369a1', label: 'To Be Generated' },
  TBD:        { bg: G.bg,     color: G.text,     label: 'Reserved' },
};

const REVIEWER_LABEL: Record<string, string> = { C: 'Cindi', T: 'Todd', J: 'Jim' };

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reviewer?: string }>;
}) {
  const { status: filterStatus, reviewer: filterReviewer } = await searchParams;

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin/topics');

  const supabase = createServiceClient();

  // Load topics from DB
  const { data: allTopics, error } = await supabase
    .from('codex_topics')
    .select('*')
    .order('num');
  if (error) throw new Error(error.message);

  // Load reference pages for status cross-reference + actual approver
  const { data: pages } = await supabase
    .from('reference_pages')
    .select('slug, id, status, category, approved_by')
    .neq('status', 'deleted');
  const pageBySlug = Object.fromEntries((pages ?? []).map(p => [p.slug, p]));

  // Resolve effective status: if reference_pages says published, trust it over codex_topics
  // This prevents display bugs when the async codex_topics sync drops silently.
  const effectiveStatus = (t: { slug: string; status: string }) => {
    const rp = pageBySlug[t.slug];
    if (rp?.status === 'published' && t.status !== 'published') return 'published';
    return t.status;
  };

  // Normalise status for filtering
  const normaliseStatus = (s: string) => {
    if (s === 'draft' || s === 'in_review') return 'ready';
    if (s === 'AI' || s === 'SME') return 'generate';
    return s;
  };

  // Apply filters (use effective status so published pages don’t show as ready)
  const filtered = (allTopics ?? []).filter(t => {
    const es = effectiveStatus(t);
    const statusMatch  = !filterStatus  || normaliseStatus(es) === filterStatus  || es === filterStatus;
    const reviewerMatch = !filterReviewer || t.reviewer === filterReviewer;
    return statusMatch && reviewerMatch;
  });

  // Group by section heading (preserve order)
  const sectionMap = new Map<string, typeof filtered>();
  for (const t of filtered) {
    if (!sectionMap.has(t.section_heading)) sectionMap.set(t.section_heading, []);
    sectionMap.get(t.section_heading)!.push(t);
  }

  // Goal tracking
  const GOAL_TOTAL      = 180;
  const SPRINT_START    = new Date('2026-08-12T00:00:00-04:00'); // sprint kick-off
  const PAGES_AT_START  = 19;                                    // published count at kick-off
  const DEADLINE        = new Date('2026-09-30T23:59:59-04:00');
  const now             = new Date();
  const msLeft          = DEADLINE.getTime() - now.getTime();
  const msTotal         = DEADLINE.getTime() - SPRINT_START.getTime();
  const msElapsed       = Math.max(0, now.getTime() - SPRINT_START.getTime());
  const daysLeft        = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
  const weeksLeft       = (daysLeft / 7).toFixed(1);
  const totalDays       = msTotal / (1000 * 60 * 60 * 24);          // 49
  const dailyPace       = (GOAL_TOTAL - PAGES_AT_START) / totalDays; // ~3.3 pages/day
  const daysElapsed     = Math.max(1, Math.ceil(msElapsed / (1000 * 60 * 60 * 24))); // day 1 on kick-off day
  const expectedCount   = Math.min(GOAL_TOTAL, Math.round(daysElapsed * dailyPace));  // 3.3 today, 6.6 tomorrow…
  const expectedPct     = Math.min(100, Math.round((expectedCount / GOAL_TOTAL) * 100));

  // Summary counts (always over all topics, not filtered) — use effective status
  const allT = allTopics ?? [];
  const counts = {
    published: allT.filter(t => effectiveStatus(t) === 'published').length,
    ready:     allT.filter(t => { const es = effectiveStatus(t); return es === 'draft' || es === 'in_review'; }).length,
    generate:  allT.filter(t => { const es = effectiveStatus(t); return es === 'AI' || es === 'SME'; }).length,
    TBD:       allT.filter(t => effectiveStatus(t) === 'TBD').length,
  };

  const publishedCount  = allT.filter(t => effectiveStatus(t) === 'published').length;
  const goalPct         = Math.min(100, Math.round((publishedCount / GOAL_TOTAL) * 100));
  const pagesLeft       = GOAL_TOTAL - publishedCount;
  const pacePerDay      = daysLeft > 0 ? (pagesLeft / daysLeft).toFixed(1) : '—';

  const milestone =
    goalPct >= 90 ? { emoji: '🏁', label: 'Final stretch!' } :
    goalPct >= 75 ? { emoji: '🔥', label: 'Crushing it!' } :
    goalPct >= 50 ? { emoji: '💪', label: 'Past the halfway point!' } :
    goalPct >= 25 ? { emoji: '📈', label: 'Building momentum' } :
    goalPct >= 10 ? { emoji: '🚀', label: 'Just getting started' } :
                    { emoji: '🎯', label: 'Let\'s go!' };

  const reviewerCounts = {
    C: allT.filter(t => t.reviewer === 'C').length,
    T: allT.filter(t => t.reviewer === 'T').length,
    J: allT.filter(t => t.reviewer === 'J').length,
  };

  function filterHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      status:   filterStatus   ?? '',
      reviewer: filterReviewer ?? '',
      ...overrides,
    });
    return `/admin/topics?${p}`;
  }

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: NSSA.dark, color: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin/kb-review" style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}>← CODEX</Link>
          <span style={{ color: '#4a7fa0' }}>/</span>
          <Link href="/admin/roadmap" style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}>Roadmap</Link>
          <span style={{ color: '#4a7fa0' }}>/</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>180 Topics</span>
        </div>
        <div style={{ fontSize: 12, color: NSSA.light }}>50-day plan · 3 reviewers</div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Goal Progress */}
        <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{milestone.emoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: NSSA.dark }}>50-Day Publishing Goal</div>
                <div style={{ fontSize: 12, color: G.text }}>{milestone.label} · {publishedCount} of {GOAL_TOTAL} pages published</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: daysLeft <= 14 ? '#dc2626' : daysLeft <= 30 ? '#d97706' : NSSA.dark, lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.text, marginTop: 2 }}>days left</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: NSSA.medium, lineHeight: 1 }}>{pacePerDay}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.text, marginTop: 2 }}>pages/day at this pace</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#065f46', lineHeight: 1 }}>{goalPct}%</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.text, marginTop: 2 }}>complete</div>
              </div>
            </div>
          </div>

          {/* Progress bar — wrapper gives room for the goal label above */}
          <div style={{ position: 'relative', paddingTop: 22 }}>

            {/* Goal label + down arrow — sits above the bar, outside overflow:hidden */}
            <div style={{
              position: 'absolute', top: 0, left: `${expectedPct}%`,
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none', zIndex: 1,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap', lineHeight: 1 }}>goal</span>
              <span style={{ fontSize: 13, color: '#dc2626', lineHeight: 1, marginTop: 1 }}>↓</span>
            </div>

            {/* Bar */}
            <div style={{ position: 'relative', height: 18, borderRadius: 9, background: G.bg, overflow: 'hidden', border: `1px solid ${G.border}` }}>
              {/* Actual progress fill */}
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${goalPct}%`,
                background: goalPct >= expectedPct
                  ? `linear-gradient(90deg, ${NSSA.medium}, #34d399)`
                  : `linear-gradient(90deg, ${NSSA.medium}, #60a5fa)`,
                borderRadius: 9,
                transition: 'width 0.6s ease',
                minWidth: goalPct > 0 ? 18 : 0,
              }} />
              {/* Milestone ticks */}
              {[25, 50, 75].map(tick => (
                <div key={tick} style={{
                  position: 'absolute', top: 0, left: `${tick}%`,
                  width: 1, height: '100%', background: 'rgba(0,0,0,0.08)',
                }} />
              ))}
              {/* Pace marker line inside bar */}
              <div style={{
                position: 'absolute', top: 0, left: `${expectedPct}%`,
                transform: 'translateX(-50%)',
                width: 2, height: '100%',
                background: '#dc2626', opacity: 0.85,
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: G.text }}>0</span>
            <span style={{ fontSize: 10, color: G.text }}>45</span>
            <span style={{ fontSize: 10, color: G.text }}>90</span>
            <span style={{ fontSize: 10, color: G.text }}>135</span>
            <span style={{ fontSize: 10, color: G.text }}>180 · Sep 30</span>
          </div>

          {/* Pace legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${NSSA.medium}, #34d399)` }} />
              <span style={{ fontSize: 11, color: G.text }}>Published ({publishedCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 2, height: 14, borderRadius: 1, background: '#dc2626' }} />
              <span style={{ fontSize: 11, color: G.text }}>On-pace target today ({expectedCount})</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: goalPct >= expectedPct ? '#065f46' : '#dc2626' }}>
                {goalPct >= expectedPct ? `✓ Ahead by ${publishedCount - expectedCount} pages` : `${expectedCount - publishedCount} pages behind pace`}
              </span>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { key: 'published', label: 'Published',         count: counts.published, color: '#065f46', bg: '#d1fae5' },
            { key: 'ready',     label: 'Ready to Review',   count: counts.ready,     color: '#92400e', bg: '#fef3c7' },
            { key: 'generate',  label: 'To Be Generated',   count: counts.generate,  color: '#0369a1', bg: '#f0f9ff' },
            { key: 'TBD',       label: 'Reserved',          count: counts.TBD,       color: G.text,    bg: G.bg     },
          ].map(s => (
            <div key={s.key} style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10, padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 110 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 10, marginTop: 4, textAlign: 'center' }}>{s.label}</span>
            </div>
          ))}
          <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10, padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: NSSA.medium }}>180</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: NSSA.medium }}>Total</span>
          </div>
        </div>

        {/* Reviewer legend */}
        <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 32 }}>
          {(['C','T','J'] as const).map(r => (
            <div key={r}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{REVIEWER_LABEL[r]}</div>
              <div style={{ fontSize: 12, color: G.text }}>{r === 'C' ? 'Social Security' : r === 'T' ? 'IRMAA & Medicare' : 'Both'} · <strong>{reviewerCounts[r]} pages</strong></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.text, textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</span>
            {[
              { value: '',          label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'ready',     label: 'Ready to Review' },
              { value: 'generate',  label: 'To Be Generated' },
              { value: 'TBD',       label: 'Reserved' },
            ].map(f => {
              const active = (filterStatus ?? '') === f.value;
              return (
                <Link key={f.value} href={filterHref({ status: f.value })} style={{
                  fontSize: 12, fontWeight: active ? 700 : 500, padding: '4px 12px',
                  borderRadius: 16, textDecoration: 'none',
                  background: active ? NSSA.dark : '#fff', color: active ? '#fff' : G.text,
                  border: `1px solid ${active ? NSSA.dark : G.border}`,
                }}>{f.label}</Link>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.text, textTransform: 'uppercase', letterSpacing: '.06em' }}>Reviewer</span>
            {[
              { value: '',  label: 'All' },
              { value: 'C', label: 'Cindi' },
              { value: 'T', label: 'Todd' },
              { value: 'J', label: 'Jim' },
            ].map(f => {
              const active = (filterReviewer ?? '') === f.value;
              return (
                <Link key={f.value} href={filterHref({ reviewer: f.value })} style={{
                  fontSize: 12, fontWeight: active ? 700 : 500, padding: '4px 12px',
                  borderRadius: 16, textDecoration: 'none',
                  background: active ? NSSA.dark : '#fff', color: active ? '#fff' : G.text,
                  border: `1px solid ${active ? NSSA.dark : G.border}`,
                }}>{f.label}</Link>
              );
            })}
          </div>
          {(filterStatus || filterReviewer) && (
            <Link href="/admin/topics" style={{ fontSize: 12, color: G.text, textDecoration: 'none' }}>✕ Clear filters</Link>
          )}
        </div>

        {/* Sections */}
        {[...sectionMap.entries()].map(([heading, topics]) => (
          <div key={heading} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: NSSA.dark, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: `2px solid ${NSSA.medium}`, paddingBottom: 8, marginBottom: 10 }}>
              {heading}
            </h2>
            <div style={{ background: '#fff', border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: G.bg }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, width: 36 }}>#</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text }}>Topic</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, width: 130 }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, width: 60 }}>Cat</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, width: 100 }} title="Published = actual approver · Others = planned domain owner">Reviewer ⓘ</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: G.text, width: 120 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, i) => {
                    const es = effectiveStatus(topic); // use effective status to avoid codex_topics desync
                    const s = STATUS_STYLE[es] ?? STATUS_STYLE.TBD;
                    const page = pageBySlug[topic.slug];
                    const reviewHref    = page ? `/admin/kb-review/${page.id}` : null;
                    const isReviewable  = es === 'draft' || es === 'in_review';
                    const isGeneratable = es === 'AI' || es === 'SME';
                    const isPublished   = es === 'published';
                    const catSlug       = topic.category === 'IRMAA' ? 'irmaa' : 'social-security';
                    const liveHref      = isPublished ? `https://www.nssapros.com/codex/${catSlug}/${topic.slug}` : null;
                    return (
                      <tr key={topic.id} style={{ borderTop: `1px solid ${G.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: G.text }}>{topic.num}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>
                          {reviewHref
                            ? <Link href={reviewHref} style={{ color: NSSA.medium, textDecoration: 'none', fontWeight: 500 }}>{topic.title}</Link>
                            : <span style={{ color: topic.status === 'TBD' ? G.text : '#111' }}>{topic.title}</span>
                          }
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: G.text }}>{topic.category}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {isPublished && page?.approved_by
                            ? <span style={{ fontSize: 12, color: G.text }} title="Actual approver">
                                {page.approved_by.split(' ')[0]}
                              </span>
                            : <ReviewerSelect id={topic.id} current={topic.reviewer} />
                          }
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {isPublished && liveHref && (
                            <a href={liveHref} target="_blank" rel="noopener" style={{
                              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                              border: '1px solid #16a34a', background: 'transparent',
                              color: '#16a34a', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>View ↗</a>
                          )}
                          {isReviewable && reviewHref && (
                            <Link href={reviewHref} style={{
                              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                              border: '1px solid #d97706', background: 'transparent',
                              color: '#d97706', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>Review →</Link>
                          )}
                          {isGeneratable && (
                            <GenerateButton title={topic.title} slug={topic.slug} category={topic.category} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: G.text }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No topics match these filters</div>
            <Link href="/admin/topics" style={{ fontSize: 13, color: NSSA.medium, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Clear filters</Link>
          </div>
        )}

      </div>
    </div>
  );
}
