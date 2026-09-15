export default function ValueSection() {
  return (
    <section className="value-section">
      <div className="container">
        <div className="value-header">
          <div className="section-eyebrow">Why ARPI</div>
          <h2 className="section-title">Professional Development Built<br />for the Complexity You Face Daily</h2>
          <p className="section-sub">Regulatory landscapes shift. Client needs evolve. ARPI equips you with the deep expertise, the professional community, and the continuously updated resources to stay ahead.</p>
        </div>

        <div className="value-grid">
          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3>Earn a Credential That Signals Real Expertise</h3>
            <p>ARPI credentials are built by subject matter experts and designed for professionals who take their craft seriously. Your credential isn&apos;t a badge — it&apos;s proof of mastery your clients can rely on.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3>Engage With a Network of Accomplished Practitioners</h3>
            <p>ARPI members join a collegial community of financial advisors, tax specialists, retirement planners, and end-of-life professionals committed to advancing their expertise and client outcomes.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </div>
            <h3>Your Expertise Never Goes Stale</h3>
            <p>Medicare rules change. Tax law evolves. Social Security strategies shift. Your ARPI membership includes annually updated courses and expert-curated resources — so you stay ahead, always.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
