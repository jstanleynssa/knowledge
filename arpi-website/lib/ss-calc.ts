// ─── Social Security Calculation Engine ─────────────────────────────────────
// Implements the dual-entitlement excess method for spousal benefits,
// validated against Jim Blair's spreadsheets (Sep 2026).

export interface Person {
  pia: number          // Primary Insurance Amount (monthly at FRA)
  birthYear: number
  birthMonth: number   // 1–12
  filingAge: number    // decimal years, e.g. 62.0, 67.0
}

export interface StrategyInputs {
  marital: 'single' | 'married'
  personA: Person
  personB?: Person     // required if married
  lifeExpectancy: number  // years for both (default 90)
}

export interface PhaseResult {
  label: string
  monthlyA: number
  monthlyB: number
  startAgeA: number    // age of person A when phase begins
}

export interface StrategyResult {
  monthlyOwnStart: number       // own benefit from filing
  monthlyCombinedStart: number  // after spousal kicks in (married only)
  monthlySurvivor: number       // after first spouse dies (married only)
  lifetimeTotal: number
  breakdownByAge: Record<number, number>  // cumulative total at each age milestone
}

export interface CalcResult {
  strategyA: StrategyResult
  strategyB: StrategyResult
  breakeven: number | null        // age of person A when B overtakes A
  netDifference: number           // strategyB.lifetimeTotal - strategyA.lifetimeTotal
}

// ─── FRA lookup ──────────────────────────────────────────────────────────────
export function getFRAMonths(birthYear: number): number {
  // Returns FRA in total months (e.g. 67*12 = 804)
  if (birthYear <= 1954) return 66 * 12
  if (birthYear === 1955) return 66 * 12 + 2
  if (birthYear === 1956) return 66 * 12 + 4
  if (birthYear === 1957) return 66 * 12 + 6
  if (birthYear === 1958) return 66 * 12 + 8
  if (birthYear === 1959) return 66 * 12 + 10
  return 67 * 12  // 1960+
}

export function getFRAYears(birthYear: number): number {
  return getFRAMonths(birthYear) / 12
}

// ─── Own benefit calculation ─────────────────────────────────────────────────
export function calcOwnBenefit(pia: number, birthYear: number, filingAge: number): number {
  const fraMonths = getFRAMonths(birthYear)
  const filingMonths = Math.round(filingAge * 12)
  const monthsEarly = fraMonths - filingMonths
  const monthsLate = filingMonths - fraMonths

  if (monthsEarly > 0) {
    // Reduction for early filing
    const first36 = Math.min(monthsEarly, 36)
    const beyond36 = Math.max(0, monthsEarly - 36)
    const reduction = (first36 * (5 / 9) + beyond36 * (5 / 12)) / 100
    return Math.round(pia * (1 - reduction))
  } else if (monthsLate > 0) {
    // Delayed credits: 8% per year = 2/3% per month, capped at age 70
    const cappedLate = Math.min(monthsLate, (70 - getFRAYears(birthYear)) * 12)
    const credit = cappedLate * (2 / 3) / 100
    return Math.round(pia * (1 + credit))
  }
  return pia
}

// ─── Spousal add-on calculation ───────────────────────────────────────────────
// Returns the spousal ADD-ON (not total) — added on top of own benefit.
// monthsEarlySpousal = months before claimant's FRA when spousal benefit STARTS
// (i.e., when the higher-earning spouse actually files, not when claimant filed)
export function calcSpousalAddon(
  claimantPIA: number,
  spousePIA: number,
  claimantBirthYear: number,
  ageWhenSpouseFiles: number,  // claimant's age when higher earner files
): number {
  const spousalBase = spousePIA * 0.5
  const excess = Math.max(0, spousalBase - claimantPIA)
  if (excess <= 0) return 0

  const fraMonths = getFRAMonths(claimantBirthYear)
  const ageWhenSpouseFilesMonths = Math.round(ageWhenSpouseFiles * 12)
  const monthsEarly = Math.max(0, fraMonths - ageWhenSpouseFilesMonths)

  if (monthsEarly === 0) return Math.round(excess)

  // Spousal reduction: 25/36% per month for first 36 months, 5/12% beyond
  const first36 = Math.min(monthsEarly, 36)
  const beyond36 = Math.max(0, monthsEarly - 36)
  const reduction = (first36 * (25 / 36) + beyond36 * (5 / 12)) / 100
  return Math.round(excess * (1 - reduction))
}

// ─── Survivor benefit ────────────────────────────────────────────────────────
// Returns survivor's monthly total (replaces, doesn't add to, own benefit)
export function calcSurvivorBenefit(
  survivorOwnBenefit: number,
  deceasedActualBenefit: number,  // what deceased was actually receiving
  deceasedPIA: number,
): number {
  // Survivor receives the higher of their own benefit or deceased's benefit
  // (minimum 82.5% of deceased's PIA if deceased filed early)
  const deceasedEffective = Math.max(deceasedActualBenefit, deceasedPIA * 0.825)
  return Math.max(survivorOwnBenefit, deceasedEffective)
}

