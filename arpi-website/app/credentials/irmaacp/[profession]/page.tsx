import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { IRMAACP_PROFESSIONS, getIrmaacpProfessionById } from '@/lib/irmaacp-professions'

// ─── Static generation ────────────────────────────────────────
export function generateStaticParams() {
  return IRMAACP_PROFESSIONS.map((p) => ({ profession: p.id }))
}

// ─── Per-page metadata ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ profession: string }>
}): Promise<Metadata> {
  const { profession } = await params
  const p = getIrmaacpProfessionById(profession)
  if (!p) return { title: 'Not Found' }
  return {
    title: `IRMAACP™ for ${p.label} — Medicare & IRMAA Planning`,
    description: `${p.headline} ${p.body.slice(0, 155)}…`,
  }
}

// ─── Brand tokens ─────────────────────────────────────────────
const DARK = '#7f1424'
const PRIMARY = '#b02a34'
const LIGHT = '#f0d4d8'
const MID = '#c13e4e'

// ─── Checkmark icon ───────────────────────────────────────────
function IconCheck() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default async function IrmaacpProfessionPage({
  params,
}: {
  params: Promise<{ profession: string }>
}) {
  const { profession } = await params
  const p = getIrmaacpProfessionById(profession)
  if (!p) notFound()

  return (
    <>
      <Nav />
      <main id="irmaacp-profession-page">

        {/* ── Hero ── */}
        <section className="iprof-hero">
          <div className="container iprof-hero-inner">
            <a href="/credentials/irmaacp" className="iprof-back-link">
              ← Back to IRMAACP™ Certification
            </a>
            <p className="iprof-eyebrow">IRMAACP™ for {p.label}</p>
            <h1 className="iprof-h1">{p.headline}</h1>
            <p className="iprof-sub">{p.body}</p>
            <div className="iprof-hero-ctas">
              <a href="/enroll?course=irmaacp" className="iprof-btn-primary">
                Enroll as a {p.label} →
              </a>
              <a href="/credentials/irmaacp" className="iprof-btn-outline-light">
                View Full Curriculum
              </a>
            </div>
          </div>
        </section>

        {/* ── Why IRMAACP™ Fits Your Practice ── */}
        <section className="iprof-why-section">
          <div className="container iprof-why-inner">
            <div className="iprof-why-text">
              <p className="iprof-section-eyebrow">WHY IRMAACP™ FITS YOUR PRACTICE</p>
              <h2 className="iprof-section-h2">
                What IRMAACP™ Changes for {p.label}
              </h2>
              <ul className="iprof-bullet-list">
                {p.whyBullets.map((bullet, i) => (
                  <li key={i} className="iprof-bullet-item">
                    <span className="iprof-bullet-icon" aria-hidden="true">
                      <IconCheck />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="iprof-why-aside">
              <div className="iprof-stat-card">
                <span className="iprof-stat-number">$4,000+</span>
                <span className="iprof-stat-label">
                  Average IRMAA surcharge cost per couple per year
                </span>
              </div>
              <div className="iprof-stat-card">
                <span className="iprof-stat-number">20%</span>
                <span className="iprof-stat-label">
                  Of Medicare enrollees pay IRMAA surcharges
                </span>
              </div>
              <div className="iprof-stat-card">
                <span className="iprof-stat-number">63M+</span>
                <span className="iprof-stat-label">
                  Americans on Medicare and counting
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="iprof-cta-section">
          <div className="container iprof-cta-inner">
            <h2 className="iprof-cta-h2">
              Ready to earn the IRMAACP™ credential?
            </h2>
            <p className="iprof-cta-sub">
              One enrollment. Complete preparation. Everything you need to advise
              clients on Medicare costs and IRMAA surcharges with confidence.
            </p>
            <div className="iprof-cta-buttons">
              <a href="/enroll?course=irmaacp" className="iprof-cta-primary">
                Enroll in IRMAACP™ Now
              </a>
              <a href="/credentials/irmaacp#curriculum" className="iprof-cta-secondary">
                View the Full Curriculum
              </a>
            </div>
            <p className="iprof-cta-note">
              Questions?{' '}
              <a href="/contact" className="iprof-cta-contact-link">
                Contact us
              </a>{' '}
              — we&apos;re happy to help you choose the right path.
            </p>
          </div>
        </section>

      </main>

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://arpinstitute.com' },
          { '@type': 'ListItem', position: 2, name: 'IRMAACP™ Certification', item: 'https://arpinstitute.com/credentials/irmaacp' },
          { '@type': 'ListItem', position: 3, name: `IRMAACP™ for ${p!.label}`, item: `https://arpinstitute.com/credentials/irmaacp/${profession}` },
        ],
      })}} />

      <Footer />

      <style>{`
        /* ── Hero ── */
        .iprof-hero {
          background: ${DARK};
          padding: 80px 0 88px;
        }
        .iprof-hero-inner {
          max-width: 760px;
        }
        .iprof-back-link {
          display: inline-block;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.18s;
        }
        .iprof-back-link:hover { color: #fff; }
        .iprof-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${MID};
          margin: 0 0 16px;
        }
        .iprof-h1 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.22;
          margin: 0 0 22px;
        }
        .iprof-sub {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.75;
          margin: 0 0 40px;
        }
        .iprof-hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* ── Hero buttons ── */
        .iprof-btn-primary {
          display: inline-block;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          color: ${DARK};
          background: #fff;
          border: 2px solid #fff;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
        }
        .iprof-btn-primary:hover {
          background: ${LIGHT};
          border-color: ${LIGHT};
          color: ${DARK};
        }
        .iprof-btn-outline-light {
          display: inline-block;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          color: #fff;
          border: 2px solid rgba(255,255,255,0.5);
          background: transparent;
          transition: border-color 0.18s, background 0.18s;
        }
        .iprof-btn-outline-light:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.08);
        }

        /* ── Why section ── */
        .iprof-why-section {
          padding: 88px 0;
          background: #fff;
        }
        .iprof-why-inner {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 72px;
          align-items: start;
        }
        .iprof-section-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${PRIMARY};
          margin: 0 0 14px;
        }
        .iprof-section-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.375rem, 2.4vw, 1.875rem);
          font-weight: 700;
          color: #111827;
          margin: 0 0 36px;
          line-height: 1.28;
        }
        .iprof-bullet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .iprof-bullet-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.68;
        }
        .iprof-bullet-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${LIGHT};
          color: ${DARK};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        /* ── Why aside (stat cards) ── */
        .iprof-why-aside {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .iprof-stat-card {
          background: ${LIGHT};
          border-left: 4px solid ${MID};
          border-radius: 10px;
          padding: 24px 26px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .iprof-stat-number {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
          color: ${DARK};
          line-height: 1;
        }
        .iprof-stat-label {
          font-size: 0.9rem;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
        }

        /* ── CTA section ── */
        .iprof-cta-section {
          background: ${LIGHT};
          padding: 88px 0;
        }
        .iprof-cta-inner {
          text-align: center;
          max-width: 640px;
          margin: 0 auto;
        }
        .iprof-cta-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 700;
          color: ${DARK};
          margin: 0 0 16px;
          line-height: 1.28;
        }
        .iprof-cta-sub {
          font-size: 1rem;
          color: #374151;
          line-height: 1.72;
          margin: 0 0 36px;
        }
        .iprof-cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .iprof-cta-primary {
          display: inline-block;
          padding: 16px 36px;
          background: ${DARK};
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.18s;
        }
        .iprof-cta-primary:hover { background: ${MID}; }
        .iprof-cta-secondary {
          display: inline-block;
          padding: 16px 36px;
          background: #fff;
          color: ${DARK};
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          border: 2px solid ${DARK};
          transition: background 0.18s, color 0.18s;
        }
        .iprof-cta-secondary:hover {
          background: ${DARK};
          color: #fff;
        }
        .iprof-cta-note {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        .iprof-cta-contact-link {
          color: ${DARK};
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .iprof-cta-contact-link:hover { color: ${MID}; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .iprof-why-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .iprof-why-aside {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 16px;
          }
          .iprof-stat-card {
            flex: 1;
            min-width: 200px;
          }
        }
        @media (max-width: 640px) {
          .iprof-hero { padding: 60px 0 72px; }
          .iprof-why-section { padding: 64px 0; }
          .iprof-cta-section { padding: 64px 0; }
          .iprof-cta-buttons { flex-direction: column; align-items: center; }
          .iprof-cta-primary,
          .iprof-cta-secondary { width: 100%; text-align: center; }
          .iprof-why-aside { flex-direction: column; }
        }
      `}</style>
    </>
  )
}
