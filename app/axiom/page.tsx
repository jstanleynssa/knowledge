/**
 * /axiom — AXIOM public-facing landing + chat page
 *
 * SSR, no auth gate. Fetches live DB stats (doc count, chunk count) from
 * Supabase using the service role, then renders the dark hero, stats strip,
 * trust badges, and embeds the AskInterface client component.
 */

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { AskInterface } from './AskInterface';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';
import { AxiomGate } from './GateForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AXIOM by NSSA',
  description: 'AI-assisted Social Security and Medicare research tool for licensed professionals. Built on SSA POMS, CFR, and CMS source documents.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'AXIOM by NSSA',
    siteName: 'AXIOM by NSSA',
  },
};

// ── Design system ─────────────────────────────────────────────────────────────
const BG     = '#0D1520';
const SURFACE= '#131E2E';
const BORDER = '#1E2D42';
const ACCENT = '#1C80BC';
const TEXT   = '#F0F4F8';
const MUTED  = '#8EA3B8';
const DIM    = '#4A6070';

// ── Data fetch ─────────────────────────────────────────────────────────────────
async function fetchStats() {
  const sb = createServiceClient();

  const [{ count: totalDocs }, { count: totalChunks }] = await Promise.all([
    sb
      .from('source_documents')
      .select('*', { count: 'exact', head: true })
      .is('superseded_at', null),
    sb
      .from('source_chunks')
      .select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalDocs: totalDocs ?? 0,
    totalChunks: totalChunks ?? 0,
  };
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({
  value,
  label,
  sub,
  last,
  valueSize,
  padX = 24,
}: {
  value: string;
  label: string;
  sub?: string;
  last?: boolean;
  valueSize?: number;
  padX?: number;
}) {
  return (
    <div style={{
      padding: `0 ${padX}px`,
      borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.25)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: valueSize ?? 26, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{value}</div>
      {label && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 500 }}>{label}</div>}
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function AxiomPage() {
  // ── Password gate ──────────────────────────────────────────────────────────
  const axiomPassword = process.env.AXIOM_PASSWORD;
  if (axiomPassword) {
    const cookieStore = await cookies();
    const access = cookieStore.get('axiom_access');
    if (access?.value !== axiomPassword) {
      return <AxiomGate />;
    }
  }

  const { totalDocs, totalChunks } = await fetchStats();

  const sourceSummary =
    `Grounded in ${totalDocs.toLocaleString()} source documents · ${totalChunks.toLocaleString()} indexed passages`;

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      color: TEXT,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
    }}>

      {/* ── A. Sticky header ───────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: ACCENT,
        borderBottom: 'none',
        padding: '14px 0',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png"
            alt="AXIOM by NSSA"
            height={32}
            style={{ height: 32, width: 'auto', display: 'block' }}
          />
          {/* Right: New Question button — rendered by AskInterface (client) */}
          <div id="axiom-header-right" />
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>

        {/* ── B. Hero ──────────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 24px',
          textAlign: 'center',
        }}>
          {/* Icon graphic */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-icon.png"
            alt=""
            aria-hidden="true"
            style={{ height: 72, width: 'auto', display: 'block', margin: '0 auto 20px' }}
          />

          {/* Eyebrow */}
          <p style={{
            fontSize: 11,
            color: ACCENT,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            margin: '0 0 20px',
            fontWeight: 600,
          }}>
            Social Security &amp; Medicare Intelligence
          </p>

          {/* H1 */}
          <h1 style={{
            fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 600,
            color: TEXT,
            lineHeight: 1.25,
            margin: '0 0 16px',
          }}>
            Get instant answers<br />grounded in federal law.
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 16,
            color: MUTED,
            lineHeight: 1.7,
            maxWidth: 580,
            margin: '0 auto 24px',
          }}>
            AXIOM gives NSSA-certified advisors and IRMAA Certified Professionals direct,
            contextual access to Social Security POMS, CMS regulations, and Medicare.gov
            guidance—every answer grounded in and cited back to its federal source.
          </p>
        </section>

        {/* ── C. Ask interface — directly under copy ───────────────────────── */}
        <AskInterface sourceSummary={sourceSummary} />

        {/* ── D. Stats strip ───────────────────────────────────────────────── */}
        <div style={{
          maxWidth: 760,
          margin: '20px auto 0',
          padding: '0 24px',
        }}>
          <div style={{
            background: ACCENT,
            border: 'none',
            borderRadius: 12,
            padding: '24px 0',
            display: 'grid',
            gridTemplateColumns: '0.75fr 0.95fr 1.4fr 1.2fr',
          }}>
            <StatCell value={totalDocs.toLocaleString()}   label="" sub="Source Documents" valueSize={20} padX={14} />
            <StatCell value={totalChunks.toLocaleString()} label="" sub="Indexed Passages" valueSize={20} padX={14} />
            <StatCell value="Federally Sourced" label="" sub="POMS · CMS · Medicare · CFR" valueSize={20} padX={14} />
            <StatCell value="Expert Reviewed"   label="" sub="NSSA® · IRMAACP®" valueSize={20} padX={14} last />
          </div>

          {/* ── D. Trust badges ────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
            marginTop: 16,
            marginBottom: 48,
          }}>
            {[
              '🏛 Grounded in federal law',
              '✓ Verified against primary sources',
              '🔒 Qualified by NSSA & IRMAACP',
            ].map(badge => (
              <span key={badge} style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 99,
                padding: '6px 16px',
                fontSize: 12,
                color: MUTED,
                background: SURFACE,
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* stats + badges above */}

      </main>

      {/* ── F. Footer ─────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '28px 24px 40px',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          color: DIM,
          fontSize: 12,
          lineHeight: 1.7,
        }}>

          {/* Line 1 — identity + address */}
          <div style={{ marginBottom: 8 }}>
            &copy; 2026 Social Security Professionals, LLC &nbsp;&middot;&nbsp;
            1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009
          </div>

          {/* Line 2 — certification links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 8 }}>
            <a href="https://www.nssapros.com/social-security-training" target="_blank" rel="noopener"
              style={{ color: ACCENT, textDecoration: 'none' }}>Social Security Certification &rsaquo;</a>
            <a href="https://www.nssapros.com/irmaa-medicare-training-course" target="_blank" rel="noopener"
              style={{ color: ACCENT, textDecoration: 'none' }}>IRMAA Certification &rsaquo;</a>
            <a href="https://directory.nssapros.com" target="_blank" rel="noopener"
              style={{ color: ACCENT, textDecoration: 'none' }}>Find an Advisor &rsaquo;</a>
          </div>

          {/* Line 3 — disclaimer (expandable) */}
          <DisclaimerFooter />
        </div>
      </footer>

    </div>
  );
}
