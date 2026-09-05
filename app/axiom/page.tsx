/**
 * /axiom — AXIOM subscriber chat interface
 *
 * Auth is handled by proxy.ts (Supabase session + axiom_subscribers check).
 * Full-height app layout: sticky header + chat fills remaining viewport.
 */

import { createSessionClient, createServiceClient } from '@/lib/supabase';
import { AskInterface } from './AskInterface';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AXIOM by NSSA',
  description: 'AI-powered Social Security and Medicare research for NSSA-certified advisors. Every answer cited to federal law.',
  robots: { index: false, follow: false },
  openGraph: { title: 'AXIOM by NSSA', siteName: 'AXIOM by NSSA' },
  manifest: '/codex/axiom-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent' as const,
    title: 'AXIOM',
  },
  other: {
    'mobile-web-app-capable':              'yes',
    'theme-color':                         '#1C80BC',
    'apple-mobile-web-app-capable':        'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title':          'AXIOM',
    'apple-touch-icon':                    '/codex/axiom-icon-192.png',
  },
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG     = '#0D1520';
const BORDER = '#1E2D42';
const ACCENT = '#1C80BC';
const TEXT   = '#F0F4F8';

// ── Staff name map ─────────────────────────────────────────────────────────────
const STAFF_NAMES: Record<string, string> = {
  'jstanley@nssapros.com':          'Jason Stanley',
  'chill@nssapros.com':             'Cindi Hill',
  'tvalles@nssapros.com':           'Todd Valles',
  'jblair@mypremierplan.com':       'Jim Blair',
  'travispaulstanley@gmail.com':    'Travis Stanley',
};

// ── Stats (for empty-state corpus label) ──────────────────────────────────────
async function fetchStats() {
  const sb = createServiceClient();
  const [{ count: totalDocs }, { count: totalChunks }] = await Promise.all([
    sb.from('source_documents').select('*', { count: 'exact', head: true }).is('superseded_at', null),
    sb.from('source_chunks').select('*', { count: 'exact', head: true }),
  ]);
  return { totalDocs: totalDocs ?? 0, totalChunks: totalChunks ?? 0 };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AxiomPage() {
  const sessionClient = await createSessionClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  const userEmail = user?.email?.toLowerCase() ?? '';

  const sb = createServiceClient();
  const { data: sub } = await sb
    .from('axiom_subscribers')
    .select('role, tier')
    .eq('email', userEmail)
    .single();

  const isStaff      = sub?.role === 'staff';
  const reviewerName = isStaff ? (STAFF_NAMES[userEmail] ?? userEmail) : null;

  const { totalDocs, totalChunks } = await fetchStats();
  const sourceSummary = `${totalDocs.toLocaleString()} source documents · ${totalChunks.toLocaleString()} indexed passages`;

  return (
    <div style={{
      height: '100dvh',
      background: BG,
      color: TEXT,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        background: ACCENT,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid rgba(0,0,0,0.15)`,
        zIndex: 10,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png"
          alt="AXIOM by NSSA"
          height={28}
          style={{ height: 28, width: 'auto', display: 'block' }}
        />
        {/* New Question button portal target — populated by AskInterface */}
        <div id="axiom-header-right" />
      </header>

      {/* ── Chat fills remaining height ─────────────────────────────────────── */}
      <AskInterface
        sourceSummary={sourceSummary}
        reviewerName={reviewerName}
        userEmail={userEmail}
      />

    </div>
  );
}
