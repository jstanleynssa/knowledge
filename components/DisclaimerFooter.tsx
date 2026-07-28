'use client';

/**
 * DisclaimerFooter — AXIOM footer disclaimer with expandable full Terms of Use modal.
 * Short one-liner always visible; "Full Disclaimer & Terms of Use →" opens a scrollable overlay.
 */

import { useState, useEffect, useCallback } from 'react';

const NAVY   = '#0D3B5C';
const ACCENT = '#1C80BC';
const SOFT   = '#4A6070';
const RULE   = '#1E2D42';
const DIM    = '#8EA3B8';

// ── Section heading inside modal ───────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 13,
      fontWeight: 700,
      color: '#F0F4F8',
      margin: '24px 0 6px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {children}
    </h3>
  );
}

// ── Body paragraph inside modal ────────────────────────────────────────────────
function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 10px',
      color: '#C8D4DE',
      lineHeight: 1.75,
      fontSize: 13,
    }}>
      {children}
    </p>
  );
}

// ── Bulleted list inside modal ─────────────────────────────────────────────────
function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: '#C8D4DE', lineHeight: 1.75, fontSize: 13, marginBottom: 4 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── The full disclaimer modal ──────────────────────────────────────────────────
function DisclaimerModal({ onClose }: { onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AXIOM Disclaimer & Terms of Use"
        style={{
          position: 'fixed',
          top: '5vh', left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(720px, 92vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#0D1520',
          border: `1px solid ${RULE}`,
          borderRadius: 8,
          padding: '32px 36px 40px',
          zIndex: 1001,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              AXIOM
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F0F4F8' }}>
              Disclaimer &amp; Terms of Use
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: DIM, fontSize: 22, lineHeight: 1, padding: '2px 4px',
              borderRadius: 4, marginTop: -4,
            }}
          >
            ✕
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${RULE}`, margin: '0 0 20px' }} />

        {/* ── Content ─────────────────────────────────────────────────────── */}

        <Heading>Purpose and intended audience</Heading>
        <Para>
          AXIOM is a professional research and reference tool built for financial advisors, insurance producers,
          tax professionals, attorneys, and other credentialed practitioners. It is not designed for, marketed to,
          or intended for use by consumers or benefit claimants. Nothing in AXIOM is intended to be delivered
          directly to a client or the public in its raw form.
        </Para>
        <Para>
          AXIOM is a starting point for research, not an ending point. It is designed to help you locate and
          understand governing source material faster. The professional judgment applied to that material remains
          entirely yours.
        </Para>

        <Heading>Nature of AI-generated output</Heading>
        <Para>
          AXIOM uses large language models to retrieve, summarize, and synthesize source documents.
          This technology carries known and unavoidable limitations:
        </Para>
        <Bullets items={[
          'Output is generated probabilistically and is non-deterministic — the same question may produce different answers at different times.',
          'The system can produce statements that are incomplete, imprecise, out of context, or factually incorrect, including confidently worded errors.',
          'Citations may be misattributed, and a cited passage may not fully support the statement it accompanies.',
          'Retrieval may surface a related but non-controlling provision, or miss a controlling one entirely.',
          'Numeric values, thresholds, fractions, dollar amounts, and effective dates are especially prone to error and must always be independently confirmed.',
        ]} />
        <Para>
          You must verify every material fact against the linked primary source before acting on it or
          communicating it to a client. Do not treat AXIOM output as verified simply because a citation is present.
        </Para>

        <Heading>Source materials and their legal weight</Heading>
        <Para>
          AXIOM draws on the Program Operations Manual System (POMS), the Social Security Handbook,
          Title 20 of the Code of Federal Regulations, and publicly available material from SSA.gov,
          Medicare.gov, and CMS.gov. These sources do not carry equal authority:
        </Para>
        <Bullets items={[
          'The Social Security Act and the Code of Federal Regulations are the governing law and regulations.',
          'POMS is SSA\'s internal operating instruction manual for its own employees. It does not carry the force of law, is not binding on courts, and may be revised, superseded, or archived at any time without notice.',
          'The Social Security Handbook is an informal plain-language summary published by SSA. It is not a legal document and is not a substitute for the statute or regulations.',
          'Medicare.gov and CMS.gov content is consumer-facing informational material published by the Centers for Medicare & Medicaid Services and is subject to change without notice.',
        ]} />
        <Para>
          Where these sources conflict, the statute and regulations control. AXIOM may not detect or flag such conflicts.
        </Para>

        <Heading>Currency of information</Heading>
        <Para>
          AXIOM operates against periodic snapshots of its source corpus, not a live feed. SSA and CMS revise
          POMS transmittals, program instructions, and published figures on their own schedules, and Congress
          can change the underlying law at any time. Annual figures — including the wage base, earnings test
          limits, cost-of-living adjustments, Part B and Part D premiums, IRMAA brackets, and deductibles —
          change every year and may change mid-year.
        </Para>
        <Para>
          Recent legislative and regulatory changes may not yet be reflected. Always confirm current-year
          figures and current program rules directly with SSA or CMS.
        </Para>

        <Heading>No advice; no professional relationship</Heading>
        <Para>
          AXIOM and Social Security Professionals LLC (d/b/a National Social Security Advisors) do not provide
          legal, tax, accounting, investment, insurance, or benefits advice. No attorney-client, accountant-client,
          advisory, or fiduciary relationship is created by your use of this tool. We are not a law firm and do
          not practice law. We do not represent claimants before SSA and are not authorized representatives in
          any claim, appeal, or administrative proceeding.
        </Para>
        <Para>
          Nothing produced by AXIOM constitutes a recommendation regarding any security, insurance product,
          filing strategy, enrollment election, or claiming decision for any particular person.
        </Para>

        <Heading>Your professional and regulatory responsibilities</Heading>
        <Para>
          You remain solely responsible for the advice, recommendations, and services you provide to your
          clients. Use of AXIOM does not satisfy, reduce, or shift any duty you owe under applicable law
          or regulation, including but not limited to obligations arising under the Investment Advisers Act,
          FINRA rules, state insurance regulations and best-interest standards, ERISA and Department of Labor
          guidance, IRS Circular 230, state bar rules, and the standards of any certifying body to which
          you are subject.
        </Para>
        <Para>
          If you are supervised by a broker-dealer, registered investment adviser, insurance carrier, or other
          firm, you are responsible for ensuring that your use of AXIOM — including any use of its output in
          client-facing material — complies with your firm&rsquo;s policies, technology-use rules, recordkeeping
          requirements, and supervisory review procedures.
        </Para>

        <Heading>Client communications and supervisory review</Heading>
        <Para>
          AXIOM output is internal research material. It is not pre-approved, reviewed, or filed as advertising,
          retail communication, or correspondence under any regulatory framework. If you reproduce, adapt, or
          excerpt AXIOM output in material delivered to clients or prospects, that material becomes your firm&rsquo;s
          communication and is subject to your firm&rsquo;s review, approval, disclosure, and recordkeeping obligations.
          Do not forward raw AXIOM output to a client.
        </Para>

        <Heading>Individual circumstances and agency determinations</Heading>
        <Para>
          Social Security and Medicare outcomes depend on facts specific to each individual — earnings history,
          coverage credits, marital and survivor history, disability status, non-covered employment, foreign work
          and totalization agreements, immigration status, enrollment timing, prior elections, and more. General
          rules described by AXIOM may not apply, or may apply differently, to a given case.
        </Para>
        <Para>
          Benefit entitlement, benefit amounts, enrollment periods, penalties, and income-related premium
          adjustments are determined solely by the Social Security Administration and the Centers for Medicare
          &amp; Medicaid Services. Only those agencies can make a binding determination. Estimates and
          illustrations derived from AXIOM are not determinations and carry no weight with any agency.
          Clients should confirm their own situation with SSA (1-800-772-1213 or{' '}
          <a href="https://www.ssa.gov" target="_blank" rel="noopener" style={{ color: ACCENT }}>ssa.gov</a>)
          or Medicare (1-800-MEDICARE or{' '}
          <a href="https://www.medicare.gov" target="_blank" rel="noopener" style={{ color: ACCENT }}>medicare.gov</a>),
          and should be referred to qualified legal or tax counsel where appropriate.
        </Para>

        <Heading>Confidential and personal information</Heading>
        <Para>
          Do not enter client names, Social Security numbers, dates of birth, account numbers, protected health
          information, or any other nonpublic personal information into AXIOM. Submit questions in general or
          hypothetical terms. You are responsible for compliance with all applicable privacy and data-security
          obligations, including Regulation S-P, HIPAA where applicable, and state privacy laws.
        </Para>

        <Heading>Government affiliation</Heading>
        <Para>
          AXIOM, National Social Security Advisors, the NSSA&reg; certification, and Social Security Professionals LLC
          are not affiliated with, endorsed by, sponsored by, approved by, or connected in any way with the
          Social Security Administration, the Centers for Medicare &amp; Medicaid Services, the U.S. Department of
          Health and Human Services, or any other federal or state government agency or program. Official
          information is available free of charge at{' '}
          <a href="https://www.ssa.gov" target="_blank" rel="noopener" style={{ color: ACCENT }}>ssa.gov</a>{' '}
          and{' '}
          <a href="https://www.medicare.gov" target="_blank" rel="noopener" style={{ color: ACCENT }}>medicare.gov</a>.
        </Para>

        <Heading>No warranty</Heading>
        <Para>
          AXIOM is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranty of any kind,
          express or implied, including any implied warranty of merchantability, fitness for a particular purpose,
          accuracy, completeness, currency, or non-infringement. We do not warrant that the tool will be
          uninterrupted, error-free, or that any output will be correct or suitable for any particular use.
        </Para>

        <Heading>Limitation of liability</Heading>
        <Para>
          To the maximum extent permitted by law, Social Security Professionals LLC, its members, managers,
          officers, employees, contractors, and content contributors shall not be liable for any direct,
          indirect, incidental, consequential, special, exemplary, or punitive damages, or for any lost
          profits, lost business, regulatory penalties, or client claims, arising out of or relating to your
          use of or reliance on AXIOM — whether based in contract, tort, negligence, strict liability, or
          otherwise, and whether or not we have been advised of the possibility of such damages. Our aggregate
          liability arising from or relating to AXIOM shall not exceed the amount you paid for access during
          the twelve months preceding the event giving rise to the claim.
        </Para>

        <Heading>Permitted use</Heading>
        <Para>
          Access to AXIOM is licensed to you personally as an individual user and may not be shared, resold,
          sublicensed, or made available to third parties. AXIOM output may not be used to train or develop a
          competing model or product, nor scraped, bulk-extracted, or systematically reproduced. Underlying
          government source documents are generally in the public domain; the AXIOM system, its curation,
          organization, synthesis, and interface are the proprietary property of Social Security Professionals LLC.
        </Para>

        <Heading>Acknowledgment</Heading>
        <Para>
          By using AXIOM, you acknowledge that you are a professional user, that you have read and understood
          these terms, and that you accept sole responsibility for verifying AXIOM output and for the advice
          you provide to your clients.
        </Para>

        <hr style={{ border: 'none', borderTop: `1px solid ${RULE}`, margin: '24px 0 12px' }} />
        <p style={{ fontSize: 11, color: SOFT, margin: 0 }}>Last updated: July 26, 2026</p>

        {/* Close button at bottom */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: ACCENT,
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Exported component ─────────────────────────────────────────────────────────
export function DisclaimerFooter() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Short always-visible line */}
      <div style={{ fontSize: 11, color: SOFT, borderTop: `1px solid ${RULE}`, paddingTop: 8 }}>
        AXIOM is an AI-assisted research tool for licensed and credentialed professionals. It provides
        educational reference material drawn from SSA and CMS source documents. It is not legal, tax,
        financial, or benefits advice, and it does not replace your own verification or your firm&rsquo;s
        compliance review. Output may be incomplete or inaccurate — confirm all figures, rules, and
        citations against the primary source before relying on them.{' '}
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: ACCENT,
            fontSize: 11,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          Full Disclaimer &amp; Terms of Use &rarr;
        </button>
      </div>

      {/* Modal */}
      {open && <DisclaimerModal onClose={close} />}
    </>
  );
}
