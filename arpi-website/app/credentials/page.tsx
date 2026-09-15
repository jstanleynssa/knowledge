import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import TrustBar from '@/components/TrustBar'
import CredentialsSection from '@/components/CredentialsSection'
import BundleSection from '@/components/BundleSection'

export const metadata: Metadata = {
  title: 'ARPI Credentials — Social Security, Medicare & End-of-Life Planning',
  description:
    'Three rigorous credentials designed for financial professionals who want to master Social Security, Medicare, and end-of-life planning. NSSA®, IRMAACP™, and CELP®.',
}

export default function CredentialsPage() {
  return (
    <>
      <Nav />
      <main className="credentials-page">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">ARPI Credentials</div>
            <h1 style={{ marginBottom: 20 }}>
              Build the Expertise<br />That Sets You Apart
            </h1>
            <p className="hero-sub" style={{ marginBottom: 36 }}>
              Three rigorous credentials designed for financial professionals who want to master
              Social Security, Medicare, and end-of-life planning — and serve every client, at
              every stage of life.
            </p>
            <div className="hero-actions">
              <a href="#credentials" className="btn-primary">Browse Credentials →</a>
              <a href="#bundles" className="btn-outline">Bundle &amp; Save →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <TrustBar />

      {/* ── Credential Cards ── */}
      <div id="credentials">
        <CredentialsSection />
      </div>

      {/* ── Why ARPI ── */}
      <section className="why-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-eyebrow">Why ARPI</div>
            <h2 className="section-title">What Makes ARPI Credentials Different</h2>
          </div>
          <div className="why-grid">
            <div className="why-item">
              <div className="why-icon">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h3>Expert-Built Curriculum</h3>
              <p>
                Created by practitioners with decades of real-world experience — including a
                35-year SSA veteran — not theoretical academics.
              </p>
            </div>
            <div className="why-item">
              <div className="why-icon">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <h3>CE Credits Handled</h3>
              <p>
                We file your CE credits with your state on your behalf. No paperwork, no
                follow-up required.
              </p>
            </div>
            <div className="why-item">
              <div className="why-icon">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              </div>
              <h3>Lifetime Access</h3>
              <p>
                Annual content updates keep your knowledge current as rules change. Your
                credential never goes stale.
              </p>
            </div>
            <div className="why-item">
              <div className="why-icon">
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>Community &amp; Support</h3>
              <p>
                Join thousands of credentialed advisors, subject matter experts, and quarterly
                content updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bundles ── */}
      <div id="bundles">
        <BundleSection />
      </div>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="testimonials-grid">
          <div className="testimonial-block">
            <div className="quote-mark">&ldquo;</div>
            <p>
              Over the last 12 months since earning the NSSA certificate I have brought in 40
              additional clients and $400,000 in additional revenues. Huge value in this, thank
              you!
            </p>
            <cite>— David S., NSSA®</cite>
          </div>
          <div className="testimonial-block">
            <div className="quote-mark">&ldquo;</div>
            <p>
              Being the advisor who understands IRMAA has set me apart. More high-value clients
              this year than any other approach — and they come to me.
            </p>
            <cite>— Sarah L., IRMAACP™</cite>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="final-cta">
        <h2>Ready to Earn Your Credential?</h2>
        <p>
          Join 5,000+ financial professionals who trust ARPI for the expertise that matters
          most to clients.
        </p>
        <a href="/enroll" className="btn-primary">Get Started Today →</a>
      </section>

      </main>
      <Footer />
    </>
  )
}
