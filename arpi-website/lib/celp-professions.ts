// Shared profession data for CELP credential pages.
// Used by WhoForInteractive component and /credentials/celp/[profession] dynamic route.

export interface Profession {
  id: string
  label: string
  headline: string
  body: string
  /** 3–4 bullets for the "Why CELP® Fits Your Practice" section on individual pages */
  whyBullets: string[]
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'financial-advisors',
    label: 'Financial Advisors',
    headline:
      'Turn your most difficult client moments into your strongest relationships.',
    body: "Most financial advisors are prepared for market volatility — but not for the call when a client's spouse dies or a parent needs memory care. CELP® gives you a complete framework for those moments: what to do, in what order, and how to guide a family through financial decisions when emotions are highest. Advisors with this credential don't just retain clients through difficult times — they become irreplaceable.",
    whyBullets: [
      'Retain clients through the most difficult financial event they will ever face — not just market cycles.',
      'Deliver structured guidance when emotions are highest, establishing you as the lead advisor — not a referral.',
      'Build irreplaceable relationships that competitors with no end-of-life framework simply cannot replicate.',
      'Complement every client conversation about aging and legacy with a credential that signals genuine expertise.',
    ],
  },
  {
    id: 'insurance-agents',
    label: 'Insurance Agents',
    headline: 'Extend your value far beyond the policy.',
    body: "Insurance agents are often the first professional a family calls after a death — but most aren't equipped to guide what comes next. CELP® changes that. You'll understand how life insurance intersects with estate settlement, beneficiary coordination, and survivor income planning — and you'll be able to offer meaningful guidance instead of just handing off to another advisor.",
    whyBullets: [
      'Expand your role beyond policy issuance into the full estate settlement and survivor income process.',
      'Understand how life insurance intersects with beneficiary coordination, probate, and legacy planning.',
      'Position yourself as the first call after a loss — the advisor families remember for a lifetime.',
      'Add a structured framework that gives families confidence in the most financially uncertain moments.',
    ],
  },
  {
    id: 'estate-attorneys',
    label: 'Estate Planning Attorneys',
    headline: 'Serve clients through implementation, not just documents.',
    body: "You draft the plan — but most families struggle with executing it. CELP® gives you the framework to support clients through the implementation phase: coordinating assets, navigating financial institutions, and managing the practical reality of estate settlement. Attorneys who hold CELP® often find it deepens referral relationships and opens new service lines.",
    whyBullets: [
      'Support clients through document implementation — the phase where most estate plans break down.',
      'Coordinate assets, financial institutions, and settlement logistics without practicing outside your lane.',
      'Deepen referral relationships with financial advisors, CPAs, and care professionals who serve the same families.',
      'Open new advisory service lines that generate revenue beyond hourly document drafting.',
    ],
  },
  {
    id: 'cpas',
    label: 'CPAs',
    headline: 'Be the advisor families turn to when it matters most.',
    body: "CPAs are trusted — but end-of-life financial complexity extends well beyond tax filing. CELP® equips you to coordinate the full financial picture: estate assets, survivor income, benefit elections, and legacy planning. Clients who work with a CPA who holds CELP® rarely need to engage a separate estate coordinator.",
    whyBullets: [
      'Coordinate the full financial picture: estate assets, survivor income, benefit elections, and legacy planning.',
      'Serve as the single trusted advisor families no longer need to assemble from multiple sources.',
      'Add end-of-life planning to your existing tax and accounting relationships — a natural extension of trust.',
      'Differentiate your firm with the only credential built for cross-discipline financial coordination at end of life.',
    ],
  },
  {
    id: 'elder-law-attorneys',
    label: 'Elder Law Attorneys',
    headline: 'Coordinate what you can\'t bill for — and build deeper relationships.',
    body: "Elder law practice touches Medicaid planning, long-term care, and guardianship — but families still lack a coordinator for the practical financial decisions. CELP® gives you a complementary framework that deepens client relationships and positions you as the central hub for families navigating aging and end-of-life planning.",
    whyBullets: [
      'Complement Medicaid planning, long-term care, and guardianship with practical financial coordination.',
      'Become the central hub for aging families — not just one spoke in a disconnected professional network.',
      'Serve clients through the financial decisions that fall outside billable legal hours but matter just as much.',
      'Build longer, deeper client relationships that generate referrals across the full care continuum.',
    ],
  },
  {
    id: 'trust-officers',
    label: 'Trust Officers',
    headline: 'Add the human layer to fiduciary management.',
    body: "Trust officers manage assets — but beneficiaries often need guidance that goes beyond asset management. CELP® gives you the tools to support families through settlement, survivor transition, and legacy planning in a way that's both empathetic and structured. It's the credential that turns a professional relationship into a trusted one.",
    whyBullets: [
      'Add empathetic family guidance to fiduciary asset management — the layer most institutions are missing.',
      'Support beneficiaries through settlement, survivor transition, and legacy planning with structure and care.',
      'Build trust that extends well beyond the investment relationship into the family\'s full life picture.',
      'Differentiate your institution with a credential that signals genuine family service, not just fund performance.',
    ],
  },
  {
    id: 'medicare-advisors',
    label: 'Medicare Advisors',
    headline: 'Expand your conversation from coverage to care coordination.',
    body: "Medicare advisors are already having the conversation about aging. CELP® extends that naturally into end-of-life planning — helping clients understand not just their coverage, but how their medical, financial, and family decisions intersect. It's a logical credential for advisors who want to serve the whole client, not just the enrollment.",
    whyBullets: [
      'Extend enrollment conversations naturally into end-of-life financial and legacy planning.',
      'Help clients understand how coverage, care decisions, and financial planning intersect in the aging years.',
      'Become the holistic advisor families turn to across every stage — not just at annual enrollment.',
      'Build a differentiated practice around serving the whole client, not just their Medicare plan.',
    ],
  },
  {
    id: 'social-workers',
    label: 'Social Workers',
    headline: 'Pair emotional guidance with financial expertise.',
    body: "Social workers walk families through impossible moments — but without financial tools, there's a gap between emotional support and practical action. CELP® gives social workers a structured financial framework to complement their clinical skills, and opens doors to advisory roles in hospice, hospital, and community settings where financial guidance is urgently needed.",
    whyBullets: [
      'Pair clinical emotional support with a structured financial framework families urgently need.',
      'Open advisory roles in hospice, hospital, and community settings where financial guidance is scarce.',
      'Bridge the gap between emotional support and practical action — the gap most families fall into.',
      'Become indispensable to the interdisciplinary teams that serve aging and end-of-life populations.',
    ],
  },
  {
    id: 'care-managers',
    label: 'Care Managers',
    headline: 'Coordinate the full picture — not just the care plan.',
    body: "Care managers are already the hub for medical and practical decisions. CELP® extends your value into the financial dimension: helping families understand benefit elections, asset decisions, and legacy planning as part of the care conversation. It's the credential that makes you indispensable across the entire care journey.",
    whyBullets: [
      'Extend your coordination role into benefit elections, asset decisions, and legacy planning.',
      'Serve as the single point of contact across medical, practical, and financial dimensions of care.',
      'Strengthen your value proposition with every family — and every referral partner — you serve.',
      'Build referral networks across financial advisors, attorneys, and healthcare organizations.',
    ],
  },
  {
    id: 'senior-living-consultants',
    label: 'Senior Living Consultants',
    headline: 'Become the trusted guide families remember.',
    body: "Senior living consultants help families make one of the most consequential decisions of a lifetime. CELP® adds the financial fluency to make that guidance complete — understanding how care costs, benefit elections, and estate planning all interact with the housing decision. Consultants with CELP® build referral networks that others can't.",
    whyBullets: [
      'Complete the financial picture alongside housing decisions — care costs, benefit elections, estate planning.',
      'Guide families through the most consequential financial and living decision of their lifetime with confidence.',
      'Build referral networks across financial advisors, estate attorneys, and care professionals that competitors can\'t replicate.',
      'Differentiate your practice with the only credential designed for the complete senior living journey.',
    ],
  },
  {
    id: 'funeral-planners',
    label: 'Funeral Planners',
    headline: 'Support families before, during, and after.',
    body: "Funeral professionals are present at the most acute moment of loss — but the financial and legal work starts immediately after. CELP® gives you the framework to help families understand what comes next: estate settlement, survivor benefits, and practical financial coordination. It's a natural extension of the compassionate role you already play.",
    whyBullets: [
      'Guide families through estate settlement and survivor benefits in the immediate aftermath of loss.',
      'Extend your compassionate role into the practical financial decisions families are least prepared for.',
      'Build long-term family relationships that generate referrals across a network of allied professionals.',
      'Add structured financial coordination to the service you already provide at the most acute moment of loss.',
    ],
  },
  {
    id: 'new-practice',
    label: 'Building a New Practice',
    headline:
      'Build a practice around one of the most needed services of the next 30 years.',
    body: "You don't need an existing client base to make CELP® valuable. The $80 trillion wealth transfer is creating massive demand for end-of-life financial coordination — and there is no established profession filling this role. CELP® gives you the credential, the framework, and the credibility to build a standalone practice from the ground up.",
    whyBullets: [
      'Enter a market with massive, growing demand and no established profession filling the coordination role.',
      'Build a standalone practice without selling investment products, insurance, or managing assets.',
      'Use CELP® as the credential, framework, and credibility to attract clients and referral partners from day one.',
      'Capitalize on the $80 trillion wealth transfer — the largest generational transfer of wealth in American history.',
    ],
  },
]

/** Look up a profession by slug — returns undefined for unrecognized slugs */
export function getProfessionById(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id)
}
