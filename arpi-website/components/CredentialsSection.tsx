import Image from 'next/image'
import { fmt, TUITION_1, CERT_1, TUITION_CELP, CE_NSSA, CE_IRMAACP } from '@/lib/pricing'

const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export default function CredentialsSection() {
  return (
    <section id="credentials" className="credentials-section">
      <div className="container">
        <div className="credentials-header">
          <div>
            <div className="section-eyebrow">ARPI Credentials</div>
            <h2 className="section-title">Three Credentials.<br />Countless Opportunities to Serve.</h2>
          </div>

        </div>

        <div className="credentials-grid">

          {/* NSSA */}

          <div className="cred-card">
            <div className="cred-card-header">
              <div className="cred-logo-wrap">
                <Image src="/assets/nssa-logo.png" alt="NSSA — National Social Security Advisor" width={200} height={56} style={{ height: 56, width: 'auto' }} />
              </div>
              <div className="cred-tag-row">
                <span className="cred-card-tag tag-nssa">Social Security</span>
              </div>
            </div>
            <div className="cred-card-body">
              <h3>NSSA® Social Security Self-Paced Course</h3>
              <p>Learn Social Security and retirement planning at your own pace with on-demand modules. Access foundational and advanced strategies, interactive quizzes, and build expertise with flexible, self-guided training.</p>
              <div className="ce-badge ce-badge--nssa">
                <ShieldIcon />
                {CE_NSSA} CE hours — Insurance, CFP, or CPE
              </div>
            </div>
            <div className="cred-card-footer-bar">
              <div>
                <div className="cred-price-label">Tuition</div>
                <div className="cred-price">{fmt(TUITION_1)}</div>
                <div className="cred-price-add">+ {fmt(CERT_1)} Exam, Certification &amp; Annual Dues</div>
              </div>
              <div className="cred-card-actions">
                <a href="/credentials/nssa" className="btn-cred btn-cred--nssa">Learn More</a>
                <a href="/enroll?course=nssa" className="btn-cred-outline btn-cred-outline--nssa">Enroll Now</a>
              </div>
            </div>
          </div>

          {/* IRMAACP */}
          <div className="cred-card">
            <div className="cred-card-header">
              <div className="cred-logo-wrap">
                <Image src="/assets/irmaa-logo.png" alt="IRMAACP — IRMAA Certified Planner" width={200} height={56} style={{ height: 56, width: 'auto' }} />
              </div>
              <div className="cred-tag-row">
                <span className="cred-card-tag tag-irmaa">Medicare &amp; IRMAA</span>
              </div>
            </div>
            <div className="cred-card-body">
              <h3>IRMAACP™ Medicare &amp; IRMAA Self-Paced Course</h3>
              <p>A complete framework for Medicare, IRMAA, and income planning. Covers Medicare basics, IRMAA calculations and appeals, and advanced strategies using retirement accounts, taxes, and withdrawals.</p>
              <div className="ce-badge ce-badge--irmaa">
                <ShieldIcon />
                {CE_IRMAACP} CE hours — Insurance, CFP, or CPE
              </div>
            </div>
            <div className="cred-card-footer-bar">
              <div>
                <div className="cred-price-label">Tuition</div>
                <div className="cred-price">{fmt(TUITION_1)}</div>
                <div className="cred-price-add">+ {fmt(CERT_1)} Exam, Certification &amp; Annual Dues</div>
              </div>
              <div className="cred-card-actions">
                <a href="/credentials/irmaacp" className="btn-cred btn-cred--irmaa">Learn More</a>
                <a href="/enroll?course=irmaacp" className="btn-cred-outline btn-cred-outline--irmaa">Enroll Now</a>
              </div>
            </div>
          </div>

          {/* CELP */}
          <div className="cred-card">
            <div className="cred-card-header">
              <div className="cred-logo-wrap">
                <Image src="/assets/celp-logo.png" alt="CELP — Certified End-of-Life Planner" width={200} height={56} style={{ height: 56, width: 'auto' }} />
              </div>
              <div className="cred-tag-row">
                <span className="cred-card-tag tag-celp">End-of-Life Planning</span>

              </div>
            </div>
            <div className="cred-card-body">
              <h3>CELP® Certified End-of-Life Planner</h3>
              <p>A complete framework for comprehensive end-of-life financial planning. Covers estate settlement, beneficiary coordination, survivor protection, tax-efficient asset transfer, and legacy planning.</p>
              <div className="ce-badge ce-badge--celp">
                <ShieldIcon />
                CE credit eligible — hours pending filing
              </div>
            </div>
            <div className="cred-card-footer-bar">
              <div>
                <div className="cred-price-label">Tuition upon acceptance</div>
                <div className="cred-price">{fmt(TUITION_CELP)}</div>
                <div className="cred-price-add">Application fee credited toward tuition</div>
              </div>
              <div className="cred-card-actions">
                <a href="/credentials/celp" className="btn-cred btn-cred--celp">Learn More</a>
                <a href="/credentials/celp#apply" className="btn-cred-outline btn-cred-outline--celp">Apply Now</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
