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
  bMonthly: number  // B's own monthly (for tile display)
}

interface AnnualRow {
  ageA: number
  ageB: number | null
  bAlive: boolean
  stratACum: number
  stratBCum: number
  stratAMonthly: number
  stratBMonthly: number
  stratAaMonthly: number  // Person A monthly in Strategy A
  stratAbMonthly: number  // Person B monthly in Strategy A (0 if single or deceased)
  stratBaMonthly: number  // Person A monthly in Strategy B
  stratBbMonthly: number  // Person B monthly in Strategy B (0 if single or deceased)
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
  annualRows: AnnualRow[]
  ageDiff: number  // bCurrentAge - aCurrentAge, for breakeven B-age display
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
  cola: number,
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

    // Add Person B's own benefit to household total
    if (marital === 'married' && b && bFilingAge != null && bOwn > 0) {
      const bAge = aAge + ageDiff
      if (bAge >= bFilingAge && bAge < lifeExpB) {
        monthly += bOwn
      }
    }

    const colaFactor = Math.pow(1 + cola, aAge - aCurrentAge)
    running += monthly * colaFactor

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
    bMonthly: Math.round(bOwn),
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
  cola: number,
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

    // B's own contribution while alive and after filing
    let bContrib = 0
    if (marital && b && strategy.bFilingAge != null) {
      const bAge = aAge + ageDiff
      if (bAge >= strategy.bFilingAge && bAge < lifeExpB) bContrib = bOwn
    }

