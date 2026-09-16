/**
 * check-poms-updates.ts — Corpus change detection for POMS sections
 *
 * Fetches a rolling batch of POMS sections from SSA, compares their
 * "Last Updated" stamp against what's stored in source_documents, and
 * logs any changes to corpus_update_log for admin review.
 *
 * Priority order:
 *   1. Sections cited in published reference_pages (highest advisor impact)
 *   2. Tier 1 sections (RS, GN, HI) not yet checked
 *   3. All other rule sections ordered by oldest last_checked
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/check-poms-updates.ts
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/check-poms-updates.ts --batch=100
 *   npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/check-poms-updates.ts --dry-run
 *
 * Run weekly via cron:
 *   0 6 * * 1 cd /Users/nssaagent/knowledge && npx tsx --tsconfig tsconfig.json --env-file .env.worker scripts/ingest/check-poms-updates.ts >> /tmp/poms-check.log 2>&1
 */

import { createServiceClient } from '@/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.worker' });

// ─── Config ───────────────────────────────────────────────────────────────────

const POMS_BASE   = 'https://secure.ssa.gov/apps10/poms.nsf/lnx';
const UA          = 'Tank/1.0 (NSSA Knowledge Base staleness check; admin@nssapros.com)';
const DELAY_MS    = 1200;   // polite delay between SSA requests
const BATCH_SIZE  = parseInt(process.env.BATCH ?? process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] ?? '50');
const DRY_RUN     = process.argv.includes('--dry-run');

// Tier 1 prefixes — highest advisor relevance, check first
const TIER1_PREFIXES = ['RS ', 'GN ', 'HI '];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Extract last_updated from SSA POMS page ──────────────────────────────────

function extractLastUpdated(html: string): string | null {
  const luHidden = html.match(/input[^>]*name="LastUpdate"[^>]*value="([^"]+)"/i);
  const luSpan   = html.match(/Effective\s+Dates?[^<]{0,5}<\/span>[^<]*([A-Z][a-z]+\s+\d{1,2},?\s*\d{4}|\d{2}\/\d{2}\/\d{4})/i);
  return luHidden?.[1] ?? luSpan?.[1] ?? null;
}

// ─── Fetch POMS section ───────────────────────────────────────────────────────

function sectionToLeafId(sectionNumber: string): string | null {
  // RS 00615.201 → rs00615201000
  // GN 00204.020 → gn00204020000
  const m = sectionNumber.match(/^([A-Z]{2})\s+(\d{5})\.(\d{3})/i);
  if (!m) return null;
  return `${m[1].toLowerCase()}${m[2]}${m[3]}000`;
}

async function fetchLastUpdated(sectionNumber: string, sourceUrl: string): Promise<string | null> {
  // Try the stored source_url first; fall back to derived leaf URL
  const leafId  = sectionToLeafId(sectionNumber);
  const url     = leafId ? `${POMS_BASE}/${leafId}` : sourceUrl;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal:  AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractLastUpdated(html);
  } catch {
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();
  const today    = new Date().toISOString().split('T')[0];

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`POMS Change Detection — ${today}`);
  console.log(`Batch size: ${BATCH_SIZE} | Dry run: ${DRY_RUN}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  // ── Step 1: Find sections cited in published pages (highest priority) ──────
  const { data: publishedPages } = await supabase
    .from('reference_pages')
    .select('primary_sources')
    .eq('status', 'published');

  const citedSections = new Set<string>();
  for (const page of publishedPages ?? []) {
    for (const src of (page.primary_sources ?? []) as Array<{section_number: string}>) {
      if (src.section_number?.match(/^(RS|GN|HI|DI|SI)\s/i)) {
        citedSections.add(src.section_number);
      }
    }
  }
  console.log(`Cited POMS sections across published pages: ${citedSections.size}`);

  // ── Step 2: Fetch batch of sections to check ──────────────────────────────
  // Priority: cited first, then Tier 1, then all others — ordered by oldest last_checked
  const { data: allDocs } = await supabase
    .from('source_documents')
    .select('id, section_number, source_url, last_updated, last_checked, source_type')
    .eq('source_type', 'poms')
    .eq('doc_kind', 'rule')
    .is('superseded_at', null)
    .not('section_number', 'is', null)
    .not('source_url', 'is', null)
    .order('last_checked', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE * 3); // fetch more than needed so we can prioritize

  if (!allDocs || allDocs.length === 0) {
    console.log('No documents to check.');
    return;
  }

  // Sort: cited first, then Tier 1, then others
  const prioritized = [
    ...allDocs.filter(d => citedSections.has(d.section_number!)),
    ...allDocs.filter(d => !citedSections.has(d.section_number!) && TIER1_PREFIXES.some(p => d.section_number!.startsWith(p))),
    ...allDocs.filter(d => !citedSections.has(d.section_number!) && !TIER1_PREFIXES.some(p => d.section_number!.startsWith(p))),
  ].slice(0, BATCH_SIZE);

  console.log(`Checking ${prioritized.length} sections…\n`);

  // ── Step 3: Check each section ────────────────────────────────────────────
  let checked = 0, changed = 0, errors = 0, unreachable = 0;

  for (const doc of prioritized) {
    const sn = doc.section_number!;
    process.stdout.write(`  ${sn.padEnd(20)} `);

    const freshLastUpdated = await fetchLastUpdated(sn, doc.source_url!);

    if (!freshLastUpdated) {
      process.stdout.write(`⚠ unreachable\n`);
      unreachable++;
      await sleep(DELAY_MS);
      continue;
    }

    const hasChanged = doc.last_updated && freshLastUpdated !== doc.last_updated;
    const isNew      = !doc.last_updated;

    if (hasChanged) {
      process.stdout.write(`🔴 CHANGED  ${doc.last_updated} → ${freshLastUpdated}\n`);
      changed++;

      if (!DRY_RUN) {
        // Log to corpus_update_log
        await supabase.from('corpus_update_log').insert({
          section_number:   sn,
          source_type:      'poms',
          old_last_updated: doc.last_updated,
          new_last_updated: freshLastUpdated,
          status:           'pending',
        });
      }
    } else if (isNew) {
      process.stdout.write(`✓ first check (${freshLastUpdated})\n`);
    } else {
      process.stdout.write(`✓ unchanged (${freshLastUpdated})\n`);
    }

    if (!DRY_RUN) {
      // Mark section as checked today
      await supabase
        .from('source_documents')
        .update({ last_checked: today })
        .eq('id', doc.id);
    }

    checked++;
    await sleep(DELAY_MS);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`✓ Checked:     ${checked}`);
  console.log(`🔴 Changed:    ${changed}  ${changed > 0 ? '← review at /admin/corpus-health' : ''}`);
  console.log(`⚠ Unreachable: ${unreachable}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes written)`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  // ── IRMAA annual warning ──────────────────────────────────────────────────
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 10) {
    console.log(`⚠ IRMAA ANNUAL UPDATE WARNING`);
    console.log(`  It's October or later. CMS typically announces new IRMAA thresholds in November.`);
    console.log(`  Run fetch_cms.ts and fetch_medicare.ts before January 1 to keep thresholds current.`);
    console.log(`  Advisors will ask about ${new Date().getFullYear() + 1} thresholds during planning season.\n`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
