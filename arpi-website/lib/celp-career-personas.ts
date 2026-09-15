// Career persona data for the CELP Two Tracks section.
// Parallel structure to celp-professions.ts — each persona has
// a headline, body, and why-bullets tailored to their specific motivation.

export interface CareerPersona {
  id: string
  label: string
  headline: string
  body: string
  whyBullets: string[]
}

export const CAREER_PERSONAS: CareerPersona[] = [
  {
    id: 'career-changers',
    label: 'Career changers seeking meaningful work',
    headline: "You've been good at something for years. Now you want to be great at something that matters.",
    body: "Most career changes happen when someone realizes their work is technically competent but personally hollow. End-of-life financial planning is the opposite — it's deeply technical AND profoundly human. You'll use real expertise in financial coordination, legal document review, and family guidance to help people through the hardest transitions of their lives. CELP gives you the structured credential to make that change legitimate and credible from day one, regardless of where you're coming from.",
    whyBullets: [
      'A credential that gives your career change instant professional credibility — not just a course certificate',
      'Transferable skills from almost any professional background apply directly to CELP work',
      'A practice built on purpose, not just income — the kind of work people do for decades',
      'Referral partnerships with attorneys, CPAs, and healthcare professionals that grow your reputation from day one',
    ],
  },
  {
    id: 'displaced-by-ai',
    label: 'Professionals displaced by automation',
    headline: "AI is replacing what you do. It cannot replace what families need most.",
    body: "Artificial intelligence is genuinely good at processing information, recognizing patterns, and generating documents. What it cannot do is sit across from a grieving widow and help her understand what to do next. It cannot navigate a blended family's conflict over a parent's estate. It cannot coordinate between an estate attorney, a CPA, and a hospice team on behalf of a family in crisis. CELP positions you at the exact intersection of expertise and human judgment that no algorithm can replicate — and makes that work your profession.",
    whyBullets: [
      'Work defined by human judgment and relationship — the specific skills automation lacks',
      'Growing demand driven by demographics, not economic cycles — 11,000 Americans turn 65 every day',
      'Coordination, empathy, and trust-building are your core competencies — not information retrieval',
      'A vocation that becomes more valuable, not less, as automation displaces other service roles',
    ],
  },
  {
    id: 'personal-experience',
    label: 'Those with personal experience navigating a family estate',
    headline: "You learned it the hard way. Now you can make sure other families don't have to.",
    body: "Those who have personally navigated the financial chaos of a parent's illness, death, or estate know something most professionals don't: how overwhelmed and alone families feel when no one is coordinating the picture. The missed accounts, the conflicting advisors, the documents nobody could find, the decisions that had to be made in grief. If that experience left you thinking 'someone should do this' — CELP is the credential that makes you that someone. Your lived experience isn't just personal history; it's your most powerful professional differentiator.",
    whyBullets: [
      'Your personal experience translates directly into client empathy and hard-won credibility',
      'Families trust advisors who have genuinely walked this path — it shows in every conversation',
      'CELP gives structure and professional standing to what you already intuitively understand',
      'Turn one of the hardest chapters of your life into a calling that protects other families from the same experience',
    ],
  },
  {
    id: 'independent-practice',
    label: 'Anyone building an independent practice',
    headline: "No firm. No boss. No products. Just expertise that families genuinely need.",
    body: "CELP was built to support standalone practices. You don't need an RIA, a broker-dealer, or an insurance license. You don't sell products — you sell expertise and coordination. Your income comes from families who need someone to organize their financial lives, review their legal documents, coordinate with their attorneys and advisors, and deliver a Survivors Guide that protects their legacy. The market is universal, the referral ecosystem is built in from day one, and there's no established profession competing for this space.",
    whyBullets: [
      'Complete practice independence — no firm affiliations, no product requirements, no compliance overhead',
      'Fee-for-service model: clients pay for expertise and outcomes, not commissions',
      'The Survivors Guide becomes your signature client deliverable — a tangible asset families can hold',
      'A built-in referral ecosystem with estate attorneys, CPAs, hospice organizations, and senior living communities',
    ],
  },
  {
    id: 'second-act',
    label: 'Retired professionals ready for a second act',
    headline: "You've earned the credibility. Now put it to work for families who need it most.",
    body: "A career's worth of professional experience — in finance, law, business, healthcare, or any discipline — is exactly what CELP families need. You bring something no new graduate can: decades of judgment, the ability to stay calm under pressure, and the kind of trustworthy presence that families turn to in a crisis. CELP gives you a credential and a professional framework to build a meaningful, flexible second career on your own schedule — serving clients whose need for your experience is greater than they know.",
    whyBullets: [
      'Your career experience is your most valuable credential — CELP amplifies it with structure and recognition',
      'Flexible schedule: serve clients on your terms, without a firm dictating your hours or your approach',
      "Deeply meaningful work that draws on everything you've learned and every relationship you've built",
      'A professional community of practitioners who share your commitment to doing this work with integrity',
    ],
  },
]
