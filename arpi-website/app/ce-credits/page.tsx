import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'CE Credit Information',
  description:
    'ARPI credentials offer CE hours for Insurance, CFP Board, and CPE requirements. View state-by-state Insurance CE approval status for NSSA® and IRMAACP™.',
}

// ─── State approval data (source: SSP Self Study Course Approvals, July 2026) ─
type Status = 'approved' | 'pending' | 'denied'

const STATE_DATA: { state: string; nssaHrs: number | null; nssaStatus: Status; irmaHrs: number | null; irmaStatus: Status; celpStatus: Status }[] = [
  { state: 'AK', nssaHrs: 4,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'AL', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'AR', nssaHrs: 3,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'AZ', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'CA', nssaHrs: null, nssaStatus: 'pending',  irmaHrs: null, irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'CO', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'CT', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'DC', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'DE', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'FL', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'GA', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'HI', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'IA', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'ID', nssaHrs: 4,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'IL', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'IN', nssaHrs: 5,    nssaStatus: 'pending',  irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'KS', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'KY', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'LA', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MA', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MD', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'ME', nssaHrs: 5,    nssaStatus: 'pending',  irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MI', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MN', nssaHrs: 5,    nssaStatus: 'pending',  irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MO', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MS', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'MT', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NC', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'ND', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NE', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NH', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NJ', nssaHrs: null, nssaStatus: 'denied',   irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NM', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NV', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'NY', nssaHrs: null, nssaStatus: 'pending',  irmaHrs: null, irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'OH', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'OK', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'OR', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'pending',  celpStatus: 'pending' },
  { state: 'PA', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'RI', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'SC', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'SD', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'TN', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'TX', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'UT', nssaHrs: 6,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'VA', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'VT', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'WA', nssaHrs: null, nssaStatus: 'denied',   irmaHrs: null, irmaStatus: 'denied',   celpStatus: 'pending' },
  { state: 'WI', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'WV', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
  { state: 'WY', nssaHrs: 5,    nssaStatus: 'approved', irmaHrs: 4,    irmaStatus: 'approved', celpStatus: 'pending' },
]

const STATUS_STYLES: Record<Status, { bg: string; color: string; label: string }> = {
  approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
  pending:  { bg: '#fef9c3', color: '#854d0e', label: 'Pending'  },
  denied:   { bg: '#fee2e2', color: '#991b1b', label: 'Denied'   },
}

function StatusCell({ hrs, status }: { hrs: number | null; status: Status }) {
  const s = STATUS_STYLES[status]
  return (
    <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: s.bg, color: s.color,
        fontWeight: 700, fontSize: '0.75rem',
        padding: '3px 10px', borderRadius: 999,
        whiteSpace: 'nowrap',
      }}>
        {status === 'approved' && hrs !== null ? `${hrs} hrs` : s.label}
      </span>
    </td>
  )
}

