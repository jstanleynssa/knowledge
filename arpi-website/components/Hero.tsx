import Image from 'next/image'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-eyebrow">Advanced Retirement Planning Institute</div>
            <h1>Join a Community of<br />Trusted Professionals</h1>
            <p className="hero-sub">
              ARPI credentials are just the beginning. Earn your NSSA®, IRMAACP™, or CELP® designation
              and gain lifetime access to an active community of like-minded professionals, annually
              updated course materials, and ongoing post-certification support.
            </p>
            <div className="hero-actions">
              <a href="#credentials" className="btn-primary">Explore Credentials</a>
              <a href="/about" className="btn-outline">About ARPI</a>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-label">ARPI Credentials</div>

            <a href="/credentials/nssa" className="credential-pill">
              <Image className="cred-badge" src="/assets/nssa-cert.png" alt="NSSA" width={88} height={88} priority />
              <div className="cred-info">
                <div className="cred-header">
                  <div className="cred-name">NSSA®</div>
                  <div className="cred-full">National Social Security Advisor</div>
                </div>
                <p className="cred-desc">The gold standard in Social Security planning — master strategy for every claiming scenario.</p>
                <span className="cred-learn">Learn More →</span>
              </div>
            </a>

            <a href="/credentials/irmaacp" className="credential-pill">
              <Image className="cred-badge" src="/assets/irmaa-certificate.png" alt="IRMAACP" width={88} height={88} priority />
              <div className="cred-info">
                <div className="cred-header">
                  <div className="cred-name">IRMAACP™</div>
                  <div className="cred-full">IRMAA Certified Planner</div>
                </div>
                <p className="cred-desc">Navigate Medicare, IRMAA surcharges, and income planning for your most valuable clients.</p>
                <span className="cred-learn">Learn More →</span>
              </div>
            </a>

            <a href="/credentials/celp" className="credential-pill">
              <Image className="cred-badge" src="/assets/celp-certificate.png" alt="CELP" width={88} height={88} priority />
              <div className="cred-info">
                <div className="cred-header">
                  <div className="cred-name">CELP®</div>
                  <div className="cred-full">Certified End-of-Life Planner</div>
                </div>
                <p className="cred-desc">Guide families through estate coordination, survivor protection, and end-of-life planning.</p>
                <span className="cred-learn">Learn More →</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
