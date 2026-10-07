'use client'

import { useState, useCallback } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SSCumulativeChart from './SSCumulativeChart'
import {
  calcOwnBenefit,
  calcSpousalAddon,
  calcSurvivorBenefit,
  getFRAYears,
} from '@/lib/ss-calc'
import { ssaLifeExpectancy, HealthTier, HEALTH_LABELS, Sex } from '@/lib/ssa-life-table'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PersonInput {
  name: string
  pia: string
  birthYear: string
  birthMonth: string
  birthDay: string    // 1–31; SSA: days 1–2 → 60 months early at 62/FRA67; days 3–31 → 59 months
  lifeExp: string
  sex: 'male' | 'female' | ''   // '' = not set
  health: HealthTier            // default 'average'
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
  aAlive: boolean
  bAlive: boolean
  year: number           // calendar year (e.g. 2026, 2027…)
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
  breakevenYear: number | null  // fractional calendar year of crossover (e.g. 2039.85)
  breakevenRowYear: number | null  // integer year of crossover row, for table highlight
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
  if (m === 0) return `${y} yrs`
  return `${y} yrs ${m} mo`
}
const MONTHS_FULL = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
function fmtBreakevenDate(calYear: number): string {
  const year = Math.floor(calYear)
  const monthIdx = Math.round((calYear - year) * 12)
  if (monthIdx === 0) return `${year}`
  if (monthIdx >= 12) return `${year + 1}`
  return `${MONTHS_FULL[monthIdx]} ${year}`
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
  const monthsToDecember = 11 - now.getMonth()

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
  const totalMonths = Math.round((lifeExpA + 1 - aCurrentAge) * 12) // +1: include full life-expectancy year
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
      if (bAge >= bFilingAge && bAge < lifeExpB + 1) { // < lifeExpB+1: include full life-expectancy year
        monthly += bOwn
      }
    }

    // COLA fires each December — count elapsed Decembers from current month
    const monthsElapsed = Math.round((aAge - aCurrentAge) * 12)
    const colaLevel = monthsElapsed < monthsToDecember
      ? 0
      : Math.ceil((monthsElapsed - monthsToDecember + 1) / 12)
    running += monthly * Math.pow(1 + cola, colaLevel)

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



// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SSCalculatorPage() {
  const [marital, setMarital] = useState<'single' | 'married'>('married')
  const [personA, setPersonA] = useState<PersonInput>({ name: '', pia: '', birthYear: '', birthMonth: '1', birthDay: '15', lifeExp: '90', sex: '', health: 'average' })
  const [personB, setPersonB] = useState<PersonInput>({ name: '', pia: '', birthYear: '', birthMonth: '1', birthDay: '15', lifeExp: '90', sex: '', health: 'average' })
  const [cola, setCola] = useState('3.7')
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

    const aDay = parseInt(personA.birthDay) || 15
    const bDay = marital === 'married' ? (parseInt(personB.birthDay) || 15) : 15
    const a = { pia: aPIA!, birthYear: aBY, birthMonth: aBM, birthDay: aDay }
    const b = marital === 'married' ? { pia: bPIA!, birthYear: bBY!, birthMonth: bBM!, birthDay: bDay } : null

    const fraA = getFRAYears(aBY)
    const fraB = b ? getFRAYears(bBY!) : 0

    const colaRate = Math.max(0, Math.min(0.10, parseFloat(cola) / 100 || 0))
    const milestones = [...new Set([75, 80, 82, 85, 90, Math.floor(leA)])].filter(m => m <= leA).sort((x, y) => x - y)

    const resA = runStrategy(marital, a, b, saA, sbA, leA, leB, colaRate, milestones)
    const resB = runStrategy(marital, a, b, saB, sbB, leA, leB, colaRate, milestones)

    // ── Annual rows for comparison table ──────────────────────────────────
    const now2 = new Date()
    const aCurrentAge2 = now2.getFullYear() - a.birthYear + (now2.getMonth() + 1 - a.birthMonth) / 12
    const bCurrentAge2 = b ? now2.getFullYear() - b.birthYear + (now2.getMonth() + 1 - b.birthMonth) / 12 : null
    const ageDiff2 = bCurrentAge2 != null ? bCurrentAge2 - aCurrentAge2 : 0

    const aOwnA2 = calcOwnBenefit(a.pia, a.birthYear, saA, a.birthDay)
    const aOwnB2 = calcOwnBenefit(a.pia, a.birthYear, saB, a.birthDay)
    const aAgeWhenBFilesA2 = sbA != null ? sbA - ageDiff2 : 0
    const aAgeWhenBFilesB2 = sbB != null ? sbB - ageDiff2 : 0
    const aSpousalA2 = (marital === 'married' && b && sbA != null) ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFilesA2, saA, a.birthDay) : 0
    const aSpousalB2 = (marital === 'married' && b && sbB != null) ? calcSpousalAddon(a.pia, b.pia, a.birthYear, aAgeWhenBFilesB2, saB, a.birthDay) : 0
    const spousalStartA2 = Math.max(saA, aAgeWhenBFilesA2)
    const spousalStartB2 = Math.max(saB, aAgeWhenBFilesB2)
    const bDeathA2 = b ? leB - ageDiff2 : leA  // A's age when B dies
    const bOwnA2 = (marital === 'married' && b && sbA != null) ? calcOwnBenefit(b.pia, b.birthYear, sbA, b.birthDay) : 0
    const bOwnB2 = (marital === 'married' && b && sbB != null) ? calcOwnBenefit(b.pia, b.birthYear, sbB, b.birthDay) : 0
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
    const endYr = Math.ceil(leA) + 1   // +1 ensures life-expectancy year is fully included
    const currentCalYear = now2.getFullYear()
    const monthsToDecember2 = 11 - now2.getMonth()

    for (let yr = startYr; yr <= endYr; yr++) {
      // Cumulative totals: COLA compounded from today — feeds stratACum/stratBCum.
      // Monthly display: one representative value per row year, COLA compounded as whole
      // integer years from the filing date. This gives exactly:
      //   filing year → base benefit (COLA^0)
      //   year+1      → base × 1.03
      //   year+2      → base × 1.03²
      // Pre-filing rows stay $0.
      let yrACola = 0, yrBCola = 0   // COLA from today — feeds cumulative totals
      for (let mo = 0; mo < 12; mo++) {
        const aAge = yr + mo / 12
        if (aAge >= leA + 1) break // include full leA year (90.0–90.917)
        // COLA fires each December — count elapsed Decembers from current month
        const monthsElapsed2 = (yr - startYr) * 12 + mo
        const colaLevel2 = monthsElapsed2 < monthsToDecember2
          ? 0
          : Math.ceil((monthsElapsed2 - monthsToDecember2 + 1) / 12)
        const cf = Math.pow(1 + colaRate, colaLevel2)
        const aMonthlyA = moAt(aAge, aOwnA2, saA, aSpousalA2, spousalStartA2, bDeathA2, aSurvivorA2)
        const aMonthlyB = moAt(aAge, aOwnB2, saB, aSpousalB2, spousalStartB2, bDeathA2, aSurvivorB2)
        yrACola += aMonthlyA * cf
        yrBCola += aMonthlyB * cf
        if (b) {
          const bAge = aAge + ageDiff2
          if (bAge < leB + 1) { // include full leB year
            if (sbA != null && bAge >= sbA) yrACola += bOwnA2 * cf
            if (sbB != null && bAge >= sbB) yrBCola += bOwnB2 * cf
          }
        }
      }
      // Monthly display: compute once at the integer-year boundary using COLA^(yearsAfterProjectionStart).
      // The user enters PIA in today's dollars. By filing year, that amount has grown with inflation
      // from the projection start (startYr), not from the filing year. Using (yr - startYr) means:
      //   - Immediate filer (startYr === filingAge): COLA^0 = raw base, same as before.
      //   - Delayed filer (e.g. 5 yrs out): filing-year display = base × COLA^5, not base × COLA^0.
      const aMoA = moAt(yr, aOwnA2, saA, aSpousalA2, spousalStartA2, bDeathA2, aSurvivorA2)
      const aMoB = moAt(yr, aOwnB2, saB, aSpousalB2, spousalStartB2, bDeathA2, aSurvivorB2)
      const aAliveThisYr = yr < leA + 1   // Person A alive this row year
      const dispAa = (aAliveThisYr && aMoA > 0) ? Math.round(aMoA * Math.pow(1 + colaRate, yr - startYr)) : 0
      const dispBa = (aAliveThisYr && aMoB > 0) ? Math.round(aMoB * Math.pow(1 + colaRate, yr - startYr)) : 0
      const bYrDisplay = yr + ageDiff2  // B's age at the start of this row year
      const dispAb = (b && sbA != null && bYrDisplay >= sbA && bYrDisplay < leB + 1)
        ? Math.round(bOwnA2 * Math.pow(1 + colaRate, yr - startYr)) : 0
      const dispBb = (b && sbB != null && bYrDisplay >= sbB && bYrDisplay < leB + 1)
        ? Math.round(bOwnB2 * Math.pow(1 + colaRate, yr - startYr)) : 0
      cumAnn_A += yrACola
      cumAnn_B += yrBCola

      const bAgeThisYr = b ? yr + ageDiff2 : null
      annualRows.push({
        ageA: yr,
        ageB: bAgeThisYr != null ? Math.round(bAgeThisYr * 10) / 10 : null,
        aAlive: aAliveThisYr,
        bAlive: bAgeThisYr != null ? bAgeThisYr < leB + 1 : false,
        year: currentCalYear + (yr - startYr),
        stratACum: Math.round(cumAnn_A),
        stratBCum: Math.round(cumAnn_B),
        stratAMonthly: dispAa + dispAb,
        stratBMonthly: dispBa + dispBb,
        stratAaMonthly: dispAa,
        stratAbMonthly: dispAb,
        stratBaMonthly: dispBa,
        stratBbMonthly: dispBb,
      })
    }

    // Derive breakeven from annualRows with linear interpolation for month precision.
    let breakevenAge: number | null = null
    let breakevenYear: number | null = null
    let breakevenRowYear: number | null = null
    // Determine which strategy wins long-term; we want the year the winner overtakes the loser.
    const aWins = resA.lifetimeTotal >= resB.lifetimeTotal
    for (let i = 1; i < annualRows.length; i++) {
      const prev = annualRows[i - 1]
      const curr = annualRows[i]

      if (aWins) {
        // Find where A overtakes B: A was behind or tied, now A is ahead
        if (prev.stratACum <= prev.stratBCum && curr.stratACum > curr.stratBCum) {
          const gapPrev = prev.stratBCum - prev.stratACum  // how far B was ahead
          const gapCurr = curr.stratACum - curr.stratBCum  // how far A is now ahead
          const fraction = gapPrev / (gapPrev + gapCurr)
          breakevenYear    = prev.year + fraction           // e.g. 2044.3
          breakevenAge     = prev.ageA + fraction
          breakevenRowYear = prev.year                     // last year loser was still ahead
          break
        }
      } else {
        // Find where B overtakes A: B was behind or tied, now B is ahead
        if (prev.stratBCum <= prev.stratACum && curr.stratBCum > curr.stratACum) {
          const gapPrev = prev.stratACum - prev.stratBCum  // how far A was ahead
          const gapCurr = curr.stratBCum - curr.stratACum  // how far B is now ahead
          const fraction = gapPrev / (gapPrev + gapCurr)
          breakevenYear    = prev.year + fraction
          breakevenAge     = prev.ageA + fraction
          breakevenRowYear = prev.year                     // last year loser was still ahead
          break
        }
      }
    }

    setResults({
      stratA: resA,
      stratB: resB,
      breakeven: breakevenAge,
      breakevenYear,
      breakevenRowYear,
      // Derive netDiff from annualRows so the summary tile and Difference column are always in sync
      netDiff: (annualRows[annualRows.length - 1]?.stratBCum ?? 0) - (annualRows[annualRows.length - 1]?.stratACum ?? 0),
      milestones,
      fra: { a: fraA, b: fraB },
      names: { a: personA.name || 'Person A', b: personB.name || 'Person B' },
      lifeExps: { a: leA, b: leB },
      annualRows,
      ageDiff: ageDiff2,
    })
    setErrors([])
  }, [marital, personA, personB, stratA, stratB, cola])

  function suggestLifeExp(p: PersonInput): number | null {
    const by = parseInt(p.birthYear)
    const bm = parseInt(p.birthMonth)
    if (!p.sex || !by || by < 1940 || by > 2005) return null
    const now = new Date()
    const age = now.getFullYear() - by + (now.getMonth() + 1 - bm) / 12
    return ssaLifeExpectancy(age, p.sex as Sex, p.health)
  }

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
            <h1 className="ssc-h1">Social Security Calculator</h1>
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
                      <div className="ssc-field" style={{ maxWidth: 72 }}>
                        <label className="ssc-label">Day</label>
                        <input className={inputCls} type="number" min={1} max={31}
                          value={personA.birthDay}
                          onChange={e => setPersonA(p => ({ ...p, birthDay: e.target.value }))} />
                      </div>
                    </div>
                    {personA.birthYear && parseInt(personA.birthYear) >= 1940 && (
                      <p className="ssc-fra-note">
                        FRA: {getFRAYears(parseInt(personA.birthYear))}
                        {parseInt(personA.birthDay) >= 3 ? ' · 59 months early at 62 (70.417%)' : ' · 60 months early at 62 (70.000%)'}
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
                      {/* Sex toggle */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {(['male', 'female'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const updated = { ...personA, sex: s }
                              const sug = suggestLifeExp(updated)
                              setPersonA(sug ? { ...updated, lifeExp: String(sug) } : updated)
                            }}
                            className={personA.sex === s ? 'ssc-sex-btn ssc-sex-btn--active' : 'ssc-sex-btn'}
                          >
                            {s === 'male' ? 'Male' : 'Female'}
                          </button>
                        ))}
                      </div>
                      {/* Health status */}
                      {personA.sex && (
                        <div style={{ marginTop: 8 }}>
                          <select
                            className="ssc-input"
                            value={personA.health}
                            onChange={e => {
                              const health = e.target.value as HealthTier
                              const updated = { ...personA, health }
                              const sug = suggestLifeExp(updated)
                              setPersonA(sug ? { ...updated, lifeExp: String(sug) } : updated)
                            }}
                          >
                            {(Object.entries(HEALTH_LABELS) as [HealthTier, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {/* Estimate note */}
                      {personA.sex && (() => {
                        const sug = suggestLifeExp(personA)
                        return sug ? (
                          <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', marginTop: 4 }}>
                            SSA estimate: age {sug} — adjust the field above as needed
                          </p>
                        ) : null
                      })()}
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
                        <div className="ssc-field" style={{ maxWidth: 72 }}>
                          <label className="ssc-label">Day</label>
                          <input className={inputCls} type="number" min={1} max={31}
                            value={personB.birthDay}
                            onChange={e => setPersonB(p => ({ ...p, birthDay: e.target.value }))} />
                        </div>
                      </div>
                      {personB.birthYear && parseInt(personB.birthYear) >= 1940 && (
                        <p className="ssc-fra-note">
                          FRA: {getFRAYears(parseInt(personB.birthYear))}
                          {parseInt(personB.birthDay) >= 3 ? ' · 59 months early at 62 (70.417%)' : ' · 60 months early at 62 (70.000%)'}
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
                        {/* Sex toggle */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {(['male', 'female'] as const).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const updated = { ...personB, sex: s }
                                const sug = suggestLifeExp(updated)
                                setPersonB(sug ? { ...updated, lifeExp: String(sug) } : updated)
                              }}
                              className={personB.sex === s ? 'ssc-sex-btn ssc-sex-btn--active' : 'ssc-sex-btn'}
                            >
                              {s === 'male' ? 'Male' : 'Female'}
                            </button>
                          ))}
                        </div>
                        {/* Health status */}
                        {personB.sex && (
                          <div style={{ marginTop: 8 }}>
                            <select
                              className="ssc-input"
                              value={personB.health}
                              onChange={e => {
                                const health = e.target.value as HealthTier
                                const updated = { ...personB, health }
                                const sug = suggestLifeExp(updated)
                                setPersonB(sug ? { ...updated, lifeExp: String(sug) } : updated)
                              }}
                            >
                              {(Object.entries(HEALTH_LABELS) as [HealthTier, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* Estimate note */}
                        {personB.sex && (() => {
                          const sug = suggestLifeExp(personB)
                          return sug ? (
                            <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', marginTop: 4 }}>
                              SSA estimate: age {sug} — adjust the field above as needed
                            </p>
                          ) : null
                        })()}
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

              {/* Print header — hidden on screen, shown on print */}
              <div className="ssc-print-header">
                <div className="ssc-print-header-bar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/arpi-logo-white.png" alt="ARPI" className="ssc-print-logo" />
                  <span className="ssc-print-header-title">Social Security Calculator Report</span>
                </div>
                <div className="ssc-print-header-meta">
                  <span className="ssc-print-scenario">
                    {marital === 'married'
                      ? `${results.names.a} files at ${stratA.aFilingAge} \u00B7 ${results.names.b} files at ${stratA.bFilingAge}\u2002\u2002vs.\u2002\u2002${results.names.a} files at ${stratB.aFilingAge} \u00B7 ${results.names.b} files at ${stratB.bFilingAge}`
                      : `${results.names.a} files at ${stratA.aFilingAge}\u2002\u2002vs.\u2002\u2002${results.names.a} files at ${stratB.aFilingAge}`
                    }
                  </span>
                  <span className="ssc-print-date">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

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
                    <span>{fmt(results.annualRows[results.annualRows.length - 1]?.stratACum ?? results.stratA.lifetimeTotal)}</span>
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
                    <span>{fmt(results.annualRows[results.annualRows.length - 1]?.stratBCum ?? results.stratB.lifetimeTotal)}</span>
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
                      <span className="ssc-breakeven-label">Breakeven{results.breakevenYear != null ? ` — ${fmtBreakevenDate(results.breakevenYear)}` : ''}</span>
                      <div className="ssc-breakeven-val">
                        <div>{results.names.a}: {fmtAge(results.breakeven!)}</div>
                        {marital === 'married' && results.breakeven! + results.ageDiff <= results.lifeExps.b && (
                          <div>{results.names.b}: {fmtAge(results.breakeven! + results.ageDiff)}</div>
                        )}
                        {marital === 'married' && results.breakeven! + results.ageDiff > results.lifeExps.b && (
                          <div>(after {results.names.b}&apos;s death)</div>
                        )}
                      </div>
                    </div>
                  )}
                  {results.breakeven == null && (
                    <p className="ssc-breakeven-none">
                      {results.netDiff >= 0 ? 'Strategy A' : 'Strategy B'} never overtakes within the projection
                    </p>
                  )}
                </div>
              </div>

              {/* ── Cumulative benefit chart ── */}
              <SSCumulativeChart
                rows={results.annualRows.map(r => ({
                  year: r.year,
                  stratACum: r.stratACum,
                  stratBCum: r.stratBCum,
                  ageA: r.ageA,
                  ageB: r.ageB,
                  stratAaMonthly: r.stratAaMonthly,
                  stratAbMonthly: r.stratAbMonthly,
                  stratBaMonthly: r.stratBaMonthly,
                  stratBbMonthly: r.stratBbMonthly,
                }))}
                breakeven={results.breakevenYear}
                names={results.names}
                stratALabel={
                  marital === 'married'
                    ? `${results.names.a} at ${stratA.aFilingAge}, ${results.names.b} at ${stratA.bFilingAge}`
                    : `files at ${stratA.aFilingAge}`
                }
                stratBLabel={
                  marital === 'married'
                    ? `${results.names.a} at ${stratB.aFilingAge}, ${results.names.b} at ${stratB.bFilingAge}`
                    : `files at ${stratB.aFilingAge}`
                }
              />

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
                            <th colSpan={5} className="ssc-th-group ssc-th-group--a">Strategy A</th>
                            <th colSpan={5} className="ssc-th-group ssc-th-group--b">Strategy B</th>
                            <th colSpan={2} className="ssc-th-group ssc-th-group--perf">Performance</th>
                          </tr>
                          <tr>
                            <th className="ssc-th-sub">{results.names.a} Age</th>
                            <th className="ssc-th-sub">Benefit</th>
                            <th className="ssc-th-sub">{results.names.b} Age</th>
                            <th className="ssc-th-sub">Benefit</th>
                            <th className="ssc-th-sub ssc-th-sub--sep">HH</th>
                            <th className="ssc-th-sub">{results.names.a} Age</th>
                            <th className="ssc-th-sub">Benefit</th>
                            <th className="ssc-th-sub">{results.names.b} Age</th>
                            <th className="ssc-th-sub">Benefit</th>
                            <th className="ssc-th-sub">HH</th>
                            <th className="ssc-th-sub">Year</th>
                            <th className="ssc-th-sub">Difference</th>
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
                      {results.annualRows.filter(r => r.aAlive).map((row, i, arr) => {
                        const diff = row.stratBCum - row.stratACum
                        const bDiesThisYear = marital === 'married' && !row.bAlive &&
                          (i === 0 || (arr[i - 1]?.bAlive ?? true))
                        const isBreakevenRow = row.year === results.breakevenRowYear
                        return (
                          <tr key={i} className={(bDiesThisYear || isBreakevenRow) ? 'ssc-tr-event' : ''}>
                            {marital === 'married' ? (
                              <>
                                {/* ── Strategy A ── */}
                                <td className="ssc-td-age">Age {row.ageA}</td>
                                <td className="ssc-td-monthly">{row.stratAaMonthly > 0 ? fmt(row.stratAaMonthly) : '—'}</td>
                                <td className="ssc-td-age">
                                  {row.bAlive
                                    ? `Age ${Math.floor(row.ageB ?? 0)}`
                                    : <span className="ssc-deceased">Deceased</span>
                                  }
                                </td>
                                <td className="ssc-td-monthly">{row.stratAbMonthly > 0 ? fmt(row.stratAbMonthly) : '—'}</td>
                                <td className="ssc-td-monthly ssc-td-bold ssc-td-group-sep">{row.stratAMonthly > 0 ? fmt(row.stratAMonthly) : '—'}</td>
                                {/* ── Strategy B ── */}
                                <td className="ssc-td-age">Age {row.ageA}</td>
                                <td className="ssc-td-monthly">{row.stratBaMonthly > 0 ? fmt(row.stratBaMonthly) : '—'}</td>
                                <td className="ssc-td-age">
                                  {row.bAlive
                                    ? `Age ${Math.floor(row.ageB ?? 0)}`
                                    : <span className="ssc-deceased">Deceased</span>
                                  }
                                </td>
                                <td className="ssc-td-monthly">{row.stratBbMonthly > 0 ? fmt(row.stratBbMonthly) : '—'}</td>
                                <td className="ssc-td-monthly ssc-td-bold">{row.stratBMonthly > 0 ? fmt(row.stratBMonthly) : '—'}</td>
                                {/* ── Year + Difference ── */}
                                <td className="ssc-td-year">{row.year}</td>
                                <td className={diff > 0 ? 'ssc-td-pos' : diff < 0 ? 'ssc-td-neg' : ''}>
                                  {diff > 0 ? `+$${diff.toLocaleString()}` : diff < 0 ? `-$${Math.abs(diff).toLocaleString()}` : '$0'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="ssc-td-age">Age {row.ageA}</td>
                                <td className="ssc-td-monthly">{row.stratAMonthly > 0 ? fmt(row.stratAMonthly) : '—'}</td>
                                <td>{fmt(row.stratACum)}</td>
                                <td className="ssc-td-monthly">{row.stratBMonthly > 0 ? fmt(row.stratBMonthly) : '—'}</td>
                                <td>{fmt(row.stratBCum)}</td>
                                <td className={diff > 0 ? 'ssc-td-pos' : diff < 0 ? 'ssc-td-neg' : ''}>
                                  {diff > 0 ? `+$${diff.toLocaleString()}` : diff < 0 ? `-$${Math.abs(diff).toLocaleString()}` : '$0'}
                                </td>
                              </>
                            )}
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
                Projections assume no earnings test and constant PIAs. Intended for educational illustration only — not financial or legal advice.
                {marital === 'married'
                  ? (() => {
                      // Determine who outlives whom based on actual birthdates + life expectancies.
                      // bDeathAgeA = Person A's age when Person B dies (life exp B adjusted for age gap).
                      const bDeathAgeA = results.lifeExps.b - results.ageDiff
                      if (results.lifeExps.a > bDeathAgeA + 0.08)
                        return ` Survivor benefit assumes ${results.names.a} outlives ${results.names.b}.`
                      if (bDeathAgeA > results.lifeExps.a + 0.08)
                        return ` Survivor benefit assumes ${results.names.b} outlives ${results.names.a}.`
                      return null  // ambiguous (within ~1 month) — omit
                    })()
                  : null
                }
              </p>

              {/* Print button — hidden on print */}
              <button onClick={() => window.print()} className="ssc-print-btn">
                🖸 Print / Save as PDF
              </button>

              {/* Print footer — hidden on screen, fixed at bottom of every page */}
              <div className="ssc-print-footer">
                Advanced Retirement Planning Institute &middot; arpinstitute.com &middot; Generated{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  )
}