export default function CECreditsPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ── */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">Continuing Education</div>
              <h1 style={{ marginBottom: 20 }}>CE Credits with ARPI Credentials</h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                All three ARPI credentials include CE hours filed directly by ARPI —
                no paperwork required on your end. Insurance CE approvals vary by state.
              </p>
            </div>
          </div>
        </section>

        {/* ── Summary cards ── */}
        <section style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 56 }}>
              {[
                { name: 'NSSA®', full: 'National Social Security Advisor', cfp: '5.5 hrs', cpe: '6 hrs', insNote: 'Up to 6 hrs — varies by state', color: '#0c334c' },
                { name: 'IRMAACP™', full: 'IRMAA Certified Planner', cfp: '4 hrs', cpe: '4 hrs', insNote: '4 hrs — varies by state', color: '#7f1424' },
                { name: 'CELP®', full: 'Certified End-of-Life Planner', cfp: '4 hrs', cpe: '4 hrs', insNote: '6 hrs — most states', color: 'var(--green-dark)' },
              ].map(c => (
                <div key={c.name} style={{ border: '1px solid #e5e7eb', borderTop: `4px solid ${c.color}`, borderRadius: 8, padding: '28px 24px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.color, marginBottom: 6 }}>{c.name}</div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginBottom: 20 }}>{c.full}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Insurance CE', val: c.insNote },
                      { label: 'CFP Board', val: c.cfp },
                      { label: 'CPE', val: c.cpe },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                        <span style={{ color: '#6b7280' }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: '#111827' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── How CE filing works ── */}
            <div className="ce-filing-grid">
              <div>
                <div style={{ width: 32, height: 3, background: 'var(--green-dark)', borderRadius: 2, marginBottom: 14 }} />
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>How CE Filing Works</h3>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.8 }}>
                  We file directly with your state insurance department or the CFP Board on your behalf. No paperwork, no forms to submit. You receive a confirmation email and your CE credit appears in your member portal once filed.
                </p>
              </div>
              <div>
                <div style={{ width: 32, height: 3, background: 'var(--green-dark)', borderRadius: 2, marginBottom: 14 }} />
                <h3 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>Annual CE Requirements</h3>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.8 }}>
                  After earning your designation, you must complete 4 approved CE hours per designation per calendar year to maintain your credential. Current-year certifications are exempt. CE is tracked in your member portal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── State approval table ── */}
        <section style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '72px 0' }}>
          <div className="container">

            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: 10 }}>
                Insurance CE
              </p>
              <h2 style={{ fontFamily: 'var(--font-merriweather), Georgia, serif', fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                State Approval Status — NSSA® &amp; IRMAACP™
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
                CFP Board and CPE credits are accepted nationally. Insurance CE is state-regulated and approval status varies. The table below reflects current approvals as of July 2026.
              </p>

              {/* Timing warning */}
              <div style={{
                background: '#fef9c3', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b',
                borderRadius: 8, padding: '14px 18px', marginBottom: 36,
                fontSize: '0.875rem', color: '#78350f', lineHeight: 1.65,
              }}>
                <strong>Important timing rule:</strong> You must <em>not</em> complete the course before your state&apos;s Insurance CE approval is confirmed. Credits cannot be filed retroactively. Contact us if your state is listed as Pending before you begin.
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>State</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0c334c', borderBottom: '2px solid #e5e7eb', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>NSSA®</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#7f1424', borderBottom: '2px solid #e5e7eb', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>IRMAACP™</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--green-dark)', borderBottom: '2px solid #e5e7eb', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>CELP®</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATE_DATA.map((row) => (
                      <tr key={row.state} style={{ background: 'white' }}>
                        <td style={{ padding: '7px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, color: '#111827' }}>
                          {row.state}
                        </td>
                        <StatusCell hrs={row.nssaHrs} status={row.nssaStatus} />
                        <StatusCell hrs={row.irmaHrs} status={row.irmaStatus} />
                        <StatusCell hrs={null} status={row.celpStatus} />
                      </tr>
                    ))}
                    {/* National rows */}
                    <tr style={{ background: '#f9fafb' }}>
                      <td style={{ padding: '7px 16px', fontWeight: 700, color: '#111827', borderTop: '2px solid #e5e7eb' }}>CFP Board</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', borderTop: '2px solid #e5e7eb' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>5.5 hrs</span>
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', borderTop: '2px solid #e5e7eb' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>4 hrs</span>
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', borderTop: '2px solid #e5e7eb' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>4 hrs</span>
                      </td>
                    </tr>
                    <tr style={{ background: '#f9fafb' }}>
                      <td style={{ padding: '7px 16px', fontWeight: 700, color: '#111827' }}>CPE</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>6 hrs</span>
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>4 hrs</span>
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999 }}>4 hrs</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                {(['approved', 'pending', 'denied'] as Status[]).map(s => {
                  const st = STATUS_STYLES[s]
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#6b7280' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: st.bg, border: `1px solid ${st.color}`, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
                      {s === 'approved' && <span>— credit hours shown</span>}
                      {s === 'pending' && <span>— do not complete course before state approves</span>}
                      {s === 'denied' && <span>— Insurance CE not available in this state</span>}
                    </div>
                  )
                })}
              </div>

              <p style={{ marginTop: 20, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.6 }}>
                State approvals are updated regularly. For the most current status or questions about a specific state, <a href="/contact" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>contact us</a>.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '64px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: 20 }}>
              Questions about CE credits or your state&apos;s approval status?
            </p>
            <a href="/contact" className="btn-primary">Contact Us →</a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
