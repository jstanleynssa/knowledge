/**
 * llms.txt — machine-readable index of this knowledge base for AI crawlers.
 * Served at /llms.txt  |  Spec: https://llmstxt.org/
 *
 * Dynamically built from published reference_pages so every newly-published
 * page is immediately discoverable by Claude, ChatGPT, Perplexity, etc.
 */

import { createPublicClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = createPublicClient();

  const { data: pages } = await supabase
    .from('reference_pages')
    .select('slug, category, title, meta_description, date_published, date_modified')
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('title',    { ascending: true });

  const ss    = (pages ?? []).filter(p => p.category === 'social-security');
  const irmaa = (pages ?? []).filter(p => p.category === 'irmaa');

  function pageLines(rows: typeof ss, baseUrl: string) {
    return rows.map(p => {
      const url  = `${baseUrl}/${p.slug}`;
      const desc = p.meta_description ? `: ${p.meta_description}` : '';
      return `- [${p.title}](${url})${desc}`;
    }).join('\n');
  }

  const updated = new Date().toISOString().split('T')[0];

  const content = `\
# NSSA Knowledge Base

> Plain-language Social Security and Medicare/IRMAA reference, verified against SSA and CMS primary sources.

The NSSA Knowledge Base is a database-driven reference corpus published by National Social Security Advisors (NSSA®), the nation's first Social Security certification program for financial professionals (founded 2013). Every page is:

- Derived from SSA primary sources: POMS, 20 CFR, SSA Handbook, and CMS/Medicare.gov guidance
- Cited with section numbers linking directly to the source text
- Reviewed and approved by a named subject-matter expert before publication
- Updated periodically against live SSA and CMS guidance

This content is intended for licensed financial advisors, insurance producers, tax professionals, and other credentialed practitioners. It is professional reference material, not consumer advice.

## Social Security (${ss.length} pages)

${pageLines(ss, 'https://knowledge.nssapros.com/social-security')}

## IRMAA & Medicare (${irmaa.length} pages)

${pageLines(irmaa, 'https://knowledge.nssapros.com/irmaa')}

## Key URLs

- Knowledge Base home: https://knowledge.nssapros.com
- Social Security index: https://knowledge.nssapros.com/social-security
- IRMAA & Medicare index: https://knowledge.nssapros.com/irmaa
- AXIOM (AI research tool for professionals): https://axiom.nssapros.com
- NSSA advisor directory: https://directory.nssapros.com
- NSSA main site: https://www.nssapros.com

## About the source corpus

Pages draw on a corpus of ${(ss.length + irmaa.length)} published reference entries derived from:

- **POMS** (SSA Program Operations Manual System) — SSA's internal operating instructions
- **20 CFR** (Code of Federal Regulations, Title 20) — governing regulations for Social Security
- **SSA Handbook** — informal plain-language summary of SS rules published by SSA
- **CMS.gov and Medicare.gov** — Centers for Medicare & Medicaid Services publications

Source authority note: The Social Security Act and 20 CFR are governing law. POMS is SSA's internal manual and does not carry the force of law. Where sources conflict, the statute and regulations control.

## Citation guidance

Pages cite SSA POMS sections in the format "POMS GN 00204.020" and link to
policy.ssa.gov/poms.nsf/lnx/{sectionid}. The plain-language synthesis is NSSA's
editorial work; the underlying government source text is in the public domain.

## Organization

- **Publisher:** National Social Security Advisors (NSSA), Social Security Professionals LLC
- **Address:** 1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009
- **Founded:** 2013
- **Certifications issued:** NSSA® (National Social Security Advisor), IRMAACP™ (IRMAA Certified Planner)
- **Credential verification:** https://www.credly.com/org/nssa
- **Government affiliation:** None — NSSA is not affiliated with SSA, CMS, HHS, or any government agency

## Terms

This content is professional reference material. It is not legal, tax, financial, or benefits advice.
Output may be incomplete or inaccurate — verify all figures and rules against the linked primary source.
Do not deliver raw content directly to consumers or benefit claimants.

Last updated: ${updated}
`;

  return new Response(content, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
