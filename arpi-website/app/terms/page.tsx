import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for the Advanced Retirement Planning Institute (ARPI) — NSSA®, IRMAACP™, and CELP® credential programs.',
}

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--ink-light)',
              lineHeight: 1.6,
            }}>
              <strong>Advanced Retirement Planning Institute</strong><br />
              Effective Date: September 2, 2026
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', marginBottom: '48px' }} />

          {/* Section 1 */}
          <Section id="section-1" title="1. Introduction">
            <p>
              Welcome to the Advanced Retirement Planning Institute (&ldquo;ARPI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), operated by
              Social Security Professionals, LLC, a Delaware limited liability company, doing business as Advanced
              Retirement Planning Institute. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of{' '}
              arpinstitute.com and all associated websites, platforms, courses, and services (collectively, the &ldquo;Site&rdquo;
              and &ldquo;Services&rdquo;). By accessing or using our Services, you agree to be bound by these Terms.
            </p>
            <p style={{ fontWeight: 600, marginTop: '16px' }}>
              If you do not agree to these Terms, you must not access or use the Site or Services.
            </p>
          </Section>

          {/* Section 2 */}
          <Section id="section-2" title="2. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted to this page with an
              updated effective date. Your continued use of the Services after changes are posted constitutes
              acceptance of the modified Terms.
            </p>
          </Section>

          {/* Section 3 */}
          <Section id="section-3" title="3. Eligibility">
            <p>
              You must be at least 18 years old to use our Services. No one under the age of 13 may access the
              Site or provide any information to us. By registering, you represent and warrant that you are at
              least 18 years of age.
            </p>
          </Section>

          {/* Section 4 */}
          <Section id="section-4" title="4. Credentials — Registration, Certification, and Designation Use">
            <p>
              ARPI offers three professional designations. The following terms apply to each program you enroll in.
            </p>

            <Subsection title="4A. NSSA® — National Social Security Advisor">
              <p>
                To earn the NSSA® designation, participants must complete the NSSA® self-paced course and pass an
                85-question certification exam with a score of 70% or higher. Certified individuals may use
                &ldquo;NSSA®&rdquo; as a professional credential (e.g., <em>Jane Smith, NSSA®</em>), conditioned on maintaining
                active membership in good standing. NSSA® certificate holders gain access to ARPI membership
                benefits including monthly group calls and ongoing course access.
              </p>
            </Subsection>

            <Subsection title="4B. IRMAACP™ — IRMAA Certified Planner">
              <p>
                To earn the IRMAACP™ designation, participants must complete the IRMAACP™ self-paced course and
                pass a 75-question certification exam with a score of 70% or higher. Certified individuals may use
                &ldquo;IRMAACP™&rdquo; as a professional credential (e.g., <em>Jane Smith, IRMAACP™</em>), conditioned on
                maintaining active membership in good standing. IRMAACP™ certificate holders gain access to ARPI
                membership benefits including monthly group calls and ongoing course access.
              </p>
            </Subsection>

            <Subsection title="4C. CELP® — Certified End-of-Life Planner">
              <p>
                To earn the CELP® designation, participants must complete the CELP® self-paced course and pass
                the certification exam with a score of 70% or higher. Certified individuals may use &ldquo;CELP®&rdquo; as a
                professional credential (e.g., <em>Jane Smith, CELP®</em>), conditioned on maintaining active membership
                in good standing. CELP® certificate holders gain access to ARPI membership benefits including
                monthly group calls and ongoing course access.
              </p>
            </Subsection>
          </Section>

          {/* Section 5 */}
          <Section id="section-5" title="5. Certification Timeline and Maintenance">
            <Subsection title="Course Completion">
              <p>
                Participants must complete the enrolled course and pass the certification exam within 12 months
                of registration. Participants receive two (2) exam attempts at no additional charge within this
                window. Each additional attempt costs $100.
              </p>
            </Subsection>

            <Subsection title="Late Completion">
              <p>
                Failure to complete within 12 months results in loss of course access and exam attempts. Resuming
                requires repurchase of tuition at a 30% discount plus applicable exam fees. The certification
                exam must still be passed to earn the designation.
              </p>
            </Subsection>

            <Subsection title="Annual Dues">
              <p>
                Certificate holders must pay annual dues on their membership renewal date. Failure to pay results
                in suspension of the designation and membership privileges.
              </p>
            </Subsection>

            <Subsection title="Continuing Education">
              <p>
                Certificate holders must complete required annual CE by the deadline established in the member
                portal, as specified in ARPI membership guidelines.
              </p>
            </Subsection>

            <Subsection title="Renewal Notices">
              <p>
                We will provide electronic notice of upcoming dues and CE deadlines at least 60 days in advance,
                with a final reminder 30 days before the deadline.
              </p>
            </Subsection>

            <Subsection title="Grace Period">
              <p>
                A 30-day grace period applies after each renewal deadline. Payment within this period maintains
                membership status without penalty.
              </p>
            </Subsection>

            <Subsection title="Lapsed Status and Recertification">
              <p>
                If certification lapses due to non-payment or CE non-completion for more than 12 consecutive
                months, recertification fees equal to current full tuition plus the certification exam fee are
                required to restore active status.
              </p>
            </Subsection>

            <Subsection title="Dispute and Hardship">
              <p>
                If your status has lapsed in error or due to hardship, submit a written request to{' '}
                <a href="mailto:engage@arpinstitute.com" style={{ color: 'var(--green-dark)' }}>
                  engage@arpinstitute.com
                </a>{' '}
                within 30 days of suspension, including documentation and explanation. We will respond within 10
                business days. Eligible requests may result in a grace period extension or reduced
                recertification fees at our discretion.
              </p>
            </Subsection>
          </Section>

          {/* Section 6 */}
          <Section id="section-6" title="6. Payment and Refunds">
            <p>
              Full payment is required at registration. Prices are subject to change. Additional exam attempts
              beyond the first two cost $100 each. Refunds are governed by our Refund Policy. Purchases may be
              subject to applicable taxes, for which you are responsible.
            </p>
          </Section>

          {/* Section 7 */}
          <Section id="section-7" title="7. Intellectual Property">
            <p>
              All content on the Site — including text, graphics, logos, course materials, videos, and curricula
              — is the property of Social Security Professionals, LLC or its licensors and is protected by
              applicable intellectual property laws. You are granted a personal, non-exclusive, non-transferable
              license to access the Site and purchased Services for your own non-commercial professional
              development only.
            </p>
            <p style={{ marginTop: '16px' }}>
              You may not reproduce, distribute, resell, share, screenshot, scrape, reverse-engineer, or create
              derivative works from any Site content or course materials. Unauthorized use is a violation of
              these Terms and applicable law.
            </p>
            <p style={{ marginTop: '16px' }}>
              NSSA®, IRMAACP™, CELP®, and ARPI are trademarks of Social Security Professionals, LLC. Nothing
              on the Site grants any license to use these marks without prior written permission.
            </p>
          </Section>

          {/* Section 8 */}
          <Section id="section-8" title="8. User Accounts">
            <p>
              You are solely responsible for maintaining the confidentiality of your account credentials. Course
              access and subscriptions are non-transferable. Sharing login credentials violates these Terms and
              will result in immediate account suspension without refund. We reserve the right to terminate any
              account at our discretion.
            </p>
          </Section>

          {/* Section 9 */}
          <Section id="section-9" title="9. Member Calls and Recording">
            <p>
              Monthly group calls and other virtual sessions may be recorded by ARPI for instructional, quality
              assurance, or member resource purposes. By participating in any ARPI virtual session, you consent
              to recording of your participation including chat, audio, and any screen content you share.
            </p>
          </Section>

          {/* Section 10 */}
          <Section id="section-10" title="10. User Conduct">
            <p>
              You agree not to engage in any activity that disrupts or interferes with our Services, including
              uploading malicious software, harassing other users, or violating applicable laws.
            </p>
          </Section>

          {/* Section 11 */}
          <Section id="section-11" title="11. Third-Party Links">
            <p>
              The Site may contain links to third-party websites. ARPI is not responsible for the content,
              services, or practices of any third-party site. You access third-party sites at your own risk.
            </p>
          </Section>

          {/* Section 12 — all-caps disclaimer */}
          <Section id="section-12" title="12. Disclaimer of Warranties">
            <LegalBlock>
              THE SITE AND SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT,
              OR ACCURACY. WE DO NOT GUARANTEE THAT THE SITE WILL BE UNINTERRUPTED OR ERROR-FREE.
            </LegalBlock>
          </Section>

          {/* Section 13 — all-caps limitation */}
          <Section id="section-13" title="13. Limitation of Liability">
            <LegalBlock>
              SOCIAL SECURITY PROFESSIONALS, LLC SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR
              INABILITY TO USE THE SITE OR SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </LegalBlock>
          </Section>

          {/* Section 14 */}
          <Section id="section-14" title="14. Arbitration and Class Action Waiver">
            <p>
              Any dispute arising from or related to these Terms or our Services shall be resolved by binding
              arbitration under the rules of the American Arbitration Association, governed by the Federal
              Arbitration Act, in the largest U.S. city within 100 miles of your permanent residence. You and
              ARPI each waive any right to participate in a class or collective action. Claims may only be
              brought in your or our individual capacity.
            </p>
          </Section>

          {/* Section 15 */}
          <Section id="section-15" title="15. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of law
              principles.
            </p>
          </Section>

          {/* Section 16 */}
          <Section id="section-16" title="16. Miscellaneous">
            <p>
              These Terms constitute the entire agreement between you and ARPI regarding use of the Services
              and supersede all prior agreements. If any provision is unenforceable, it will be limited to the
              minimum extent necessary and the remaining Terms will remain in effect.
            </p>
          </Section>

          {/* Section 17 — Contact */}
          <Section id="section-17" title="17. Contact">
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
