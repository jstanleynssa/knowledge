/**
 * /axiom/fidelity — Fidelity-branded AXIOM experience
 *
 * Same corpus, retrieval, and AI pipeline as AXIOM by NSSA.
 * Fidelity brand takes center stage; NSSA credited in footer.
 */

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { AskInterface } from '../AskInterface';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';
import { AxiomGate } from '../GateForm';
import { ReviewerGate } from '../ReviewerGate';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AXIOM — Fidelity',
  description: 'AI-assisted Social Security and Medicare research tool. Built on SSA POMS, CFR, and CMS source documents.',
  robots: { index: false, follow: false },
};

// ── Fidelity Design System ────────────────────────────────────────────────────
const BG      = '#061A0E';   // near-black green
const SURFACE = '#0D2617';   // dark green surface
const BORDER  = '#1A3D28';   // dark green border
const GREEN   = '#006044';   // Fidelity primary green
const BRIGHT  = '#368727';   // Fidelity logo green (accent highlights)
const GOLD    = '#AF8A49';   // Fidelity gold
const TEXT    = '#F0F4F8';
const MUTED   = '#8EB09A';
const DIM     = '#4A7060';

// ── Logos ─────────────────────────────────────────────────────────────────────
const LOGO_WHITE  = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/axiom/fidelity-logo-white.png';
const LOGO_ICON   = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/axiom/fidelity-logo.png';
const POWERED_BY  = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/powered-by-nssa.png';

// ── Data ──────────────────────────────────────────────────────────────────────
async function fetchStats() {
  const sb = createServiceClient();
  const [{ count: totalDocs }, { count: totalChunks }] = await Promise.all([
    sb.from('source_documents').select('*', { count: 'exact', head: true }).is('superseded_at', null),
    sb.from('source_chunks').select('*', { count: 'exact', head: true }),
  ]);
  return { totalDocs: totalDocs ?? 0, totalChunks: totalChunks ?? 0 };
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ value, sub, last }: { value: string; sub: string; last?: boolean }) {
  return (
    <div style={{
      padding: '0 24px',
      borderRight: last ? 'none' : `1px solid rgba(255,255,255,0.2)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>{sub}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function FidelityAxiomPage() {
  // ── Password gate ────────────────────────────────────────────────────────
  const axiomPassword = process.env.AXIOM_PASSWORD;
  const cookieStore = await cookies();
  if (axiomPassword) {
    const access = cookieStore.get('axiom_access');
    if (access?.value !== axiomPassword) {
      return <AxiomGate />;
    }
  }

  // ── Reviewer gate ────────────────────────────────────────────────────────
  const reviewerCookie = cookieStore.get('axiom_reviewer');
  const reviewerName = reviewerCookie?.value ?? null;
  if (!reviewerName) {
    return <ReviewerGate />;
  }

  const { totalDocs, totalChunks } = await fetchStats();
  const sourceSummary = `Grounded in ${totalDocs.toLocaleString()} source documents · ${totalChunks.toLocaleString()} indexed passages`;

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      color: TEXT,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",sans-serif',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: GREEN,
        padding: '12px 0',
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
          {/* Left: Fidelity logo + AXIOM product name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_WHITE}
              alt="Fidelity Investments"
              style={{ height: 28, width: 'auto', display: 'block' }}
            />
            <div style={{
              width: 1,
              height: 24,
              background: 'rgba(255,255,255,0.35)',
            }} />
            <span style={{
              fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
              fontSize: 18,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.04em',
            }}>
              AXIOM
            </span>
          </div>
          {/* Right: new question button slot */}
          <div id="axiom-header-right" />
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 24px',
          textAlign: 'center',
        }}>
          {/* Fidelity pyramid icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_ICON}
            alt=""
            aria-hidden="true"
            style={{ height: 64, width: 'auto', display: 'block', margin: '0 auto 20px', opacity: 0.92 }}
          />

          {/* Eyebrow */}
          <p style={{
            fontSize: 11,
            color: GOLD,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            margin: '0 0 16px',
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
            margin: '0 0 8px',
          }}>
            Fidelity&rsquo;s AXIOM
          </h1>

          <p style={{
            fontSize: 13,
            color: GOLD,
            fontWeight: 600,
            letterSpacing: '0.06em',
            margin: '0 0 20px',
          }}>
            Powered by NSSA
          </p>

          {/* Sub */}
          <p style={{
            fontSize: 16,
            color: MUTED,
            lineHeight: 1.7,
            maxWidth: 580,
            margin: '0 auto 24px',
          }}>
            Instant answers grounded in federal law — Social Security POMS, CMS regulations,
            and Medicare guidance — every response cited back to its primary source.
          </p>
        </section>

        {/* ── Ask Interface ────────────────────────────────────────────────── */}
        <AskInterface
          sourceSummary={sourceSummary}
          reviewerName={reviewerName}
          theme={{
            accent:      GREEN,
            accentDark:  '#004D35',
            textareaBg:  '#112A16',
            shadowColor: 'rgba(0,96,68,0.15)',
          }}
        />

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 760, margin: '20px auto 0', padding: '0 24px' }}>
          <div style={{
            background: GREEN,
            borderRadius: 12,
            padding: '24px 0',
            display: 'grid',
            gridTemplateColumns: '0.75fr 0.95fr 1.4fr 1.2fr',
          }}>
            <StatCell value={totalDocs.toLocaleString()} sub="Source Documents" />
            <StatCell value={totalChunks.toLocaleString()} sub="Indexed Passages" />
            <StatCell value="Federally Sourced" sub="POMS · CMS · Medicare · CFR" />
            <StatCell value="Expert Reviewed" sub="NSSA® · IRMAACP®" last />
          </div>

          {/* Trust badges */}
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

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
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

          {/* Powered by NSSA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ color: DIM, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POWERED_BY}
              alt="NSSA"
              style={{ height: 20, width: 'auto', opacity: 0.6 }}
            />
          </div>

          {/* Legal */}
          <div style={{ marginBottom: 8 }}>
            &copy; {new Date().getFullYear()} Social Security Professionals, LLC &nbsp;&middot;&nbsp;
            Research corpus built on SSA POMS, 20 CFR, and CMS primary sources.
          </div>

          {/* Disclaimer */}
          <DisclaimerFooter accent={BRIGHT} rule={BORDER} />
        </div>
      </footer>

    </div>
  );
}
