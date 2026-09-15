import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Our Mission',
  description:
    'ARPI exists to multiply advisor expertise across the market — reducing retirement anxiety and financial mistakes for millions of Americans.',
}

export default function MissionPage() {
  return (
    <>
      <Nav />
      <main>

        {/* Hero */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">Our Mission</div>
              <h1 style={{ marginBottom: 20 }}>Why ARPI Exists</h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                ARPI is a credential and intelligence platform that empowers financial advisors with
                specialized expertise and trusted research tools for comprehensive retirement and
                end-of-life financial planning.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1 — Purpose */}
        <section style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
          <div className="container">
            <div style={{ maxWidth: 760 }}>
              <MissionSection
                eyebrow="What We Do"
                heading="Enable Confident Guidance"
              >
                <p>
                  Enable financial advisors to confidently guide their clients through the most complex
                  and consequential phases of retirement and financial life — Social Security claiming,
                  Medicare and IRMAA planning, and end-of-life financial coordination.
                </p>
              </MissionSection>
            </div>
          </div>
        </section>

        {/* Section 2 — Cause */}
        <section style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
          <div className="container">
            <div style={{ maxWidth: 760 }}>
              <MissionSection
                eyebrow="Why It Matters"
                heading="Closing the Expertise Gap"
              >
                <p>
                  Retirement anxiety is real. Financial mistakes at the end of life are common. The gap
                  isn&rsquo;t a lack of caring advisors — it&rsquo;s a lack of specialized expertise. We close that
                  gap by ensuring advisors have rigorous, current credentials in the areas where their
                  clients need them most.
                </p>
              </MissionSection>
            </div>
          </div>
        </section>

        {/* Section 3 — Passion */}
        <section style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
          <div className="container">
            <div style={{ maxWidth: 760 }}>
              <MissionSection
                eyebrow="How We Think About Impact"
                heading="The Compounding Effect"
              >
                <p>
                  The compounding effect of advisor expertise. Each certified advisor serves hundreds
                  of clients. Each institutional partnership scales that impact across entire firms and
                  platforms. We&rsquo;re not selling credentials — we&rsquo;re multiplying capability in the
                  market.
                </p>
                <div className="mission-stats-grid">
                  {[
                    { stat: '1', label: 'advisor certified' },
                    { stat: '100s', label: 'of clients better served' },
                    { stat: '∞', label: 'compounding impact' },
                  ].map(({ stat, label }) => (
                    <div key={label} style={{
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)',
                      borderTop: '3px solid var(--green-dark)',
                      borderRadius: 4,
                      padding: '28px 20px',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-merriweather), Georgia, serif',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--green-dark)',
                        lineHeight: 1,
                        marginBottom: 8,
                      }}>
                        {stat}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--ink-light)', fontWeight: 500 }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 32, color: 'var(--ink-light)', fontStyle: 'italic' }}>
                  That&rsquo;s the math that drives everything we build.
                </p>
              </MissionSection>
            </div>
          </div>
        </section>

        {/* Section 4 — CTA */}
        <section style={{ background: 'var(--green-dark)', padding: '80px 0' }}>
          <div className="container">
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 16,
              }}>
                Join the Movement
              </div>
              <h2 style={{
                fontFamily: 'var(--font-merriweather), Georgia, serif',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.25,
                marginBottom: 20,
              }}>
                Built for Advisors Who Take Their Responsibility Seriously
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.75,
                marginBottom: 36,
              }}>
                If you&rsquo;re a financial professional who takes your responsibility to clients seriously,
                ARPI is built for you. Our credentials are rigorous because the decisions your clients
                face are serious. That&rsquo;s what we believe.
              </p>
              <a href="/credentials" className="btn-primary" style={{
                background: '#fff',
                color: 'var(--green-dark)',
                border: '2px solid #fff',
              }}>
                Explore Our Credentials →
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}

/* ─── Helper ─────────────────────────────────────────────────────────────── */

function MissionSection({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--green-dark)',
        marginBottom: 12,
      }}>
        {eyebrow}
      </div>
      <h2 style={{
        fontFamily: 'var(--font-merriweather), Georgia, serif',
        fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
        fontWeight: 700,
        color: 'var(--ink)',
        lineHeight: 1.25,
        marginBottom: 24,
      }}>
        {heading}
      </h2>
      <div style={{
        fontSize: '1rem',
        color: 'var(--ink-mid)',
        lineHeight: 1.8,
      }}>
        {children}
      </div>
    </div>
  )
}
