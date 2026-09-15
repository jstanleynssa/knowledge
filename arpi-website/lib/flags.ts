// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — flip these before launch as needed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AXIOM_ENABLED
 * true  = AXIOM appears in nav, homepage, and sitemap (default for post-beta launch)
 * false = AXIOM section hidden at launch if beta testing is not complete
 *
 * Affects:
 *   - components/Nav.tsx         (AXIOM nav link)
 *   - app/working-home/page.tsx  (AxiomSection on homepage)
 *   - app/sitemap.ts             (/axiom URL)
 *
 * The /axiom page itself remains accessible via direct URL either way.
 */
export const AXIOM_ENABLED = true
