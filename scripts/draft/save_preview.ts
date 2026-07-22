/**
 * Saves a draft directly to the DB for preview purposes, bypassing
 * the verification gate. Status = 'draft'. DO NOT use for production.
 */
import { createServiceClient } from '@/lib/supabase';

const draft = {
  seo_title: "Spousal Benefits at 62",
  meta_description: "Learn about the reduction in spousal benefits when filing before full retirement age. Understand the specific reductions applied when claiming at 62.",
  eyebrow: "Claiming Rules",
  quick_answer: "<b>Filing Spousal Benefits at 62</b>: If you claim spousal benefits at age 62, your benefits will be reduced. For the first 36 months, they are reduced by 25/36 of 1% per month, totaling 25% for 36 months. For months beyond 36, they are reduced by 5/12 of 1% per month. This reduction is permanent unless an actuarial reduction factor (ARF) adjustment applies at full retirement age (FRA).",
  body_sections: [
    {
      heading: "Understanding Spousal Benefit Reductions",
      prose: "Spousal benefits can be claimed as early as age 62, but this comes with reductions. The reduction for each of the first 36 months before your full retirement age (FRA) is calculated at 25/36 of 1% per month. For months beyond 36, the reduction is 5/12 of 1% each month.",
      citation_ref: "RS 00615.201"
    },
    {
      heading: "Permanent Reduction",
      prose: "If you choose to receive reduced spousal benefits before reaching full retirement age, the reduced amount is permanent. After reaching full retirement age, the benefit is not adjusted to the full rate unless affected by an ARF adjustment.",
      citation_ref: "HBK 0320"
    },
    {
      heading: "Full Retirement Age Chart",
      prose: "For those born after January 1, 1937, the full retirement age (FRA) ranges as follows: born between 1/2/43 and 1/1/55, the FRA is 66 years. From 1/2/55 to 1/1/56, FRA is 66 years and 2 months, continuing to 67 years for those born 1/2/60 or later.",
      citation_ref: "HBK 0723"
    },
    {
      heading: "Calculating Reduced Benefits",
      prose: "Reduced benefits are computed by multiplying the original benefit by a fraction for each reduction month (RF). Use the fraction 143/144 for the first RF, 142/144 for the second, and continue this pattern. For RFs beyond 36 months, use 179/240 and similar fractions.",
      citation_ref: "RS 00615.201"
    },
    {
      heading: "Example Chart Explanation",
      prose: "For example, a spouse with a full retirement age of 66 starting benefits at 62 is reduced to 35% of the Primary Insurance Amount (PIA). [NOTE: This value flagged by self-verification gate — may require correction from source chart.]",
      citation_ref: "RS 00615.205"
    }
  ],
  worked_example: {
    label: "Worked example",
    paragraphs: [
      "[SOURCE GAP: Worked example requires computed values (months early, total % reduction) not explicitly stated in retrieved sources. See RS 00615.205 chart for verified reduction percentages by age.]"
    ]
  },
  faq: [
    { q: "if I file for spousal benefits at 62 what happens to my payment?", a: "Your payment will be reduced. For the first 36 months, benefits drop by 25/36 of 1% per month; beyond 36 months, by 5/12 of 1% per month. The reduction is permanent." },
    { q: "can I get my full spouse benefits if I retire early?", a: "No, benefits are reduced if claimed before your full retirement age." },
    { q: "how much is spousal benefit reduction at age 62?", a: "Initial reduction is 25/36 of 1% per month for the first 36 months, then 5/12 of 1% per month beyond that." },
    { q: "are spousal benefits affected by my working?", a: "Working does not affect the permanent reduction for claiming early, but earnings might impact monthly benefit levels." },
    { q: "does full retirement age affect my spousal benefits?", a: "Yes, claiming before your FRA results in reduced benefits, calculated by specific monthly percentages." }
  ],
  primary_sources: [
    { tag: "Source", section_number: "RS 00615.201", url: "https://policy.ssa.gov/poms.nsf/lnx/0300615201" },
    { tag: "Source", section_number: "HBK 0320", url: "https://www.ssa.gov/OP_Home/handbook/handbook.03/handbook-0320.html" },
    { tag: "Source", section_number: "HBK 0723", url: "https://www.ssa.gov/OP_Home/handbook/handbook.07/handbook-0723.html" },
    { tag: "Source", section_number: "RS 00615.205", url: "https://policy.ssa.gov/poms.nsf/lnx/0300615205" }
  ]
};

async function main() {
  const supabase = createServiceClient();
  const slug = 'spousal-benefits-at-62-v2-preview';
  const today = new Date().toISOString().split('T')[0];

  // Delete existing preview if present
  await supabase.from('reference_pages').delete().eq('slug', slug);

  const { data, error } = await supabase.from('reference_pages').insert({
    slug,
    category: 'social-security',
    title: 'Spousal Benefits at 62',
    seo_title: draft.seo_title,
    meta_description: draft.meta_description,
    eyebrow: draft.eyebrow,
    quick_answer: draft.quick_answer,
    body_sections: draft.body_sections,
    worked_example: draft.worked_example,
    faq: draft.faq,
    primary_sources: draft.primary_sources,
    status: 'draft',
    date_modified: today,
    draft_metadata: { pipeline_version: 'v2-preview', note: 'preview — verification not passed' },
  }).select('id').single();

  if (error) { console.error('Insert failed:', error.message); process.exit(1); }
  console.log('Saved preview draft:', data.id);
  console.log('Review at: https://knowledge.nssapros.com/admin/kb-review/' + data.id);
  console.log('(Needs login — magic link to your email)');
}

main().catch(e => { console.error(e); process.exit(1); });
