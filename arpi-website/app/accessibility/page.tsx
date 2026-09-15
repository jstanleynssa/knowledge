import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'ARPI is committed to making our website accessible to all users, including those with disabilities. Learn about our accessibility support options.',
}

export default function AccessibilityPage() {
  return (
    <>
      <Nav />
      <main style={{ background: 'var(--white)', minHeight: '60vh' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '72px 24px 96px' }}>

          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: 16 }}>
            Accessibility
          </p>
          <h1 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, color: '#111827', margin: '0 0 32px', lineHeight: 1.25 }}>
            Accessibility Statement
          </h1>

          {/* Commitment */}
          <section style={{ marginBottom: 48 }}>
            <p style={{ fontSize: '1.0625rem', color: '#374151', lineHeight: 1.75, margin: '0 0 16px' }}>
              Advanced Retirement Planning Institute (ARPI) is committed to making our website and digital content accessible to all users, including those with disabilities, in accordance with applicable laws. We strive to provide an equal and effective experience guided by the Web Content Accessibility Guidelines (WCAG) 2.1 AA as our conformance standard, and we are committed to ongoing improvements that keep pace with evolving technology and accessibility guidelines.
            </p>
          </section>

          {/* Support */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px', paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
              Accessibility Support
            </h2>
            <p style={{ fontSize: '1.0rem', color: '#374151', lineHeight: 1.75, margin: '0 0 16px' }}>
              We are dedicated to meeting your accessibility needs. If you are experiencing any issues with our website related to assistive technology — including screen readers, keyboard navigation, or other accessibility concerns — we want to help.
            </p>

            {/* Contact options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '28px 0' }}>

              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 24px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>📞</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>Call Us</p>
                  <a href="tel:2023701807" style={{ color: 'var(--green-dark)', fontWeight: 600, fontSize: '1.0625rem', textDecoration: 'none' }}>
                    (202) 370-1807
                  </a>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Speak with a live agent who can help you accomplish what you came to do.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 24px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>✉️</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>Email Us</p>
                  <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-dark)', fontWeight: 600, fontSize: '1.0625rem', textDecoration: 'none' }}>
                    engage@arpinstitute.com
                  </a>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Please include the specific page you are having difficulty with so we can investigate and improve your experience.
                  </p>
                </div>
              </div>

            </div>

            <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
              If you have questions about ARPI, our credential programs, or your account, please visit our{' '}
              <a href="/contact" style={{ color: 'var(--green-dark)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Contact page
              </a>.
            </p>
          </section>

          {/* Standards */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px', paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
              Our Standard
            </h2>
            <p style={{ fontSize: '1.0rem', color: '#374151', lineHeight: 1.75, margin: 0 }}>
              We use the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our accessibility benchmark. These guidelines explain how to make web content more accessible to people with disabilities. Conformance to these guidelines helps make the web more usable for everyone.
            </p>
          </section>

          {/* Ongoing commitment */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px', paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
              Ongoing Commitment
            </h2>
            <p style={{ fontSize: '1.0rem', color: '#374151', lineHeight: 1.75, margin: 0 }}>
              Accessibility is an ongoing effort. We are continually working to improve the usability of our site for all visitors and welcome your feedback as we make improvements over time.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
