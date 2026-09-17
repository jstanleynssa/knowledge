// ─────────────────────────────────────────────────────────────────────────────
// ARPI Course Pricing — single source of truth
// Change numbers here; they propagate automatically across the entire site.
// ─────────────────────────────────────────────────────────────────────────────

// ── Single-course pricing (NSSA® and IRMAACP™ share the same tuition) ─────────
export const TUITION_1 = 1_195  // course tuition per credential
export const CERT_1    =   195  // exam + certification + annual dues per credential
export const TOTAL_1   = TUITION_1 + CERT_1  // → 1,390

// ── CELP® standalone ──────────────────────────────────────────────────────────
export const TUITION_CELP = 3_995  // application-based; not part of NSSA/IRMAACP bundles
export const CERT_CELP    =   395  // annual exam, certification & membership
export const TOTAL_CELP   = TUITION_CELP + CERT_CELP  // → 4,390

// ── NSSA + IRMAACP 2-course bundle (all-in first year) ───────────────────────
// $1,995 all-in vs $2,780 standalone; $295/yr thereafter
export const TOTAL_2   = 1_995
export const CERT_2    =   295  // annual renewal
export const TUITION_2 = TOTAL_2 - CERT_2  // → 1,700 (implied tuition component)

/** Savings vs. buying two individual courses — tuition only (shown in bundle cards) */
export const SAVINGS_2_TUITION = TUITION_1 * 2 - TUITION_2  // → 690
/** All-in savings vs. two individual full prices (shown in enrollment flow) */
export const SAVINGS_2 = TOTAL_1 * 2 - TOTAL_2              // → 785

// ── CELP + 1 bundle (CELP + NSSA or CELP + IRMAACP, all-in first year) ────────
// $4,995 all-in vs $5,780 standalone; $495/yr thereafter
export const TOTAL_CELP_PLUS_1 = 4_995
export const CERT_CELP_PLUS_1  =   495  // annual renewal

/** All-in savings vs. CELP + one individual full price */
export const SAVINGS_CELP_PLUS_1 = TOTAL_CELP + TOTAL_1 - TOTAL_CELP_PLUS_1  // → 785

// ── CELP + NSSA + IRMAACP — all three (all-in first year) ────────────────────
// $5,995 all-in vs $7,170 standalone; $595/yr thereafter
export const TOTAL_3   = 5_995
export const CERT_3    =   595  // annual renewal
export const TUITION_3 = TOTAL_3 - CERT_3  // → 5,400 (implied tuition component)

/** Savings vs. buying all three individually — tuition only */
export const SAVINGS_3_TUITION = TUITION_CELP + TUITION_1 * 2 - TUITION_3  // → 985
/** All-in savings vs. all three individual full prices */
export const SAVINGS_3 = TOTAL_CELP + TOTAL_1 * 2 - TOTAL_3                // → 1,175

// ── NSSA → IRMAACP upgrade add-on (existing NSSA holders only) ───────────────
export const ADDON_IRMAACP = 505  // $1,195 + $505 = $1,700 bundle tuition (updated 2026-09-17)

// ── CE Hours ─────────────────────────────────────────────────────────────────
export const CE_NSSA     = 6   // maximum; varies by state (AR=3, AK/ID=4, most states=5)
export const CE_IRMAACP  = 4
export const CE_CELP     = 6
export const CE_BUNDLE_3 = CE_NSSA + CE_IRMAACP + CE_CELP  // → 16

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Format a number as a USD display string: 1195 → "$1,195" */
export function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US')
}

/** Lookup tables for EnrollClient (CELP is application-only; max enrollable count = 2) */
export const TUITION_MAP: Record<number, number> = {
  0: 0,
  1: TUITION_1,
  2: TUITION_2,
  3: TUITION_3,
}
export const CERT_MAP: Record<number, number> = {
  0: 0,
  1: CERT_1,
  2: CERT_2,
  3: CERT_3,
}