// ─── Core projection ─────────────────────────────────────────────────────────
interface ProjectionInputs {
  marital: 'single' | 'married'
  // Person A
  aStartAge: number       // current age of A
  aPIA: number
  aBirthYear: number
  aFilingAge: number
  // Person B (married only)
  bStartAge?: number
  bPIA?: number
  bBirthYear?: number
  bFilingAge?: number
  // Projection
  lifeExpectancy: number
}

interface MonthlyBucket {
  age: number             // person A's age
  monthly: number
}

function project(inputs: ProjectionInputs): MonthlyBucket[] {
  const {
    marital, aStartAge, aPIA, aBirthYear, aFilingAge,
    bStartAge, bPIA, bBirthYear, bFilingAge,
    lifeExpectancy,
  } = inputs

  const buckets: MonthlyBucket[] = []

  const aOwnBenefit = calcOwnBenefit(aPIA, aBirthYear, aFilingAge)
  const bOwnBenefit = marital && bPIA && bBirthYear && bFilingAge
    ? calcOwnBenefit(bPIA, bBirthYear, bFilingAge)
    : 0

  // Determine age of A when B files (so we can compute spousal timing)
  const ageDiffAB = (bStartAge ?? 0) - aStartAge
  const bFilesAtAgeB = bFilingAge ?? 0
  const aAgeWhenBFiles = bFilesAtAgeB - ageDiffAB  // A's age when B files

  // Spousal add-on for A (lower earner scenario — A has smaller PIA)
  // Only applies if A's PIA < 50% of B's PIA
  const aSpousalAddon = marital && bPIA && bBirthYear && bFilingAge
    ? calcSpousalAddon(aPIA, bPIA, aBirthYear, aAgeWhenBFiles)
    : 0

  // B's spousal add-on (if B's PIA < 50% of A's PIA — less common but possible)
  const bSpousalAddon = marital && bPIA && bBirthYear && bFilingAge
    ? calcSpousalAddon(bPIA, aPIA, bBirthYear!, bFilingAge - (bStartAge! - aStartAge) + aFilingAge - (aFilingAge - (bFilingAge - (bStartAge! - aStartAge))))
    : 0
  // Note: for simplicity in this tool, we assume A is the lower earner (spousal flows to A)
  // This covers the most common advisor scenario

  // Survivor: A survives B (B dies at lifeExpectancy adjusted for age diff)
  const bDeathAgeB = lifeExpectancy  // B lives to lifeExpectancy
  const aAgeWhenBDies = bDeathAgeB - ageDiffAB

  // After B dies, A gets survivor benefit
  const aSurvivor = marital && bPIA && bBirthYear && bFilingAge
    ? calcSurvivorBenefit(
        // A's own benefit at that point (already reduced/credited from filing)
        aOwnBenefit + aSpousalAddon,
        bOwnBenefit,
        bPIA,
      )
    : 0

  // Project month by month for person A's lifetime
  const totalMonths = Math.round((lifeExpectancy - aStartAge) * 12)

  for (let m = 0; m < totalMonths; m++) {
    const aAge = aStartAge + m / 12

    let monthly = 0

    if (marital) {
      const bAge = (bStartAge ?? aStartAge) + m / 12
      const bAlive = bAge < lifeExpectancy
      const aFiled = aAge >= aFilingAge
      const bFiled = bAge >= (bFilingAge ?? 999)

      if (!aFiled) {
        monthly = 0
      } else if (bAlive) {
        // Both spouses potentially alive
        if (bFiled && aSpousalAddon > 0) {
          monthly = aOwnBenefit + aSpousalAddon
        } else {
          monthly = aOwnBenefit
        }
      } else {
        // B has died — survivor phase
        monthly = aSurvivor
      }
    } else {
      // Single
      monthly = aAge >= aFilingAge ? aOwnBenefit : 0
    }

    buckets.push({ age: aAge, monthly })
  }

  return buckets
}

