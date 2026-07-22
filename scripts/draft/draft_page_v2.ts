/**
 * Page builder v2 — Retrieval-and-Grounding Core, Consumer A.
 *
 * Replaces draft_page.ts (which required hand-fed section numbers and used no vector index).
 *
 * Pipeline:
 *   [1] Hybrid retrieval   — topic query → fused vector + keyword search
 *   [2] Grounded drafting  — hardened prompt; operative specifics; no imported numbers
 *   [3] Self-verification  — every stated value must appear in a cited source
 *   [4] Output             — save draft to DB with retrieval trace, or report gaps
 *
 * Usage (env vars):
 *   TOPIC    = "Spousal benefit reduction for filing before full retirement age"
 *   TITLE    = "Spousal Benefits at 62"
 *   SLUG     = "spousal-benefits-at-62"
 *   CATEGORY = "social-security"   (or "irmaa")
 *   TOP_K    = 10                  (optional, default 10 retrieved sections)
 *
 * Example:
 *   TOPIC="..." TITLE="..." SLUG="..." CATEGORY="social-security" \
 *     npx tsx --tsconfig tsconfig.json --env-file .env.local scripts/draft/draft_page_v2.ts
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';
import { hybridRetrieve, type RetrievedSection } from '../retrieval/hybrid';
import { verifyClaims, type DraftFields } from './verify';
import type { Category, BodySection, FaqItem, PrimarySource } from '@/lib/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const topic    = process.env.TOPIC;
const title    = process.env.TITLE;
const slug     = process.env.SLUG;
const category = (process.env.CATEGORY ?? 'social-security') as Category;
const topK     = parseInt(process.env.TOP_K ?? '15', 10);
const dryRun          = process.env.DRY_RUN === 'true'; // print output without saving
const skipWorkedExample = process.env.SKIP_WORKED_EXAMPLE === 'true';

if (!topic || !title || !slug) {
  console.error('Required env vars: TOPIC, TITLE, SLUG');
  process.exit(1);
}

// ─── Hardened system prompt ───────────────────────────────────────────────────
//
// Rules apply the "drafting diagnostic" fixes: no imported numbers, distinguish
// benefit types, flag gaps rather than paper over them.

const SYSTEM_PROMPT = `You are a technical writer producing a Social Security reference page for the NSSA Knowledge Base.

NON-NEGOTIABLE RULES:
1. Write ONLY from the source text provided below. Do not add information from your own training.
2. STATE OPERATIVE SPECIFICS. For every rule, state the actual value from the source — the specific fraction, percentage, dollar amount, age, or threshold. Never substitute vague language ("specified fractions," "a precise formula," "a detailed chart," "the applicable reduction") for the actual number. If the number is in the source, write it. If it isn't, see Rule 3.
3. GROUND EVERY SPECIFIC; NEVER IMPORT ONE. Every number or fraction you state MUST appear verbatim in the provided source passages. Do NOT use a figure from your own knowledge, even if you believe it is correct. If you are about to write a number not present in the sources, STOP and flag it instead.
4. GAPS ARE REQUIRED, VALUED OUTPUT. If the sources lack an operative value, do NOT invent one and do NOT write evasive filler. State what the source DOES establish, then flag: [SOURCE GAP: {description of missing value}]. A flagged gap is success. Hidden-gap filler is failure.
5. DISTINGUISH BENEFIT TYPES. Retirement, spousal, and survivor benefits reduce by DIFFERENT formulas. Never apply one type's formula to another type's benefit. State which benefit type each formula governs, per the source. If a source discusses retirement reduction in a section about spousal benefits, note the distinction explicitly.
6. NO HYPOTHETICAL EXAMPLES IN BODY SECTIONS. Body section prose states rules, eligibility criteria, and formulas sourced verbatim — never a hypothetical dollar amount, computed result, or illustrative scenario ("suppose a beneficiary with a MAGI of $X..."). If illustrating a rule requires specific numbers, those numbers must appear verbatim in the cited source — if they do not, omit the illustration entirely. Reserve all examples for the worked_example field.

7. WORKED EXAMPLES COMPUTE FROM SOURCE VALUES ONLY. Every number in an example must trace to a value stated in the sources. If you cannot build the example from source-stated values, write [SOURCE GAP: worked example needs {X}] — never fabricate a calculation.
7. FAQ PHRASING. FAQ questions must match the exact phrasing style of real search queries — first-person, conversational, the way someone types into Google or an AI chatbot (e.g. "if I file for spousal benefits at 62 what happens to my payment?", "can I collect spousal and my own Social Security?"). Not formal Q&A, not advisor jargon.
8. CITATION INTEGRITY. Only cite section numbers that appear in the provided sources. Never invent or extrapolate a section number.
9. Output ONLY valid JSON matching the schema. No prose before or after.

OUTPUT SCHEMA (TypeScript-style):
{
  "title": string,              // short canonical label, ≤40 chars, used in breadcrumbs + admin (e.g. "Spousal Benefits at 62")
  "h1": string,                 // SEO-optimised page headline, 8–12 words; keyword-rich question or descriptive statement
                                //   • Include the primary keyword phrase naturally
                                //   • Use question format when it matches search intent ("How Are Spousal Benefits Reduced at 62?")
                                //   • Or statement format ("Spousal Social Security Benefit Reduction Rules at Age 62")
                                //   • NOT the same as seo_title; can be longer and more descriptive
  "seo_title": string,          // ≤60 chars, for <title> tag and SERPs
  "meta_description": string,   // 150–160 chars
  "eyebrow": string,            // MUST be one of these exact values — do not invent new ones:
                                //   Social Security: "Claiming Rules" | "Spousal & Divorced Benefits" | "Survivor Benefits" |
                                //     "Earnings Test" | "WEP & GPO" | "Benefit Calculation" | "Family Benefits" |
                                //     "Filing & Enrollment" | "Appeals & Reconsideration" | "Medicare Enrollment"
                                //   IRMAA: "IRMAA Basics" | "IRMAA Appeals" | "Medicare Part B" | "Medicare Part D"
  "quick_answer": string,       // HTML; bold key terms; ≤200 words; definition-led
  "body_sections": [            // 3–6 sections
    {
      "heading": string,
      "prose": string,          // HTML; cite section_number inline where relevant
      "citation_ref": string    // section_number from the provided sources
    }
  ],
  // worked_example is omitted when SKIP_WORKED_EXAMPLE=true
  "worked_example": {
    "label": "Worked example",
    "paragraphs": string[]      // HTML; every number must trace to a source value; omit key entirely if any value cannot be sourced verbatim
  } | null,
  "faq": [
    { "q": string, "a": string }   // 4–6 items; search-query phrasing
  ],
  "primary_sources": [
    {
      "tag": "Source",
      "section_number": string, // MUST exactly match a section number from provided sources
      "url": string             // source_url from that section
    }
  ]
}`;

// ─── User prompt builder ──────────────────────────────────────────────────────

// Max chars of full_text to include per section in the prompt.
// POMS sections can be very long; 10 sections × 8000 chars = ~80K chars ≈ 20K tokens,
// well within GPT-4o's 128K context after adding system prompt overhead.
const MAX_SECTION_CHARS = 15000;

function buildUserPrompt(
  pageTitle: string,
  sections: RetrievedSection[],
): string {
  const sourceBlock = sections
    .map(s => {
      const text = s.full_text.length > MAX_SECTION_CHARS
        ? s.full_text.slice(0, MAX_SECTION_CHARS) + '\n[... truncated for length ...]'
        : s.full_text;
      return `--- SOURCE: ${s.section_number} ---\nTitle: ${s.title ?? '(none)'}\nURL: ${s.source_url}\n\n${text}`;
    })
    .join('\n\n');

  return `Draft a reference page titled: "${pageTitle}"
CATEGORY: ${category}
TOPIC: ${topic}

Use ONLY the following source sections. Cite section numbers exactly as shown.
${sourceBlock}

Produce the JSON output per the schema. Flag any [SOURCE GAP] where operative values are missing from the sources.`;
}

// ─── Citation validator ───────────────────────────────────────────────────────

function validateCitations(
  draft: DraftFields,
  validSectionNumbers: Set<string>,
): string[] {
  return draft.primary_sources
    .map(s => s.section_number)
    .filter(sn => !validSectionNumbers.has(sn));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();

  // ── [1] Hybrid retrieval ──────────────────────────────────────────────────
  console.log('\n━━━ [1] RETRIEVAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Query: "${topic}"`);
  console.log(`Fetching top ${topK} sections via hybrid search…`);

  const { sections, trace } = await hybridRetrieve(topic!, { topK });

  console.log(`\nRetrieved ${sections.length} sections:`);
  sections.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.section_number} (score: ${s.score.toFixed(4)}, vec: ${s.debug.vector_rank ?? '—'}, kw: ${s.debug.keyword_rank ?? '—'})`);
    console.log(`     ${s.title?.slice(0, 80) ?? '(no title)'}`);
  });

  // ── Acceptance test check ─────────────────────────────────────────────────
  const targetSection = 'RS 00615.201'; // spousal acceptance test
  const targetRank = trace.fused_top.indexOf(targetSection);
  if (targetRank >= 0) {
    console.log(`\n✓ Acceptance check: ${targetSection} ranked #${targetRank + 1} in fused results`);
  } else if (topic!.toLowerCase().includes('spousal') || topic!.toLowerCase().includes('spouse')) {
    console.warn(`\n⚠ Acceptance check: ${targetSection} NOT in top ${topK} — retrieval may need tuning`);
  }

  if (sections.length === 0) {
    console.error('No sections retrieved. Check the corpus and embedding index.');
    process.exit(1);
  }

  // ── [2] Grounded drafting ─────────────────────────────────────────────────
  console.log('\n━━━ [2] DRAFTING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Calling GPT-4o with hardened prompt…');

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(title!, sections) },
    ],
  });

  const responseText = completion.choices[0]?.message?.content ?? '';

  let draft: DraftFields & {
    seo_title: string;
    meta_description: string;
    eyebrow: string;
  };

  try {
    const jsonText = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    draft = JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse model output as JSON:');
    console.error(responseText.slice(0, 1000));
    process.exit(1);
  }

  // ── Citation validation ───────────────────────────────────────────────────
  const validSNs = new Set(sections.map(s => s.section_number));
  const invalidCitations = validateCitations(draft, validSNs);
  if (invalidCitations.length > 0) {
    console.error('\n✗ CITATION VALIDATION FAILED — invented section numbers:');
    invalidCitations.forEach(sn => console.error(`  ${sn}`));
    console.error('Draft NOT saved. The model cited sections not in the retrieved set.');
    process.exit(1);
  }
  console.log('✓ All citations trace to retrieved sections');

  // Check for SOURCE GAP flags
  const allDraftText = JSON.stringify(draft);
  const gapMatches = allDraftText.match(/\[SOURCE GAP[^\]]*\]/g) ?? [];
  if (gapMatches.length > 0) {
    console.warn(`\n⚠ Model flagged ${gapMatches.length} source gap(s):`);
    gapMatches.forEach(g => console.warn(`  ${g}`));
    console.warn('These gaps should be reviewed before approving the page.');
  } else {
    console.log('✓ No source gaps flagged');
  }

  // ── [3] Self-verification gate ────────────────────────────────────────────
  console.log('\n━━━ [3] SELF-VERIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const verification = verifyClaims(draft, sections);
  console.log(`Specifics extracted: ${verification.all_specifics.length}`);
  console.log(`  Values: ${verification.all_specifics.join(', ')}`);
  console.log(`Verified: ${verification.verified_count}/${verification.all_specifics.length}`);

  if (!verification.passed) {
    console.warn(`\n⚠ VERIFICATION FLAGGED — ${verification.unverified.length} unverified claim(s) (will save to review queue for human check):`);
    for (const u of verification.unverified) {
      console.warn(`\n  VALUE: "${u.value}"`);
      console.warn(`  CONTEXT: ${u.context}`);
      if (u.found_in_uncited) {
        console.warn(`  HINT: Value exists in ${u.found_in_uncited} (retrieved but not cited — possible mis-attribution)`);
      } else {
        console.warn(`  NOT FOUND in any retrieved section. Flagged for reviewer.`);
      }
    }
    if (dryRun) console.warn('(DRY_RUN=true — printing draft anyway)\n');
  } else {
    console.log('✓ All stated values verified against cited sources');
  }

  // ── [4] Output ────────────────────────────────────────────────────────────
  console.log('\n━━━ [4] OUTPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dryRun) {
    console.log('DRY_RUN=true — draft:\n');
    console.log(JSON.stringify(draft, null, 2));
    return;
  }

  // Check for existing slug
  const { data: existing } = await supabase
    .from('reference_pages')
    .select('id, status')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.error(`Slug "${slug}" already exists (status: ${existing.status}).`);
    console.error('To update, edit the existing draft in the review UI or delete the existing row first.');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  const draftMetadata = {
    pipeline_version: 'v2',
    drafted_at: new Date().toISOString(),
    topic,
    trace,
    verification: {
      passed: verification.passed,
      specifics: verification.all_specifics,
      unverified: verification.unverified,
    },
    source_gaps: gapMatches,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('reference_pages')
    .insert({
      slug,
      category,
      title:            (draft as any).title ?? title,  // model-generated short label, fallback to env var
      h1:               (draft as any).h1 ?? null,
      seo_title:        draft.seo_title,
      meta_description: draft.meta_description,
      eyebrow:          draft.eyebrow || null,
      quick_answer:     draft.quick_answer,
      body_sections:    draft.body_sections,
      worked_example:   skipWorkedExample ? null : (draft.worked_example ?? null),
      faq:              draft.faq ?? [],
      primary_sources:  draft.primary_sources,
      // Pages with unverified claims go straight to in_review so a human can check them.
      // Fully verified pages save as draft (reviewer approves when ready to publish).
      status:           verification.passed ? 'draft' : 'in_review',
      date_modified:    today,
      draft_metadata:   draftMetadata,
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('Insert failed:', insertErr.message);
    process.exit(1);
  }

  const savedStatus = verification.passed ? 'draft' : 'in_review (flagged for human review)';
  console.log(`✓ Draft saved: ${inserted.id}`);
  console.log(`  Slug: ${slug}`);
  console.log(`  Status: ${savedStatus}`);
  console.log(`  Status: draft → review at /admin/kb-review/${inserted.id}`);
  console.log(`\nRetrieval trace stored in draft_metadata for auditing.`);
}

main().catch(err => { console.error(err); process.exit(1); });
