import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Explore career opportunities at the Advanced Retirement Planning Institute (ARPI).',
}

export default function CareersPage() {
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
              Careers
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
              Join the ARPI Team
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              We&rsquo;re building the leading credential and intelligence platform for financial professionals.
              If you&rsquo;re passionate about advisor education, financial services, or building products that
              make a real difference for retirement-age Americans, we&rsquo;d love to hear from you.
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', marginBottom: 48 }} />

          {/* Current Openings */}
          <section>
            <h2 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 20,
            }}>
              Current Openings
            </h2>
            <div style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '32px 36px',
              fontSize: '0.92rem',
              color: 'var(--ink-mid)',
              lineHeight: 1.8,
            }}>
              <p style={{ marginBottom: 16 }}>
                We don&rsquo;t have any open positions listed right now, but we&rsquo;re always interested in
                hearing from talented people.
              </p>
              <p>
                Send your resume and a note about what you&rsquo;d bring to{' '}
                <a
                  href="mailto:engage@arpinstitute.com"
                  style={{ color: 'var(--green-dark)', fontWeight: 600 }}
                >
                  engage@arpinstitute.com
                </a>
                .
              </p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