// ─── Main exported function ───────────────────────────────────────────────────
export function calculate(
  inputs: StrategyInputs,
  strategyA: { aFilingAge: number; bFilingAge?: number },
  strategyB: { aFilingAge: number; bFilingAge?: number },
): CalcResult {
  const { marital, personA, personB, lifeExpectancy } = inputs
  const milestones = [75, 80, 82, 85, 90, lifeExpectancy].filter((a, i, arr) =>
    a > personA.filingAge && arr.indexOf(a) === i
  ).sort((a, b) => a - b)

  function runProjection(strategy: { aFilingAge: number; bFilingAge?: number }): StrategyResult {
    const buckets = project({
      marital,
      aStartAge: personA.birthYear
        ? new Date().getFullYear() - personA.birthYear + (new Date().getMonth() + 1 - personA.birthMonth) / 12
        : 62,  // fallback
      aPIA: personA.pia,
      aBirthYear: personA.birthYear,
      aFilingAge: strategy.aFilingAge,
      bStartAge: personB
        ? new Date().getFullYear() - personB.birthYear + (new Date().getMonth() + 1 - personB.birthMonth) / 12
        : undefined,
      bPIA: personB?.pia,
      bBirthYear: personB?.birthYear,
      bFilingAge: strategy.bFilingAge,
      lifeExpectancy,
    })

    const lifetimeTotal = buckets.reduce((sum, b) => sum + b.monthly, 0)

    // Cumulative at milestones
    const breakdownByAge: Record<number, number> = {}
    let running = 0
    for (const b of buckets) {
      running += b.monthly
      for (const m of milestones) {
        if (b.age >= m && breakdownByAge[m] === undefined) {
          breakdownByAge[m] = Math.round(running)
        }
      }
    }
    // Fill any remaining milestones
    for (const m of milestones) {
      if (breakdownByAge[m] === undefined) breakdownByAge[m] = Math.round(running)
    }

    // Monthly phases
    const aOwnBenefit = calcOwnBenefit(personA.pia, personA.birthYear, strategy.aFilingAge)
    const ageDiffAB = personB
      ? (new Date().getFullYear() - personB.birthYear) - (new Date().getFullYear() - personA.birthYear)
      : 0
    const aAgeWhenBFiles = strategy.bFilingAge != null
      ? strategy.bFilingAge - ageDiffAB
      : 0
    const aSpousalAddon = marital && personB && strategy.bFilingAge != null
      ? calcSpousalAddon(personA.pia, personB.pia, personA.birthYear, aAgeWhenBFiles)
      : 0
    const bOwnBenefit = marital && personB && strategy.bFilingAge != null
      ? calcOwnBenefit(personB.pia, personB.birthYear, strategy.bFilingAge)
      : 0
    const survivor = marital && personB
      ? calcSurvivorBenefit(aOwnBenefit + aSpousalAddon, bOwnBenefit, personB.pia)
      : 0

    return {
      monthlyOwnStart: Math.round(aOwnBenefit),
      monthlyCombinedStart: Math.round(aOwnBenefit + aSpousalAddon),
      monthlySurvivor: Math.round(survivor),
      lifetimeTotal: Math.round(lifetimeTotal),
      breakdownByAge,
    }
  }

  const resultA = runProjection(strategyA)
  const resultB = runProjection(strategyB)

  // Breakeven: find age where cumulative B overtakes cumulative A
  const bucketsA = project({
    marital,
    aStartAge: new Date().getFullYear() - personA.birthYear + (new Date().getMonth() + 1 - personA.birthMonth) / 12,
    aPIA: personA.pia,
    aBirthYear: personA.birthYear,
    aFilingAge: strategyA.aFilingAge,
    bStartAge: personB
      ? new Date().getFullYear() - personB.birthYear + (new Date().getMonth() + 1 - personB.birthMonth) / 12
      : undefined,
    bPIA: personB?.pia,
    bBirthYear: personB?.birthYear,
    bFilingAge: strategyA.bFilingAge,
    lifeExpectancy,
  })
  const bucketsB = project({
    marital,
    aStartAge: new Date().getFullYear() - personA.birthYear + (new Date().getMonth() + 1 - personA.birthMonth) / 12,
    aPIA: personA.pia,
    aBirthYear: personA.birthYear,
    aFilingAge: strategyB.aFilingAge,
    bStartAge: personB
      ? new Date().getFullYear() - personB.birthYear + (new Date().getMonth() + 1 - personB.birthMonth) / 12
      : undefined,
    bPIA: personB?.pia,
    bBirthYear: personB?.birthYear,
    bFilingAge: strategyB.bFilingAge,
    lifeExpectancy,
  })

  let cumA = 0, cumB = 0, breakeven: number | null = null
  for (let i = 0; i < Math.min(bucketsA.length, bucketsB.length); i++) {
    cumA += bucketsA[i].monthly
    cumB += bucketsB[i].monthly
    if (cumB >= cumA && breakeven === null && cumA > 0) {
      breakeven = Math.round(bucketsA[i].age * 10) / 10
    }
  }

  return {
    strategyA: resultA,
    strategyB: resultB,
    breakeven,
    netDifference: resultB.lifetimeTotal - resultA.lifetimeTotal,
  }
}

// ─── Validation (Jim Blair numbers) ──────────────────────────────────────────
// Wife PIA $1,500, Husband PIA $3,800, FRA 67 for both
// Wife files 62, Husband files 67:
//   own = $1,050 ✓
//   spousal addon = $333 ✓
//   total combined = $1,383 ✓
// Wife files 67: own = $1,500, spousal addon = $400, total = $1,900 ✓
