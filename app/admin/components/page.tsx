/**
 * /admin/components — Manage reusable reference_components.
 *
 * Lists all components with key, label, description, last updated.
 * Content is shown as formatted JSON for now; a visual editor is a future addition.
 */
import { redirect } from 'next/navigation';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { ReferenceComponent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'jstanley@nssapros.com';
const NSSA_DARK = '#13405E';

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ComponentCard({ comp }: { comp: ReferenceComponent }) {
  const content = comp.content as unknown as Record<string, unknown>;
  const isTable = content.type === 'table';

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px',
      background: '#fff', marginBottom: 20,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <code style={{
              background: '#F3F4F6', border: '1px solid #E5E7EB',
              borderRadius: 4, padding: '2px 8px', fontSize: 13, fontWeight: 700, color: '#1F2937',
            }}>
              {comp.key}
            </code>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: isTable ? '#DBEAFE' : '#F3F4F6',
              color: isTable ? '#1E40AF' : '#374151',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {String(content.type ?? 'prose')}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 17, color: NSSA_DARK, marginBottom: 2 }}>{comp.label}</div>
          {comp.description && (
            <div style={{ fontSize: 13, color: '#6B7280' }}>{comp.description}</div>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right', flexShrink: 0 }}>
          <div>Updated: {fmtDate(comp.updated_at)}</div>
        </div>
      </div>

      {/* Table preview */}
      {isTable && Array.isArray(content.headers) && Array.isArray(content.rows) && (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 8 }}>
            Preview — {(content.rows as string[][]).length} rows × {(content.headers as string[]).length} cols
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {(content.headers as string[]).map((h, i) => (
                  <th key={i} style={{ padding: '7px 12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(content.rows as string[][]).map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '6px 12px', color: '#1F2937' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* How to use */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>
          How to use this component in a page →
        </summary>
        <pre style={{
          marginTop: 10, background: '#F9FAFB', border: '1px solid #E5E7EB',
          borderRadius: 6, padding: '12px 14px', fontSize: 12, overflowX: 'auto',
          color: '#1F2937',
        }}>
{JSON.stringify({
  type: 'component',
  component_key: comp.key,
  heading: '',
  prose: '',
}, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default async function ComponentsAdminPage() {
  // Auth gate
  const sessionClient = await createSessionClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect('/admin/login');

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('reference_components')
    .select('*')
    .order('key');

  const components: ReferenceComponent[] = data ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'ui-sans-serif, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: NSSA_DARK, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ color: '#93C5FD', textDecoration: 'none', fontSize: 13 }}>← Admin</a>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Reusable Components</span>
        </div>
        <span style={{ color: '#93C5FD', fontSize: 13 }}>{components.length} component{components.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Explainer */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '16px 20px', marginBottom: 28 }}>
          <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>📦 Reusable Components</div>
          <p style={{ margin: 0, fontSize: 14, color: '#1E3A5F', lineHeight: 1.6 }}>
            Components are named, reusable content blocks (tables, prose) that can be embedded in multiple reference pages.
            To use one, add a body section with <code style={{ background: '#DBEAFE', padding: '1px 5px', borderRadius: 3 }}>type: &quot;component&quot;</code> and
            the matching <code style={{ background: '#DBEAFE', padding: '1px 5px', borderRadius: 3 }}>component_key</code>.
            Update a component once and all pages that reference it reflect the change on next deploy.
          </p>
        </div>

        {/* How to add new */}
        <details style={{ marginBottom: 28 }}>
          <summary style={{ fontSize: 14, fontWeight: 600, color: NSSA_DARK, cursor: 'pointer' }}>
            + Add a new component
          </summary>
          <div style={{ marginTop: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
            <p style={{ fontSize: 13, color: '#374151', marginTop: 0 }}>
              Insert a row directly into Supabase. Ask Tank to seed a new component — provide the key, label, and table data.
            </p>
            <pre style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '12px 14px', fontSize: 12, overflowX: 'auto' }}>
{`INSERT INTO reference_components (key, label, description, content)
VALUES (
  'my-component-key',
  'My Component Label',
  'Optional description of what this is.',
  '{
    "type": "table",
    "heading": "Table Heading",
    "prose": "",
    "headers": ["Col 1", "Col 2"],
    "rows": [["Row 1 A", "Row 1 B"]]
  }'
);`}
            </pre>
          </div>
        </details>

        {/* Component list */}
        {components.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 15 }}>
            No components yet. Add your first one above.
          </div>
        ) : (
          components.map((comp) => <ComponentCard key={comp.id} comp={comp} />)
        )}
      </div>
    </div>
  );
}
