/**
 * /about/nssa-arpi — Announcement: NSSA is now part of ARPI
 */
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'NSSA® Is Now Part of ARPI',
  description:
    'The National Social Security Advisors program has a new home. Learn why we launched the Advanced Retirement Planning Institute and what it means for NSSA® members and credential holders.',
}

export default function NssaArpiPage() {
  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section style={{
          background: 'var(--green-dark)',
          color: 'var(--white)',
          padding: '88px 0 80px',
          textAlign: 'center',
        }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 99,
              padding: '5px 16px',
              marginBottom: 28,
              color: 'var(--green-xlight)',
            }}>
              Announcement
            </div>
            <h1 style={{
              fontFamily: 'var(--font-merriweather), Georgia, serif',
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: '0 0 24px',
              color: 'var(--white)',
            }}>
              NSSA® Is Now Part of the<br />Advanced Retirement Planning Institute
            </h1>
            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.82)',
              margin: '0 auto',
              maxWidth: 580,
            }}>
              Same credential. Same team. Same standards.<br />A broader platform built for everything retirement planning has become.
            </p>
          </div>
        </section>

        {/* ── What Changed ─────────────────────────────────────────── */}
        <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="section-eyebrow">What Changed</div>
            <h2 className="section-title" style={{ marginBottom: 24 }}>NSSA® Has a New Home</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 20 }}>
              The National Social Security Advisors (NSSA®) program — founded in 2013 by Marc Kiner
              and Jim Blair — is now offered through the Advanced Retirement Planning Institute (ARPI),
              the platform brand we built to house our growing family of retirement planning credentials.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 0 }}>
              If you earned your NSSA® through nssapros.com, nothing about your credential changes.
              Your designation is fully valid, your CE obligations and annual membership continue
              exactly as before, and the same team is behind everything. The platform has grown
              — the credential hasn&apos;t moved.
            </p>
          </div>
        </section>

        {/* ── Why We Built ARPI ────────────────────────────────────── */}
        <section style={{ padding: '80px 0', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="section-eyebrow">Why We Did It</div>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Built to Serve the Full Retirement Planning Sector</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 20 }}>
              NSSA was always about more than a single credential. As we expanded into Medicare
              and IRMAA planning with the IRMAACP™ designation, and then into end-of-life financial
              coordination with the upcoming CELP® certification, it became clear that our work had
              outgrown a single-credential identity.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 20 }}>
              We launched ARPI because we want to fully serve the retirement planning sector — not
              just one corner of it. Social Security, Medicare, IRMAA, and end-of-life planning are
              deeply interconnected. Advisors and their clients deserve a single institution that
              handles all of it with the same rigor.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              ARPI is that institution.
            </p>
          </div>
        </section>

        {/* ── What ARPI Is ─────────────────────────────────────────── */}
        <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="section-eyebrow">What ARPI Is</div>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Three Designations. One Platform.</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 48 }}>
              ARPI is a credential and education platform that equips financial advisors with
              specialized expertise across the full arc of retirement planning — from Social Security
              claiming to Medicare decisions to end-of-life financial coordination.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              {[
                {
                  name: 'NSSA®',
                  full: 'National Social Security Advisor',
                  desc: 'The original credential. Social Security strategy, claiming rules, spousal and survivor benefits — verified against SSA POMS.',
                  href: '/credentials/nssa',
                },
                {
                  name: 'IRMAACP™',
                  full: 'IRMAA Certified Planner',
                  desc: 'Medicare surcharges, the two-year look-back rule, and life-changing event appeals — the income-related side of Medicare planning.',
                  href: '/credentials/irmaacp',
                },
                {
                  name: 'CELP®',
                  full: 'Certified End-of-Life Planner',
                  desc: 'The newest designation. End-of-life financial coordination — helping advisors guide clients through the most consequential decisions of their financial lives.',
                  href: '/credentials/celp',
                },
              ].map(cred => (
                <a key={cred.name} href={cred.href} className="arpi-cred-card">
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-dark)', marginBottom: 4 }}>{cred.name}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.02em', marginBottom: 12 }}>{cred.full}</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{cred.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── What Stays the Same ──────────────────────────────────── */}
        <section style={{ padding: '80px 0', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="section-eyebrow">For NSSA® Members</div>
            <h2 className="section-title" style={{ marginBottom: 40 }}>Everything That Matters Stays the Same</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                'Your NSSA® designation is fully valid — nothing to renew or re-certify',
                'CE requirements and the annual membership cycle are unchanged',
                'Monthly member calls, CE credits, and the member portal continue as normal',
                'The curriculum is updated annually, same as always',
                'Same team. Same standards. Same commitment to keeping the credential rigorous.',
                'Questions? Reach us at support@arpinstitute.com',
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '16px 20px',
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <span style={{ color: 'var(--green-mid)', fontWeight: 700, fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: '0.92rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mission link ─────────────────────────────────────────── */}
        <section style={{ padding: '64px 0', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: 24 }}>
              Want to understand what drives every decision we make?
            </p>
            <a href="/mission" className="btn-outline-dark" style={{ display: 'inline-block' }}>
              Read Our Mission →
            </a>
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}
