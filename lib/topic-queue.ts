/**
 * Prioritized topic queue for the "Give me more" pull button.
 *
 * Topics are ordered by advisor impact (highest first). The generate route
 * picks the next N that don't already have a slug in reference_pages.
 * Tranche size starts at 5 — widen as consecutive clean tranches prove it.
 *
 * Add new topics here when coverage report surfaces new priority clusters.
 */

export interface QueuedTopic {
  slug: string;
  title: string;
  topic: string;          // TOPIC env var — the natural language query for retrieval
  category: 'social-security' | 'irmaa';
}

export const TOPIC_QUEUE: QueuedTopic[] = [
  // ── Social Security ────────────────────────────────────────────────────────

  // Survivor / widow
  { slug: 'widow-benefit-vs-own-retirement',
    title: 'Widow Benefit vs. Own Retirement',
    topic: 'How should a widow or widower decide between claiming survivor benefits or their own Social Security retirement benefit',
    category: 'social-security' },

  { slug: 'lump-sum-death-payment',
    title: 'Lump Sum Death Payment',
    topic: 'Who qualifies for the Social Security lump sum death payment and how to claim it',
    category: 'social-security' },

  // Benefits taxation
  { slug: 'social-security-taxation',
    title: 'When Social Security Benefits Are Taxable',
    topic: 'How the combined income rule determines when Social Security benefits are taxable and what percentage is included in income',
    category: 'social-security' },

  // Earnings record / credits
  { slug: 'social-security-credits',
    title: 'Social Security Credits and Eligibility',
    topic: 'How Social Security credits are earned and how many credits are required to qualify for retirement benefits',
    category: 'social-security' },

  { slug: 'correcting-earnings-record',
    title: 'Correcting Your Social Security Earnings Record',
    topic: 'How to identify and correct errors in your Social Security earnings record before you file',
    category: 'social-security' },

  // Grace year / earnings test nuance
  { slug: 'social-security-grace-year',
    title: 'The Social Security Grace Year Rule',
    topic: 'How the Social Security grace year rule applies in the first year of retirement and exempts monthly earnings from the earnings test',
    category: 'social-security' },

  // CSRS / federal employees
  { slug: 'social-security-csrs-fers',
    title: 'Social Security and Federal Employees',
    topic: 'How CSRS and FERS federal retirement pensions affect Social Security benefits through WEP and GPO',
    category: 'social-security' },

  // Disability
  { slug: 'ssdi-eligibility',
    title: 'Social Security Disability Insurance Eligibility',
    topic: 'How Social Security evaluates eligibility for disability benefits using the five-step sequential evaluation process',
    category: 'social-security' },

  // Voluntary suspension
  { slug: 'voluntary-suspension',
    title: 'Voluntary Suspension of Benefits',
    topic: 'What happens when you voluntarily suspend Social Security retirement benefits and how it affects spousal benefits',
    category: 'social-security' },

  // my Social Security account
  { slug: 'my-social-security-account',
    title: 'Using My Social Security Account',
    topic: 'How to use the my Social Security online account to check your earnings record, estimate benefits, and manage your benefits',
    category: 'social-security' },

  // RRB
  { slug: 'railroad-retirement-and-social-security',
    title: 'Railroad Retirement and Social Security',
    topic: 'How Railroad Retirement Board benefits interact with Social Security and how railroad work affects Social Security eligibility',
    category: 'social-security' },

  // FRA earnings test nuance
  { slug: 'earnings-test-year-of-fra',
    title: 'Earnings Test in the Year You Reach FRA',
    topic: 'How the Social Security earnings test works differently in the year you reach full retirement age — higher exempt amount and monthly rules',
    category: 'social-security' },

  // Medicare enrollment combo
  { slug: 'medicare-special-enrollment-period',
    title: 'Medicare Special Enrollment Period',
    topic: 'How the Medicare Special Enrollment Period works when you delay enrollment due to employer coverage and how to avoid late penalties',
    category: 'irmaa' },

  // Non-covered pension
  { slug: 'non-covered-pension-wep',
    title: 'Non-Covered Pensions and WEP',
    topic: 'Which pensions trigger the Windfall Elimination Provision and how non-covered employment is defined for WEP purposes',
    category: 'social-security' },

  // Substantial earnings / WEP exemption
  { slug: 'wep-substantial-earnings',
    title: 'WEP and Substantial Earnings',
    topic: 'How years of substantial Social Security-covered earnings reduce or eliminate the Windfall Elimination Provision penalty',
    category: 'social-security' },

  // ── IRMAA ─────────────────────────────────────────────────────────────────

  { slug: 'irmaa-income-thresholds',
    title: 'IRMAA Income Thresholds and Surcharge Levels',
    topic: 'What are the current IRMAA income thresholds and corresponding Medicare Part B and Part D surcharge amounts by filing status',
    category: 'irmaa' },

  { slug: 'irmaa-form-ssa-44',
    title: 'Using Form SSA-44 to Request IRMAA Reduction',
    topic: 'How to use IRS Form SSA-44 to request a new IRMAA initial determination after a qualifying life-changing event',
    category: 'irmaa' },

  { slug: 'irmaa-roth-conversions',
    title: 'IRMAA and Roth Conversions',
    topic: 'How a Roth conversion increases modified adjusted gross income and triggers or increases IRMAA surcharges two years later',
    category: 'irmaa' },

  { slug: 'irmaa-married-filing-status',
    title: 'IRMAA and Married Filing Status',
    topic: 'How IRMAA income thresholds differ by tax filing status and what happens to Medicare premiums when a spouse dies or divorces',
    category: 'irmaa' },

  { slug: 'irmaa-medicare-advantage',
    title: 'IRMAA and Medicare Advantage Plans',
    topic: 'How IRMAA applies to Medicare Advantage plans and whether switching to Medicare Advantage removes the IRMAA surcharge',
    category: 'irmaa' },

  { slug: 'irmaa-new-enrollee',
    title: 'IRMAA for New Medicare Enrollees',
    topic: 'How IRMAA is determined for someone newly enrolling in Medicare and when retroactive IRMAA determinations apply',
    category: 'irmaa' },
];
