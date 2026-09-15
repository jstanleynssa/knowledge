import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Press & Media',
  description:
    'Press resources, media inquiries, and news about the Advanced Retirement Planning Institute (ARPI).',
}

export default function PressPage() {
  return (
    <>
      <Nav />
      <main style={{ background: 'var(--white)', minHeight: '60vh' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto', padding: '64px 32px 96px' }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--green-mid)',
              marginBottom: 12,
            }}>
              Press &amp; Media
            </p>
            <h1 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              marginBottom: 20,
            }}>
              Media Resources
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              For media inquiries, interview requests, or press resources, contact us below.
              We&rsquo;re happy to provide commentary on Social Security planning, Medicare strategy,
              IRMAA, and end-of-life financial planning.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', marginBottom: 48 }} />

          {/* Media Contact */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 20,
            }}>
              Media Contact
            </h2>
            <div style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--green-dark)',
              borderRadius: 4,
              padding: '24px 28px',
              fontSize: '0.92rem',
              color: 'var(--ink-mid)',
              lineHeight: 1.8,
            }}>
              <div style={{ marginBottom: 4 }}>
                <strong style={{ color: 'var(--ink)' }}>Email:</strong>{' '}
                <a href="mailto:engage@arpinstitute.com?subject=Media%20Inquiry" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>
                  engage@arpinstitute.com
                </a>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-light)' }}>
                Use subject line: <em>Media Inquiry</em>
              </div>
            </div>
          </section>

          {/* About ARPI boilerplate */}
          <section style={{
            paddingTop: 40,
            borderTop: '1px solid var(--border)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 20,
            }}>
              About ARPI
            </h2>
            <div style={{
              fontSize: '0.92rem',
              color: 'var(--ink-mid)',
              lineHeight: 1.85,
            }}>
              <p style={{ marginBottom: 16 }}>
                Advanced Retirement Planning Institute (ARPI) is a credential and intelligence platform
                for financial professionals.
              </p>
              <p style={{ marginBottom: 16 }}>
                ARPI offers three professional designations — NSSA®, IRMAACP™, and CELP® — designed to
                equip advisors with specialized expertise in Social Security planning, Medicare and IRMAA
                coordination, and end-of-life financial strategy.
              </p>
              <p>
                ARPI is operated by Social Security Professionals, LLC, a Delaware limited liability company.
              </p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
