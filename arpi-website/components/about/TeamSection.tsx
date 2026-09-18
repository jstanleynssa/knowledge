const team = [
  {
    name: 'Jason Stanley',
    title: 'Managing Director',
    initials: 'JS',
    bio: 'Jason leads ARPI with a focus on innovation, technology, and expanding the reach of professional certification in retirement benefits planning.',
    featured: true,
  },
  {
    name: 'Todd Valles',
    title: 'Director of IRMAA & Medicare Education',
    initials: 'TV',
    bio: 'Todd brings deep expertise in IRMAA, Medicare, and income planning, leading the development and delivery of the IRMAACP™ curriculum.',
  },
  {
    name: 'Cindi Hill',
    title: 'Director of Social Security Education',
    initials: 'CH',
    bio: 'Cindi oversees the NSSA® curriculum and continuing education, ensuring advisors receive the most current and accurate Social Security guidance.',
  },
  {
    name: 'CiCi Reidy',
    title: 'Director of Institutional Partnerships',
    initials: 'CR',
    bio: 'With 25 years spanning higher education, workforce development, and technology, CiCi specializes in building the partnerships and revenue structures that move organizations into new markets. A former Kaplan executive turned fractional VP through Reidy & Associates LLC, she chairs two national education-access committees and has led ventures into institutional and government markets. At ARPI, she leads institutional partnership development and strategic growth.',
  },
  {
    name: 'Richard Capezzali',
    title: 'Strategic Advisor',
    initials: 'RC',
    bio: 'Richard brings a 50-year track record of building, scaling, and exiting education and healthcare companies. He founded the National Institute for Paralegal Arts and Sciences, sold it to Kaplan Inc., and helped grow Kaplan University into one of the largest online higher-education institutions in the US as SVP of Marketing and Sales. He founded Education Connection, co-founded Revolve Capital (managing $100M+ in mortgage notes annually), and served on the board of Digital Media Solutions through its 2020 NYSE listing.',
  },
  {
    name: 'Marc Kiner',
    title: 'Co-Founder',
    initials: 'MK',
    bio: 'A licensed CPA with 40 years of experience and advanced degrees in Accounting, Finance, and Tax, Marc co-founded the NSSA program in 2013.',
  },
  {
    name: 'Jim Blair',
    title: 'Co-Founder',
    initials: 'JB',
    bio: 'Jim brings 49 years of Social Security expertise, including 35 years with the Social Security Administration, as one of the foremost authorities in the field.',
  },
]

export default function TeamSection() {
  return (
    <section style={{ background: '#fff', padding: '88px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="section-eyebrow">Meet the Team</div>
          <h2 className="section-title">The People Behind the Credential</h2>
          <p className="section-sub" style={{ margin: '16px auto 0' }}>
            A team of dedicated professionals with deep expertise in Social Security, Medicare,
            financial advising, and professional education.
          </p>
        </div>

        {/* Featured member */}
        <div className="about-featured-card" style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '40px 48px',
          marginBottom: 24,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--green-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>JS</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>Jason Stanley</h3>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                background: 'var(--green-xlight)',
                color: 'var(--green-dark)',
                padding: '3px 10px',
                borderRadius: 2,
              }}>Managing Director</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.75, maxWidth: 600 }}>
              Jason leads ARPI with a focus on innovation, technology, and expanding the reach of
              professional certification in retirement benefits planning.
            </p>
          </div>
        </div>

        {/* Rest of team */}
        <div className="about-team-grid">
          {team.slice(1).map((member) => (
            <div key={member.name} className="about-team-card" style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '32px',
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--green-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>{member.initials}</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{member.name}</h3>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-dark)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>{member.title}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-mid)', lineHeight: 1.7 }}>{member.bio}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Founders note */}
        <div style={{
          marginTop: 20,
          background: '#111827',
          borderRadius: 6,
          padding: '32px 40px',
        }} className="about-founders-note">
          <div style={{ color: 'var(--green-mid)', flexShrink: 0, marginTop: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--green-mid)', marginBottom: 8 }}>A Note on Our Founders</div>
            <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.75 }}>
              Together, Marc Kiner and Jim Blair brought over <strong style={{ color: '#fff' }}>80 years of combined expertise</strong> in Social
              Security, tax, and financial advising. Their decision to build the NSSA® certification
              program grounded it in the kind of real-world, regulatory precision that academic
              programs rarely achieve. Their founding vision remains the backbone of every credential ARPI offers today.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
