import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { NSSA_PROFESSIONS, getNssaProfessionById } from '@/lib/nssa-professions'

// ─── Static generation ────────────────────────────────────────
export function generateStaticParams() {
  return NSSA_PROFESSIONS.map((p) => ({ profession: p.id }))
}

// ─── Per-page metadata ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ profession: string }>
}): Promise<Metadata> {
  const { profession } = await params
  const p = getNssaProfessionById(profession)
  if (!p) return { title: 'Not Found' }
  return {
    title: `NSSA® for ${p.label} — Social Security Planning`,
    description: `${p.headline} ${p.body.slice(0, 155)}…`,
  }
}

// ─── Brand tokens ─────────────────────────────────────────────
const DARK = '#0c334c'
const PRIMARY = 'var(--blue-400)'
const LIGHT = '#d6eaf4'
const MID = '#47a2da'

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
export default async function NssaProfessionPage({
  params,
}: {
  params: Promise<{ profession: string }>
}) {
  const { profession } = await params
  const p = getNssaProfessionById(profession)
  if (!p) notFound()

  return (
    <>
      <Nav />
      <main id="nssa-profession-page">

        {/* ── Hero ── */}
        <section className="nprof-hero">
          <div className="container nprof-hero-inner">
            <a href="/credentials/nssa" className="nprof-back-link">
              ← Back to NSSA® Certification
            </a>
            <p className="nprof-eyebrow">NSSA® for {p.label}</p>
            <h1 className="nprof-h1">{p.headline}</h1>
            <p className="nprof-sub">{p.body}</p>
            <div className="nprof-hero-ctas">
              <a href="/enroll?course=nssa" className="nprof-btn-primary">
                Enroll as a {p.label} →
              </a>
              <a href="/credentials/nssa" className="nprof-btn-outline-light">
                View Full Curriculum
              </a>
            </div>
          </div>
        </section>

        {/* ── Why NSSA® Fits Your Practice ── */}
        <section className="nprof-why-section">
          <div className="container nprof-why-inner">
            <div className="nprof-why-text">
              <p className="nprof-section-eyebrow">WHY NSSA® FITS YOUR PRACTICE</p>
              <h2 className="nprof-section-h2">
                What NSSA® Changes for {p.label}
              </h2>
              <ul className="nprof-bullet-list">
                {p.whyBullets.map((bullet, i) => (
                  <li key={i} className="nprof-bullet-item">
                    <span className="nprof-bullet-icon" aria-hidden="true">
                      <IconCheck />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nprof-why-aside">
              <div className="nprof-stat-card">
                <span className="nprof-stat-number">$80T+</span>
                <span className="nprof-stat-label">
                  The great wealth transfer is underway — Social Security is the anchor income for most retirees
                </span>
              </div>
              <div className="nprof-stat-card">
                <span className="nprof-stat-number">11,000+</span>
                <span className="nprof-stat-label">
                  Americans reach 65 every day, each facing a Social Security claiming decision
                </span>
              </div>
              <div className="nprof-stat-card">
                <span className="nprof-stat-number">70%</span>
                <span className="nprof-stat-label">
                  Of retirees claim Social Security before their optimal age — NSSA® advisors fix this
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="nprof-cta-section">
          <div className="container nprof-cta-inner">
            <h2 className="nprof-cta-h2">
              Ready to earn the NSSA® credential?
            </h2>
            <p className="nprof-cta-sub">
              One enrollment. Complete preparation. Everything you need to advise
              clients on the most important retirement income decision they will ever make.
            </p>
            <div className="nprof-cta-buttons">
              <a href="/enroll?course=nssa" className="nprof-cta-primary">
                Enroll in NSSA® Now
              </a>
              <a href="/credentials/nssa#curriculum" className="nprof-cta-secondary">
                View the Full Curriculum
              </a>
            </div>
            <p className="nprof-cta-note">
              Questions?{' '}
              <a href="/contact" className="nprof-cta-contact-link">
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
          { '@type': 'ListItem', position: 2, name: 'NSSA® Certification', item: 'https://arpinstitute.com/credentials/nssa' },
          { '@type': 'ListItem', position: 3, name: `NSSA® for ${p!.label}`, item: `https://arpinstitute.com/credentials/nssa/${profession}` },
        ],
      })}} />

      <Footer />

      <style>{`
        /* ── Hero ── */
        .nprof-hero {
          background: ${DARK};
          padding: 80px 0 88px;
        }
        .nprof-hero-inner {
          max-width: 760px;
        }
        .nprof-back-link {
          display: inline-block;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.18s;
        }
        .nprof-back-link:hover { color: #fff; }
        .nprof-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${MID};
          margin: 0 0 16px;
        }
        .nprof-h1 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.22;
          margin: 0 0 22px;
        }
        .nprof-sub {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.75;
          margin: 0 0 40px;
        }
        .nprof-hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* ── Hero buttons ── */
        .nprof-btn-primary {
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
        .nprof-btn-primary:hover {
          background: ${LIGHT};
          border-color: ${LIGHT};
          color: ${DARK};
        }
        .nprof-btn-outline-light {
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
        .nprof-btn-outline-light:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.08);
        }

        /* ── Why section ── */
        .nprof-why-section {
          padding: 88px 0;
          background: #fff;
        }
        .nprof-why-inner {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 72px;
          align-items: start;
        }
        .nprof-section-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${PRIMARY};
          margin: 0 0 14px;
        }
        .nprof-section-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.375rem, 2.4vw, 1.875rem);
          font-weight: 700;
          color: #111827;
          margin: 0 0 36px;
          line-height: 1.28;
        }
        .nprof-bullet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .nprof-bullet-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.68;
        }
        .nprof-bullet-icon {
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
        .nprof-why-aside {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .nprof-stat-card {
          background: ${LIGHT};
          border-left: 4px solid ${MID};
          border-radius: 10px;
          padding: 24px 26px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nprof-stat-number {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
          color: ${DARK};
          line-height: 1;
        }
        .nprof-stat-label {
          font-size: 0.9rem;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
        }

        /* ── CTA section ── */
        .nprof-cta-section {
          background: ${LIGHT};
          padding: 88px 0;
        }
        .nprof-cta-inner {
          text-align: center;
          max-width: 640px;
          margin: 0 auto;
        }
        .nprof-cta-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 700;
          color: ${DARK};
          margin: 0 0 16px;
          line-height: 1.28;
        }
        .nprof-cta-sub {
          font-size: 1rem;
          color: #374151;
          line-height: 1.72;
          margin: 0 0 36px;
        }
        .nprof-cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .nprof-cta-primary {
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
        .nprof-cta-primary:hover { background: ${MID}; }
        .nprof-cta-secondary {
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
        .nprof-cta-secondary:hover {
          background: ${DARK};
          color: #fff;
        }
        .nprof-cta-note {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        .nprof-cta-contact-link {
          color: ${DARK};
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .nprof-cta-contact-link:hover { color: ${MID}; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .nprof-why-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .nprof-why-aside {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 16px;
          }
          .nprof-stat-card {
            flex: 1;
            min-width: 200px;
          }
        }
        @media (max-width: 640px) {
          .nprof-hero { padding: 60px 0 72px; }
          .nprof-why-section { padding: 64px 0; }
          .nprof-cta-section { padding: 64px 0; }
          .nprof-cta-buttons { flex-direction: column; align-items: center; }
          .nprof-cta-primary,
          .nprof-cta-secondary { width: 100%; text-align: center; }
          .nprof-why-aside { flex-direction: column; }
        }
      `}</style>
    </>
  )
}
