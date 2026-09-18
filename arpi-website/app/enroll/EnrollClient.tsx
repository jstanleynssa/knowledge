'use client'

import { useState, useMemo, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { fmt, TUITION_MAP, CERT_MAP, CE_NSSA, CE_IRMAACP } from '@/lib/pricing'
import Image from 'next/image'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// ─── Courses ─────────────────────────────────────────────────
// CELP is not yet enrollable — it's application-only, launching Q4 2026
const ENROLLABLE_IDS = ['nssa', 'irmaacp']

const COURSES = [
  {
    id: 'nssa',
    name: 'NSSA®',
    tagline: 'Social Security Planning',
    ce: CE_NSSA,
    modules: '6 Modules',
    primary: 'var(--blue-400)',
    dark: '#0c334c',
    light: '#d6eaf4',
    logo: '/assets/nssa-logo.png',
    badge: '/assets/nssa-cert.png',
    bullets: [
      'Fundamentals through advanced claiming strategies',
      'Spousal, survivor & disability benefits',
      '35-year SSA veteran on faculty',
    ],
    singleHref: 'https://www.nssapros.com/offers/kUmSJWNr/checkout', // update to arpinstitute.com offer URL when Kajabi domain flips
  },
  {
    id: 'irmaacp',
    name: 'IRMAACP™',
    tagline: 'Medicare & IRMAA Planning',
    ce: CE_IRMAACP,
    modules: '6 Modules',
    primary: 'var(--red-mid)',
    dark: '#7f1424',
    light: '#f0d4d8',
    logo: '/assets/irmaa-logo.png',
    badge: '/assets/irmaa-certificate.png',
    bullets: [
      'Surcharge projections & bracket management',
      'Life-changing event appeals strategy',
      'Income planning for high-value clients',
    ],
    singleHref: 'https://www.nssapros.com/offers/BqKACKXA/checkout', // update to arpinstitute.com offer URL when Kajabi domain flips
  },
  {
    id: 'celp',
    name: 'CELP®',
    tagline: 'End-of-Life Coordination',
    ce: 0, // hours TBD — pending state filing
    modules: '10 Modules',
    primary: 'var(--green-dark)',
    dark: 'var(--green-900)',
    light: 'var(--green-xlight)',
    logo: '/assets/celp-logo.png',
    badge: '/assets/celp-certificate.png',
    bullets: [
      'Complete Survivors Guide framework',
      'Legal, digital estate & family coordination',
      'Standalone practice or existing service line',
    ],
    singleHref: '/credentials/celp#apply',
    applicationOnly: true, // not yet enrollable — Q4 2026
  },
]

// ─── Vision Map ─────────────────────────────────────────────
const VISION_MAP: Record<string, { headline: string; body: string }> = {
  '': {
    headline: "Choose the credential that fits your practice.",
    body: "Each ARPI designation is built to stand on its own and deliver real value to your clients from day one. Select one or more above to see what you\'ll be equipped to do — or build your full package and save with bundle pricing.",
  },
  'nssa': {
    headline: "You'll be the advisor who actually knows Social Security.",
    body: "Most advisors hand clients a pamphlet and a rule of thumb. You'll walk them through a genuine strategy — spousal coordination, survivor timing, delayed credits, and the nuances that make the difference. The claiming decision shapes retirement income for decades. You'll be the one they trust to get it right.",
  },
  'irmaacp': {
    headline: "You'll protect your clients from a cost most advisors never address.",
    body: "IRMAA surcharges quietly cost retirees thousands of dollars a year — and most advisors don't see the exposure until it's too late. With the IRMAACP™, you'll be equipped to model future Medicare costs, spot bracket risk before it hits, and build strategies that keep your clients on the right side of those thresholds.",
  },
  'celp': {
    headline: "You'll be the advisor families call when life gets complicated.",
    body: "Most advisors step back when end-of-life decisions arrive. The CELP® positions you to step forward — with a complete, proven framework for navigating the legal, financial, and logistical decisions that arise at the most difficult moments. Families remember the advisors who showed up.",
  },
  'irmaacp+nssa': {
    headline: "You'll own the two programs that define retirement income.",
    body: "Social Security and Medicare aren't separate conversations — they interact in ways most advisors never see. The NSSA® and IRMAACP™ together give you the expertise to optimize claiming strategy while protecting those benefits from avoidable costs. Most advisors handle one, or neither. You'll handle both with confidence.",
  },
  'celp+nssa': {
    headline: "From the first check to the final plan — you'll be there.",
    body: "The NSSA® gives you the expertise to navigate the Social Security decision that anchors your clients' retirement income. The CELP® gives you the framework to support them — and their families — through the transitions that follow. Together, they extend your reach across an arc that most advisors never fully cover.",
  },
  'celp+irmaacp': {
    headline: "You'll address two areas most advisors leave to chance.",
    body: "The IRMAACP™ helps you actively manage Medicare costs that quietly erode retirement income. The CELP® equips you to guide clients and families through end-of-life decisions with structure and care. Together, they expand your practice into territory where trusted guidance is genuinely scarce — and deeply valued.",
  },
  'celp+irmaacp+nssa': {
    headline: "You'll be ready for the full arc of retirement — not just the accumulation phase.",
    body: "From the Social Security claiming strategy that sets your client's income floor, to the Medicare planning that protects it from unnecessary costs, to the end-of-life framework that supports their family through what comes next — you'll have the full picture covered. That's a rare and trusted capability, and your clients will know the difference.",
  },
}

// ─── Pricing — sourced from lib/pricing.ts ──────────────────
const TUITION = TUITION_MAP
const CERT    = CERT_MAP
const BUNDLE_HREF = 'https://www.nssapros.com/offers/Pi9xowh2/checkout'  // NSSA + IRMAACP bundle

// Standalone exam, cert & membership — for customers who purchased course only
// Use these links in support/sales when someone missed the upsell at checkout
const EXAM_HREF: Record<string, string> = {
  nssa:           'https://www.nssapros.com/offers/GJSX238b/checkout',
  irmaacp:        'https://www.nssapros.com/offers/zTVaDFF4/checkout',
  'nssa+irmaacp': 'https://www.nssapros.com/offers/5qRbtokg/checkout',
}

function getCtaHref(selected: string[]) {
  if (selected.length === 0) return '#'
  if (selected.length > 1)  return BUNDLE_HREF
  return COURSES.find(c => c.id === selected[0])?.singleHref ?? '#'
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SavingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      {/* price tag with a dot */}
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
    </svg>
  )
}

