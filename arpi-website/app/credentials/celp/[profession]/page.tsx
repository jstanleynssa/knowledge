import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PROFESSIONS, getProfessionById } from '@/lib/celp-professions'

// ─── Static generation ────────────────────────────────────────
export function generateStaticParams() {
  return PROFESSIONS.map((p) => ({ profession: p.id }))
}

// ─── Per-page metadata ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ profession: string }>
}): Promise<Metadata> {
  const { profession } = await params
  const p = getProfessionById(profession)
  if (!p) return { title: 'Not Found' }
  return {
    title: `CELP® for ${p.label} — Certified End-of-Life Planner`,
    description: `${p.headline} ${p.body.slice(0, 155)}…`,
  }
}

// ─── Brand tokens ─────────────────────────────────────────────
const GREEN_DARK = 'var(--green-dark)'
const GREEN_900 = 'var(--green-900)'
const GREEN_MID = 'var(--green-mid)'
const GREEN_XLIGHT = 'var(--green-xlight)'

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
export default async function ProfessionPage({
  params,
}: {
  params: Promise<{ profession: string }>
}) {
  const { profession } = await params
  const p = getProfessionById(profession)
  if (!p) notFound()

  return (
    <>
      <Nav />
      <main id="profession-page">

        {/* ── Hero ── */}
        <section className="prof-hero">
          <div className="container prof-hero-inner">
            <a href="/credentials/celp" className="prof-back-link">
              ← Back to CELP® Certification
            </a>
            <p className="prof-eyebrow">CELP® for {p.label}</p>
            <h1 className="prof-h1">{p.headline}</h1>
            <p className="prof-sub">{p.body}</p>
            <div className="prof-hero-ctas">
              <a href="/enroll?course=celp" className="btn-primary">
                Enroll as a {p.label} →
              </a>
              <a href="/credentials/celp" className="btn-outline-light">
                View Full Curriculum
              </a>
            </div>
          </div>
        </section>

        {/* ── Why CELP® Fits Your Practice ── */}
        <section className="prof-why-section">
          <div className="container prof-why-inner">
            <div className="prof-why-text">
              <p className="prof-section-eyebrow">WHY CELP® FITS YOUR PRACTICE</p>
              <h2 className="prof-section-h2">
                What CELP® Changes for {p.label}
              </h2>
              <ul className="prof-bullet-list">
                {p.whyBullets.map((bullet, i) => (
                  <li key={i} className="prof-bullet-item">
                    <span className="prof-bullet-icon" aria-hidden="true">
                      <IconCheck />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="prof-why-aside">
              <div className="prof-stat-card">
                <span className="prof-stat-number">$80T+</span>
                <span className="prof-stat-label">
                  Great wealth transfer underway — and most families have no coordinator
                </span>
              </div>
              <div className="prof-stat-card">
                <span className="prof-stat-number">11,000+</span>
                <span className="prof-stat-label">
                  Americans reach 65 every day, all needing end-of-life planning
                </span>
              </div>
              <div className="prof-stat-card">
                <span className="prof-stat-number">70%</span>
                <span className="prof-stat-label">
                  Of families leave financial disorder at death — CELP® solves this
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="prof-cta-section">
          <div className="container prof-cta-inner">
            <h2 className="prof-cta-h2">
              Ready to earn the CELP® credential?
            </h2>
            <p className="prof-cta-sub">
              One enrollment. Complete preparation. Everything you need to serve
              families through the most complex financial transition of their lives.
            </p>
            <div className="prof-cta-buttons">
              <a href="/enroll?course=celp" className="prof-cta-primary">
                Enroll in CELP® Now
              </a>
              <a href="/credentials/celp#curriculum" className="prof-cta-secondary">
                View the Full Curriculum
              </a>
            </div>
            <p className="prof-cta-note">
              Questions?{' '}
              <a href="/contact" className="prof-cta-contact-link">
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
          { '@type': 'ListItem', position: 2, name: 'CELP® Certification', item: 'https://arpinstitute.com/credentials/celp' },
          { '@type': 'ListItem', position: 3, name: `CELP® for ${p!.label}`, item: `https://arpinstitute.com/credentials/celp/${profession}` },
        ],
      })}} />

      <Footer />

      <style>{`
        /* ── Hero ── */
        .prof-hero {
          background: ${GREEN_900};
          padding: 80px 0 88px;
        }
        .prof-hero-inner {
          max-width: 760px;
        }
        .prof-back-link {
          display: inline-block;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.18s;
        }
        .prof-back-link:hover { color: #fff; }
        .prof-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${GREEN_MID};
          margin: 0 0 16px;
        }
        .prof-h1 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.22;
          margin: 0 0 22px;
        }
        .prof-sub {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.75;
          margin: 0 0 40px;
        }
        .prof-hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* Button overrides for this page */
        #profession-page .btn-primary {
          background: ${GREEN_DARK} !important;
          border-color: ${GREEN_DARK} !important;
          color: #fff !important;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
          transition: background 0.18s, border-color 0.18s;
        }
        #profession-page .btn-primary:hover {
          background: ${GREEN_900} !important;
          border-color: ${GREEN_900} !important;
        }
        .btn-outline-light {
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
        .btn-outline-light:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.08);
        }

        /* ── Why section ── */
        .prof-why-section {
          padding: 88px 0;
          background: #fff;
        }
        .prof-why-inner {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 72px;
          align-items: start;
        }
        .prof-section-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${GREEN_DARK};
          margin: 0 0 14px;
        }
        .prof-section-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.375rem, 2.4vw, 1.875rem);
          font-weight: 700;
          color: #111827;
          margin: 0 0 36px;
          line-height: 1.28;
        }
        .prof-bullet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .prof-bullet-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.68;
        }
        .prof-bullet-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${GREEN_XLIGHT};
          color: ${GREEN_DARK};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        /* ── Why aside (stat cards) ── */
        .prof-why-aside {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .prof-stat-card {
          background: ${GREEN_XLIGHT};
          border-left: 4px solid ${GREEN_MID};
          border-radius: 10px;
          padding: 24px 26px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .prof-stat-number {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 2rem;
          font-weight: 700;
          color: ${GREEN_DARK};
          line-height: 1;
        }
        .prof-stat-label {
          font-size: 0.9rem;
          color: #374151;
          line-height: 1.5;
          font-weight: 500;
        }

        /* ── CTA section ── */
        .prof-cta-section {
          background: ${GREEN_XLIGHT};
          padding: 88px 0;
        }
        .prof-cta-inner {
          text-align: center;
          max-width: 640px;
          margin: 0 auto;
        }
        .prof-cta-h2 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 700;
          color: ${GREEN_900};
          margin: 0 0 16px;
          line-height: 1.28;
        }
        .prof-cta-sub {
          font-size: 1rem;
          color: #374151;
          line-height: 1.72;
          margin: 0 0 36px;
        }
        .prof-cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .prof-cta-primary {
          display: inline-block;
          padding: 16px 36px;
          background: ${GREEN_DARK};
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.18s;
        }
        .prof-cta-primary:hover { background: ${GREEN_900}; }
        .prof-cta-secondary {
          display: inline-block;
          padding: 16px 36px;
          background: #fff;
          color: ${GREEN_DARK};
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          border: 2px solid ${GREEN_DARK};
          transition: background 0.18s, color 0.18s;
        }
        .prof-cta-secondary:hover {
          background: ${GREEN_DARK};
          color: #fff;
        }
        .prof-cta-note {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        .prof-cta-contact-link {
          color: ${GREEN_DARK};
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .prof-cta-contact-link:hover { color: ${GREEN_900}; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .prof-why-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .prof-why-aside {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 16px;
          }
          .prof-stat-card {
            flex: 1;
            min-width: 200px;
          }
        }
        @media (max-width: 640px) {
          .prof-hero { padding: 60px 0 72px; }
          .prof-why-section { padding: 64px 0; }
          .prof-cta-section { padding: 64px 0; }
          .prof-cta-buttons { flex-direction: column; align-items: center; }
          .prof-cta-primary,
          .prof-cta-secondary { width: 100%; text-align: center; }
          .prof-why-aside { flex-direction: column; }
        }
      `}</style>
    </>
  )
}
