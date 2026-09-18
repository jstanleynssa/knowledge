'use client'

import { useState } from 'react'
import Image from 'next/image'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// ─── Icons ───────────────────────────────────────────────────
function IconSearch({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconFileText({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
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
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconLink({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}
function IconAlertTriangle({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconBookOpen({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}
function IconZap({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

// ─── Pricing toggle ───────────────────────────────────────────
const PLANS = [
  {
    id: 'public',
    label: 'AXIOM Access',
    monthly: 29,
    annual: 295,
    annualMonthly: 24,
    badge: null,
    features: [
      'Unlimited situational queries',
      'Full POMS + CFR + CMS corpus access',
      'Source-cited answers with document links',
      'Plain-language + technical response modes',
      'Query history & saved cases',
      'New regulation updates as published',
    ],
    cta: 'Get Early Access',
    ctaStyle: 'primary',
  },
]

export default function AxiomPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      <Nav />
      <main id="ax">

        {/* ── Hero ── */}
        <section className="ax-hero">
          <div className="container">
            <div className="ax-hero-inner">
              <div className="ax-hero-left">
                <h1 className="ax-h1">
                  The answers your<br />clients need, grounded<br />in federal law.
                </h1>
                <p className="ax-sub">
                  AXIOM gives financial professionals direct, sourced answers to complex Social
                  Security and Medicare scenarios — every response cited back to the specific
                  federal regulation it comes from. Not AI doing its best. Federal law, precisely applied.
                </p>
                <div className="ax-hero-actions">
                  <a href="#how-it-works" className="btn-primary">See How It Works</a>
                  <a href="/contact" className="btn-outline-dark">Get Early Access — Q4 2026</a>
                </div>
                <div className="ax-trust-row">
                  <span className="ax-trust-pill"><IconShield size={13} /> Grounded in federal law</span>
                  <span className="ax-trust-pill"><IconCheck size={13} /> Expert-reviewed corpus</span>
                  <span className="ax-trust-pill"><IconFileText size={13} /> Every answer cited</span>
                </div>
              </div>
              <div className="ax-hero-right">
                <div className="ax-stat-card">
                  <div className="ax-stat-logo">
                    <Image src="/assets/axiom-logo-white.png" alt="AXIOM®" width={400} height={154}
                      style={{ objectFit: 'contain', height: 154, width: 'auto', opacity: 0.9 }} priority />
                  </div>
                  <div className="ax-stat-grid">
                    <div className="ax-stat">
                      <span className="ax-stat-n">40,882</span>
                      <span className="ax-stat-d">Source Documents</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">1.1M+</span>
                      <span className="ax-stat-d">Indexed Passages</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">4</span>
                      <span className="ax-stat-d">Federal Corpora</span>
                    </div>
                    <div className="ax-stat">
                      <span className="ax-stat-n">Expert</span>
                      <span className="ax-stat-d">Reviewed & Trained</span>
                    </div>
                  </div>
                  <div className="ax-corpus-tags">
                    <span>POMS</span><span>CFR</span><span>CMS</span><span>Medicare.gov</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Problem ── */}
        <section className="ax-section ax-problem">
          <div className="container">
            <div className="ax-problem-grid">
              <div className="ax-problem-left">
                <p className="ax-eyebrow">The Problem</p>
                <h2 className="ax-h2">The SSA office isn’t always right. Your client, and your reputation, is paying the price.</h2>
                <p className="ax-body">
                  Social Security rules are dense, interconnected, and frequently misapplied —
                  even by SSA employees. When a client acts on incorrect guidance, the financial
                  damage compounds every single month for the rest of their life.
                </p>
                <p className="ax-body">
                  Until now, verifying the correct answer required a 35-year SSA veteran, a
                  deep dive into POMS, or an expensive consultation. AXIOM makes that expertise
                  available on demand, for any scenario, in seconds.
                </p>
                <p className="ax-cost-label">The cost of acting on this advice?</p>
                <p className="ax-cost-summary">
                  By filing at 62, she locks in a permanent 30% reduction on her own benefit.
                  Her spousal add-on is also reduced — but only by 16.7%, applied to the $400
                  excess over her own PIA when her husband files at 67 (she&rsquo;s 65, just
                  24 months before her FRA). The net lifetime loss compared to waiting: <strong>$71,700</strong>.
                </p>
              </div>

              {/* AXIOM chat UI — no bubble backgrounds, colored text only */}
              <div className="ax-chat-card">

                {/* User question */}
                <div className="ax-chat-q-row">
                  <div className="ax-chat-q-bubble">
                    I have a client who is 62 and considering filing early. Her husband is 64
                    and is the higher income earner and is not planning to file until FRA. The
                    Social Security office is telling her that she will still benefit from a full
                    spousal boost, even if she claims early and her own benefit is reduced.
                    Is this accurate?
                  </div>
                </div>


                {/* AXIOM response */}
                <div className="ax-chat-a-row">
                  <div className="ax-chat-avatar">A</div>
                  <div className="ax-chat-a-body">
                    <div className="ax-incorrect-badge">
                      <span className="ax-x">×</span>{' '}
                      <strong>Incorrect</strong>{' — '}The advice is incorrect because the client
                      will not receive a full spousal boost if she files at age 62.
                    </div>
                    <div className="ax-answer-card">
                      <p>The advice that the client will receive a full spousal boost if she
                      files for Social Security benefits at age 62 and her husband files at
                      full retirement age is incorrect.</p>
                      <p>When the client files for Social Security benefits at age 62, she will
                      receive a reduced retirement benefit due to early filing. If she later
                      becomes eligible for spousal benefits when her husband files at full
                      retirement age, the spousal benefit will also be reduced because she
                      filed for her own benefits early. The reduction applies to both her own
                      retirement benefit and the spousal benefit (GN 00204.035).</p>
                      <p>Deemed filing rules require that when the client files for her own
                      retirement benefits, she is also deemed to have filed for spousal
                      benefits if she is eligible, which means she cannot delay the spousal
                      benefit to receive a higher amount later (GN 00204.035).</p>
                    </div>

                  </div>
                </div>
              <p className="ax-actual-label">Actual AXIOM response</p>

              </div>
            </div>

            {/* ── 4 cost tiles — full width ── */}
            <div className="ax-cost-tiles-wrap">
            <div className="ax-cost-tiles">

              <div className="ax-cost-tile">
                <div className="ax-tile-header">
                  <div className="ax-tile-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><IconUser /></div>
                  <h3 className="ax-tile-title">Her Own<br/>Benefit</h3>
                </div>
                <p className="ax-tile-sub">PIA $1,500 — 60 months early<br/>received alone ages 62–65</p>
                <div className="ax-tile-math">
                  <span>36 mo × 5⁄9% = 20%</span>
                  <span className="ax-tile-op">+</span>
                  <span>24 mo × 5⁄12% = 10%</span>
                </div>
                <div className="ax-tile-result">
                  <span className="ax-tile-was">$1,500</span>
                  <span className="ax-tile-arrow">→</span>
                  <span className="ax-tile-now">$1,050<em>/mo</em></span>
                </div>
              </div>

              <div className="ax-cost-tile">
                <div className="ax-tile-header">
                  <div className="ax-tile-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><IconUser /></div>
                  <h3 className="ax-tile-title">Her Spousal<br/>Benefit</h3>
                </div>
                <p className="ax-tile-sub">50% of $3,800 = $1,900 · excess over own PIA:<br/>$1,900 − $1,500 = $400 · kicks in at age 65</p>
                <div className="ax-tile-math">
                  <span>24 mo × 25⁄36% = 16.7%</span>
                  <span className="ax-tile-op">→</span>
                  <span>$400 × 83.3% = $333 add-on</span>
                </div>
                <div className="ax-tile-result">
                  <span className="ax-tile-was">$1,050</span>
                  <span className="ax-tile-arrow">+$333</span>
                  <span className="ax-tile-now">$1,383<em>/mo</em></span>
                </div>
              </div>

              <div className="ax-cost-tile">
                <div className="ax-tile-header">
                  <div className="ax-tile-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><IconUsers /></div>
                  <h3 className="ax-tile-title">Lifetime<br/>Comparison</h3>
                </div>
                <p className="ax-tile-sub">Husband files at 67<br/>projected to age 90</p>
                <div className="ax-tile-scenarios">
                  <div className="ax-tile-scenario-row">
                    <span className="ax-tile-scenario-label">Claims at 62</span>
                    <span className="ax-tile-scenario-val ax-tile-scenario-val--dim">$452,700</span>
                  </div>
                  <div className="ax-tile-scenario-row">
                    <span className="ax-tile-scenario-label">Waits to FRA</span>
                    <span className="ax-tile-scenario-val">$524,400</span>
                  </div>
                </div>
                <div className="ax-tile-gain">
                  <span className="ax-tile-gain-label">By waiting</span>
                  <span className="ax-tile-gain-num">+$71,700</span>
                </div>
              </div>

              <div className="ax-cost-tile ax-cost-tile--loss">
                <div className="ax-tile-header">
                  <div className="ax-tile-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><IconAlertTriangle /></div>
                  <h3 className="ax-tile-title">Net Lifetime<br/>Loss</h3>
                </div>
                <div className="ax-tile-loss-row">
                  <div>
                    <p className="ax-tile-loss-sub">To age 82</p>
                    <p className="ax-tile-loss-num ax-tile-loss-num--sm">$22,068</p>
                  </div>
                  <div className="ax-tile-loss-divider" />
                  <div>
                    <p className="ax-tile-loss-sub">To age 90</p>
                    <p className="ax-tile-loss-num ax-tile-loss-num--sm">$71,700</p>
                  </div>
                </div>
                <p className="ax-tile-loss-note">
                  3 years of reduced own benefit before spousal kicks in at 65 —
                  the permanent reduction compounds every year she lives.
                </p>
              </div>

            </div>
            </div>

          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="ax-section" style={{ background: '#fff' }}>
          <div className="container">
            <p className="ax-eyebrow" style={{ textAlign: 'center' }}>How It Works</p>
            <h2 className="ax-h2" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 16px' }}>
              Describe the situation.<br/>Get the sourced answer.
            </h2>
            <p className="ax-body" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
              AXIOM isn't a calculator or a forecasting tool. It's a regulatory intelligence engine —
              built for the complex, ambiguous, edge-case scenarios that standard software can't handle.
            </p>
            <div className="ax-steps">
              <div className="ax-step">
                <div className="ax-step-num">01</div>
                <div className="ax-step-icon"><IconSearch /></div>
                <h3>Describe the scenario</h3>
                <p>Type your question in plain language — just as you'd explain it to a colleague. No special syntax required.</p>
              </div>
              <div className="ax-step-arrow"><IconArrowRight size={20} /></div>
              <div className="ax-step">
                <div className="ax-step-num">02</div>
                <div className="ax-step-icon"><IconBookOpen /></div>
                <h3>AXIOM searches 1.1M+ passages</h3>
                <p>The engine retrieves the most relevant sections from POMS, CFR, CMS, and Medicare.gov — ranked by regulatory authority and semantic relevance.</p>
              </div>
              <div className="ax-step-arrow"><IconArrowRight size={20} /></div>
              <div className="ax-step">
                <div className="ax-step-num">03</div>
                <div className="ax-step-icon"><IconZap /></div>
                <h3>Get a cited answer</h3>
                <p>AXIOM delivers a clear answer with the exact source documents cited — so you can verify, share with your client, or document your due diligence.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── What's Inside ── */}
        <section className="ax-section ax-corpus-section">
          <div className="container">
            <p className="ax-eyebrow">The Corpus</p>
            <h2 className="ax-h2">What AXIOM knows</h2>
            <p className="ax-body" style={{ maxWidth: 600 }}>
              AXIOM's knowledge base was built from primary federal sources, then reviewed and
              calibrated by NSSA and IRMAACP instructors and subject matter experts. This is not
              a general-purpose AI drawing on the public internet.
            </p>
            <div className="ax-corpus-grid">
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconFileText /></div>
                <h3>POMS</h3>
                <p>Program Operations Manual System — the SSA's internal operations bible. Every claiming rule, exception, and calculation method.</p>
                <div className="ax-corpus-stat">15,566 documents</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconFileText /></div>
                <h3>Code of Federal Regulations</h3>
                <p>Title 20 (Employees' Benefits) and Title 42 (Public Health) — the statutory backbone behind every Social Security and Medicare rule.</p>
                <div className="ax-corpus-stat">1,981 documents</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconFileText /></div>
                <h3>CMS & Medicare.gov</h3>
                <p>Centers for Medicare & Medicaid Services guidance, IRMAA determinations, Part B/D rules, and official Medicare documentation.</p>
                <div className="ax-corpus-stat">Coverage &amp; premium rules</div>
              </div>
              <div className="ax-corpus-card">
                <div className="ax-corpus-icon"><IconShield /></div>
                <h3>Expert Reviewed</h3>
                <p>NSSA and IRMAACP instructors reviewed and calibrated the model's responses — so answers reflect how practitioners actually apply these rules.</p>
                <div className="ax-corpus-stat">Not just ingested — trained</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Differentiation ── */}
        <section className="ax-section ax-diff-section">
          <div className="container">
            <div className="ax-diff-grid">
              <div>
                <p className="ax-eyebrow">Why AXIOM</p>
                <h2 className="ax-h2">Software runs projections.<br/>AXIOM answers questions.</h2>
                <p className="ax-body">
                  Software tools model scenarios and project numbers. AXIOM answers questions.
                  There is no other product that gives financial professionals sourced, regulation-grounded
                  answers to situational Social Security and Medicare questions — on demand, for any case.
                </p>
                <ul className="ax-diff-list">
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Not a forecasting tool.</strong> AXIOM doesn't model scenarios or
                      run projections. It answers specific regulatory questions about specific situations.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Not generic AI.</strong> ChatGPT draws on the public internet.
                      AXIOM draws on 40,882 federal source documents, reviewed by human experts.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Not another SSA phone call.</strong> AXIOM is available 24/7,
                      answers in seconds, and cites its sources. SSA employees do not.
                    </div>
                  </li>
                  <li>
                    <span className="ax-diff-check"><IconCheck size={14} /></span>
                    <div>
                      <strong>Documentation for your files.</strong> Every AXIOM answer is a
                      citable, saveable record of due diligence — for your client files and E&O protection.
                    </div>
                  </li>
                </ul>
              </div>
              <div className="ax-diff-right">
                <div className="ax-compare">
                  <div className="ax-compare-head">
                    <span>Capability</span>
                    <span>Other tools</span>
                    <span>AXIOM</span>
                  </div>
                  {[
                    ['Scenario Q&A in plain language', false, true],
                    ['Source citations with every answer', false, true],
                    ['Federal regulation coverage', false, true],
                    ['Expert-reviewed responses', false, true],
                    ['Benefit projections & modeling', true, false],
                    ['Available 24/7', false, true],
                    ['E&O documentation trail', false, true],
                  ].map(([label, other, ax], i) => (
                    <div key={i} className="ax-compare-row">
                      <span>{label as string}</span>
                      <span className={other ? 'ax-yes' : 'ax-no'}>{other ? <IconCheck size={14} /> : '—'}</span>
                      <span className={ax ? 'ax-yes ax-yes--green' : 'ax-no'}>{ax ? <IconCheck size={14} /> : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="ax-section" style={{ background: '#1a7fbb' }}>
          <div className="container">
            <p className="ax-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Pricing</p>
            <h2 className="ax-h2" style={{ color: '#fff' }}>Simple, flat-rate access</h2>

            <div className="ax-pricing-horiz">

              {/* Left — what’s included */}
              <div className="ax-pricing-left">
                <p className="ax-pricing-desc" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Unlimited queries. No per-question fees. One flat rate gets you full access
                  to 40,882 federal source documents and every answer cited back to its source.
                </p>
                <ul className="ax-plan-features">
                  {PLANS[0].features.map((f, i) => (
                    <li key={i} style={{ color: 'rgba(255,255,255,0.9)' }}><span className="ax-feat-check" style={{ color: '#fff' }}><IconCheck size={13} /></span>{f}</li>
                  ))}
                </ul>
                <div className="ax-firm-bar" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  <div className="ax-firm-left">
                    <div className="ax-firm-icon" style={{ color: '#fff', background: 'rgba(255,255,255,0.15)' }}><IconUsers /></div>
                    <div>
                      <strong style={{ color: '#fff' }}>Team &amp; Firm Access</strong>
                      <p style={{ color: 'rgba(255,255,255,0.75)' }}>3+ seats? We offer volume pricing for RIA firms, insurance agencies, and CPA practices.</p>
                    </div>
                  </div>
                  <a href="/contact" className="btn-outline">Contact Us</a>
                </div>
              </div>

              {/* Right — price + CTA */}
              <div className="ax-pricing-right">
                <div className="ax-pricing-card">

                  {/* billing toggle */}
                  <div className="ax-toggle-row" style={{ marginBottom: 28 }}>
                    <button
                      className={`ax-toggle-btn${!annual ? ' ax-toggle-btn--on' : ''}`}
                      onClick={() => setAnnual(false)}
                    >Monthly</button>
                    <button
                      className={`ax-toggle-btn${annual ? ' ax-toggle-btn--on' : ''}`}
                      onClick={() => setAnnual(true)}
                    >Annual <span className="ax-save-chip">Save 2 months</span></button>
                  </div>

                  <div className="ax-plan-price">
                    <span className="ax-plan-dollar">$</span>
                    <span className="ax-plan-num">{annual ? PLANS[0].annualMonthly : PLANS[0].monthly}</span>
                    <span className="ax-plan-per">/mo</span>
                  </div>
                  {annual && (
                    <p className="ax-plan-annual-note">Billed ${PLANS[0].annual}/year</p>
                  )}

                  <a href="/contact" className="ax-plan-cta ax-plan-cta--primary">
                    {PLANS[0].cta}
                  </a>
                  <p className="ax-plan-fine">Beta launching Q4 2026 · early access available now</p>

                  <div className="ax-pricing-guarantee">
                    <IconShield size={15} />
                    <span>Your card is not charged until day 8</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── CTA Footer Band ── */}
        <section className="ax-cta-band">
          <div className="container ax-cta-inner">
            <div>
              <h2 className="ax-cta-h">AXIOM is launching Q4 2026.</h2>
              <p className="ax-cta-sub">Beta access is available now for ARPI credential holders. Contact us to get on the early access list.</p>
            </div>
            <a href="/contact" className="btn-primary ax-cta-btn">Get Early Access</a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