// ─── Component ───────────────────────────────────────────────
const PARTNER_DISCOUNT = 0.25

export default function EnrollClient({
  defaultCourse,
  pickTwo,
}: {
  defaultCourse?: string
  pickTwo?: boolean
}) {
  const searchParams = useSearchParams()
  const isPartner = !!(searchParams?.get('partner'))
  const getInitial = (): string[] => {
    if (defaultCourse === 'all') return ENROLLABLE_IDS
    const validId = ENROLLABLE_IDS.find(id => id === defaultCourse)
    return [validId ?? 'nssa']
  }

  const [selected, setSelected] = useState<string[]>(getInitial)

  function toggle(id: string) {
    if (!ENROLLABLE_IDS.includes(id)) return // CELP not yet enrollable
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      return [...prev, id]
    })
  }

  // Preserve COURSES array order (NSSA → IRMAACP → CELP)
  const selectedCourses = useMemo(
    () => COURSES.filter(c => selected.includes(c.id)),
    [selected],
  )
  const n       = selectedCourses.length
  const tuition = TUITION[n] ?? 0
  const cert    = CERT[n] ?? 0
  // Partner discount: 25% off tuition only
  const partnerDiscount = isPartner ? Math.round(tuition * PARTNER_DISCOUNT) : 0
  const total   = tuition - partnerDiscount + cert
  // "Individual" price = what you'd pay enrolling each selected course separately
  const fullPrice = selectedCourses.reduce((sum, c) => sum + (TUITION[1] + CERT[1]), 0)
  const savings   = fullPrice - total
  const isBundled = n > 1

  const tuitionLabel = n > 1 ? 'Bundle tuition' : 'Course tuition'
  const totalCE = selectedCourses.reduce((sum, c) => sum + c.ce, 0)

  const visionKey = [...selected].sort().join('+')
  const vision = VISION_MAP[visionKey]
  const visionAccent = selectedCourses[0]?.primary ?? 'var(--blue-400)'

  return (
    <>
      <Nav />
      <main id="ep">

        {/* ── Hero — matches About / Contact global style ── */}
        <section className="hero" style={{ padding: '90px 0 148px' }}>
          <div className="container">
            <div style={{ position: 'relative', zIndex: 1 }}>
              {pickTwo && (
                <div className="ep-pick-banner">
                  Choose any two credentials below to unlock 2-credential bundle pricing
                </div>
              )}
              <div className="hero-eyebrow">Build Your ARPI Package</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '40px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, flexShrink: 0 }}>Choose Your<br />Certifications</h1>
                <p className="hero-sub" style={{ margin: 0, flex: 1, minWidth: 240 }}>
                  {pickTwo
                    ? 'Select any two credentials — bundle pricing applies automatically. Add a third to maximize your savings.'
                    : 'Select one, two, or all three credentials. Bundle pricing applies automatically — the more you add, the more you save.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4-column grid ── */}
        <section className="ep-body">
          <div className="container ep-grid">

            {/* Three course cards */}
            {COURSES.map((course) => {
              const isSel = selected.includes(course.id)
              const isAppOnly = !!(course as { applicationOnly?: boolean }).applicationOnly

              if (isAppOnly) {
                // CELP — non-selectable application-only card
                return (
                  <div
                    key={course.id}
                    className="ep-card ep-card--apponly"
                    style={{
                      '--cp': course.primary,
                      '--cd': course.dark,
                      '--cl': course.light,
                    } as React.CSSProperties}
                  >
                    <div className="ep-bar" />
                    <div className="ep-apponly-badge">By Application · Q4 2026</div>

                    <div className="ep-logo">
                      <Image src={course.logo} alt={course.name} width={120} height={38}
                        style={{ objectFit: 'contain', maxWidth: '100%', height: '38px' }} priority />
                    </div>

                    <div className="ep-card-body">
                      <p className="ep-tagline">{course.tagline}</p>
                      <div className="ep-badges">
                        <span className="ep-badge">CE Credit Eligible</span>
                        <span className="ep-badge">{course.modules}</span>
                      </div>
                      <ul className="ep-bullets">
                        {course.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>

                    <div className="ep-foot ep-foot--apponly">
                      <a href={course.singleHref} className="ep-apponly-cta">Apply for Consideration →</a>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={course.id}
                  className={`ep-card${isSel ? ' ep-card--on' : ''}`}
                  style={{
                    '--cp': course.primary,
                    '--cd': course.dark,
                    '--cl': course.light,
                  } as React.CSSProperties}
                  onClick={() => toggle(course.id)}
                  aria-pressed={isSel}
                >
                  <div className="ep-bar" />
                  <span className={`ep-check${isSel ? ' ep-check--on' : ''}`} aria-hidden="true">
                    {isSel
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    }
                  </span>
                  <div className="ep-logo">
                    <Image src={course.logo} alt={course.name} width={120} height={38}
                      style={{ objectFit: 'contain', maxWidth: '100%', height: '38px' }} priority />
                  </div>
                  <div className="ep-card-body">
                    <p className="ep-tagline">{course.tagline}</p>
                    <div className="ep-badges">
                      <span className="ep-badge">{course.ce} CE Hrs</span>
                      <span className="ep-badge">{course.modules}</span>
                    </div>
                    <ul className="ep-bullets">
                      {course.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                  <div className={`ep-foot${isSel ? ' ep-foot--on' : ''}`}>
                    {isSel
                      ? <><CheckIcon /> {n > 1 ? 'Bundled' : `Selected — ${fmt(TUITION_MAP[1])}`}</>
                      : <>+ Add to package</>}
                  </div>
                </button>
              )
            })}

            {/* Order summary — 4th column */}
            <aside className="ep-summary">
              <h2 className="ep-sum-h">Your Investment</h2>

              {/* selected course list */}
              <div className="ep-lines">
                {selectedCourses.length === 0
                  ? <p className="ep-empty">Select a credential to start</p>
                  : selectedCourses.map(c => (
                    <div key={c.id} className="ep-line">
                      <span className="ep-dot" style={{ background: c.primary }} />
                      <span className="ep-line-name">{c.name}</span>
                      <span className="ep-line-ce">{c.ce} CE hrs</span>
                    </div>
                  ))
                }
              </div>

              <div className="ep-divider" />

              {/* Full price line items (at individual per-credential rates) */}
              <div className="ep-subs">
                <div className="ep-sub">
                  <span>Course tuition</span>
                  <span>{isPartner ? <s style={{ color: '#9ca3af', marginRight: 6 }}>{fmt(tuition)}</s> : null}{fmt(isPartner ? tuition - partnerDiscount : tuition)}</span>
                </div>
                {isPartner && partnerDiscount > 0 && (
                  <div className="ep-sub ep-sub--discount">
                    <span>Partner discount (25%)</span>
                    <span className="ep-discount-val">−{fmt(partnerDiscount)}</span>
                  </div>
                )}
                <div className="ep-sub">
                  <span>Certification &amp; dues</span>
                  <span>{fmt(n * (CERT_MAP[1] ?? 0))}</span>
                </div>
                {n > 0 && (
                  <div className="ep-sub ep-sub--ce">
                    <span>CE hours included</span>
                    <span className="ep-ce-val">{totalCE} hrs</span>
                  </div>
                )}
              </div>

              {/* Bundle discount row — only shown when saving */}
              {savings > 0 && (
                <>
                  <div className="ep-divider" />
                  <div className="ep-sub ep-sub--rack">
                    <span>Full price</span>
                    <span>{fmt(fullPrice)}</span>
                  </div>
                  <div className="ep-sub ep-sub--discount">
                    <span>Bundle savings</span>
                    <span className="ep-discount-val">−{fmt(savings)}</span>
                  </div>
                </>
              )}

              <div className="ep-divider" />

              {/* Final total */}
              <div className="ep-total">
                <span>Your investment</span>
                <span className="ep-total-n">{fmt(total)}</span>
              </div>

              {/* CTA */}
              {n > 0 ? (
                <>
                  <a href={getCtaHref(selected)} className="ep-cta">
                    Go to Checkout → {fmt(total)}
                  </a>
  
                </>
              ) : (
                <div className="ep-cta ep-cta--empty">
                  Select a credential above
                </div>
              )}

              {n > 0 && (
                <p className="ep-checkout-note">
                  {isBundled
                    ? <>Your bundle price is <strong>all-inclusive</strong> at {fmt(total)} — course tuition, exams, certification fees, and first-year membership are all covered. You’ll still need to add the <strong>Dual Exam, Certification &amp; Membership package</strong> on the next page to complete your enrollment.</>
                    : <>Your course tuition will be pre-loaded at checkout. To sit for the exam and use your designation, you&apos;ll also need to add the <strong>Exam, Certification &amp; Membership</strong> package on the next page.</>}
                </p>
              )}

              <p className="ep-fine">
                <a href="/contact">Questions?</a>
              </p>
            </aside>

          {vision && (
              <div className="ep-vision" key={visionKey} style={{ '--va': visionAccent } as React.CSSProperties}>
                <div className="ep-vision-inner">

                  {/* Badges column */}
                  <div className="ep-vision-badges">
                    {selectedCourses.map((course, i) => (
                      <Fragment key={course.id}>
                        <div className="ep-vision-badge">
                          <Image
                            src={course.badge}
                            alt={`${course.name} credential badge`}
                            width={72}
                            height={72}
                            style={{ objectFit: 'contain', width: '72px', height: '72px' }}
                          />
                        </div>
                      </Fragment>
                    ))}
                  </div>

                  {/* Text */}
                  <div className="ep-vision-text">
                    <div className="ep-vision-eyebrow">What you&apos;ll be equipped to do</div>
                    <p className="ep-vision-headline">{vision.headline}</p>
                    <p className="ep-vision-body">{vision.body}</p>
                  </div>

                </div>
              </div>
          )}

          </div>
        </section>

      </main>
      <Footer />

      <style>{`
        #ep *, #ep *::before, #ep *::after { box-sizing: border-box; }

        /* ── Pick-two banner (hero) ── */
        .ep-pick-banner {
          display: inline-block;
          background: var(--green-mid);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 7px 18px;
          border-radius: 999px;
          margin-bottom: 20px;
        }

        /* ── 4-col grid ── */
        .ep-body {
          margin-top: -68px;
          padding: 0 0 48px;
          position: relative;
          z-index: 1;
        }
        .ep-body::before {
          content: '';
          position: absolute;
          inset: 68px 0 0 0;
          background: #eef2f7;
          z-index: -1;
        }
        .ep-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }

        /* ── Course cards ── */
        .ep-card {
          grid-row: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 300px;
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          text-align: left;
          padding: 0;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.12s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .ep-card:hover {
          border-color: var(--cp);
          box-shadow: 0 6px 28px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .ep-card--on {
          border-color: var(--cd) !important;
          background: var(--cd) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
        }
        .ep-card--on .ep-tagline { color: rgba(255,255,255,0.7); }
        .ep-card--on .ep-badge { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); }
        .ep-card--on .ep-bullets li { color: rgba(255,255,255,0.8); }
        .ep-card--on .ep-bullets li::before { color: var(--cl); }
        .ep-bar { height: 5px; background: var(--cp); flex-shrink: 0; }

        .ep-check {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: background 0.18s, border-color 0.18s;
          pointer-events: none;
          flex-shrink: 0;
        }
        .ep-check--on {
          background: var(--cp) !important;
          border-color: var(--cp) !important;
        }

        .ep-logo {
          padding: 12px 20px 0;
          height: 46px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .ep-logo img { transition: filter 0.18s ease; }
        .ep-card--on .ep-logo img { filter: brightness(0) invert(1); }

        .ep-card-body { padding: 8px 20px 0; flex: 1; }
        .ep-tagline {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--cp);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin: 0 0 10px;
        }
        .ep-badges { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
        .ep-badge {
          padding: 3px 10px;
          border-radius: 999px;
          background: var(--cl);
          color: var(--cd);
          font-size: 0.72rem;
          font-weight: 700;
        }
        .ep-bullets { list-style: none; padding: 0; margin: 0; }
        .ep-bullets li {
          font-size: 0.835rem;
          color: #4b5563;
          padding: 4px 0 4px 16px;
          position: relative;
          line-height: 1.45;
        }
        .ep-bullets li::before {
          content: '·';
          color: var(--cp);
          position: absolute;
          left: 4px;
          font-weight: 900;
          font-size: 1.4em;
          line-height: 1.15;
        }

        .ep-foot {
          margin: 8px 20px 12px;
          padding: 8px 14px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 0.82rem;
          font-weight: 600;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.18s, color 0.18s;
          flex-shrink: 0;
        }
        .ep-foot--on { background: rgba(255,255,255,0.15); color: #fff; }
        .ep-foot--apponly { background: transparent; padding: 0 20px 16px; margin: 8px 0 0; }
        .ep-card--apponly {
          cursor: default;
          opacity: 0.88;
          border-style: dashed;
        }
        .ep-card--apponly:hover {
          transform: none;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border-color: var(--cp);
        }
        .ep-apponly-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--cl);
          color: var(--cd);
          padding: 3px 10px;
          border-radius: 999px;
        }
        .ep-apponly-cta {
          display: block;
          width: 100%;
          text-align: center;
          padding: 9px 14px;
          border-radius: 8px;
          background: var(--cl);
          color: var(--cd);
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s;
        }
        .ep-apponly-cta:hover { background: var(--cp); color: #fff; }

        /* ── Order Summary ── */
        .ep-summary {
          grid-column: 4;
          grid-row: 1 / 3;
          background: #fff;
          border-radius: 16px;
          padding: 26px 22px;
          box-shadow: 0 6px 36px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          position: sticky;
          top: 24px;
          align-self: start;
        }
        .ep-sum-h {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 18px;
        }
        .ep-lines { display: flex; flex-direction: column; gap: 8px; min-height: 28px; }
        .ep-line { display: flex; align-items: center; gap: 8px; }
        .ep-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ep-line-name { font-size: 0.9rem; color: #374151; font-weight: 600; flex: 1; }
        .ep-line-ce { font-size: 0.72rem; font-weight: 700; color: var(--green-dark); white-space: nowrap; }
        .ep-empty { font-size: 0.85rem; color: #9ca3af; margin: 0; font-style: italic; }

        .ep-divider { height: 1px; background: #e5e7eb; margin: 14px 0; }

        .ep-subs { display: flex; flex-direction: column; gap: 9px; }
        .ep-sub {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          font-size: 0.865rem;
          color: #6b7280;
        }
        .ep-sub span:last-child { font-weight: 600; color: #374151; white-space: nowrap; }
        .ep-ce-val { color: var(--green-dark) !important; font-weight: 600; }
        .ep-sub--rack { color: #9ca3af; }
        .ep-sub--rack span:last-child { color: #9ca3af; text-decoration: line-through; }
        .ep-sub--discount span:first-child { color: var(--green-dark); font-weight: 600; }
        .ep-discount-val { color: var(--green-dark) !important; font-weight: 700; }

        .ep-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 0.9625rem;
          font-weight: 700;
          color: #111827;
        }
        .ep-total-n { font-size: 1.3rem; color: #0c334c; }

        .ep-savings {
          margin-top: 12px;
          background: var(--green-xlight);
          border: 1px solid var(--green-light);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .ep-save-main { font-size: 0.875rem; font-weight: 700; color: var(--green-dark); }
        .ep-save-note { font-size: 0.755rem; color: #6b7280; }

        .ep-cta {
          display: block;
          width: 100%;
          text-align: center;
          padding: 14px 16px;
          margin-top: 20px;
          border-radius: 10px;
          background: var(--green-mid);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.18s;
          line-height: 1.4;
        }
        .ep-cta:hover { background: var(--green-dark); }
        .ep-cta.ep-cta--empty,
        .ep-cta.ep-cta--empty:hover {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: default;
        }

        .ep-checkout-note {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.55;
          margin: 12px 0 8px;
          padding: 10px 12px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #e5e7eb;
        }
        .ep-checkout-note strong { color: #374151; }
        .ep-fine {
          font-size: 0.73rem;
          color: #9ca3af;
          text-align: center;
          margin: 6px 0 0;
          line-height: 1.5;
        }
        .ep-fine a { color: #6b7280; text-decoration: underline; }

        /* ── Vision Block ── */
        .ep-vision {
          grid-column: 1 / 4;
          grid-row: 2;
          background: #fff;
          border-radius: 14px;
          border-top: 4px solid var(--va);
          padding: 20px 26px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          animation: ep-vision-in 0.32s ease;
          align-self: start;
        }
        @keyframes ep-vision-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* ── Vision inner layout ── */
        .ep-vision-inner {
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }
        .ep-vision-badges {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .ep-vision-badge {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.10);
          line-height: 0;
        }
        .ep-vision-text {
          flex: 1;
          min-width: 0;
        }

        .ep-vision-eyebrow {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 14px;
        }
        .ep-vision-headline {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 14px;
          line-height: 1.35;
        }
        .ep-vision-body {
          font-size: 1.0rem;
          color: #4b5563;
          line-height: 1.75;
          margin: 0;
          max-width: 800px;
        }
        @media (max-width: 720px) {
          .ep-vision { padding: 24px 20px 28px; }
          .ep-vision-headline { font-size: 1.15rem; }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .ep-grid { grid-template-columns: repeat(3, 1fr); }
          .ep-card { grid-row: auto; }
          .ep-vision { grid-row: auto; grid-column: 1 / -1; }
          .ep-summary { grid-column: 1 / -1; grid-row: auto; position: static; max-width: 480px; margin: 0 auto; }
        }
        @media (max-width: 720px) {
          .ep-grid { grid-template-columns: 1fr; }
          .ep-body { padding: 16px 0 32px; }
        }
      `}</style>
    </>
  )
}
