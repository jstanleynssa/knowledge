// Shared profession data for NSSA credential pages.
// Used by NssaWhoForInteractive component and /credentials/nssa/[profession] dynamic route.

export interface NssaProfession {
  id: string
  label: string
  headline: string
  body: string
  /** 3–4 bullets for the "Why NSSA® Fits Your Practice" section on individual pages */
  whyBullets: string[]
}

export const NSSA_PROFESSIONS: NssaProfession[] = [
  {
    id: 'financial-advisors',
    label: 'Financial Advisors',
    headline: "Know Social Security better than anyone in the room.",
    body: "Social Security is the single largest retirement income source for most of your clients — yet most advisors treat it as an afterthought. The NSSA® gives you a comprehensive framework for maximizing benefits, coordinating spousal strategies, and navigating the claiming decision with confidence. Clients who see you master Social Security don't just trust you — they refer you.",
    whyBullets: [
      "Optimize claiming strategies across every client situation — single, married, divorced, widowed",
      "Navigate spousal, survivor, and disability benefit rules with confidence",
      "Become the advisor clients call first for retirement income questions",
      "Differentiate your practice with a nationally recognized credential",
    ],
  },
  {
    id: 'insurance-agents',
    label: 'Insurance Agents',
    headline: "Social Security is the foundation of every client's retirement income. Understand it.",
    body: "Insurance agents who understand Social Security become indispensable at the intersection of protection and income planning. The NSSA® gives you the knowledge to discuss Social Security confidently, coordinate it with the products you offer, and position yourself as a complete retirement resource — not just an agent.",
    whyBullets: [
      "Coordinate Social Security timing with life insurance and annuity income strategies",
      "Guide clients on survivor benefit elections that affect their protection needs",
      "Differentiate from agents who only discuss products",
      "Earn CE credit toward your insurance license requirements",
    ],
  },
  {
    id: 'cpas',
    label: 'CPAs',
    headline: "Social Security is a tax planning conversation — treat it like one.",
    body: "The Social Security claiming decision has profound tax implications: provisional income, taxation of benefits, Roth conversion timing, and Medicare premiums all intersect directly. CPAs who earn the NSSA® can integrate Social Security optimization into tax planning conversations — delivering measurable value that goes well beyond the return.",
    whyBullets: [
      "Quantify Social Security's interaction with provisional income and benefit taxation",
      "Time Roth conversions and income events around optimal claiming strategy",
      "Model IRMAA exposure from income spikes near Medicare thresholds",
      "Add a recognized credential to a service line your clients actually need",
    ],
  },
  {
    id: 'estate-attorneys',
    label: 'Estate Planning Attorneys',
    headline: "Social Security shapes what's left to distribute. Know how it works.",
    body: "Spousal elections, survivor benefits, divorce benefit rules, and the interaction with pension income all affect how a client's estate is structured and what their surviving spouse will live on. NSSA® gives estate planning attorneys the Social Security fluency to advise clients more completely — and to catch the decisions that affect every document you draft.",
    whyBullets: [
      "Understand spousal and survivor benefit implications for estate plans",
      "Coordinate Social Security timing with pension and annuity income",
      "Identify divorce benefit opportunities that affect financial outcomes",
      "Deepen client relationships at the intersection of income and legacy planning",
    ],
  },
  {
    id: 'bank-wealth-advisors',
    label: 'Bank Wealth Advisors',
    headline: "Social Security is the starting point for every retirement conversation.",
    body: "Bank wealth advisors who hold the NSSA® can lead retirement income conversations with the one retirement asset every client has — Social Security. Understanding optimal claiming, coordination with other income, and the implications for Medicare and taxes gives you a foundation that distinguishes you from peers who rely on general guidance.",
    whyBullets: [
      "Lead retirement conversations with authoritative Social Security optimization",
      "Coordinate benefits with deposit, investment, and annuity products",
      "Understand Medicare cost interaction with retirement income strategies",
      "Distinguish yourself with a recognized credential within your institution",
    ],
  },
  {
    id: 'retirement-planners',
    label: 'Retirement Planners',
    headline: "Social Security is the most important retirement income decision most clients will ever make.",
    body: "Retirement planners who earn the NSSA® gain a deep, practitioner-level understanding of Social Security — not just the basics, but the edge cases, coordination rules, and strategies that can mean tens of thousands of dollars over a client's lifetime. It's the credential purpose-built for the work you already do.",
    whyBullets: [
      "Model break-even analysis and lifetime benefit maximization scenarios",
      "Navigate complex coordination rules for married, divorced, and widowed clients",
      "Coordinate Social Security with pension, 401(k), and IRA distribution strategies",
      "Deliver retirement income planning your clients can't get elsewhere",
    ],
  },
  {
    id: 'medicare-advisors',
    label: 'Medicare Advisors',
    headline: "Social Security and Medicare are the same conversation — handle both.",
    body: "Medicare advisors who also hold the NSSA® can guide clients through both foundational retirement programs in one relationship. Understanding how Social Security income affects Medicare premiums, how enrollment timing interacts with claiming strategy, and how to coordinate both programs makes you the single most valuable advisor in a client's retirement.",
    whyBullets: [
      "Coordinate Social Security claiming timing with Medicare enrollment windows",
      "Model IRMAA exposure before it surprises your clients at enrollment",
      "Understand the interaction of Social Security income and Part B/D premiums",
      "Serve clients through both programs without referring them elsewhere",
    ],
  },
  {
    id: 'tax-professionals',
    label: 'Tax Professionals',
    headline: "Every Social Security claiming decision is a tax decision. Make it count.",
    body: "Tax professionals who understand Social Security can offer something most clients have never received: a claiming recommendation that accounts for the full tax picture. Provisional income, benefit taxation, Roth conversion windows, and IRMAA all intersect directly with when and how clients claim. The NSSA® gives you the framework to make this part of every retirement tax planning engagement.",
    whyBullets: [
      "Analyze provisional income rules and Social Security benefit taxation",
      "Time claiming decisions around Roth conversion and income-planning opportunities",
      "Model the true after-tax cost of early versus delayed claiming",
      "Add a high-value credential and service line to an existing tax practice",
    ],
  },
]

/** Look up a profession by slug — returns undefined for unrecognized slugs */
export function getNssaProfessionById(id: string): NssaProfession | undefined {
  return NSSA_PROFESSIONS.find((p) => p.id === id)
}
