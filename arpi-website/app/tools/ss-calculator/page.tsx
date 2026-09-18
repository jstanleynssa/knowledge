'use client'

import { useState, useCallback } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {
  calcOwnBenefit,
  calcSpousalAddon,
  calcSurvivorBenefit,
  getFRAYears,
} from '@/lib/ss-calc'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PersonInput {
  name: string
  pia: string
  birthYear: string
  birthMonth: string
  lifeExp: string
}

interface StrategyInput {
  aFilingAge: string
  bFilingAge: string
}

interface PhaseBreakdown {
  label: string
  monthly: number
  startAge: number
  endAge: number
}

interface StrategyResult {
  phases: PhaseBreakdown[]
  lifetimeTotal: number
  atAge: Record<number, number>
}

interface Results {
  stratA: StrategyResult
  stratB: StrategyResult
  breakeven: number | null
  netDiff: number
  milestones: number[]
  fra: { a: number; b: number }
  names: { a: string; b: string }
  lifeExps: { a: number; b: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString()
}
function fmtAge(n: number) {
  const y = Math.floor(n)
  const m = Math.round((n - y) * 12)
  if (m === 0) return `${y}`
  return `${y} yrs ${m} mo`
}
function parseAge(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}
function parsePIA(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

const AGE_OPTIONS = [62, 63, 64, 65, 66, 67, 68, 69, 70]
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Core calculation (inline, validated against Jim Blair) ───────────────────
function runStrategy(
  marital: 'single' | 'married',
  a: { pia: number; birthYear: number; birthMonth: number },
  b: { pia: number; birthYear: number; birthMonth: number } | null,
  aFilingAge: number,
  bFilingAge: number | null,
  lifeExpA: number,
  lifeExpB: number,
  milestones: number[],
): StrategyResult {
  const now = new Date()
  const aCurrentAge = now.getFullYear() - a.birthYear + (now.getMonth() + 1 - a.birthMonth) / 12
  const bCurrentAge = b
    ? now.getFullYear() - b.birthYear + (now.getMonth() + 1 - b.birthMonth) / 12
    : null

  const aOwn = calcOwnBenefit(a.pia, a.birthYear, aFilingAge)
  const bOwn = (marital && b && bFilingAge != null)
    ? calcOwnBenefit(b.pia, b.birthYear, bFilingAge)
    : 0

  // A's age when B files
  const ageDiff = bCurrentAge != null ? bCurrentAge - aCurrentAge : 0
  const aAgeWhenBFiles = bFilingAge != null ? bFilingAge - ageDiff : 0

  // Spousal: assume A is lower earner; add-on only if A's PIA < 50% of B's PIA
  const aSpousal = (marital && b && bFilingAge != null)
    ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFiles)
    : 0

  // Survivor: A survives B
  const bDeathAgeA = b ? lifeExpB - ageDiff : lifeExpA  // A's age when B dies
  const aSurvivor = (marital && b && bFilingAge != null)
    ? calcSurvivorBenefit(aOwn + aSpousal, bOwn, b.pia)
    : 0

  // Build phases
  const phases: PhaseBreakdown[] = []

  if (marital && b && bFilingAge != null) {
    const spousalStartAgeA = Math.max(aFilingAge, aAgeWhenBFiles)

    if (aFilingAge < spousalStartAgeA) {
      phases.push({
        label: 'Own benefit only',
        monthly: aOwn,
        startAge: aFilingAge,
        endAge: spousalStartAgeA,
      })
    }

    if (aSpousal > 0) {
      phases.push({
        label: 'Own + spousal add-on',
        monthly: aOwn + aSpousal,
        startAge: spousalStartAgeA,
        endAge: bDeathAgeA,
      })
    } else {
      phases.push({
        label: 'Own benefit',
        monthly: aOwn,
        startAge: spousalStartAgeA,
        endAge: bDeathAgeA,
      })
    }

    if (aSurvivor > aOwn + aSpousal) {
      phases.push({
        label: 'Survivor benefit',
        monthly: aSurvivor,
        startAge: bDeathAgeA,
        endAge: lifeExpA,
      })
    } else {
      phases.push({
        label: 'Own benefit (survivor phase)',
        monthly: aOwn + aSpousal,
        startAge: bDeathAgeA,
        endAge: lifeExpA,
      })
    }
  } else {
    phases.push({
      label: 'Own benefit',
      monthly: aOwn,
      startAge: aFilingAge,
      endAge: lifeExpA,
    })
  }

  // Accumulate lifetime total month by month
  const totalMonths = Math.round((lifeExpA - aCurrentAge) * 12)
  const atAge: Record<number, number> = {}
  let running = 0
  const milestonesSet = new Set(milestones)

  for (let m = 0; m < totalMonths; m++) {
    const aAge = aCurrentAge + m / 12
    let monthly = 0

    for (const ph of phases) {
      if (aAge >= ph.startAge && aAge < ph.endAge) {
        monthly = ph.monthly
        break
      }
    }

    running += monthly

    for (const ms of milestones) {
      if (milestonesSet.has(ms) && aAge >= ms - 1 / 24 && atAge[ms] === undefined) {
        atAge[ms] = Math.round(running)
      }
    }
  }
  // Fill any milestones past life expectancy
  for (const ms of milestones) {
    if (atAge[ms] === undefined) atAge[ms] = Math.round(running)
  }

  return {
    phases,
    lifetimeTotal: Math.round(running),
    atAge,
  }
}

function computeBreakeven(
  marital: 'single' | 'married',
  a: { pia: number; birthYear: number; birthMonth: number },
  b: { pia: number; birthYear: number; birthMonth: number } | null,
  stA: { aFilingAge: number; bFilingAge: number | null },
  stB: { aFilingAge: number; bFilingAge: number | null },
  lifeExpA: number,
  lifeExpB: number,
): number | null {
  const now = new Date()
  const aCurrentAge = now.getFullYear() - a.birthYear + (now.getMonth() + 1 - a.birthMonth) / 12
  const bCurrentAge = b
    ? now.getFullYear() - b.birthYear + (now.getMonth() + 1 - b.birthMonth) / 12
    : null
  const ageDiff = bCurrentAge != null ? bCurrentAge - aCurrentAge : 0

  function monthlyAt(strategy: { aFilingAge: number; bFilingAge: number | null }, aAge: number): number {
    const aOwn = calcOwnBenefit(a.pia, a.birthYear, strategy.aFilingAge)
    const bOwn = (marital && b && strategy.bFilingAge != null)
      ? calcOwnBenefit(b.pia, b.birthYear, strategy.bFilingAge)
      : 0
    const aAgeWhenBFiles = strategy.bFilingAge != null ? strategy.bFilingAge - ageDiff : 0
    const aSpousal = (marital && b && strategy.bFilingAge != null)
      ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFiles)
      : 0
    const bDeathAgeA = b ? lifeExpB - ageDiff : lifeExpA
    const aSurvivor = (marital && b && strategy.bFilingAge != null)
      ? calcSurvivorBenefit(aOwn + aSpousal, bOwn, b.pia)
      : 0
    const spousalStart = Math.max(strategy.aFilingAge, aAgeWhenBFiles)

    if (aAge < strategy.aFilingAge) return 0
    if (marital && b && strategy.bFilingAge != null) {
      if (aAge < spousalStart) return aOwn
      if (aAge < bDeathAgeA) return aSpousal > 0 ? aOwn + aSpousal : aOwn
      return aSurvivor > aOwn + aSpousal ? aSurvivor : aOwn + aSpousal
    }
    return aOwn
  }

