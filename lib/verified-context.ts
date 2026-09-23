/**
 * lib/verified-context.ts — Shared verified-answer context retrieval.
 *
 * Queries the verified_answers table for semantically similar Q&A pairs
 * confirmed correct by expert reviewers. Used by both the AXIOM live Q&A
 * pipeline (/api/ask) and the CODEX page generation pipeline (draft_page_v2).
 *
 * Verified answers take priority over conflicting raw POMS source text.
 * Extracted from /api/ask/route.ts so both pipelines share one implementation.
 */

import OpenAI from 'openai';
import { createServiceClient } from './supabase';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/**
 * Returns a formatted verified-answer block for injection into a model prompt,
 * or '' if no sufficiently similar answers exist (similarity ≥ 0.70).
 *
 * @param question   The question or topic to match against
 * @param category   'social-security' | 'irmaa' — both categories are always searched
 * @param embedding  Optional pre-computed embedding to avoid a redundant OpenAI round-trip
 */
export async function getVerifiedContext(
  question: string,
  category: string,
  embedding?: number[],
): Promise<string> {
  try {
    const emb = embedding ??
      (await getOpenAI().embeddings.create({ model: 'text-embedding-3-small', input: question }))
        .data[0].embedding;

    const supabase = createServiceClient();

    // Search both categories — IRMAA/SS questions are frequently cross-category;
    // the corpus is small so cross-category search is cheap and safe.
    const otherCategory = category === 'irmaa' ? 'social-security' : 'irmaa';

    const [{ data: primaryHits }, { data: secondaryHits }] = await Promise.all([
      supabase.rpc('match_verified_answers', {
        query_embedding: emb,
        match_count: 5,
        match_threshold: 0.70,
        filter_category: category,
      }),
      supabase.rpc('match_verified_answers', {
        query_embedding: emb,
        match_count: 5,
        match_threshold: 0.70,
        filter_category: otherCategory,
      }),
    ]);

    const combined = [...(primaryHits ?? []), ...(secondaryHits ?? [])]
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 3);

    if (combined.length > 0) {
      return (
        '\n\n--- VERIFIED ANSWERS (confirmed correct by expert reviewers;' +
        ' these take priority over conflicting raw POMS text) ---\n' +
        combined.map((va: any) => `Q: ${va.question}\nA: ${va.answer}`).join('\n\n---\n')
      );
    }

    return '';
  } catch {
    return '';
  }
}
