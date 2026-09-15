import { fmt, TOTAL_1, TOTAL_2, TOTAL_3, TOTAL_CELP, CERT_2, CERT_3, SAVINGS_2, SAVINGS_3 } from '@/lib/pricing'

const CheckIcon = () => (
  <svg className="bundle-check" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function BundleSection() {
  return (
    <section className="bundle-section">
      <div className="container">
        <div className="bundle-header">
          <div className="section-eyebrow">Bundle &amp; Save</div>
          <h2 className="section-title">Expand Your Expertise. Keep More in Your Pocket.</h2>
          <p className="section-sub">Pair any two or three credentials and save significantly compared to enrolling individually.</p>
        </div>

        <div className="bundle-grid">

          {/* 2-Credential Bundle */}
          <div className="bundle-card">
            <div className="bundle-tag">2-Credential Bundle</div>
            <h3>Any Two ARPI Credentials</h3>
            <div className="bundle-pricing">
              <span className="bundle-regular-price">{fmt(TOTAL_1 * 2)}</span>
              <span className="bundle-sale-price">{fmt(TOTAL_2)}</span>
              <span className="bundle-inline-save">save {fmt(SAVINGS_2)}</span>
            </div>
            <div className="bundle-dues">Includes tuition + {fmt(CERT_2)} Exam, Certification &amp; Annual Dues</div>
            <ul className="bundle-includes">
              <li><CheckIcon />Choose any 2 of NSSA®, IRMAACP™, or CELP®</li>
              <li><CheckIcon />Self-paced on-demand access to both courses</li>
              <li><CheckIcon />Lifetime access with annual content updates</li>
              <li><CheckIcon />Full ARPI membership community included</li>
            </ul>
            <a href="/enroll?bundle=2" className="bundle-cta">Enroll in 2-Credential Bundle</a>
          </div>

          {/* 3-Credential Bundle */}
          <div className="bundle-card featured">
            <div className="bundle-tag">3-Credential Bundle</div>
            <h3>All Three ARPI Credentials</h3>
            <div className="bundle-pricing">
              <span className="bundle-regular-price">{fmt(TOTAL_CELP + TOTAL_1 * 2)}</span>
              <span className="bundle-sale-price">{fmt(TOTAL_3)}</span>
              <span className="bundle-inline-save">save {fmt(SAVINGS_3)}</span>
            </div>
            <div className="bundle-dues">Includes tuition + {fmt(CERT_3)} Exam, Certification &amp; Annual Dues</div>
            <ul className="bundle-includes">
              <li><CheckIcon />NSSA®, IRMAACP™, and CELP® — all three credentials</li>
              <li><CheckIcon />Self-paced on-demand access to all three courses</li>
              <li><CheckIcon />Lifetime access with annual content updates</li>
              <li><CheckIcon />Full ARPI membership community included</li>
              <li><CheckIcon />Broadest positioning across all client verticals</li>
            </ul>
            <a href="/enroll?course=all" className="bundle-cta">Enroll in Complete Bundle</a>
          </div>

        </div>

        <p className="bundle-individual-note">
          Prefer to start with one? <a href="/credentials">View individual credentials ↑</a>
        </p>
      </div>
    </section>
  )
}
