'use client'

// app/calculus/page.tsx
// CALCULUS marketing page — mirrors the AXIOM page structure.
// Reuses ax-* CSS classes from globals.css; #calc scope overrides blue → green.

import { useState } from 'react'
import Image from 'next/image'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const MONTHLY        = 19
const ANNUAL         = 195
const ANNUAL_MONTHLY = 16   // $195 / 12, rounded down

const TOOL_URL = 'https://calculus.arpinstitute.com'

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconShield({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconUsers({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconBarChart({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function IconCalendar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconSave({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
function IconPrinter({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
function IconUser({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconTrendingUp({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const schemaApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CALCULUS',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description:
    'A purpose-built Social Security breakeven calculator for financial advisors. Compare two filing strategies side-by-side with SSA Period Life Tables, correct spousal benefit math, and unlimited saved scenarios.',
  url: 'https://calculus.arpinstitute.com',
  offers: {
    '@type': 'Offer',
    price: '19.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'Advanced Retirement Planning Institute',
      url: 'https://arpinstitute.com',
    },
  },
  creator: {
    '@type': 'Organization',
    name: 'Advanced Retirement Planning Institute',
    url: 'https://arpinstitute.com',
  },
  featureList: [
    'Two-strategy side-by-side Social Security comparison',
    'SSA 2023 Period Life Tables with health tier adjustments',
    'Correct spousal benefit reduction calculation',
    'Unlimited saved client scenarios',
    'Print-ready PDF output',
    'Cumulative benefit chart',
    'Year-by-year breakeven table',
  ],
}

const schemaFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a Social Security breakeven calculator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Social Security breakeven calculator compares two filing strategies — typically filing early vs. waiting — and shows the exact age at which the cumulative benefit of the later strategy surpasses the head start from filing early. CALCULUS does this with SSA 2023 Period Life Tables and actuarially correct spousal benefit math.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I calculate the Social Security breakeven age?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Social Security breakeven age is the point where the cumulative lifetime benefit of a later filing strategy overtakes the benefit of filing earlier. CALCULUS calculates this automatically using SSA Period Life Tables, health tier adjustments, and full spousal benefit formulas — and shows the crossover down to the month.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does CALCULUS handle spousal Social Security benefits?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. CALCULUS correctly calculates spousal benefit reduction based on when the lower earner actually claims the spousal benefit — not when the higher earner files. Most calculators get this wrong, which can shift the breakeven age by years and lead clients to the wrong filing decision.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is CALCULUS free to try?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. CALCULUS offers a 7-day free trial with full access. No charge until day 8. After the trial, pricing is $19/month or $195/year ($16/month). Cancel any time from your dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is CALCULUS built for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CALCULUS is purpose-built for financial advisors who need to present defensible, data-driven Social Security filing recommendations to clients. It was created by the team behind NSSA® and IRMAACP® — the leading credentials for Social Security planning specialists.',
      },
    },
  ],
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CalculusPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      <Nav />
      <main id="calc">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }} />

        {/* ── Scoped green palette + page-specific overrides ── */}
        <style>{`
          #calc {
            --calc-dark:    #1a4a37;
            --calc-green:   #2a6b54;
            --calc-mid:     #3d8a6e;
            --calc-light:   #6fa896;
            --calc-xlight:  #d9ede5;
          }
          /* Recolour ax-* blue references → green for this page */
          #calc .ax-hero::before { background: radial-gradient(circle, rgba(42,107,84,0.12) 0%, transparent 68%); }
          #calc .ax-hero::after  { background: radial-gradient(circle, rgba(42,107,84,0.07) 0%, transparent 60%); }
          #calc .ax-eyebrow { color: var(--calc-green); }
          #calc .ax-eyebrow::before { background: var(--calc-green); }
          #calc .ax-trust-pill { border-color: rgba(42,107,84,0.25); color: rgba(255,255,255,0.7); }
          #calc .ax-trust-pill svg { color: var(--calc-mid); }
          #calc .ax-diff-check { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-yes--green { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-feat-check { color: var(--calc-xlight); }

          /* Green stat card */
          #calc .ax-stat-card { background: rgba(42,107,84,0.25); border-color: rgba(42,107,84,0.45); }
          #calc .ax-corpus-tags span { background: rgba(42,107,84,0.25); border-color: rgba(42,107,84,0.3); }
          /* Blue → green overrides for all inherited ax-* elements */
          #calc .ax-step-icon { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-corpus-icon { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-corpus-stat { color: var(--calc-green); }
          #calc .ax-plan-cta--primary { background: var(--calc-green); border-color: var(--calc-green); }
          #calc .ax-plan-cta--primary:hover { background: var(--calc-dark); border-color: var(--calc-dark); }
          #calc .ax-diff-check { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-yes--green { background: var(--calc-xlight); color: var(--calc-green); }
          #calc .ax-toggle-btn--on { background: var(--calc-green); border-color: var(--calc-green); color: white; }
          #calc .ax-save-chip { background: rgba(255,255,255,0.2); }

          /* Strategy comparison card */
          .calc-demo-card {
            background: white;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 24px 64px rgba(0,0,0,0.18);
            max-width: 760px;
            margin: 0 auto;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .calc-demo-header {
            background: #1a4a37;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .calc-demo-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.6);
          }
          .calc-demo-body {
            padding: 24px;
          }
          .calc-strat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .calc-strat {
            border-radius: 10px;
            padding: 16px;
          }
          .calc-strat-a { background: #f0faf5; border: 1.5px solid #a7d4bf; }
          .calc-strat-b { background: #fff8f0; border: 1.5px solid #f5c28a; }
          .calc-strat-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .calc-strat-a .calc-strat-label { color: #2a6b54; }
          .calc-strat-b .calc-strat-label { color: #b45309; }
          .calc-strat-age { font-size: 1.5rem; font-weight: 800; color: #1f2937; line-height: 1; margin-bottom: 4px; }
          .calc-strat-benefit { font-size: 1.25rem; font-weight: 700; color: #1f2937; }
          .calc-strat-note { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .calc-breakeven-row {
            background: #f9fafb;
            border-radius: 10px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .calc-be-label { font-size: 13px; color: #6b7280; font-weight: 500; }
          .calc-be-val { font-size: 1.5rem; font-weight: 800; color: #1a4a37; }
          .calc-be-sub { font-size: 12px; color: #6b7280; }
          .calc-demo-note {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            margin-top: 12px;
          }

          /* Breakeven tiles */
          .calc-be-tiles {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
          @media (max-width: 900px) { .calc-be-tiles { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 560px) { .calc-be-tiles { grid-template-columns: 1fr; } }
          .calc-be-tile {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 22px 20px;
            color: white;
          }
          .calc-be-tile-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255,255,255,0.55);
            margin-bottom: 10px;
          }
          .calc-be-tile-num {
            font-size: 1.75rem;
            font-weight: 800;
            color: white;
            line-height: 1;
            margin-bottom: 4px;
          }
          .calc-be-tile-num em {
            font-style: normal;
            font-size: 1rem;
            font-weight: 500;
            color: rgba(255,255,255,0.6);
          }
          .calc-be-tile-detail {
            font-size: 12px;
            color: rgba(255,255,255,0.6);
            line-height: 1.5;
          }
          @media (max-width: 900px) {
            .calc-strat-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="ax-hero">
          <div className="container">
            <div className="ax-hero-inner">
              <div className="ax-hero-left">
                <p className="ax-hero-eyebrow">CALCULUS</p>
                <h1 className="ax-h1">
                  Know the exact<br />breakeven point.<br />For every client.
                </h1>
                <p className="ax-sub">
                  A purpose-built Social Security breakeven calculator for financial
                  advisors. Two strategies, compared side-by-side. SSA Period Life Tables
                  built in. Spousal benefit math that's actually correct.
                </p>
                <div className="ax-hero-actions">
                  <span className="btn-primary" style={{ cursor: 'default', opacity: 0.85 }}>Launching Q4 2026</span>
                  <a href="#how-it-works" className="btn-outline-dark">See How It Works</a>
                </div>
                <div className="ax-trust-row">
                  <span className="ax-trust-pill"><IconShield size={13} /> SSA Period Life Tables</span>
                  <span className="ax-trust-pill"><IconCheck size={13} /> Correct Spousal Math</span>
                  <span className="ax-trust-pill"><IconSave size={13} /> Saved Scenarios</span>
                </div>
              </div>

              <div className="ax-hero-right">
                <div style={{ marginBottom: 20 }}>
                  <Image
                    src="/assets/calculus-full-badge.png"
                    alt="CALCULUS"
                    width={957}
                    height={300}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ width: '100%', height: 'auto' }}
                    priority
                  />
                </div>
                <div className="ax-stat-card">
                  <div className="ax-stat-grid">
                    <div className="ax-stat">
                      <span className="ax-stat-n">2</span>
                      <span className="ax-stat-d">Strategies Compared</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">SSA</span>
                      <span className="ax-stat-d">Period Life Tables</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">100%</span>
                      <span className="ax-stat-d">Spousal Math Coverage</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">∞</span>
                      <span className="ax-stat-d">Saved Scenarios</span>
                    </div>
                  </div>
                  <div className="ax-corpus-tags" style={{ marginTop: 20 }}>
                    <span>File at 62</span><span>File at FRA</span><span>File at 70</span><span>Any Age</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Problem ────────────────────────────────────────────── */}
        <section className="ax-section ax-problem">
          <div className="container">
            <div className="ax-problem-centered">
              <p className="ax-eyebrow">The Problem</p>
              <h2 className="ax-h2">Most Social Security tools take longer to learn than the client meeting itself.</h2>
              <p className="ax-body">
                Full retirement planning suites. Integrated projections. Tax modules. Monte Carlo
                simulations. They're powerful — and for most advisors, complete overkill when all
                you need is a breakeven. The learning curve is steep, the interface is dense, and
                by the time you find the right screen, you've lost the room.
              </p>
              <p className="ax-body">
                The math is complicated. So is the decision. File too early and you lock in a
                permanent reduction. Wait too long and you leave years of income on the table.
                Either way, the filing date is permanent. CALCULUS handles the math so you can
                focus on the decision — simple, accurate, ready in two minutes, without the
                training manual.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Solution ───────────────────────────────────────────── */}
        <section className="ax-section ax-solution">
          <div className="container">
            <div className="ax-solution-header">
              <p className="ax-eyebrow">The Solution</p>
              <h2 className="ax-h2">Enter two strategies. See the exact crossover — down to the month.</h2>
            </div>

            <div className="calc-demo-card">
              <div className="calc-demo-header">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <span className="calc-demo-title" style={{ marginLeft: 8 }}>CALCULUS — Strategy Comparison</span>
              </div>
              <div className="calc-demo-body">
                <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                  <strong style={{ color: '#1f2937' }}>Client:</strong> Female, age 62 · PIA $1,500 · Husband age 64, PIA $3,800
                </div>
                <div className="calc-strat-grid">
                  <div className="calc-strat calc-strat-a">
                    <div className="calc-strat-label">Strategy A — File Now</div>
                    <div className="calc-strat-age">Age 62</div>
                    <div className="calc-strat-benefit">$1,050<span style={{ fontSize: '0.8em', fontWeight: 500, color: '#6b7280' }}>/mo</span></div>
                    <div className="calc-strat-note">30% reduction for 60 months early</div>
                    <div className="calc-strat-note" style={{ marginTop: 8 }}>+ Spousal add-on at 65: <strong>$333/mo</strong></div>
                    <div className="calc-strat-note"><strong style={{ color: '#1f2937' }}>$1,383/mo</strong> from age 65</div>
                  </div>
                  <div className="calc-strat calc-strat-b">
                    <div className="calc-strat-label">Strategy B — Wait to FRA</div>
                    <div className="calc-strat-age">Age 67</div>
                    <div className="calc-strat-benefit">$1,500<span style={{ fontSize: '0.8em', fontWeight: 500, color: '#6b7280' }}>/mo</span></div>
                    <div className="calc-strat-note">Full benefit — no reduction</div>
                    <div className="calc-strat-note" style={{ marginTop: 8 }}>+ Spousal add-on at 67: <strong>$400/mo</strong></div>
                    <div className="calc-strat-note"><strong style={{ color: '#1f2937' }}>$1,900/mo</strong> from age 67</div>
                  </div>
                </div>
                <div className="calc-breakeven-row">
                  <div>
                    <div className="calc-be-label">Breakeven Age</div>
                    <div className="calc-be-val">78.7</div>
                    <div className="calc-be-sub">Strategy B pays off at ~age 79</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="calc-be-label">Monthly Advantage After 67</div>
                    <div className="calc-be-val">+$517<span style={{ fontSize: '1rem', fontWeight: 500, color: '#6b7280' }}>/mo</span></div>
                    <div className="calc-be-sub">Strategy B vs Strategy A</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="calc-be-label">Lifetime Gain to Age 90</div>
                    <div className="calc-be-val" style={{ color: '#2a6b54' }}>+$71,700</div>
                    <div className="calc-be-sub">By waiting to FRA</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="calc-demo-note" style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 14 }}>
              Actual CALCULUS output · Spousal reduction correctly calculated using claimant's age at time of spousal claim
            </p>
          </div>
        </section>

        {/* ── The Numbers ────────────────────────────────────────────── */}
        <section className="ax-section" style={{ background: 'var(--calc-dark, #1a4a37)', padding: '80px 0' }}>
          <div className="container">
            <div className="ax-cost-section-header" style={{ marginBottom: '2.5rem' }}>
              <p className="ax-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>The Numbers</p>
              <h2 className="ax-h2" style={{ color: 'white' }}>Five years of early filing costs your client — permanently.</h2>
            </div>

            <div className="calc-be-tiles">
              <div className="calc-be-tile">
                <div className="calc-be-tile-label">Head Start (Age 62–67)</div>
                <div className="calc-be-tile-num">$63,000</div>
                <div className="calc-be-tile-detail">60 months × $1,050/mo collected before FRA</div>
              </div>
              <div className="calc-be-tile">
                <div className="calc-be-tile-label">Monthly Gap After 67</div>
                <div className="calc-be-tile-num">$517<em>/mo</em></div>
                <div className="calc-be-tile-detail">Strategy B ($1,900) vs Strategy A ($1,383) — every month for life</div>
              </div>
              <div className="calc-be-tile">
                <div className="calc-be-tile-label">Breakeven Age</div>
                <div className="calc-be-tile-num">78.7</div>
                <div className="calc-be-tile-detail">Head start erased 11.7 years after FRA</div>
              </div>
              <div className="calc-be-tile" style={{ background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="calc-be-tile-label">Net Lifetime Gain to 90</div>
                <div className="calc-be-tile-num">$71,700</div>
                <div className="calc-be-tile-detail">By waiting. This is what the right decision is worth — and why the math has to be right.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────────────── */}
        <section id="how-it-works" className="ax-section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="ax-eyebrow" style={{ textAlign: 'center' }}>How It Works</p>
            <h2 className="ax-h2" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 16px' }}>
              Enter the details.<br />See the crossover.
            </h2>
            <p className="ax-body" style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 56px' }}>
              CALCULUS is not a generic retirement planner. It's a focused tool that does one thing
              precisely: compares two Social Security filing strategies with actuarially correct math.
            </p>
            <div className="ax-steps">
              <div className="ax-step">
                <div className="ax-step-num">01</div>
                <div className="ax-step-icon"><IconUser /></div>
                <h3>Enter client details</h3>
                <p>Ages, estimated PIAs, marital status, health tier, and the two filing ages you want to compare. No spreadsheet required.</p>
              </div>
              <div className="ax-step-arrow"><IconArrowRight size={20} /></div>
              <div className="ax-step">
                <div className="ax-step-num">02</div>
                <div className="ax-step-icon"><IconBarChart /></div>
                <h3>CALCULUS models both strategies</h3>
                <p>SSA 2023 Period Life Tables with cohort correction, full spousal benefit calculation, COLA applied consistently across both strategies.</p>
              </div>
              <div className="ax-step-arrow"><IconArrowRight size={20} /></div>
              <div className="ax-step">
                <div className="ax-step-num">03</div>
                <div className="ax-step-icon"><IconTrendingUp /></div>
                <h3>Show your client the crossover</h3>
                <p>Cumulative benefit chart, exact breakeven month, and a year-by-year table — ready to save, print, or share. Every time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── What's Inside ──────────────────────────────────────────── */}
        <section className="ax-section ax-corpus-section">
          <div className="container">
            <p className="ax-eyebrow">What's Included</p>
            <h2 className="ax-h2">Built for the way advisors actually work</h2>
            <p className="ax-body" style={{ maxWidth: 580 }}>
              CALCULUS was built by the team behind NSSA® and IRMAACP® — the people who teach
              Social Security planning for a living. Every feature exists because advisors asked for it.
            </p>
            <div className="ax-corpus-grid">
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconCalendar /></div>
                <h3>SSA Period Life Tables</h3>
                <p>2023 SSA actuarial life tables with cohort correction and health tier adjustments — the same source the SSA itself uses to model life expectancy.</p>
                <div className="ax-corpus-stat">Male · Female · 5 health tiers</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconUsers /></div>
                <h3>Full Spousal Benefit Math</h3>
                <p>Correct spousal reduction formula — calculated based on when the lower earner actually claims the spousal benefit, not when the higher earner files. The distinction matters.</p>
                <div className="ax-corpus-stat">Single &amp; married scenarios</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconSave /></div>
                <h3>Save Unlimited Scenarios</h3>
                <p>Save every client's scenario by name. Load it back in one click. Compare different filing ages for the same client without re-entering everything.</p>
                <div className="ax-corpus-stat">Persistent across sessions</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconPrinter /></div>
                <h3>Print-Ready PDF Output</h3>
                <p>Clean, branded output ready to hand to your client or drop into your case file. The chart, the breakeven, and the year-by-year table — on one page.</p>
                <div className="ax-corpus-stat">One click to print</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why CALCULUS ───────────────────────────────────────────── */}
        <section className="ax-section ax-diff-section">
          <div className="container">
            <div className="ax-diff-grid">
              <div>
                <p className="ax-eyebrow">Why CALCULUS</p>
                <h2 className="ax-h2">The SSA's tool doesn't compare strategies.<br />Generic tools don't get the spousal math right.</h2>
                <p className="ax-body">
                  CALCULUS exists because no existing tool does all of this correctly. The SSA's online
                  calculator is a single-strategy estimator. Generic breakeven spreadsheets ignore
                  spousal reduction nuance. Neither is built for the advisor who needs to present
                  a defensible recommendation to a real client.
                </p>
                <ul className="ax-diff-list">
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Two strategies, one screen.</strong> Enter Strategy A and Strategy B.
                      See the crossover point directly — no back-and-forth between tabs or tools.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Spousal reduction that's actually correct.</strong> The reduction is
                      applied when the lower earner claims the spousal benefit — not when the
                      higher earner files. Most tools get this wrong and understate the benefit of waiting.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Life expectancy built in.</strong> No separate actuarial table to look up.
                      Select a health tier and CALCULUS handles the math — using the same SSA tables
                      behind the Social Security statement.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>A permanent record for your files.</strong> Save and print every scenario.
                      The output is your documentation of a data-driven recommendation.
                    </div>
                  </li>
                </ul>
              </div>
              <div className="ax-diff-right">
                <div className="ax-compare">
                  <div className="ax-compare-head">
                    <span>Capability</span>
                    <span>SSA / Generic</span>
                    <span>CALCULUS</span>
                  </div>
                  {([
                    ['Two-strategy side-by-side comparison', false, true],
                    ['Correct spousal reduction formula',    false, true],
                    ['SSA life tables built in',             false, true],
                    ['Health-adjusted life expectancy',      false, true],
                    ['Cumulative benefit chart',             false, true],
                    ['Save & reload scenarios',              false, true],
                    ['Print / PDF output',                   false, true],
                    ['Built for financial advisors',         false, true],
                  ] as [string, boolean, boolean][]).map(([label, other, calc], i) => (
                    <div key={i} className="ax-compare-row">
                      <span>{label}</span>
                      <span className={other ? 'ax-yes' : 'ax-no'}>{other ? <IconCheck size={14} /> : '—'}</span>
                      <span className={calc ? 'ax-yes ax-yes--green' : 'ax-no'}>{calc ? <IconCheck size={14} /> : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────── */}
        <section id="pricing" className="ax-section" style={{ background: '#2a6b54' }}>
          <div className="container">
            <p className="ax-eyebrow" style={{ color: 'rgba(255,255,255,0.65)' }}>Pricing</p>
            <h2 className="ax-h2" style={{ color: '#fff' }}>Flat-rate access. No per-scenario fees.</h2>

            <div className="ax-pricing-horiz">
              <div className="ax-pricing-left">
                <p className="ax-pricing-desc" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  One subscription. Unlimited scenarios. Compare any filing ages, for any client,
                  as many times as you need — and save every result.
                </p>
                <ul className="ax-plan-features">
                  {[
                    'Unlimited client scenarios',
                    'Two-strategy side-by-side comparison',
                    'SSA 2023 Period Life Tables + health tiers',
                    'Full spousal benefit calculation',
                    'Save and reload unlimited scenarios',
                    'Print / PDF output',
                  ].map((f, i) => (
                    <li key={i} style={{ color: 'rgba(255,255,255,0.9)' }}>
                      <span className="ax-feat-check" style={{ color: 'rgba(255,255,255,0.9)' }}><IconCheck size={13} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ax-pricing-right">
                <div className="ax-pricing-card">
                  <div className="ax-toggle-row" style={{ marginBottom: 28 }}>
                    <button
                      className={`ax-toggle-btn${!annual ? ' ax-toggle-btn--on' : ''}`}
                      onClick={() => setAnnual(false)}
                    >
                      Monthly
                    </button>
                    <button
                      className={`ax-toggle-btn${annual ? ' ax-toggle-btn--on' : ''}`}
                      onClick={() => setAnnual(true)}
                    >
                      Annual <span className="ax-save-chip">Save 2 months</span>
                    </button>
                  </div>

                  <div className="ax-plan-price">
                    <span className="ax-plan-dollar">$</span>
                    <span className="ax-plan-num">{annual ? ANNUAL_MONTHLY : MONTHLY}</span>
                    <span className="ax-plan-per">/mo</span>
                  </div>
                  {annual && (
                    <p className="ax-plan-annual-note">Billed ${ANNUAL}/year</p>
                  )}

                  <div className="ax-plan-cta ax-plan-cta--primary" style={{ textAlign: 'center', cursor: 'default', opacity: 0.85 }}>
                    Launching Q4 2026
                  </div>
                  <p className="ax-plan-fine">Early access opens Q4 2026. <a href="/contact" style={{ color: 'inherit', textDecoration: 'underline' }}>Get notified →</a></p>

                  <div className="ax-pricing-guarantee">
                    <IconShield size={15} />
                    <span>No charge until day 8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ax-firm-bar" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' }}>
              <div className="ax-firm-left">
                <div className="ax-firm-icon" style={{ color: '#fff', background: 'rgba(255,255,255,0.15)' }}><IconUsers /></div>
                <div>
                  <strong style={{ color: '#fff' }}>Team &amp; Firm Access</strong>
                  <p style={{ color: 'rgba(255,255,255,0.72)' }}>
                    Multiple advisors at the same firm? Contact us for volume pricing.
                  </p>
                </div>
              </div>
              <a href="/contact" className="btn-outline">Contact Us</a>
            </div>
          </div>
        </section>

        {/* ── CTA Band ───────────────────────────────────────────────── */}
        <section className="ax-cta-band">
          <div className="container ax-cta-inner">
            <div>
              <h2 className="ax-cta-h">CALCULUS launches Q4 2026.</h2>
              <p className="ax-cta-sub">
                Early access for ARPI credential holders. Get notified when it’s live.
              </p>
            </div>
            <a href="/contact" className="btn-primary ax-cta-btn">Get Notified</a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
