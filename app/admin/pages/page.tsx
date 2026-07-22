/**
 * /admin/pages — Full page inventory with status and review dates.
 * One row per page, sortable by status / last verified / category.
 * Used for annual review tracking.
 */
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { ReferencePage, Category, PageStatus } from '@/lib/types';

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export const dynamic = 'force-dynamic';

const NSSA_DARK = '#13405E';
const G = { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280' };

const STATUS_STYLE: Record<PageStatus | string, { label: string; bg: string; color: string }> = {
  draft:      { label: 'Draft',      bg: '#f3f4f6', color: '#374151' },
  in_review:  { label: 'In Review',  bg: '#FEF3C7', color: '#92400E' },
  approved:   { label: 'Approved',   bg: '#D1FAE5', color: '#065F46' },
  published:  { label: 'Published',  bg: '#DBEAFE', color: '#1E40AF' },
  superseded: { label: 'Superseded', bg: '#FEE2E2', color: '#7F1D1D' },
  retired:    { label: 'Retired',    bg: '#F3F4F6', color: '#9CA3AF' },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4,
    }}>
      {s.label}
    </span>
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function reviewDue(verified: string | null | undefined): { label: string; color: string } {
  if (!verified) return { label: 'Not set', color: '#9CA3AF' };
  const months = (Date.now() - new Date(verified).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months > 12) return { label: 'Overdue', color: '#DC2626' };
  if (months > 9)  return { label: 'Due soon', color: '#D97706' };
  return { label: 'Current', color: '#059669' };
}

export default async function PagesInventory({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { category: catParam, status: statusParam } = await searchParams;

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user?.email) redirect('/admin/login');

  const service = createServiceClient();

  // Auth check
  const isAdmin = user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    const { data: reviewer } = await service
      .from('kb_reviewers')
      .select('display_name')
      .eq('email', user.email)
      .single();
    if (!reviewer) redirect('/admin/login?error=unauthorized');
  }

  let query = service
    .from('reference_pages')
    .select('id, slug, category, title, h1, eyebrow, status, source_last_verified, date_published, date_modified, reviewer, approved_by')
    .order('category', { ascending: true })
    .order('eyebrow', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (catParam && catParam !== 'all') query = query.eq('category', catParam as Category);
  if (statusParam && statusParam !== 'all') query = query.eq('status', statusParam as PageStatus);

  const { data: pages } = await query;
  const rows = (pages ?? []) as Partial<ReferencePage>[];

  const tabHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({ category: catParam || 'all', status: statusParam || 'all', ...overrides });
    return `/admin/pages?${p}`;
  };

  const catTabs = [
    { key: 'all', label: 'All' },
    { key: 'social-security', label: 'Social Security' },
    { key: 'irmaa', label: 'IRMAA' },
  ];
  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'in_review', label: 'In Review' },
    { key: 'draft', label: 'Draft' },
    { key: 'superseded', label: 'Superseded' },
  ];

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', minHeight: '100vh', background: G.bg }}>
      {/* Header */}
      <div style={{
        background: NSSA_DARK, color: '#fff', padding: '0 24px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin/kb-review" style={{ color: '#8ECAEE', fontSize: 14, textDecoration: 'none' }}>← Queue</a>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Page Inventory</span>
          <span style={{ background: '#1C80BC', borderRadius: 4, fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>
            {rows.length} pages
          </span>
        </div>
        <a
          href={`/admin/pages/export.csv?category=${catParam||'all'}&status=${statusParam||'all'}`}
          style={{ color: '#8ECAEE', fontSize: 13, textDecoration: 'none' }}
        >
          Export CSV ↓
        </a>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {catTabs.map(t => (
              <a key={t.key} href={tabHref({ category: t.key })}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
                  textDecoration: 'none',
                  background: (catParam || 'all') === t.key ? NSSA_DARK : '#fff',
                  color: (catParam || 'all') === t.key ? '#fff' : G.text,
                  border: `1px solid ${G.border}`,
                }}>
                {t.label}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {statusTabs.map(t => (
              <a key={t.key} href={tabHref({ status: t.key })}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
                  textDecoration: 'none',
                  background: (statusParam || 'all') === t.key ? '#374151' : '#fff',
                  color: (statusParam || 'all') === t.key ? '#fff' : G.text,
                  border: `1px solid ${G.border}`,
                }}>
                {t.label}
              </a>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 8, border: `1px solid ${G.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}>
                {['Page', 'Category', 'Topic', 'Status', 'Last Verified', 'Review Due', 'Reviewed By'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: G.text }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: G.text }}>
                    No pages match these filters.
                  </td>
                </tr>
              ) : rows.map(page => {
                const due = reviewDue(page.source_last_verified);
                return (
                  <tr key={page.id} style={{ borderBottom: `1px solid ${G.border}` }}>
                    <td style={{ padding: '12px 14px' }}>
                      <a href={`/admin/kb-review/${page.id}`} style={{ color: NSSA_DARK, fontWeight: 600, textDecoration: 'none' }}>
                        {page.title}
                      </a>
                      <div style={{ fontSize: 11, color: G.text, marginTop: 2 }}>/{page.slug}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: G.text, whiteSpace: 'nowrap' }}>
                      {page.category === 'irmaa' ? 'IRMAA' : 'Social Security'}
                    </td>
                    <td style={{ padding: '12px 14px', color: G.text }}>
                      {page.eyebrow ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <Badge status={page.status ?? 'draft'} />
                    </td>
                    <td style={{ padding: '12px 14px', color: G.text, whiteSpace: 'nowrap' }}>
                      {fmtDate(page.source_last_verified)}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: due.color }}>{due.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: G.text }}>
                      {page.approved_by ?? page.reviewer ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
