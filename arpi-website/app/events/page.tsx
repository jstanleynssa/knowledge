import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Webinars & Events',
  description:
    'ARPI hosts monthly member calls, webinars, and in-person events for credentialed financial professionals.',
  robots: { index: false, follow: false },
}

const EVENTS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    label: 'Monthly',
    heading: 'Monthly Member Call',
    body: 'Live Zoom call open to all credentialed members. Attendance of 40 or more minutes earns automatic CE credit — filed directly on your behalf. Meeting ID is posted in your member portal each month.',
    tag: 'CE Credit Available',
    tagColor: 'var(--green-dark)',
    tagBg: 'var(--green-xlight)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    label: 'Ongoing',
    heading: 'Topical Webinars',
    body: 'Deep-dives on Social Security updates, Medicare changes, IRMAA bracket shifts, and end-of-life planning trends. Announced via member email — watch your inbox for upcoming topics.',
    tag: 'Members Only',
    tagColor: 'var(--blue-dark)',
    tagBg: 'var(--blue-xlight)',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: 'Annual',
    heading: 'In-Person Events',
    body: 'Annual conference and regional gatherings for credentialed ARPI members. Connect with peers, hear from subject-matter experts, and earn CE hours in person.',
    tag: 'Next: Dallas, TX — Sep 23–25, 2026',
    tagColor: '#7d4a00',
    tagBg: '#fdf0d9',
    note: 'Details coming soon.',
  },
]

export default function EventsPage() {
  return (
    <>
      <Nav />
      <main>

        {/* Hero */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">Events</div>
              <h1 style={{ marginBottom: 20 }}>Webinars &amp; Events</h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                ARPI hosts regular events for credentialed professionals — from monthly member calls
                to specialized webinars and in-person conferences.
              </p>
            </div>
          </div>
        </section>

        {/* Event blocks */}
        <section style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {EVENTS.map((ev, i) => (
                <div key={i} className="event-card-grid">
                  {/* Icon column */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 6,
                    background: 'var(--green-xlight)',
                    color: 'var(--green-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {ev.icon}
                  </div>

                  {/* Content */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}>
                      <h2 style={{
                        fontFamily: 'var(--font-merriweather), Georgia, serif',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}>
                        {ev.heading}
                      </h2>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: ev.tagColor,
                        background: ev.tagBg,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}>
                        {ev.tag}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.95rem',
                      color: 'var(--ink-mid)',
                      lineHeight: 1.75,
                      marginBottom: ev.note ? 12 : 0,
                    }}>
                      {ev.body}
                    </p>
                    {ev.note && (
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--ink-light)',
                        fontStyle: 'italic',
                      }}>
                        {ev.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--green-dark)', padding: '72px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
              fontWeight: 700,
              color: '#fff',
              marginBottom: 16,
            }}>
              Ready to Join the Community?
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 32,
              maxWidth: 480,
              margin: '0 auto 32px',
            }}>
              Earn your ARPI credential and get access to monthly calls, webinars, and in-person events.
            </p>
            <a href="/enroll" className="btn-primary" style={{
              background: '#fff',
              color: 'var(--green-dark)',
              border: '2px solid #fff',
            }}>
              Become a Member →
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
