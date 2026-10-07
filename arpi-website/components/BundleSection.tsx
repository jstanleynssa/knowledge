import { fmt, TOTAL_1, TOTAL_2, CERT_2, SAVINGS_2 } from '@/lib/pricing'
import './BundleSection.css'

const CheckIcon = () => (
  <svg className="bundle-check" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <p className="section-sub">Pair NSSA® and IRMAACP™ and save significantly compared to enrolling individually.</p>
        </div>

        <div className="bundle-grid bundle-grid--single">

          {/* NSSA + IRMAACP Bundle */}
          <div className="bundle-card featured">
            <div className="bundle-tag">NSSA® + IRMAACP® Bundle</div>
            <h3>Social Security + IRMAA in One Package</h3>
            <div className="bundle-pricing">
              <span className="bundle-regular-price">{fmt(TOTAL_1 * 2)}</span>
              <span className="bundle-sale-price">{fmt(TOTAL_2)}</span>
              <span className="bundle-inline-save">save {fmt(SAVINGS_2)}</span>
            </div>
            <div className="bundle-dues">Includes tuition + {fmt(CERT_2)} Dual Exam, Certification &amp; Annual Dues</div>
            <ul className="bundle-includes">
              <li><CheckIcon />NSSA® and IRMAACP™ — both credentials</li>
              <li><CheckIcon />Self-paced on-demand access to both courses</li>
              <li><CheckIcon />Lifetime access with annual content updates</li>
              <li><CheckIcon />Full ARPI membership community included</li>
            </ul>
            <a href="/enroll?course=nssa-irmaacp" className="bundle-cta">Enroll in NSSA® + IRMAACP® Bundle</a>
          </div>

        </div>

        <p className="bundle-individual-note">
          Prefer to start with one? <a href="/credentials">View individual credentials →</a>
        </p>
      </div>
    </section>
  )
}
