/**
 * /admin/axiom-subscribers — AXIOM subscriber management
 *
 * View all subscribers, provision new ones manually, activate/revoke,
 * or change tiers. Safety net for when Zapier/Kajabi misses a purchase.
 *
 * Protected by proxy.ts (admin session required — Jason only).
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase';
import { SubscribersClient } from './SubscribersClient';
import type { Subscriber } from './SubscribersClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AXIOM Subscribers — Admin',
};

async function fetchSubscribers(): Promise<Subscriber[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('axiom_subscribers')
    .select('id, email, name, tier, role, status, kajabi_purchase_id, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Subscriber[];
}

export default async function AxiomSubscribersPage() {
  const subscribers = await fetchSubscribers();

  const activeCount = subscribers.filter(s => s.status === 'active' && s.role !== 'staff').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/codex/admin/kb-review" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
            AXIOM Subscribers
          </h1>
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          <strong style={{ color: '#111827' }}>{activeCount}</strong> paying subscriber{activeCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>

        {/* ── Instructions ── */}
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 28,
          fontSize: 13,
          color: '#1E40AF',
          lineHeight: 1.6,
        }}>
          <strong>Manual provisioning:</strong> Use the form below if a Kajabi purchase wasn't automatically provisioned by Zapier.
          Activating an existing subscriber resets their status to <em>active</em> without changing their tier.
          Staff accounts (blue rows) are internal — don't revoke them.
        </div>

        {/* ── Subscriber list + actions (client) ── */}
        <SubscribersClient initial={subscribers} />

      </div>
    </div>
  );
}
