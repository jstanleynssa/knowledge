import Image from 'next/image'

const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function MembershipSection() {
  return (
    <section className="membership-section">
      <div className="container">
        <div className="membership-inner">
          <div>
            <div className="section-eyebrow">ARPI Membership</div>
            <h2 className="section-title">Your Credential is the Beginning,<br />Not the End</h2>
            <p className="section-sub">
              ARPI&apos;s membership model means your professional development never stops. Every credential
              comes with access to an active, growing community of peers who share your commitment to
              client excellence.
            </p>
            <ul className="member-benefits-list">
              <li><CheckIcon />Member community and support — peer connections, shared insights, and expert guidance</li>
              <li><CheckIcon />Annually updated courses — your knowledge stays current with every regulatory change</li>
              <li><CheckIcon />Expert-curated resource library — guides, case studies, and planning tools</li>
              <li><CheckIcon />Live webinars with industry experts and peer Q&amp;A sessions</li>
              <li><CheckIcon />Member directory — connect with advisors in your region and specialty</li>
            </ul>
          </div>

          <div className="member-stats-box">
            <div className="member-stat">
              <div className="member-stat-num">5,000<span>+</span></div>
              <div className="member-stat-label">Certifications Awarded</div>
            </div>
            <div className="member-stat">
              <Image src="/assets/FINRA-Logo.png" alt="FINRA" width={110} height={40} style={{ maxWidth: 110, width: '100%', margin: '0 auto 8px', display: 'block' }} />
              <div className="member-stat-label">FINRA Recognized</div>
            </div>
            <div className="member-stat">
              <div className="member-stat-num">∞</div>
              <div className="member-stat-label">Lifetime Course Access</div>
            </div>
            <a href="/membership" className="btn-primary">Explore Membership Benefits</a>
          </div>
        </div>
      </div>
    </section>
  )
}
