import Image from 'next/image'

export default function AxiomSection() {
  return (
    <section className="axiom-section">
      <div className="container">
        <div className="axiom-inner">
          <div className="axiom-content">
            <div className="accent-hr" />
            <h2 className="section-title">Introducing AXIOM®</h2>
            <p>
              AXIOM is a federal benefits intelligence platform purpose-built for professionals
              navigating the complex intersection of Social Security, Medicare, and federal retirement
              benefits. Available to advisors, planners, and firms of any credential background.
            </p>
            <p>
              Cross-reference regulatory guidance, model benefit scenarios, and generate
              client-ready summaries grounded in real policy sources — not AI hallucinations.
              Built for the precision your practice demands.
            </p>
            <div className="axiom-tag-row">
              <span className="axiom-tag">Policy Research</span>
              <span className="axiom-tag">Benefit Modeling</span>
              <span className="axiom-tag">Client Reports</span>
              <span className="axiom-tag">Open to All Advisors</span>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/axiom" className="btn-outline-dark">Explore AXIOM</a>
              <a href="/axiom#pricing" className="btn-primary">View Pricing</a>
            </div>
          </div>

          <div className="axiom-logo-wrap">
            <Image src="/assets/axiom-logo.png" alt="AXIOM®" width={200} height={110} style={{ height: 110, width: 'auto' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