    if (aAge < strategy.aFilingAge) return bContrib  // only B collecting before A files
    if (marital && b && strategy.bFilingAge != null) {
      if (aAge < spousalStart) return aOwn + bContrib
      if (aAge < bDeathAgeA) return (aSpousal > 0 ? aOwn + aSpousal : aOwn) + bContrib
      return aSurvivor > aOwn + aSpousal ? aSurvivor : aOwn + aSpousal  // B dead
    }
    return aOwn
  }

  let cumA = 0, cumB = 0
  const totalMonths = Math.round((lifeExpA - aCurrentAge) * 12)
  for (let m = 0; m < totalMonths; m++) {
    const aAge = aCurrentAge + m / 12
    const cf = Math.pow(1 + cola, aAge - aCurrentAge)
    cumA += monthlyAt(stA, aAge) * cf
    cumB += monthlyAt(stB, aAge) * cf
    if (cumB > cumA && cumA > 0) {
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
  const [cola, setCola] = useState('3')
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

    const colaRate = Math.max(0, Math.min(0.10, parseFloat(cola) / 100 || 0))
    const milestones = [...new Set([75, 80, 82, 85, 90, Math.floor(leA)])].filter(m => m <= leA).sort((x, y) => x - y)

    const resA = runStrategy(marital, a, b, saA, sbA, leA, leB, colaRate, milestones)
    const resB = runStrategy(marital, a, b, saB, sbB, leA, leB, colaRate, milestones)
    const bkv = computeBreakeven(marital, a, b,
      { aFilingAge: saA, bFilingAge: sbA },
      { aFilingAge: saB, bFilingAge: sbB },
      leA, leB, colaRate,
    )

    // ── Annual rows for comparison table ──────────────────────────────────
    const now2 = new Date()
    const aCurrentAge2 = now2.getFullYear() - a.birthYear + (now2.getMonth() + 1 - a.birthMonth) / 12
    const bCurrentAge2 = b ? now2.getFullYear() - b.birthYear + (now2.getMonth() + 1 - b.birthMonth) / 12 : null
    const ageDiff2 = bCurrentAge2 != null ? bCurrentAge2 - aCurrentAge2 : 0

    const aOwnA2 = calcOwnBenefit(a.pia, a.birthYear, saA)
    const aOwnB2 = calcOwnBenefit(a.pia, a.birthYear, saB)
    const aAgeWhenBFilesA2 = sbA != null ? sbA - ageDiff2 : 0
    const aAgeWhenBFilesB2 = sbB != null ? sbB - ageDiff2 : 0
    const aSpousalA2 = (marital === 'married' && b && sbA != null) ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFilesA2) : 0
    const aSpousalB2 = (marital === 'married' && b && sbB != null) ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFilesB2) : 0
    const spousalStartA2 = Math.max(saA, aAgeWhenBFilesA2)
    const spousalStartB2 = Math.max(saB, aAgeWhenBFilesB2)
    const bDeathA2 = b ? leB - ageDiff2 : leA  // A's age when B dies
    const bOwnA2 = (marital === 'married' && b && sbA != null) ? calcOwnBenefit(b.pia, b.birthYear, sbA) : 0
    const bOwnB2 = (marital === 'married' && b && sbB != null) ? calcOwnBenefit(b.pia, b.birthYear, sbB) : 0
    const aSurvivorA2 = (marital === 'married' && b) ? calcSurvivorBenefit(aOwnA2 + aSpousalA2, bOwnA2, b.pia) : 0
    const aSurvivorB2 = (marital === 'married' && b) ? calcSurvivorBenefit(aOwnB2 + aSpousalB2, bOwnB2, b.pia) : 0

    const moAt = (
      aAge: number, aOwn: number, filingAge: number,
      spousal: number, spousalStart: number,
      bDeath: number, survivor: number,
    ): number => {
      if (aAge < filingAge) return 0
      if (marital === 'married' && b) {
        if (aAge < spousalStart) return aOwn
        if (aAge < bDeath) return spousal > 0 ? aOwn + spousal : aOwn
        return Math.max(aOwn, survivor)
      }
      return aOwn
    }

    const annualRows: AnnualRow[] = []
    let cumAnn_A = 0, cumAnn_B = 0
    const startYr = Math.floor(aCurrentAge2)
    const endYr = Math.ceil(leA)

    for (let yr = startYr; yr <= endYr; yr++) {
      let yrA = 0, yrB = 0, yrAa = 0, yrAb = 0, yrBa = 0, yrBb = 0
      for (let mo = 0; mo < 12; mo++) {
        const aAge = yr + mo / 12
        if (aAge >= leA) break
        const cf = Math.pow(1 + colaRate, aAge - aCurrentAge2)
        // Person A contribution per strategy
        const aContribA = moAt(aAge, aOwnA2, saA, aSpousalA2, spousalStartA2, bDeathA2, aSurvivorA2) * cf
        const aContribB = moAt(aAge, aOwnB2, saB, aSpousalB2, spousalStartB2, bDeathA2, aSurvivorB2) * cf
        yrA += aContribA; yrAa += aContribA
        yrB += aContribB; yrBa += aContribB
        // Person B contribution per strategy (while alive and after B's filing age)
        if (b) {
          const bAge = aAge + ageDiff2
          if (bAge < leB) {
            if (sbA != null && bAge >= sbA) { yrA += bOwnA2 * cf; yrAb += bOwnA2 * cf }
            if (sbB != null && bAge >= sbB) { yrB += bOwnB2 * cf; yrBb += bOwnB2 * cf }
          }
        }
      }
      cumAnn_A += yrA
      cumAnn_B += yrB

      const bAgeThisYr = b ? yr + ageDiff2 : null
      annualRows.push({
        ageA: yr,
        ageB: bAgeThisYr != null ? Math.round(bAgeThisYr * 10) / 10 : null,
        bAlive: bAgeThisYr != null ? bAgeThisYr < leB : false,
        stratACum: Math.round(cumAnn_A),
        stratBCum: Math.round(cumAnn_B),
        stratAMonthly: Math.round(yrA / 12),
        stratBMonthly: Math.round(yrB / 12),
        stratAaMonthly: Math.round(yrAa / 12),
        stratAbMonthly: Math.round(yrAb / 12),
        stratBaMonthly: Math.round(yrBa / 12),
        stratBbMonthly: Math.round(yrBb / 12),
      })
    }

    setResults({
      stratA: resA,
      stratB: resB,
      breakeven: bkv,
      netDiff: resB.lifetimeTotal - resA.lifetimeTotal,
      milestones,
      fra: { a: fraA, b: fraB },
      names: { a: personA.name || 'Person A', b: personB.name || 'Person B' },
      lifeExps: { a: leA, b: leB },
      annualRows,
      ageDiff: ageDiff2,
    })
    setErrors([])
  }, [marital, personA, personB, stratA, stratB, cola])

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
                      <label className="ssc-label">Name <span className="ssc-optional">(optional)</span></label>
                      <input className={inputCls} type="text" placeholder="e.g. Jane"
                        value={personA.name}
                        onChange={e => setPersonA(p => ({ ...p, name: e.target.value }))} />
                    </div>
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
                    <div className="ssc-field ssc-field--le-inline">
                      <label className="ssc-label">Life Expectancy</label>
                      <div className="ssc-le-row">
                        <input className={`${inputCls} ssc-le-input`} type="number"
                          min={70} max={105} value={personA.lifeExp}
                          onChange={e => setPersonA(p => ({ ...p, lifeExp: e.target.value }))} />
                        <input className="ssc-slider" type="range" min={70} max={105}
                          value={personA.lifeExp}
                          onChange={e => setPersonA(p => ({ ...p, lifeExp: e.target.value }))} />
                      </div>
                    </div>
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

              {/* COLA */}
              <div className="ssc-cola-row">
                <div className="ssc-cola-label-wrap">
                  <label className="ssc-label">Annual COLA Rate</label>
                  <p className="ssc-fra-note">Applied to both strategies equally. Higher rates compound the advantage of the larger benefit.</p>
                </div>
                <div className="ssc-le-row ssc-cola-inputs">
                  <input className={`${inputCls} ssc-le-input`} type="number"
                    min={0} max={10} step={0.1} value={cola}
                    onChange={e => setCola(e.target.value)} />
                  <span className="ssc-cola-pct">%</span>
                  <input className="ssc-slider" type="range" min={0} max={6} step={0.1}
                    value={cola} onChange={e => setCola(e.target.value)} />
                </div>
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
                <div className={`ssc-result-tile${results.netDiff < 0 ? ' ssc-result-tile--winner' : ''}`}>
                  <p className="ssc-tile-label">Strategy A</p>
                  <p className="ssc-tile-filing">
                    {marital === 'married'
                      ? `${results.names.a} files at ${stratA.aFilingAge} and ${results.names.b} files at ${stratA.bFilingAge}`
                      : `${results.names.a} files at ${stratA.aFilingAge}`
                    }
                  </p>
                  {results.stratA.phases.map((ph, i) => (
                    <div key={i} className="ssc-phase-row">
                      <span className="ssc-phase-label">{ph.label}</span>
                      <span className="ssc-phase-val">{fmt(ph.monthly)}<em>/mo</em></span>
                    </div>
                  ))}
                  {marital === 'married' && results.stratA.bMonthly > 0 && (
                    <div className="ssc-phase-row ssc-phase-row--partner">
                      <span className="ssc-phase-label">{results.names.b}’s own benefit</span>
                      <span className="ssc-phase-val">{fmt(results.stratA.bMonthly)}<em>/mo</em></span>
                    </div>
                  )}
                  <div className="ssc-tile-total">
                    <span>Household total</span>
                    <span>{fmt(results.stratA.lifetimeTotal)}</span>
                  </div>
                </div>

                {/* Strategy B tile */}
                <div className={`ssc-result-tile${results.netDiff >= 0 ? ' ssc-result-tile--winner' : ''}`}>
                  <p className="ssc-tile-label">Strategy B</p>
                  <p className="ssc-tile-filing">
                    {marital === 'married'
                      ? `${results.names.a} files at ${stratB.aFilingAge} and ${results.names.b} files at ${stratB.bFilingAge}`
                      : `${results.names.a} files at ${stratB.aFilingAge}`
                    }
                  </p>
                  {results.stratB.phases.map((ph, i) => (
                    <div key={i} className="ssc-phase-row">
                      <span className="ssc-phase-label">{ph.label}</span>
                      <span className="ssc-phase-val">{fmt(ph.monthly)}<em>/mo</em></span>
                    </div>
                  ))}
                  {marital === 'married' && results.stratB.bMonthly > 0 && (
                    <div className="ssc-phase-row ssc-phase-row--partner">
                      <span className="ssc-phase-label">{results.names.b}’s own benefit</span>
                      <span className="ssc-phase-val">{fmt(results.stratB.bMonthly)}<em>/mo</em></span>
                    </div>
                  )}
                  <div className="ssc-tile-total">
                    <span>Household total</span>
                    <span>{fmt(results.stratB.lifetimeTotal)}</span>
                  </div>
                </div>

                {/* Difference tile */}
                <div className={`ssc-result-tile ssc-result-tile--diff${results.netDiff > 0 ? ' ssc-result-tile--gain' : ' ssc-result-tile--loss'}`}>
                  <p className="ssc-tile-label">
                    {results.netDiff >= 0
                      ? `Strategy B is better by`
                      : `Strategy A is better by`
                    }
                  </p>
                  <p className="ssc-diff-num">{fmt(Math.abs(results.netDiff))}</p>
                  <p className="ssc-diff-sub">
                    {marital === 'married' && results.lifeExps.a !== results.lifeExps.b
                      ? `lifetime (${results.names.a} to ${results.lifeExps.a} / ${results.names.b} to ${results.lifeExps.b})`
                      : `lifetime (to age ${results.lifeExps.a})`
                    }
                  </p>

                  {results.breakeven != null && (
                    <div className="ssc-breakeven">
                      <span className="ssc-breakeven-label">Breakeven</span>
                      <span className="ssc-breakeven-val">
                        {results.names.a}: {fmtAge(results.breakeven!)}
                        {marital === 'married' && results.breakeven! + results.ageDiff <= results.lifeExps.b && (
                          <> &nbsp;/&nbsp; {results.names.b}: {fmtAge(results.breakeven! + results.ageDiff)}</>
                        )}
                        {marital === 'married' && results.breakeven! + results.ageDiff > results.lifeExps.b && (
                          <> &nbsp;(after {results.names.b}&apos;s death)</>
                        )}
                      </span>
                    </div>
                  )}
                  {results.breakeven == null && (
                    <p className="ssc-breakeven-none">
                      {results.netDiff >= 0 ? 'Strategy A' : 'Strategy B'} never overtakes within the projection
                    </p>
                  )}
                </div>
              </div>

              {/* Annual table */}
              <div className="ssc-milestone-wrap">
                <h2 className="ssc-section-heading">
                Cumulative benefits by year
                {parseFloat(cola) > 0 && (
                  <span className="ssc-cola-badge">{cola}% COLA applied</span>
                )}
              </h2>
                <div className="ssc-table-wrap">
                  <table className="ssc-table">
                    <thead>
                      {marital === 'married' ? (
                        <>
                          <tr>
                            <th rowSpan={2}>{results.names.a}</th>
                            <th colSpan={2} className="ssc-th-benefit">Benefit</th>
                            <th rowSpan={2}>{results.names.b}</th>
                            <th colSpan={2} className="ssc-th-benefit">Benefit</th>
                            <th colSpan={2} className="ssc-th-group ssc-th-group--a">Strategy A</th>
                            <th colSpan={2} className="ssc-th-group ssc-th-group--b">Strategy B</th>
                            <th rowSpan={2}>Difference</th>
                          </tr>
                          <tr>
                            <th>A</th>
                            <th>B</th>
                            <th>A</th>
                            <th>B</th>
                            <th>Household /mo</th>
                            <th>Total</th>
                            <th>Household /mo</th>
                            <th>Total</th>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <th>{results.names.a}</th>
                          <th>Strategy A /mo</th>
                          <th>Strategy A total</th>
                          <th>Strategy B /mo</th>
                          <th>Strategy B total</th>
                          <th>Difference</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {results.annualRows.map((row, i) => {
                        const diff = row.stratBCum - row.stratACum
                        const bDiesThisYear = marital === 'married' && !row.bAlive &&
                          (i === 0 || (results.annualRows[i - 1]?.bAlive ?? true))
                        const isLastYear = row.ageA >= Math.floor(results.lifeExps.a)
                        return (
                          <tr key={i} className={bDiesThisYear ? 'ssc-tr-event' : isLastYear ? 'ssc-tr-last' : ''}>
                            <td className="ssc-td-age">
                              Age {row.ageA}
                              {isLastYear && <span className="ssc-badge ssc-badge--a"> last year</span>}
                            </td>
                            {marital === 'married' && (
                              <>
                                {/* Anna benefit: A then B — sits right after Anna age */}
                                <td className="ssc-td-monthly">{row.stratAaMonthly > 0 ? fmt(row.stratAaMonthly) : '—'}</td>
                                <td className="ssc-td-monthly">{row.stratBaMonthly > 0 ? fmt(row.stratBaMonthly) : '—'}</td>
                                {/* Jason age */}
                                <td className="ssc-td-age">
                                  {row.bAlive
                                    ? `Age ${Math.floor(row.ageB ?? 0)}`
                                    : <span className="ssc-deceased">Deceased</span>
                                  }
                                </td>
                                {/* Jason benefit: A then B */}
                                <td className="ssc-td-monthly">{row.stratAbMonthly > 0 ? fmt(row.stratAbMonthly) : '—'}</td>
                                <td className="ssc-td-monthly">{row.stratBbMonthly > 0 ? fmt(row.stratBbMonthly) : '—'}</td>
                                {/* Strategy A: household + total */}
                                <td className="ssc-td-monthly ssc-td-bold">{row.stratAMonthly > 0 ? fmt(row.stratAMonthly) : '—'}</td>
                                <td>{fmt(row.stratACum)}</td>
                                {/* Strategy B: household + total */}
                                <td className="ssc-td-monthly ssc-td-bold">{row.stratBMonthly > 0 ? fmt(row.stratBMonthly) : '—'}</td>
                              </>
                            )}
                            {marital !== 'married' && (
                              <td className="ssc-td-monthly">{row.stratAMonthly > 0 ? fmt(row.stratAMonthly) : '—'}</td>
                            )}
                            <td>{fmt(marital === 'married' ? row.stratBCum : row.stratACum)}</td>
                            {marital !== 'married' && (
                              <>
                                <td className="ssc-td-monthly">{row.stratBMonthly > 0 ? fmt(row.stratBMonthly) : '—'}</td>
                                <td>{fmt(row.stratBCum)}</td>
                              </>
                            )}
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
                {parseFloat(cola) > 0
                  ? ` COLA of ${cola}% compounded annually from today. `
                  : ' All projections in today\'s dollars (no COLA). '}
                Projections assume no earnings test and constant PIAs. Intended for educational illustration only — not financial or legal advice. Survivor benefit assumes Person A outlives Person B.
              </p>

            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  )
}
