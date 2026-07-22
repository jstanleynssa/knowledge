/**
 * /admin/kb-review — Knowledge Base review queue + annual review tracker.
 *
 * Status tabs: Needs Review | Drafts | Published | Review Due | Superseded
 * "Review Due" surfaces published pages where source_last_verified is null
 * or older than 9 months — the annual review work list.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { Category, KbReviewer, PageStatus, ReferencePage } from '@/lib/types';
import { TOPIC_QUEUE } from '@/lib/topic-queue';
import { GenerateButton } from './GenerateButton';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

const NSSA  = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' };
const IRMAA = { dark: '#AF2A35' };
const G     = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:      { label: 'Draft',         bg: '#f3f4f6', color: '#374151' },
  in_review:  { label: 'Needs Review',  bg: '#FEF3C7', color: '#92400E' },
  approved:   { label: 'Approved',      bg: '#D1FAE5', color: '#065F46' },
  published:  { label: 'Published',     bg: '#DBEAFE', color: '#1E40AF' },
  superseded: { label: 'Superseded',    bg: '#FEE2E2', color: '#7F1D1D' },
  retired:    { label: 'Retired',       bg: '#F3F4F6', color: '#6B7280' },
};

// "review_due" is a virtual tab — not a real status value
const STATUS_TABS = [
  { key: 'in_review',   label: 'Needs Review' },
  { key: 'draft',       label: 'Drafts' },
  { key: 'published',   label: 'Published' },
  { key: 'review_due',  label: 'Review Due' },
  { key: 'superseded',  label: 'Superseded' },
] as const;

const CATEGORY_TABS = [
  { key: 'all',             label: 'All' },
  { key: 'social-security', label: 'Social Security' },
  { key: 'irmaa',           label: 'IRMAA & Medicare' },
] as const;

type TabKey = typeof STATUS_TABS[number]['key'];

export const dynamic = 'force-dynamic';

export default async function KbReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status: statusParam, category: categoryParam } = await searchParams;
  const activeTab      = (statusParam || 'review_due') as TabKey;
  const categoryFilter = categoryParam || 'all';

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();
  const isAdmin = user.email === ADMIN_EMAIL;

  let reviewerName = 'Jason Stanley';
  let categories: Category[] | null = null;

  if (!isAdmin) {
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('display_name, categories')
      .eq('email', user.email)
      .single<KbReviewer>();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
    reviewerName = reviewer.display_name;
    categories   = reviewer.categories;
  }

  // 9 months ago — threshold for "review due"
  const nineMonthsAgo = new Date();
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
  const threshold = nineMonthsAgo.toISOString();

  let query = service
    .from('reference_pages')
    .select('id, slug, category, title, h1, eyebrow, status, reviewer, approved_by, approved_at, updated_at, source_last_verified, primary_sources')
    .order('updated_at', { ascending: false });

  if (activeTab === 'review_due') {
    // Published pages with stale/missing verification + all drafts (never verified)
    query = query
      .in('status', ['published', 'draft', 'in_review'])
      .or(`source_last_verified.is.null,source_last_verified.lt.${threshold}`);
  } else {
    query = query.eq('status', activeTab as PageStatus);
  }

  if (categoryFilter !== 'all') query = query.eq('category', categoryFilter as Category);
  if (categories)               query = query.in('category', categories);

  type PageRow = Pick<ReferencePage,
    'id' | 'title' | 'eyebrow' | 'category' | 'slug' | 'status' |
    'reviewer' | 'approved_by' | 'approved_at' | 'updated_at' |
    'source_last_verified' | 'primary_sources'
  >;

  const { data: pages, error } = await query.returns<PageRow[]>();
  if (error) throw new Error(error.message);

  // Coverage metrics
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: publishedRows }, { data: weekRows }, { data: allSlugs }] = await Promise.all([
    service.from('reference_pages').select('id').eq('status', 'published'),
    service.from('reference_pages').select('id').eq('status', 'published').gte('updated_at', weekAgo),
    service.from('reference_pages').select('slug'),
  ]);
  const publishedCount   = publishedRows?.length ?? 0;
  const approvedThisWeek = weekRows?.length ?? 0;
  const existingSlugSet  = new Set((allSlugs ?? []).map(r => r.slug));
  const remaining        = TOPIC_QUEUE.filter(t => !existingSlugSet.has(t.slug)).length;

  function tabHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({ status: activeTab, category: categoryFilter, ...overrides });
    return `/admin/kb-review?${p}`;
  }

  function reviewDueLabel(verified: string | null | undefined) {
    if (!verified) return { label: 'Never verified', color: '#DC2626' };
    const months = (Date.now() - new Date(verified).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (months > 12) return { label: 'Overdue', color: '#DC2626' };
    if (months > 9)  return { label: 'Due soon', color: '#D97706' };
    return null; // current — don't show
  }

  function fmtDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: NSSA.dark, color: '#fff', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAdmin && (
            <><a href="/admin/members" style={{ color: NSSA.light, textDecoration: 'none', fontSize: 14 }}>← Admin</a><span style={{ color: '#4a7fa0' }}>/</span></>
          )}
          <span style={{ fontWeight: 700, fontSize: 18 }}>Knowledge Base</span>
          <a href="/admin/coverage" style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}>Coverage ↗</a>
          <a href="/admin/leaderboard" style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}>Leaderboard ↗</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Coverage metrics */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: NSSA.light }}>
            <span><strong style={{ color: '#fff' }}>{publishedCount}</strong> published</span>
            {approvedThisWeek > 0 && (
              <span><strong style={{ color: '#6EE7B7' }}>+{approvedThisWeek}</strong> this week</span>
            )}
            <span><strong style={{ color: '#fff' }}>{remaining}</strong> topics queued</span>
          </div>
          <GenerateButton remaining={remaining} />
          <span style={{ fontSize: 13, color: NSSA.light }}>
            Reviewing as <strong style={{ color: '#fff' }}>{reviewerName}</strong>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${G.border}`, marginBottom: 16 }}>
          {STATUS_TABS.map(tab => {
            const active = activeTab === tab.key;
            const isDue  = tab.key === 'review_due';
            return (
              <Link key={tab.key} href={tabHref({ status: tab.key })} style={{
                padding: '10px 18px',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: active ? (isDue ? '#DC2626' : NSSA.dark) : G.text,
                textDecoration: 'none',
                borderBottom: active ? `2px solid ${isDue ? '#DC2626' : NSSA.dark}` : '2px solid transparent',
                marginBottom: -2,
                whiteSpace: 'nowrap',
              }}>
                {isDue && <span style={{ marginRight: 5 }}>⚑</span>}{tab.label}
              </Link>
            );
          })}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: G.text, fontWeight: 600, marginRight: 4 }}>FILTER:</span>
          {CATEGORY_TABS.map(tab => {
            const active = categoryFilter === tab.key;
            const accent = tab.key === 'irmaa' ? IRMAA.dark : NSSA.dark;
            return (
              <Link key={tab.key} href={tabHref({ category: tab.key })} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 13,
                fontWeight: active ? 700 : 500, textDecoration: 'none',
                background: active ? accent : '#fff', color: active ? '#fff' : G.text,
                border: `1px solid ${active ? accent : G.border}`,
              }}>
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {(!pages || pages.length === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: G.text }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
              {activeTab === 'review_due' ? 'All pages are current' : 'Queue is clear'}
            </div>
            <div style={{ fontSize: 14 }}>
              {activeTab === 'review_due'
                ? 'No published pages are past their annual review date.'
                : `No ${categoryFilter !== 'all' ? categoryFilter + ' ' : ''}pages with this status.`}
            </div>
          </div>
        )}

        {/* Page cards */}
        {pages && pages.map(page => {
          const sm       = STATUS_META[page.status] ?? STATUS_META.draft;
          const catColor = page.category === 'irmaa' ? IRMAA.dark : NSSA.dark;
          const citations = (page.primary_sources ?? []).length;
          const due      = reviewDueLabel(page.source_last_verified);

          return (
            <Link key={page.id} href={`/admin/kb-review/${page.id}`}
              style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
              <div style={{
                background: '#fff', border: `1px solid ${due ? '#FECACA' : G.border}`,
                borderRadius: 8, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                {/* Category */}
                <span style={{
                  flexShrink: 0, background: catColor, color: '#fff',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 4, minWidth: 80, textAlign: 'center',
                }}>
                  {page.category === 'irmaa' ? 'IRMAA' : 'Soc. Sec.'}
                </span>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {(page as any).h1 && (
                    <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(page as any).h1}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: (page as any).h1 ? G.text : '#111', fontWeight: (page as any).h1 ? 400 : 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {page.title}
                  </div>
                  <div style={{ fontSize: 13, color: G.text }}>
                    {page.eyebrow && <span style={{ marginRight: 8, color: '#8A5A00', fontWeight: 500 }}>{page.eyebrow}</span>}
                    <code style={{ background: G.bg, padding: '1px 6px', borderRadius: 3, marginRight: 8 }}>{page.slug}</code>
                    {citations} citation{citations !== 1 ? 's' : ''}
                    {page.approved_by
                      ? <span style={{ marginLeft: 8, color: '#059669' }}>· ✓ {page.approved_by}</span>
                      : page.reviewer
                      ? <span style={{ marginLeft: 8 }}>· for {page.reviewer}</span>
                      : null}
                  </div>
                </div>

                {/* Right: status + dates */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{
                    background: sm.bg, color: sm.color, fontSize: 12, fontWeight: 600,
                    padding: '3px 10px', borderRadius: 10, display: 'inline-block', marginBottom: 4,
                  }}>{sm.label}</span>
                  {due && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: due.color }}>{due.label}</div>
                  )}
                  <div style={{ fontSize: 12, color: G.text }}>
                    {activeTab === 'review_due' || activeTab === 'published'
                      ? `Verified ${fmtDate(page.source_last_verified)}`
                      : fmtDate(page.approved_at ?? page.updated_at)}
                  </div>
                </div>

                <span style={{ color: G.text, fontSize: 20, flexShrink: 0 }}>›</span>
              </div>
            </Link>
          );
        })}

        <p style={{ fontSize: 12, color: G.text, textAlign: 'right', marginTop: 8 }}>
          {pages?.length ?? 0} page{pages?.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
