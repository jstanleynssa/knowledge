// Shared profession data for IRMAACP credential pages.
// Used by IrmaacpWhoForInteractive component and /credentials/irmaacp/[profession] dynamic route.

export interface IrmaacpProfession {
  id: string
  label: string
  headline: string
  body: string
  /** 3–4 bullets for the "Why IRMAACP™ Fits Your Practice" section on individual pages */
  whyBullets: string[]
}

export const IRMAACP_PROFESSIONS: IrmaacpProfession[] = [
  {
    id: 'financial-advisors',
    label: 'Financial Advisors',
    headline: "IRMAA is eroding your clients' retirement income. Protect it.",
    body: "Most financial advisors don't discover a client's IRMAA exposure until the bill arrives — and by then it's too late to do much about it. The IRMAACP™ gives you the tools to model future surcharges, time income events strategically, and build retirement income plans that account for Medicare costs as a first-class variable. Advisors who master IRMAA protect wealth in ways their peers never see coming.",
    whyBullets: [
      "Model IRMAA surcharge exposure before income events trigger bracket jumps",
      "Time Roth conversions, RMDs, and capital gains realizations around IRMAA thresholds",
      "File successful life-changing event appeals on behalf of clients",
      "Turn Medicare cost management into a differentiated, high-value service line",
    ],
  },
  {
    id: 'wealth-managers',
    label: 'Wealth Managers',
    headline: "High-net-worth clients have the most to lose from IRMAA. Be ready.",
    body: "For affluent clients, IRMAA isn't a minor inconvenience — it's a recurring six-figure cost over a retirement. Wealth managers who hold the IRMAACP™ can model IRMAA across multi-decade income projections, coordinate withdrawal strategies to minimize bracket creep, and integrate Medicare cost planning into comprehensive wealth management engagements.",
    whyBullets: [
      "Integrate IRMAA modeling into comprehensive long-term financial plans",
      "Coordinate withdrawal sequencing to manage Medicare premium exposure across retirement",
      "Identify bracket-straddling opportunities across Roth conversions and asset sales",
      "Position IRMAA expertise as part of a premium offering for high-income clients",
    ],
  },
  {
    id: 'insurance-agents',
    label: 'Insurance Agents',
    headline: "Medicare coverage is only half the story. IRMAA is the other half.",
    body: "Insurance agents who focus on Medicare supplement or Medicare Advantage plans are already in the right conversation — but IRMAA is the cost variable most agents never address. The IRMAACP™ gives you the tools to help clients understand and manage their premium exposure, making you the advisor who solves the whole Medicare cost picture, not just the coverage.",
    whyBullets: [
      "Address IRMAA premium exposure alongside Medicare coverage and plan decisions",
      "Guide clients on life-changing event appeals that can immediately reduce surcharges",
      "Serve high-income Medicare clients with depth most agents never offer",
      "Expand your value proposition beyond plan selection to full Medicare cost management",
    ],
  },
  {
    id: 'cpas',
    label: 'CPAs',
    headline: "IRMAA is a tax planning problem. Treat it like one.",
    body: "IRMAA surcharges are triggered by MAGI — and almost every income event a CPA manages (Roth conversions, capital gains realizations, RMDs, business sale proceeds) has the potential to push a client into a higher bracket. The IRMAACP™ gives CPAs a complete IRMAA framework to integrate into tax planning, so income decisions account for the Medicare cost they create.",
    whyBullets: [
      "Model IRMAA bracket exposure within multi-year income projections",
      "Coordinate capital gains realizations and Roth conversions around MAGI thresholds",
      "Advise clients on life-changing event appeals for anomalous high-income years",
      "Quantify the true cost of income events in terms of Medicare premium impact",
    ],
  },
  {
    id: 'medicare-specialists',
    label: 'Medicare Specialists',
    headline: "IRMAA expertise is what separates good Medicare advisors from great ones.",
    body: "Medicare specialists already understand enrollment, coverage, and plan comparison — but IRMAA is the piece that most advisors either avoid or address superficially. The IRMAACP™ gives you a rigorous framework for surcharge modeling, appeals strategy, and income coordination that positions you as the definitive Medicare cost expert for high-income clients.",
    whyBullets: [
      "Lead IRMAA surcharge conversations with confidence and precision",
      "File and win life-changing event appeals for clients in anomalous income years",
      "Model future IRMAA exposure across multiple income scenarios",
      "Serve high-income Medicare clients that other advisors refer away",
    ],
  },
  {
    id: 'retirement-planners',
    label: 'Retirement Planners',
    headline: "Medicare costs are a retirement income variable. Plan for them.",
    body: "Retirement planners who ignore IRMAA are building income plans with a blind spot. For clients with income above the initial threshold, Medicare premiums can cost tens of thousands of dollars more over retirement than basic estimates account for. The IRMAACP™ gives you the framework to model, minimize, and manage that cost as part of every retirement income plan.",
    whyBullets: [
      "Integrate IRMAA projections into retirement income models from the first planning year",
      "Sequence withdrawals and income events to minimize lifetime Medicare premium costs",
      "Coordinate Social Security timing decisions with IRMAA bracket management",
      "Deliver retirement income planning that accounts for the full cost of Medicare",
    ],
  },
  {
    id: 'bank-advisors',
    label: 'Bank Advisors',
    headline: "Your high-income clients have an IRMAA problem. Be the one who sees it.",
    body: "Bank advisors serving clients with significant assets are almost certainly working with people who face IRMAA surcharges — or will. The IRMAACP™ gives you the training to identify exposure early, model the impact of income decisions, and present Medicare cost planning as part of a complete retirement conversation. It's the kind of expertise that builds lasting relationships with your highest-value clients.",
    whyBullets: [
      "Identify IRMAA exposure in client portfolios before income events trigger surcharges",
      "Coordinate CD maturities, RMDs, and withdrawals around IRMAA brackets",
      "Present Medicare cost planning as part of comprehensive retirement advice",
      "Differentiate your service within your institution with a recognized credential",
    ],
  },
  {
    id: 'estate-attorneys',
    label: 'Estate Planning Attorneys',
    headline: "The income clients take in retirement determines what they pay for Medicare. That matters for estate planning.",
    body: "Estate planning decisions — trust distributions, asset liquidations, business transitions — generate income events that directly affect IRMAA exposure. Attorneys who understand IRMAA can advise clients on the Medicare cost implications of their planning decisions, providing a more complete picture and strengthening referral relationships with the financial advisors and CPAs in their network.",
    whyBullets: [
      "Understand how estate and trust distributions create IRMAA bracket exposure",
      "Advise on the Medicare premium implications of asset liquidation and business sale timing",
      "Coordinate with financial advisors on income events that affect Medicare costs",
      "Deepen referral relationships through cross-disciplinary Medicare cost expertise",
    ],
  },
]

/** Look up a profession by slug — returns undefined for unrecognized slugs */
export function getIrmaacpProfessionById(id: string): IrmaacpProfession | undefined {
  return IRMAACP_PROFESSIONS.find((p) => p.id === id)
}