  let cumA = 0, cumB = 0
  const totalMonths = Math.round((lifeExpA - aCurrentAge) * 12)
  for (let m = 0; m < totalMonths; m++) {
    const aAge = aCurrentAge + m / 12
    cumA += monthlyAt(stA, aAge)
    cumB += monthlyAt(stB, aAge)
    if (cumB >= cumA && cumA > 0) {
      return Math.round(aAge * 10) / 10
    }
  }
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SSCalculatorPage() {
  const [marital, setMarital] = useState<'single' | 'married'>('married')
  const [personA, setPersonA] = useState<PersonInput>({ name: '', pia: '', birthYear: '', birthMonth: '1', lifeExp: '90' })
  const [personB, setPersonB] = useState<PersonInput>({ name: '', pia: '', birthYear: '', birthMonth: '1', lifeExp: '90' })
  const [stratA, setStratA] = useState<StrategyInput>({ aFilingAge: '62', bFilingAge: '67' })
  const [stratB, setStratB] = useState<StrategyInput>({ aFilingAge: '67', bFilingAge: '67' })
  const [results, setResults] = useState<Results | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const runCalc = useCallback(() => {
    const errs: string[] = []
    const aPIA = parsePIA(personA.pia)
    const aBY = parseInt(personA.birthYear)
    const aBM = parseInt(personA.birthMonth)
    const bPIA = marital === 'married' ? parsePIA(personB.pia) : null
    const bBY = marital === 'married' ? parseInt(personB.birthYear) : null
    const bBM = marital === 'married' ? parseInt(personB.birthMonth) : null
    const leA = parseFloat(personA.lifeExp)
    const leB = marital === 'married' ? parseFloat(personB.lifeExp) : leA

    if (!aPIA) errs.push(`Enter a valid PIA for ${personA.name || 'Person A'}`)
    if (!aBY || aBY < 1940 || aBY > 2005) errs.push(`Enter a valid birth year for ${personA.name || 'Person A'}`)
    if (marital === 'married' && !bPIA) errs.push(`Enter a valid PIA for ${personB.name || 'Person B'}`)
    if (marital === 'married' && (!bBY || bBY < 1940 || bBY > 2005)) errs.push(`Enter a valid birth year for ${personB.name || 'Person B'}`)
    if (!leA || leA < 70 || leA > 105) errs.push(`Life expectancy for ${personA.name || 'Person A'} must be between 70 and 105`)
    if (marital === 'married' && (!leB || leB < 70 || leB > 105)) errs.push(`Life expectancy for ${personB.name || 'Person B'} must be between 70 and 105`)

    const saA = parseFloat(stratA.aFilingAge)
    const saB = parseFloat(stratB.aFilingAge)
    const sbA = marital === 'married' ? parseFloat(stratA.bFilingAge) : null
    const sbB = marital === 'married' ? parseFloat(stratB.bFilingAge) : null

    if (errs.length > 0) { setErrors(errs); return }

    const a = { pia: aPIA!, birthYear: aBY, birthMonth: aBM }
    const b = marital === 'married' ? { pia: bPIA!, birthYear: bBY!, birthMonth: bBM! } : null

    const fraA = getFRAYears(aBY)
    const fraB = b ? getFRAYears(bBY!) : 0

    const milestones = [...new Set([75, 80, 82, 85, 90, Math.floor(leA)])].filter(m => m <= leA).sort((x, y) => x - y)

    const resA = runStrategy(marital, a, b, saA, sbA, leA, leB, milestones)
    const resB = runStrategy(marital, a, b, saB, sbB, leA, leB, milestones)
    const bkv = computeBreakeven(marital, a, b,
      { aFilingAge: saA, bFilingAge: sbA },
      { aFilingAge: saB, bFilingAge: sbB },
      leA, leB,
    )

    setResults({
      stratA: resA,
      stratB: resB,
      breakeven: bkv,
      netDiff: resB.lifetimeTotal - resA.lifetimeTotal,
      milestones,
      fra: { a: fraA, b: fraB },
      names: { a: personA.name || 'Person A', b: personB.name || 'Person B' },
      lifeExps: { a: leA, b: leB },
    })
    setErrors([])
  }, [marital, personA, personB, stratA, stratB])

  const inputCls = 'ssc-input'
  const selCls = 'ssc-select'

  return (
    <>
      <Nav />
      <main className="ssc-page">

        {/* ── Header ── */}
        <section className="ssc-hero">
          <div className="container">
            <p className="ssc-eyebrow">Free Tool</p>
            <h1 className="ssc-h1">Social Security Strategy Comparison</h1>
            <p className="ssc-sub">
              Enter two claiming strategies and see the real cost of filing early —
              month by month, phase by phase, to any life expectancy.
              Math validated against Social Security POMS rules.
            </p>
          </div>
        </section>

        {/* ── Form ── */}
        <section className="ssc-form-section">
          <div className="container">
            <div className="ssc-form-card">

              {/* Marital status */}
              <div className="ssc-field-group">
                <label className="ssc-label">Marital Status</label>
                <div className="ssc-toggle-row">
                  {(['married', 'single'] as const).map(v => (
                    <button
                      key={v}
                      className={`ssc-toggle${marital === v ? ' ssc-toggle--on' : ''}`}
                      onClick={() => setMarital(v)}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Person inputs */}
              <div className={`ssc-persons-grid${marital === 'single' ? ' ssc-persons-grid--single' : ''}`}>

                {/* Person A */}
                <div className="ssc-person-block">
                  <h3 className="ssc-person-heading">
                    {marital === 'married' ? 'Person A (lower earner)' : 'Your Information'}
                  </h3>
                  <div className="ssc-fields">
                    <div className="ssc-field">
                      <label className="ssc-label">PIA (monthly benefit at FRA)</label>
                      <div className="ssc-input-prefix-wrap">
                        <span className="ssc-prefix">$</span>
                        <input className={inputCls} type="text" inputMode="numeric"
                          placeholder="1,500" value={personA.pia}
                          onChange={e => setPersonA(p => ({ ...p, pia: e.target.value }))} />
                      </div>
                    </div>
                    <div className="ssc-field ssc-field--row">
                      <div className="ssc-field">
                        <label className="ssc-label">Birth Year</label>
                        <input className={inputCls} type="text" inputMode="numeric"
                          placeholder="1964" value={personA.birthYear}
                          onChange={e => setPersonA(p => ({ ...p, birthYear: e.target.value }))} />
                      </div>
                      <div className="ssc-field">
                        <label className="ssc-label">Birth Month</label>
                        <select className={selCls} value={personA.birthMonth}
                          onChange={e => setPersonA(p => ({ ...p, birthMonth: e.target.value }))}>
                          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    {personA.birthYear && parseInt(personA.birthYear) >= 1940 && (
                      <p className="ssc-fra-note">
                        FRA: {getFRAYears(parseInt(personA.birthYear))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Person B */}
                {marital === 'married' && (
                  <div className="ssc-person-block">
                    <h3 className="ssc-person-heading">Person B (higher earner)</h3>
                    <div className="ssc-fields">
                      <div className="ssc-field">
                        <label className="ssc-label">Name <span className="ssc-optional">(optional)</span></label>
                        <input className={inputCls} type="text" placeholder="e.g. John"
                          value={personB.name}
                          onChange={e => setPersonB(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="ssc-field">
                        <label className="ssc-label">PIA (monthly benefit at FRA)</label>
                        <div className="ssc-input-prefix-wrap">
                          <span className="ssc-prefix">$</span>
                          <input className={inputCls} type="text" inputMode="numeric"
                            placeholder="3,800" value={personB.pia}
                            onChange={e => setPersonB(p => ({ ...p, pia: e.target.value }))} />
                        </div>
                      </div>
                      <div className="ssc-field ssc-field--row">
                        <div className="ssc-field">
                          <label className="ssc-label">Birth Year</label>
                          <input className={inputCls} type="text" inputMode="numeric"
                            placeholder="1962" value={personB.birthYear}
                            onChange={e => setPersonB(p => ({ ...p, birthYear: e.target.value }))} />
                        </div>
                        <div className="ssc-field">
                          <label className="ssc-label">Birth Month</label>
                          <select className={selCls} value={personB.birthMonth}
                            onChange={e => setPersonB(p => ({ ...p, birthMonth: e.target.value }))}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                      {personB.birthYear && parseInt(personB.birthYear) >= 1940 && (
                        <p className="ssc-fra-note">
                          FRA: {getFRAYears(parseInt(personB.birthYear))}
                        </p>
                      )}
                      <div className="ssc-field ssc-field--le-inline">
                        <label className="ssc-label">Life Expectancy</label>
                        <div className="ssc-le-row">
                          <input className={`${inputCls} ssc-le-input`} type="number"
                            min={70} max={105} value={personB.lifeExp}
                            onChange={e => setPersonB(p => ({ ...p, lifeExp: e.target.value }))} />
                          <input className="ssc-slider" type="range" min={70} max={105}
                            value={personB.lifeExp}
                            onChange={e => setPersonB(p => ({ ...p, lifeExp: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy inputs */}
              <div className="ssc-strategies-grid">
                {([
                  { label: 'Strategy A', key: 'A', st: stratA, setSt: setStratA },
                  { label: 'Strategy B', key: 'B', st: stratB, setSt: setStratB },
                ] as const).map(({ label, st, setSt }) => (
                  <div key={label} className="ssc-strategy-block">
                    <h3 className="ssc-strategy-heading">{label}</h3>
                    <div className="ssc-fields">
                      <div className="ssc-field">
                        <label className="ssc-label">
                          {marital === 'married' ? `${personA.name || 'Person A'} filing age` : 'Filing age'}
                        </label>
                        <select className={selCls} value={st.aFilingAge}
                          onChange={e => setSt(s => ({ ...s, aFilingAge: e.target.value }))}>
                          {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      {marital === 'married' && (
                        <div className="ssc-field">
                          <label className="ssc-label">{personB.name || 'Person B'} filing age</label>
                          <select className={selCls} value={st.bFilingAge}
                            onChange={e => setSt(s => ({ ...s, bFilingAge: e.target.value }))}>
                            {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="ssc-errors">
                  {errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}

              <button className="btn-primary ssc-run-btn" onClick={runCalc}>
                Calculate Strategies
              </button>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        {results && (
          <section className="ssc-results-section">
            <div className="container">

              {/* Summary tiles */}
              <div className="ssc-tiles-grid">

                {/* Strategy A tile */}
                <div className="ssc-result-tile ssc-result-tile--a">
                  <p className="ssc-tile-label">Strategy A</p>
                  <p className="ssc-tile-filing">
                    Person A files at {stratA.aFilingAge}
                    {marital === 'married' && ` · Person B files at ${stratA.bFilingAge}`}
                  </p>
                  {results.stratA.phases.map((ph, i) => (
                    <div key={i} className="ssc-phase-row">
                      <span className="ssc-phase-label">{ph.label}</span>
                      <span className="ssc-phase-val">{fmt(ph.monthly)}<em>/mo</em></span>
                    </div>
                  ))}
                  <div className="ssc-tile-total">
                    <span>Lifetime total</span>
                    <span>{fmt(results.stratA.lifetimeTotal)}</span>
                  </div>
                </div>

                {/* Strategy B tile */}
                <div className="ssc-result-tile ssc-result-tile--b">
                  <p className="ssc-tile-label">Strategy B</p>
                  <p className="ssc-tile-filing">
                    Person A files at {stratB.aFilingAge}
                    {marital === 'married' && ` · Person B files at ${stratB.bFilingAge}`}
                  </p>
                  {results.stratB.phases.map((ph, i) => (
                    <div key={i} className="ssc-phase-row">
                      <span className="ssc-phase-label">{ph.label}</span>
                      <span className="ssc-phase-val">{fmt(ph.monthly)}<em>/mo</em></span>
                    </div>
                  ))}
                  <div className="ssc-tile-total">
                    <span>Lifetime total</span>
                    <span>{fmt(results.stratB.lifetimeTotal)}</span>
                  </div>
                </div>

                {/* Difference tile */}
                <div className={`ssc-result-tile ssc-result-tile--diff${results.netDiff > 0 ? ' ssc-result-tile--gain' : ' ssc-result-tile--loss'}`}>
                  <p className="ssc-tile-label">
                    {results.netDiff >= 0 ? 'B is better by' : 'A is better by'}
                  </p>
                  <p className="ssc-diff-num">{fmt(Math.abs(results.netDiff))}</p>
                  <p className="ssc-diff-sub">lifetime (to age {results.lifeExps.a})</p>

                  {results.breakeven != null && (
                    <div className="ssc-breakeven">
                      <span className="ssc-breakeven-label">Breakeven age</span>
                      <span className="ssc-breakeven-val">{fmtAge(results.breakeven)}</span>
                    </div>
                  )}
                  {results.breakeven == null && (
                    <p className="ssc-breakeven-none">
                      Strategy B never overtakes A within the projection
                    </p>
                  )}
                </div>
              </div>

              {/* Milestone table */}
              <div className="ssc-milestone-wrap">
                <h2 className="ssc-section-heading">Cumulative benefits by age</h2>
                <div className="ssc-table-wrap">
                  <table className="ssc-table">
                    <thead>
                      <tr>
                        <th>Age</th>
                        <th>Strategy A</th>
                        <th>Strategy B</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.milestones.map(ms => {
                        const a = results.stratA.atAge[ms] ?? 0
                        const b = results.stratB.atAge[ms] ?? 0
                        const diff = b - a
                        return (
                          <tr key={ms}>
                            <td className="ssc-td-age">{results.names.a} age {ms}</td>
                            <td>{fmt(a)}</td>
                            <td>{fmt(b)}</td>
                            <td className={diff > 0 ? 'ssc-td-pos' : diff < 0 ? 'ssc-td-neg' : ''}>
                              {diff >= 0 ? '+' : ''}{fmt(diff)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="ssc-disclaimer">
                This tool uses the dual-entitlement excess method for spousal benefits per SSA POMS rules.
                All projections assume no COLAs, no earnings test, and constant PIAs.
                Intended for educational illustration only — not financial or legal advice.
                Survivor benefit assumes Person A outlives Person B.
              </p>

            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  )
}
