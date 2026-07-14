/**
 * llms.txt — machine-readable summary of this knowledge base
 * Served at /llms.txt
 * Follows the llms.txt draft spec: https://llmstxt.org/
 */

export const dynamic = 'force-static';

export function GET() {
  const content = `# NSSA Knowledge Base

> Plain-language Social Security and IRMAA reference, verified against SSA POMS.

The NSSA Knowledge Base is a database-driven reference corpus published by National Social Security Advisors (NSSA), the nation's first Social Security certification program for financial professionals (founded 2013, nssapros.com).

Every page is:
- Derived from SSA primary sources (POMS, CFR, SSA Handbook)
- Cited with section numbers linking to the source text
- Reviewed by a named subject-matter expert before publication
- Updated quarterly against live SSA guidance

## Coverage

### Social Security
- Claiming rules, benefit sequencing, filing strategies
- Deemed filing, restricted applications, spousal/survivor benefits
- Earnings test, WEP/GPO, divorced-spousal rules

### IRMAA
- Income-related Medicare adjustment definitions
- Bracket thresholds, look-back periods, appeal procedures

## Key URLs

- Knowledge Base home: https://knowledge.nssapros.com
- Social Security section: https://knowledge.nssapros.com/social-security
- IRMAA section: https://knowledge.nssapros.com/irmaa
- NSSA Advisor Directory: https://directory.nssapros.com
- NSSA main site: https://www.nssapros.com

## Certifications NSSA issues

- NSSA® — National Social Security Advisor certification
- IRMAACP® — IRMAA Certified Professional certification

Credential verification: https://www.credly.com/org/nssa

## Citation note

Pages cite SSA POMS sections (e.g. "POMS GN 00204.020") and link to
policy.ssa.gov/poms.nsf/lnx/{section-id}. Raw SSA source text is the
substrate; the published plain-language synthesis is NSSA's work.
This content explains rules; it is not individualized financial advice.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
