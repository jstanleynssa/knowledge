const team = [
  {
    name: 'Jason Stanley',
    title: 'Managing Director',
    initials: 'JS',
    bio: 'Jason built his career at the intersection of creativity, technology, and business strategy — starting as a web designer in the late 1990s and growing into leadership roles that consistently brought those disciplines together. He spent 12 years at Coalmarch Productions, a digital marketing agency he helped build as Creative Director before taking over as CEO, where he grew revenue 5× in five years. He then joined Canopy Lawn Care as CMO, overseeing a full rebrand, building integrated sales and marketing automation, and growing monthly recurring revenue 56% while reducing sales headcount by 40%. He completed AI and business strategy coursework at MIT Sloan School of Management in 2023. At ARPI, he leads strategy, technology, marketing, and member experience — building the systems, platforms, and infrastructure that help financial professionals earn and apply the credentials that matter most to their clients.',
    featured: true,
  },
  {
    name: 'Todd Valles',
    title: 'Director of IRMAA & Medicare Education',
    initials: 'TV',
    bio: 'Todd spent nearly a decade at T. Rowe Price as VP of Separate Account Sales for the Northeast, working directly with annuity wholesalers at Jackson, Corebridge, Equitable, Prudential, Lincoln, PacLife, Protective, and Delaware. Before that he was an investment and economic sales resource at Prudential Financial covering broker-dealer and bank channels. That front-line wholesaler experience — understanding precisely how advisors think about annuity products alongside income and Medicare planning — is what he brings to the IRMAACP™ curriculum. At ARPI since 2023, he designs and continuously updates the IRMAA certification course, presents Medicare and Social Security strategy to wholesaler teams nationwide, and leads webinars helping advisors confidently integrate IRMAA costs into every client conversation.',
  },
  {
    name: 'Cindi Hill',
    title: 'Director of Social Security Education',
    initials: 'CH',
    bio: 'Cindi holds one of the deeper credential stacks in retirement planning — CFP®, ChFC®, RICP®, CRPC®, ABFP®, and NSSA® — backed by 33 years at TruStage, where she led the financial planning initiative for TruStage Wealth Management Consulting Services. In that role she supported and coached credit union investment programs and their advisors nationwide on IRA and qualified plan strategy, Social Security claiming, and Medicare planning, while also building a national speaking career at industry conferences, advisor trainings, and client events across the country. In 2025 she launched CKH Consulting LLC, partnering with financial advisors on case design, advanced retirement income planning, and client-facing education. At ARPI, she oversees the NSSA® curriculum and continuing education — ensuring the guidance advisors receive reflects the most current rules, regulations, and real-world planning scenarios.',
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
    title: 'NSSA® Co-Founder',
    initials: 'MK',
    bio: 'Marc is a licensed CPA with over 40 years of experience and advanced degrees in Accounting, Finance, and Tax from the University of Cincinnati. Since 2010 he has run a Social Security consulting and education practice focused on helping individuals maximize their benefits and training advisors across the country to do the same. He co-founded the NSSA® program in 2013 and has served as course developer and instructor ever since — building the curriculum around the intersection of tax strategy and Social Security planning that most credential programs never address.',
  },
  {
    name: 'Jim Blair',
    title: 'NSSA® Co-Founder',
    initials: 'JB',
    bio: 'Jim brought 34½ years inside the Social Security Administration to the founding of NSSA®. His SSA career began as a Service Representative, progressed through Claims Representative and Operations Supervisor, and culminated as District Manager of the Piqua, Ohio office — one of the few practitioners who has sat on both sides of every Social Security decision. He holds a BS in Administrative Management from the University of Cincinnati. Jim co-founded the NSSA® program in 2013 to give financial advisors the ground-level regulatory fluency he earned across nearly four decades at the agency.',
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
              <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>{team[0].name}</h3>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                background: 'var(--green-xlight)',
                color: 'var(--green-dark)',
                padding: '3px 10px',
                borderRadius: 2,
              }}>{team[0].title}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.75, maxWidth: 600 }}>
              {team[0].bio}
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
