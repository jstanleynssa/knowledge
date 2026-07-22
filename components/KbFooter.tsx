/**
 * Shared Knowledge Base footer.
 * Used by all public-facing pages.
 */

const NAVY = '#0D3B5C';
const SOFT = '#4A5560';
const RULE = '#E4E0D7';
const BEIGE_MID = '#cdc4ad';

interface Props {
  /** Pass true to wrap in .wrap div (for pages that already have a wrapper). */
  wrapped?: boolean;
}

export function KbFooter({ wrapped = false }: Props) {
  const inner = (
    <div style={{ color: SOFT, fontSize: 13, lineHeight: 1.7 }}>
      {/* Company identity */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', marginBottom: 10, alignItems: 'baseline' }}>
        <span style={{ fontWeight: 700, color: NAVY }}>Social Security Professionals, LLC</span>
        <span style={{ color: BEIGE_MID }}>|</span>
        <span>1763 Columbia Road NW, Ste 175, PMB 481983, Washington, DC 20009</span>
        <span style={{ color: BEIGE_MID }}>|</span>
        <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
      </div>

      {/* Training links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 10 }}>
        <a href="https://www.nssapros.com/social-security-training" target="_blank" rel="noopener"
          style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>
          Social Security Certification &rsaquo;
        </a>
        <a href="https://www.nssapros.com/irmaa-medicare-training-course" target="_blank" rel="noopener"
          style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>
          IRMAA Certification &rsaquo;
        </a>
        <a href="https://directory.nssapros.com" target="_blank" rel="noopener"
          style={{ color: NAVY, textDecoration: 'none', fontWeight: 600 }}>
          Find an Advisor &rsaquo;
        </a>
        <a href="https://www.nssapros.com" target="_blank" rel="noopener"
          style={{ color: SOFT, textDecoration: 'none' }}>
          nssapros.com &rsaquo;
        </a>
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: 12, color: BEIGE_MID, borderTop: `1px solid ${RULE}`, paddingTop: 10, marginTop: 4 }}>
        National Social Security Advisors (NSSA&reg;) is the nation&rsquo;s first Social Security certification program
        for financial professionals, founded 2013. The NSSA Knowledge Base provides educational reference material
        based on SSA Program Operations Manual System (POMS) sources. Content is verified against SSA guidance
        but is not individualized legal, financial, or benefits advice. Rules change; verify current rules with SSA
        before making filing decisions.
      </div>
    </div>
  );

  return (
    <footer style={{ borderTop: `1px solid ${RULE}`, padding: '28px 0 48px', marginTop: 24 }}>
      {wrapped ? <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>{inner}</div> : inner}
    </footer>
  );
}
