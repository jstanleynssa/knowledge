export default function MissionSection() {
  return (
    <section className="value-section" style={{ padding: '88px 0' }}>
      <div className="container">
        <div className="about-mission-grid">

          <div>
            <div className="section-eyebrow">Our Mission</div>
            <h2 className="section-title" style={{ marginBottom: 24 }}>
              Empowering Professionals Who Serve Clients at the Most Consequential Moments
            </h2>
            <div className="accent-hr" style={{ marginTop: 32 }} />
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              We empower financial professionals to become authoritative advisors on Social Security,
              Medicare, and end-of-life planning — the most complex and consequential financial
              decisions their clients will ever face.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginTop: 16 }}>
              By combining rigorous, expert-built curriculum with AI-powered knowledge retrieval and
              continuous regulatory updates, ARPI ensures advisors have both the credential and the
              tools to deliver confident, accurate guidance — year after year.
            </p>
          </div>

          <div>
            <div className="section-eyebrow">Our Approach</div>
            <h2 className="section-title" style={{ marginBottom: 24 }}>
              Built on Expertise.<br />Sustained by Innovation.
            </h2>
            <div style={{ marginTop: 32 }}>
              {[
                {
                  title: 'Expert-Built Curriculum',
                  body: 'Every ARPI credential was developed by practitioners with decades of direct experience in Social Security, Medicare, and financial planning — not generalists.',
                },
                {
                  title: 'Annually Updated Content',
                  body: 'Regulatory landscapes shift constantly. ARPI courses are reviewed and updated every year so your credential stays relevant long after you earn it.',
                },
                {
                  title: 'AXIOM® Intelligence Platform',
                  body: 'ARPI members access AXIOM, a federal benefits intelligence tool that surfaces regulatory guidance, models benefit scenarios, and supports client-ready answers.',
                },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                  <div style={{ width: 6, minWidth: 6, height: 6, borderRadius: '50%', background: 'var(--green-mid)', marginTop: 8 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6, fontSize: '0.95rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.75 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
