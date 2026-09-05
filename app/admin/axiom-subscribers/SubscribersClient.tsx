'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Subscriber {
  id:                  string;
  email:               string;
  name:                string | null;
  tier:                string;
  role:                string;
  status:              string;
  kajabi_purchase_id:  string | null;
  created_at:          string;
}

// ── Design tokens (matches admin pages) ───────────────────────────────────────
const TIERS   = ['standard', 'arpi_grad', 'firm', 'staff'];
const ROLES   = ['subscriber', 'staff'];

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
  past_due:  { bg: '#FEF3C7', color: '#92400E', label: 'Past Due' },
  trialing:  { bg: '#DBEAFE', color: '#1E40AF', label: 'Trialing' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: '#F3F4F6', color: '#374151', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Row actions ────────────────────────────────────────────────────────────────
function RowActions({ sub, onAction }: { sub: Subscriber; onAction: (a: string, e: string, extra?: object) => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function go(action: string, extra?: object) {
    setBusy(true);
    await onAction(action, sub.email, extra);
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {sub.status !== 'active' && (
        <button onClick={() => go('activate')} disabled={busy}
          style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, border: '1px solid #059669', background: '#ECFDF5', color: '#065F46', cursor: 'pointer' }}>
          Activate
        </button>
      )}
      {sub.status === 'active' && sub.role !== 'staff' && (
        <button onClick={() => go('revoke')} disabled={busy}
          style={{ fontSize: 12, padding: '3px 10px', borderRadius: 5, border: '1px solid #DC2626', background: '#FEF2F2', color: '#991B1B', cursor: 'pointer' }}>
          Revoke
        </button>
      )}
      {/* Tier changer */}
      <select
        disabled={busy}
        value={sub.tier}
        onChange={e => go('update_tier', { tier: e.target.value })}
        style={{ fontSize: 12, padding: '3px 8px', borderRadius: 5, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer' }}
      >
        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}

// ── Add subscriber form ────────────────────────────────────────────────────────
function AddForm({ onAction }: { onAction: (a: string, e: string, extra?: object) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [tier,  setTier]  = useState('standard');
  const [role,  setRole]  = useState('subscriber');
  const [busy,  setBusy]  = useState(false);
  const [msg,   setMsg]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    await onAction('provision', email, { tier, role });
    setMsg(`✓ ${email} provisioned`);
    setEmail('');
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end',
      padding: '16px 20px',
      background: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px' }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="advisor@example.com"
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tier</label>
        <select value={tier} onChange={e => setTier(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}>
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <button type="submit" disabled={busy || !email}
        style={{
          padding: '8px 20px', borderRadius: 6, border: 'none',
          background: busy || !email ? '#9CA3AF' : '#1C80BC',
          color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: busy || !email ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}>
        {busy ? 'Adding…' : '+ Provision'}
      </button>
      {msg && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, alignSelf: 'center' }}>{msg}</span>}
    </form>
  );
}

// ── Main client component ──────────────────────────────────────────────────────
export function SubscribersClient({ initial }: { initial: Subscriber[] }) {
  const [subs, setSubs] = useState<Subscriber[]>(initial);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function doAction(action: string, email: string, extra?: object) {
    setError('');
    const res = await fetch('/codex/api/admin/axiom-subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email, ...extra }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Something went wrong');
      return;
    }

    // Refresh data from server
    startTransition(() => router.refresh());
  }

  // Count by status
  const counts = subs.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* ── Stats strip ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_BADGE).map(([key, meta]) => (
          counts[key] !== undefined && (
            <div key={key} style={{
              padding: '10px 18px', borderRadius: 8,
              background: meta.bg, border: `1px solid ${meta.color}22`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80,
            }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: meta.color }}>{counts[key]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</span>
            </div>
          )
        ))}
        <div style={{
          padding: '10px 18px', borderRadius: 8,
          background: '#F3F4F6', border: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#374151' }}>{subs.length}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Total</span>
        </div>
      </div>

      {/* ── Add form ── */}
      <AddForm onAction={doAction} />

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Name', 'Email', 'Tier', 'Role', 'Status', 'Kajabi ID', 'Added', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map((sub, i) => (
              <tr key={sub.id} style={{
                borderBottom: i < subs.length - 1 ? '1px solid #F3F4F6' : 'none',
                background: sub.role === 'staff' ? '#F0F9FF' : '#fff',
              }}>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: '#111827' }}>{sub.name ?? '—'}</td>
                <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12 }}>{sub.email}</td>
                <td style={{ padding: '10px 14px', color: '#6B7280' }}>{sub.tier}</td>
                <td style={{ padding: '10px 14px' }}>
                  {sub.role === 'staff' && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#DBEAFE', color: '#1E40AF' }}>
                      staff
                    </span>
                  )}
                  {sub.role !== 'staff' && <span style={{ color: '#6B7280' }}>subscriber</span>}
                </td>
                <td style={{ padding: '10px 14px' }}><StatusBadge status={sub.status} /></td>
                <td style={{ padding: '10px 14px', color: '#9CA3AF', fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>
                  {sub.kajabi_purchase_id ?? '—'}
                </td>
                <td style={{ padding: '10px 14px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmt(sub.created_at)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <RowActions sub={sub} onAction={doAction} />
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
