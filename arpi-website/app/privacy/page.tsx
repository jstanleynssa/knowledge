import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for the Advanced Retirement Planning Institute (ARPI) — how we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main style={{ background: 'var(--white)', minHeight: '60vh' }}>
        {/* Page content */}
        <div style={{
          maxWidth: '740px',
          margin: '0 auto',
          padding: '64px 32px 96px',
        }}>
          {/* Page header */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--green-mid)',
              marginBottom: '12px',
            }}>
              Legal
            </p>
            <h1 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              marginBottom: '16px',
            }}>
              Privacy Policy
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--ink-light)',
              lineHeight: 1.6,
            }}>
              <strong>Advanced Retirement Planning Institute</strong><br />
              Rev. September 2026
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', marginBottom: '48px' }} />

          {/* Intro */}
          <div style={{ fontSize: '0.92rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: '48px' }}>
            <p>
              This Privacy Policy describes how Social Security Professionals, LLC, doing business as Advanced
              Retirement Planning Institute (&ldquo;ARPI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), collects, uses, and protects
              information from visitors and members of arpinstitute.com. By using the Site, you consent to the
              practices described in this policy.
            </p>
            <p style={{ fontWeight: 600, marginTop: '16px' }}>
              If you do not agree to this Privacy Policy, do not use the Site.
            </p>
          </div>

          {/* Section 1 */}
          <Section id="section-1" title="1. Information We Collect">
            <p>
              We collect information you provide directly and information generated through your use of our Services.
            </p>

            <Subsection title="Information You Provide">
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Name, email address, phone number, and mailing address</li>
                <li>Professional information including license numbers, designations held, and state of licensure</li>
                <li>Account credentials</li>
                <li>Payment information (processed by our third-party payment processor — we do not store full card numbers)</li>
                <li>Course enrollment and registration details</li>
                <li>Exam scores and course completion records</li>
                <li>Continuing education (CE) submissions and records</li>
                <li>Survey responses, feedback, and communications with us</li>
              </ul>
            </Subsection>

            <Subsection title="Information Collected Automatically">
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Log data including IP address, browser type, pages visited, and referring URLs</li>
                <li>Cookie and tracking data (see Section 6)</li>
                <li>Zoom attendance duration and participation data from monthly member calls</li>
              </ul>
            </Subsection>

            <Subsection title="Information from Third Parties">
              <p>
                We may receive information about you from third-party platforms we use to operate our services,
                including our learning management system and CRM.
              </p>
            </Subsection>
          </Section>

          {/* Section 2 */}
          <Section id="section-2" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Deliver and administer courses, exams, and certifications</li>
              <li>Issue and maintain your ARPI designation(s)</li>
              <li>Report continuing education credits to applicable state licensing authorities on your behalf</li>
              <li>Process payments and manage your account</li>
              <li>Send transactional communications including enrollment confirmations, renewal notices, and CE deadlines</li>
              <li>Send educational and membership communications about programs, updates, and member resources</li>
              <li>Conduct and credit Zoom attendance for monthly member calls</li>
              <li>Improve our courses, platform, and services</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section id="section-3" title="3. How We Share Your Information">
            <p>We do not sell your personal information. We share your information only as described below.</p>

            <Subsection title="Service Providers">
              <p style={{ marginBottom: '8px' }}>
                We share information with third-party vendors who help us operate our services, including:
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Kajabi</strong> — course delivery, enrollment, and payment processing</li>
                <li><strong>HubSpot</strong> — customer relationship management</li>
                <li><strong>Zoom</strong> — virtual member calls and CE attendance tracking</li>
                <li><strong>Resend</strong> — transactional and member email delivery</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                These providers are authorized to use your information only to perform services on our behalf.
              </p>
            </Subsection>

            <Subsection title="CE Reporting">
              <p>
                If you have authorized us to file CE credits on your behalf, we will share your name, license
                number, designation, and completion information with the applicable state licensing authority or
                CE administrator.
              </p>
            </Subsection>

            <Subsection title="Legal Requirements">
              <p>
                We may disclose your information if required by law, court order, or governmental authority, or
                to protect the rights, safety, or property of ARPI, our members, or the public.
              </p>
            </Subsection>

            <Subsection title="Business Transfers">
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to
                the successor entity subject to the same privacy protections.
              </p>
            </Subsection>
          </Section>

          {/* Section 4 */}
          <Section id="section-4" title="4. Data Retention">
            <p>
              We retain your personal information for as long as your account is active and for a reasonable period
              thereafter to fulfill the purposes described in this policy, comply with legal obligations, and
              resolve disputes. Course completion records and CE records may be retained indefinitely as required
              by state regulatory requirements or to support future credential verifications.
            </p>
          </Section>

          {/* Section 5 */}
          <Section id="section-5" title="5. Your Choices and Rights">
            <p>Depending on your state of residence, you may have the right to:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information, subject to our legal retention obligations</li>
              <li>Opt out of marketing communications at any time using the unsubscribe link in any email</li>
            </ul>
            <p style={{ marginTop: '16px' }}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-dark)' }}>
                engage@arpinstitute.com
              </a>
              . We will respond within a reasonable time and in accordance with applicable law.
            </p>
            <p style={{ marginTop: '16px', fontWeight: 600 }}>
              Marketing opt-out:
            </p>
            <p>
              You may unsubscribe from marketing emails at any time. You will continue to receive transactional
              messages related to your enrollment, certification, and membership regardless of marketing
              preferences.
            </p>
          </Section>

          {/* Section 6 */}
          <Section id="section-6" title="6. Cookies and Tracking">
            <p>
              Our Site uses cookies and similar technologies to improve functionality, analyze usage, and support
              advertising. You may control cookie settings through your browser preferences. Disabling cookies
              may affect certain Site features.
            </p>
            <p style={{ marginTop: '16px' }}>
              We may use third-party analytics tools (such as Google Analytics) to understand how visitors use
              the Site. These tools may collect information sent by your browser as part of a web page request.
            </p>
          </Section>

          {/* Section 7 */}
          <Section id="section-7" title="7. Children Under 13">
            <p>
              We do not knowingly collect personal information from children under 13. If we learn that we have
              received information from a child under 13, we will delete it promptly. If you believe we have
              inadvertently collected such information, please contact us at{' '}
              <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-dark)' }}>
                engage@arpinstitute.com
              </a>
              .
            </p>
          </Section>

          {/* Section 8 — Security */}
          <Section id="section-8" title="8. Security">
            <LegalBlock>
              We implement reasonable administrative, technical, and physical safeguards to protect your
              information from unauthorized access, disclosure, or destruction. No method of transmission over
              the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </LegalBlock>
          </Section>

          {/* Section 9 */}
          <Section id="section-9" title="9. Third-Party Links">
            <p>
              Our Site may contain links to third-party websites. This Privacy Policy does not apply to those
              sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </Section>

          {/* Section 10 */}
          <Section id="section-10" title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will post the revised policy on this page
              with an updated revision date. Your continued use of the Site after any changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          {/* Section 11 — Contact */}
          <Section id="section-11" title="11. Contact">
            <p style={{ marginBottom: '20px' }}>
              If you have questions about this Privacy Policy or your personal information, please contact us:
            </p>
            <div style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '24px 28px',
              fontSize: '0.9rem',
              lineHeight: 1.75,
              color: 'var(--ink-mid)',
            }}>
              <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                Social Security Professionals, LLC
              </strong>
              d/b/a Advanced Retirement Planning Institute<br />
              1763 Columbia Road NW, Ste 175, PMB 481983<br />
              Washington, DC 20009
              <div style={{ marginTop: '16px' }}>
                Email:{' '}
                <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-dark)' }}>
                  engage@arpinstitute.com
                </a>
                <br />
                Website:{' '}
                <a href="https://arpinstitute.com" style={{ color: 'var(--green-dark)' }}>
                  arpinstitute.com
                </a>
              </div>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  )
}

/* ─── Layout helpers ─────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      style={{
        marginBottom: '48px',
        paddingTop: '40px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-merriweather), Georgia, serif',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: '20px',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: '0.92rem',
          color: 'var(--ink-mid)',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: '24px' }}>
      <h3
        style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      <div style={{ fontSize: '0.92rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  )
}

function LegalBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--ink-pale)',
        borderRadius: '4px',
        padding: '20px 24px',
        fontSize: '0.82rem',
        lineHeight: 1.75,
        color: 'var(--ink-mid)',
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  )
}
