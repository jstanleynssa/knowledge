const milestones = [
  {
    year: '2013',
    title: 'The First Social Security Credential',
    body: 'Marc Kiner and Jim Blair — a CPA with 40 years of experience and a 35-year SSA veteran — founded the National Social Security Advisor (NSSA®) program. It was the first professional certification in the country dedicated to Social Security strategy.',
  },
  {
    year: '2024',
    title: 'New Leadership, New Era',
    body: 'Social Security Professionals (SSP) acquired the NSSA program, with Jason Stanley taking the helm as Managing Director. The new leadership team brought upgraded technology, a modernized curriculum, and a broader vision for professional education.',
  },
  {
    year: '2025',
    title: 'IRMAACP™ Joins the Portfolio',
    body: 'ARPI acquired the IRMAA Certified Planner (IRMAACP™) designation, recognizing that Social Security and Medicare are inseparable for retirement planning clients. For the first time, advisors could earn both credentials under one roof.',
  },
  {
    year: '2026',
    title: 'CELP® and the Birth of ARPI',
    body: 'With the launch of the Certified End-of-Life Planner (CELP®) designation and the rebrand to the Advanced Retirement Planning Institute, ARPI became the first organization to credential advisors across the full arc of retirement benefits planning.',
  },
]

export default function HistorySection() {
  return (
    <section style={{ background: 'var(--bg-soft)', padding: '88px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-eyebrow">Our Story</div>
          <h2 className="section-title">Over a Decade of Building<br />the Profession&apos;s Gold Standard</h2>
        </div>

        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: 48,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--border)',
          }} />

          {milestones.map((m, i) => (
            <div key={m.year} className="history-milestone" style={{
              marginBottom: i < milestones.length - 1 ? 48 : 0,
            }}>
              {/* Year badge */}
              <div className="history-year-col">
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--green-mid)',
                  border: '3px solid #fff',
                  boxShadow: '0 0 0 2px var(--green-mid)',
                  marginTop: 4,
                }} />
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--green-dark)',
                  letterSpacing: '0.04em',
                }}>{m.year}</div>
              </div>

              {/* Content */}
              <div className="history-content-card">
                <h3 style={{
                  fontFamily: 'var(--font-merriweather), Georgia, serif',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: 12,
                  lineHeight: 1.35,
                }}>{m.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.75 }}>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
