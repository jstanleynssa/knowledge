/**
 * Self-verification gate — deterministic, non-LLM.
 *
 * For every numeric specific stated in a draft (fraction, %, dollar amount, age,
 * month count), confirm the value literally appears in the full_text of a cited
 * source section. If it doesn't: reject.
 *
 * This is the mechanical guard that replaces "hope the sections were picked right."
 * It would have killed the flawed spousal page: "5/9" was not in any spousal section.
 */

export interface DraftFields {
  quick_answer: string;
  body_sections: Array<{ heading: string; prose: string; citation_ref?: string | null }>;
  worked_example?: { label: string; paragraphs: string[] } | null;
  faq?: Array<{ q: string; a: string }>;
  primary_sources: Array<{ section_number: string; url: string; tag?: string }>;
}

export interface UnverifiedClaim {
  /** The exact value that couldn't be verified. */
  value: string;
  /** Surrounding draft context (for human review). */
  context: string;
  /**
   * If the value WAS found in a retrieved section that was NOT cited,
   * this is that section number — likely a mis-citation or missing citation.
   */
  found_in_uncited?: string;
}

export interface VerificationResult {
  passed: boolean;
  verified_count: number;
  unverified: UnverifiedClaim[];
  /** All specifics extracted from the draft (for logging). */
  all_specifics: string[];
}

// ─── Extraction ──────────────────────────────────────────────────────────────

/**
 * Extract numeric/quantitative specifics from draft text that should be
 * traceable to a cited source. Runs after stripping HTML tags.
 *
 * Patterns captured:
 *   - Fractions:      25/36, 5/9, 5/12, 1/2, 3/4
 *   - Percentages:    50%, 6.2%, 0.5%
 *   - Dollar amounts: $1,000  $105
 *   - Ages:           age 62, age 66, age 60
 *   - Month counts:   36 months, 12 months
 *   - Year counts:    10 years (for duration thresholds)
 *
 * NOT captured: page numbers, list numbering, unambiguous common words.
 */
function extractSpecifics(text: string): string[] {
  // Strip HTML
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const patterns: RegExp[] = [
    // Fractions: 25/36, 5/9 of 1% — but NOT MM/DD date patterns like 01/02 or 12/31
    /\b(?!(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])(?:\/|\b))\d+\/\d+(?:\s+of\s+1%)?/g,
    /\b\d+(?:\.\d+)?%/g,                     // percentages
    /\$[\d,]+(?:\.\d{2})?/g,                 // dollar amounts
    /\bage\s+\d{2}\b/gi,                     // ages (2-digit: age 62, age 70)
    /\b\d{2,3}\s+months?\b/gi,              // month counts (2–3 digit: 36 months, 120 months)
    /\b\d{1,2}\s+years?\b/gi,               // year counts (1–2 digit thresholds)
  ];

  const found = new Set<string>();
  for (const pattern of patterns) {
    for (const match of clean.matchAll(pattern)) {
      const val = match[0].trim();
      // Skip trivially common values unlikely to be substantive claims
      if (val === '1%' || val === '0%' || val === '$0') continue;
      found.add(val);
    }
  }
  return [...found];
}

function collectDraftText(draft: DraftFields): string {
  const parts: string[] = [draft.quick_answer];
  for (const s of draft.body_sections) parts.push(s.prose);
  if (draft.worked_example) parts.push(...draft.worked_example.paragraphs);
  for (const f of (draft.faq ?? [])) parts.push(f.a);
  return parts.join('\n');
}

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * Normalise text for loose comparison:
 *  - "100%" ↔ "100 percent"  (and "percent" / "%" interchangeably)
 *  - "19/40" ↔ "19 /40" ↔ "19/ 40"  (spaces around fraction slash)
 *  - collapse multiple spaces
 */
function normalise(text: string): string {
  return text
    // Percent sign ↔ word
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\d)\s+percent/gi, '$1 percent')
    // Spaces around fraction slash: "19 /40" or "19/ 40" → "19/40"
    .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')
    // Age: "60 years old" / "60 years" (not "years of coverage") → "age 60"
    .replace(/\b(\d{2})\s+years?\s+old\b/gi, 'age $1')
    .replace(/\b(\d{2})\s+years?\b(?!\s+of\b)/gi, 'age $1')
    // Collapse whitespace
    .replace(/\s+/g, ' ');
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify every extracted specific against cited sources.
 *
 * @param draft          The parsed draft JSON
 * @param allSections    ALL sections that were retrieved (including non-cited) —
 *                       used to diagnose whether a value appeared in an uncited section.
 */
export function verifyClaims(
  draft: DraftFields,
  allSections: Array<{ section_number: string; full_text: string }>,
): VerificationResult {
  const citedNumbers = new Set(draft.primary_sources.map(s => s.section_number));

  // Normalise all source texts once for efficient lookup
  const normalisedSections = allSections.map(s => ({
    section_number: s.section_number,
    full_text: s.full_text,
    normalised: normalise(s.full_text),
  }));

  const citedNormalised = normalisedSections
    .filter(s => citedNumbers.has(s.section_number))
    .map(s => s.normalised)
    .join('\n');

  if (!citedNormalised) {
    return {
      passed: false,
      verified_count: 0,
      unverified: [{
        value: '(all)',
        context: 'No cited sections were matched in the retrieved set.',
        found_in_uncited: undefined,
      }],
      all_specifics: [],
    };
  }

  const draftText = collectDraftText(draft);
  const specifics = extractSpecifics(draftText);
  const unverified: UnverifiedClaim[] = [];

  for (const value of specifics) {
    const normValue = normalise(value);
    if (citedNormalised.includes(normValue)) continue; // ✓ verified

    // Not in cited sources — check uncited sections
    const uncitedSection = normalisedSections.find(
      s => !citedNumbers.has(s.section_number) && s.normalised.includes(normValue),
    );

    const idx = draftText.indexOf(value);
    const context = idx >= 0
      ? '\u2026' + draftText.slice(Math.max(0, idx - 80), idx + value.length + 80).replace(/\s+/g, ' ').trim() + '\u2026'
      : '(context not found)';

    unverified.push({
      value,
      context,
      found_in_uncited: uncitedSection?.section_number,
    });
  }

  return {
    passed: unverified.length === 0,
    verified_count: specifics.length - unverified.length,
    unverified,
    all_specifics: specifics,
  };
}
