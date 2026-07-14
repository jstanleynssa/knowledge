#!/usr/bin/env tsx
/**
 * draft_page.ts — AI-assisted reference page drafter (review-gated)
 *
 * Given a topic slug + category, fetches the relevant source_documents rows
 * and produces a reference_pages row with status='draft'.
 *
 * CRITICAL DISCIPLINE:
 * - Writes ONLY from supplied source text
 * - Proposes primary_sources citations with real section numbers from the DB
 * - NEVER invents a section number — all citations must trace to a real row
 * - Output goes to DB with status='draft'; nothing publishes without SME review
 *
 * Do NOT batch-generate at volume. Seed first 5 pages, run full review loop,
 * measure, then tune prompt before scaling.
 *
 * Usage:
 *   npx tsx scripts/draft/draft_page.ts \
 *     --slug=deemed-filing \
 *     --category=social-security \
 *     --title="Deemed filing" \
 *     --sections="GN 00204.020,RS 00615.020"
 */

import Anthropic from '@anthropic-ai/sdk';  // or use openai — swappable
import { createServiceClient } from '@/lib/supabase';
import type { ReferencePageInsert, BodySection, FaqItem, PrimarySource, Category } from '@/lib/types';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const slug: string = args.slug ?? '';
const category: Category = (args.category as Category) ?? 'social-security';
const title: string = args.title ?? '';
const sectionNumbers: string[] = (args.sections ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const reviewer: string = args.reviewer ?? '';

if (!slug || !title || sectionNumbers.length === 0) {
  console.error('Usage: draft_page.ts --slug=... --category=... --title=... --sections=GN 00204.020,...');
  process.exit(1);
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a technical writer producing a reference page for the NSSA Knowledge Base.

RULES (non-negotiable):
1. Write ONLY from the source text provided below. Do not add information from your own knowledge.
2. Every factual claim must be traceable to a specific source section. Cite the section number.
3. NEVER invent or guess a section number. Only cite sections that are in the provided source text.
4. Write plain-language explanations — clear, precise, no jargon. Advisors and consumers read this.
5. The quick_answer must be definition-led (≤200 words), answering "what is this?" directly.
6. faq items must be genuine questions a consumer or pre-retiree would ask in their own voice — second-person, plain language (e.g. "Will filing for my spouse\'s benefit reduce my own?" / "Can I still work and collect Social Security?"). NOT advisor jargon or rephrased headings. These question phrasings should match what real people type into AI search engines.
7. Output ONLY valid JSON matching the schema below. No prose before or after.

OUTPUT SCHEMA (TypeScript-style):
{
  "seo_title": string,          // ≤60 chars
  "meta_description": string,   // 150–160 chars
  "eyebrow": string,            // e.g. "Claiming Rules"
  "quick_answer": string,       // HTML string, bold key terms with <strong>, ≤200 words
  "body_sections": [            // 3–6 sections
    {
      "heading": string,
      "prose": string,          // HTML string; cite with section_number in the prose where needed
      "citation_ref": string    // section_number from provided sources that supports this section
    }
  ],
  "worked_example": {
    "label": "Worked example",
    "paragraphs": string[]      // HTML strings; use <span class='name'>Name.</span> for example person
  },
  "faq": [
    { "q": string, "a": string }   // 3–5 items
  ],
  "primary_sources": [
    {
      "tag": "Source",
      "section_number": string, // MUST exactly match a section number from the provided sources
      "url": string             // The source_url from that source document
    }
  ]
}`;

function buildUserPrompt(
  title: string,
  sources: Array<{ section_number: string; title: string | null; full_text: string; source_url: string }>
): string {
  const sourceBlock = sources
    .map(
      (s) =>
        `--- SOURCE: ${s.section_number} ---\nTitle: ${s.title ?? '(none)'}\nURL: ${s.source_url}\n\n${s.full_text}`
    )
    .join('\n\n');

  return `Draft a reference page for: "${title}"

CATEGORY: ${category}

Use ONLY the following primary sources. Cite section numbers exactly as shown.

${sourceBlock}

Produce the JSON output per the schema.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createServiceClient();

  // 1. Fetch source documents
  console.log(`Fetching source docs for sections: ${sectionNumbers.join(', ')}`);
  const { data: sourceDocs, error } = await supabase
    .from('source_documents')
    .select('section_number, title, full_text, source_url')
    .in('section_number', sectionNumbers)
    .eq('doc_kind', 'rule');

  if (error) throw error;
  if (!sourceDocs || sourceDocs.length === 0) {
    console.error('No source documents found for the given section numbers. Run ingest first.');
    process.exit(1);
  }

  const missing = sectionNumbers.filter((sn) => !sourceDocs.find((d) => d.section_number === sn));
  if (missing.length > 0) {
    console.warn(`WARNING: These sections not found in DB: ${missing.join(', ')}`);
    console.warn('Citations for missing sections will be omitted from the draft.');
  }

  const validSources = sourceDocs.filter(
    (d): d is { section_number: string; title: string | null; full_text: string; source_url: string } =>
      !!d.full_text && !!d.section_number
  );

  console.log(`Found ${validSources.length}/${sectionNumbers.length} source docs with content`);

  // 2. Call Claude to draft the page
  console.log('Drafting page with Claude...');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(title, validSources) },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // 3. Parse JSON output
  let draftFields: {
    seo_title: string;
    meta_description: string;
    eyebrow: string;
    quick_answer: string;
    body_sections: BodySection[];
    worked_example: { label: string; paragraphs: string[] } | null;
    faq: FaqItem[];
    primary_sources: PrimarySource[];
  };

  try {
    // Strip any markdown code fences if present
    const jsonText = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    draftFields = JSON.parse(jsonText);
  } catch (err) {
    console.error('Failed to parse Claude output as JSON:');
    console.error(responseText);
    throw err;
  }

  // 4. Validate citations — reject any section numbers NOT in our source docs
  const validSectionNumbers = new Set(validSources.map((s) => s.section_number));
  const invalidCitations = draftFields.primary_sources.filter(
    (s) => !validSectionNumbers.has(s.section_number)
  );
  if (invalidCitations.length > 0) {
    console.error('CITATION VALIDATION FAILED — invented section numbers detected:');
    invalidCitations.forEach((c) => console.error(`  ${c.section_number}`));
    console.error('Draft NOT saved. Fix the prompt or source list and retry.');
    process.exit(1);
  }

  // 5. Check for slug conflicts
  const { data: existing } = await supabase
    .from('reference_pages')
    .select('id, status')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.error(`Slug "${slug}" already exists (status: ${existing.status}). Aborting.`);
    console.error('To update, edit the existing draft in the review UI.');
    process.exit(1);
  }

  // 6. Insert draft
  const draft: ReferencePageInsert = {
    slug,
    category,
    title,
    seo_title: draftFields.seo_title,
    meta_description: draftFields.meta_description,
    eyebrow: draftFields.eyebrow,
    quick_answer: draftFields.quick_answer,
    body_sections: draftFields.body_sections,
    worked_example: draftFields.worked_example,
    faq: draftFields.faq,
    primary_sources: draftFields.primary_sources,
    og_image_url: null,
    reviewer: reviewer || null,
    status: 'draft',
    source_last_verified: null,
    date_published: null,
    date_modified: null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('reference_pages')
    .insert(draft)
    .select('id')
    .single();

  if (insertError) throw insertError;

  console.log(`\nDraft saved!`);
  console.log(`  ID: ${inserted.id}`);
  console.log(`  Slug: ${slug}`);
  console.log(`  Status: draft`);
  console.log(`  Citations: ${draftFields.primary_sources.map((s) => s.section_number).join(', ')}`);
  console.log(`\nNext step: open the review UI, assign to ${reviewer || 'Cindi/Todd'}, verify citations side-by-side.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
