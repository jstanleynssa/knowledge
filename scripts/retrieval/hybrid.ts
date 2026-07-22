/**
 * Hybrid retrieval engine — vector search + keyword/FTS, fused with RRF.
 *
 * Design:
 *   Vector search  → catches semantic meaning ("impact on spouse if I retire early")
 *   Keyword search → catches exact tokens vector misses (section numbers, fractions,
 *                    benefit-type terms: "spousal", "survivor", "25/36")
 *   RRF fusion     → Reciprocal Rank Fusion combines both rankings without tuning weights
 *
 * Acceptance test:
 *   query "spousal benefit reduction early filing at 62"
 *   must return RS 00615.201 in top results, ranked above the .001/.003/.005/.010 cluster.
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChunkResult {
  chunk_id: string;
  source_document_id: string;
  section_number: string;
  chunk_text: string;
  similarity: number;
}

interface FtsResult {
  section_number: string;
  title: string | null;
  full_text: string;
  source_url: string;
  rank?: number;
}

export interface RetrievedSection {
  section_number: string;
  title: string | null;
  full_text: string;
  source_url: string;
  /** Fused RRF score. Higher = more relevant. */
  score: number;
  debug: {
    vector_similarity?: number;
    vector_rank?: number;
    keyword_rank?: number;
  };
}

export interface RetrievalTrace {
  query: string;
  vector_top: string[];    // section_numbers ranked by vector score
  keyword_top: string[];   // section_numbers ranked by keyword score
  fused_top: string[];     // section_numbers ranked by RRF score (what was actually used)
  passed_to_model: string[]; // top-k fed to the drafter
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBED_MODEL = 'text-embedding-3-small';
const RRF_K = 60; // standard RRF constant; balances precision vs. recall

// ─── Embedding ────────────────────────────────────────────────────────────────

export async function embed(text: string): Promise<number[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({ model: EMBED_MODEL, input: text });
  return res.data[0].embedding;
}

// ─── Vector search ────────────────────────────────────────────────────────────

async function vectorSearch(
  embedding: number[],
  topK: number,
  threshold: number,
): Promise<ChunkResult[]> {
  const supabase = createServiceClient();
  // Fetch more candidates than needed so the client-side threshold filter has
  // enough to work with. IVFFlat is fast with ORDER BY+LIMIT only — no WHERE
  // on the similarity score (that pattern forces a full scan).
  const candidateK = Math.max(topK * 4, 80);
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_count: candidateK,
    match_threshold: 0, // unused now; kept for API compatibility
  });
  if (error) throw new Error('Vector search failed: ' + error.message);
  // Filter by threshold client-side
  const all = (data as ChunkResult[]) ?? [];
  return all.filter(c => c.similarity >= threshold).slice(0, topK);
}

// ─── Keyword / FTS search ─────────────────────────────────────────────────────
//
// Two passes:
//   1. Postgres FTS (plainto_tsquery) — handles multi-word queries, stemming
//   2. ILIKE on specific high-signal terms extracted from the query
//      (benefit-type labels, section number patterns, numeric values)
//
// Both return source_documents rows; results are merged and de-duped.

// Synonym expansions — when a query contains one form, also search for the other.
// This prevents ILIKE misses when POMS uses 'spouse' but the query says 'spousal'.
const BENEFIT_SYNONYMS: Record<string, string[]> = {
  spousal:    ['spouse'],
  spouse:     ['spousal'],
  widow:      ['widower', 'widow\'s'],
  widower:    ['widow', 'widow\'s'],
  divorced:   ['divorce'],
  divorce:    ['divorced'],
  disability: ['disabled'],
  disabled:   ['disability'],
};

function extractKeyTerms(query: string): string[] {
  const q = query.toLowerCase();
  const terms: string[] = [];

  // Benefit-type keywords (with synonym expansion)
  const benefitTypes = ['spousal', 'spouse', 'survivor', 'widow', 'widower',
    'divorced', 'disability', 'retirement', 'irmaa', 'medicare'];
  for (const t of benefitTypes) {
    if (q.includes(t)) {
      terms.push(t);
      for (const syn of BENEFIT_SYNONYMS[t] ?? []) terms.push(syn);
    }
  }

  // Section number patterns (e.g. "RS 00615", "GN 002")
  const sectionPattern = /\b[A-Z]{2,3}\s?\d{3,5}(?:\.\d{3})?\b/g;
  const sectionMatches = query.match(sectionPattern) ?? [];
  terms.push(...sectionMatches);

  // Numeric fractions/values (e.g. "25/36", "5/9")
  const fracPattern = /\b\d+\/\d+\b/g;
  const fracMatches = query.match(fracPattern) ?? [];
  terms.push(...fracMatches);

  return [...new Set(terms)];
}

async function keywordSearch(query: string, topK: number): Promise<FtsResult[]> {
  const supabase = createServiceClient();
  const results = new Map<string, FtsResult>();

  // Pass 1: Ranked FTS via search_documents_fts RPC.
  // Uses plainto_tsquery with ts_rank ordering; excludes PR/PS state-specific sections.
  // Extract significant words (drop stopwords + short tokens) for the FTS phrase.
  const significantWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'that', 'this', 'from', 'what', 'when',
      'early', 'late', 'filing', 'claim', 'before', 'after'].includes(w));
  // Normalize POMS-specific terms: FTS English doesn't unify 'spousal'→'spouse',
  // 'widower'→'widow', etc. POMS text consistently uses the base form.
  const normMap: Record<string, string> = {
    spousal: 'spouse', widower: 'widow', divorced: 'divorce',
    disabled: 'disability', retirement: 'retire',
  };
  const normalizedWords = [...new Set(significantWords)]
    .slice(0, 6)
    .map(w => normMap[w] ?? w);
  const ftsPhrase = normalizedWords.join(' ');

  if (ftsPhrase.length > 0) {
    // Fetch more than topK to give RRF enough candidates from the keyword leg.
    const { data: ftsData, error: ftsErr } = await supabase.rpc('search_documents_fts', {
      fts_query: ftsPhrase,
      match_count: Math.max(topK * 2, 30),
    });
    if (ftsErr) {
      console.warn('FTS search error (continuing):', ftsErr.message);
    } else {
      for (const row of (ftsData ?? []) as FtsResult[]) {
        if (row.section_number) results.set(row.section_number, row);
      }
    }
  }

  // Pass 2: ILIKE on high-signal terms (section numbers, fractions, benefit-type synonyms).
  // Only use benefit-type terms here if FTS didn't find enough results — ILIKE is unranked
  // and broad benefit terms ('spouse') match thousands of rows with arbitrary ordering.
  const terms = extractKeyTerms(query);
  // Prioritise section-number and fraction terms (highly specific); skip broad benefit types
  // unless FTS returned few results
  const specificTerms = terms.filter(t =>
    /[A-Z]{2,3}\s?\d/.test(t) ||   // section number patterns
    /\d+\/\d+/.test(t)              // fraction patterns
  );
  const broadTerms = terms.filter(t => !specificTerms.includes(t));
  const ilikeTerms = results.size < 5
    ? [...specificTerms, ...broadTerms].slice(0, 6)
    : specificTerms.slice(0, 4);

  for (const term of ilikeTerms) {
    const { data: ilikeData } = await supabase
      .from('source_documents')
      .select('section_number, title, full_text, source_url')
      .ilike('full_text', `%${term}%`)
      .eq('doc_kind', 'rule')
      .not('full_text', 'is', null)
      .not('section_number', 'like', 'PR %')   // exclude state precedent rulings
      .not('section_number', 'like', 'PS %')   // exclude state policy statements
      .limit(15);

    for (const row of (ilikeData ?? [])) {
      if (row.section_number && !results.has(row.section_number)) {
        results.set(row.section_number, row as FtsResult);
      }
    }
  }

  return [...results.values()];
}

// ─── RRF fusion ───────────────────────────────────────────────────────────────

function rrfScore(rank: number): number {
  return 1 / (RRF_K + rank);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface HybridRetrieveOptions {
  /** Number of sections to return. Default 10. */
  topK?: number;
  /** Number of chunks to fetch from vector search. Default 40. */
  vectorTopK?: number;
  /** Number of sections to fetch from keyword search. Default 25. */
  keywordTopK?: number;
  /** Min vector similarity threshold. Default 0.65. */
  threshold?: number;
}

export async function hybridRetrieve(
  query: string,
  options: HybridRetrieveOptions = {},
): Promise<{ sections: RetrievedSection[]; trace: RetrievalTrace }> {
  const {
    topK       = 10,
    vectorTopK = 40,
    keywordTopK = 25,
    threshold  = 0.50,  // text-embedding-3-small cosine sims for SS policy text top ~0.55-0.70
  } = options;

  const supabase = createServiceClient();

  // ── Vector search ──────────────────────────────────────────────────────────
  const embedding = await embed(query);
  const chunks = await vectorSearch(embedding, vectorTopK, threshold);

  // Aggregate chunk scores → section scores (max similarity per section).
  // Exclude state-specific precedent (PR) and policy statement (PS) sections —
  // same exclusion as the FTS leg; these sections pollute results for factual queries.
  const EXCLUDED_PREFIXES = ['PR ', 'PS '];
  const vectorBySection = new Map<string, number>();
  for (const chunk of chunks) {
    if (!chunk.section_number) continue;
    if (EXCLUDED_PREFIXES.some(p => chunk.section_number.startsWith(p))) continue;
    const current = vectorBySection.get(chunk.section_number) ?? 0;
    if (chunk.similarity > current) {
      vectorBySection.set(chunk.section_number, chunk.similarity);
    }
  }

  // Rank vector results
  const vectorRanked = [...vectorBySection.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([sn, sim], i) => ({ section_number: sn, rank: i + 1, similarity: sim }));

  // ── Keyword search ─────────────────────────────────────────────────────────
  const kwResults = await keywordSearch(query, keywordTopK);
  const kwRanked = kwResults.map((r, i) => ({ ...r, rank: i + 1 }));

  // ── RRF fusion ─────────────────────────────────────────────────────────────
  const allSectionNumbers = new Set([
    ...vectorRanked.map(r => r.section_number),
    ...kwRanked.map(r => r.section_number),
  ]);

  const fused: Array<{
    section_number: string;
    score: number;
    vector_similarity?: number;
    vector_rank?: number;
    keyword_rank?: number;
  }> = [];

  for (const sn of allSectionNumbers) {
    const vEntry = vectorRanked.find(r => r.section_number === sn);
    const kEntry = kwRanked.find(r => r.section_number === sn);
    fused.push({
      section_number: sn,
      score: (vEntry ? rrfScore(vEntry.rank) : 0) + (kEntry ? rrfScore(kEntry.rank) : 0),
      vector_similarity: vEntry?.similarity,
      vector_rank: vEntry?.rank,
      keyword_rank: kEntry?.rank,
    });
  }

  fused.sort((a, b) => b.score - a.score);
  const topFused = fused.slice(0, topK);

  // ── Fetch full section data for top results ────────────────────────────────
  const topSNs = topFused.map(f => f.section_number);
  const { data: sectionDocs, error: docErr } = await supabase
    .from('source_documents')
    .select('section_number, title, full_text, source_url')
    .in('section_number', topSNs)
    .eq('doc_kind', 'rule');

  if (docErr) throw new Error('Section fetch failed: ' + docErr.message);

  const docMap = new Map((sectionDocs ?? []).map(d => [d.section_number, d]));

  // Merge — keyword results already have full_text, use that when available
  const kwMap = new Map(kwRanked.map(r => [r.section_number, r]));

  const sections: RetrievedSection[] = topFused
    .flatMap(f => {
      const kw = kwMap.get(f.section_number);
      const doc = docMap.get(f.section_number);
      const fullText = kw?.full_text ?? doc?.full_text;
      if (!fullText) return [];
      const section: RetrievedSection = {
        section_number: f.section_number,
        title: kw?.title ?? doc?.title ?? null,
        full_text: fullText,
        source_url: kw?.source_url ?? doc?.source_url ?? '',
        score: f.score,
        debug: {
          vector_similarity: f.vector_similarity,
          vector_rank: f.vector_rank,
          keyword_rank: f.keyword_rank,
        },
      };
      return [section];
    });

  const trace: RetrievalTrace = {
    query,
    vector_top: vectorRanked.slice(0, 10).map(r => r.section_number),
    keyword_top: kwRanked.slice(0, 10).map(r => r.section_number),
    fused_top: fused.slice(0, topK).map(f => f.section_number),
    passed_to_model: sections.map(s => s.section_number),
  };

  return { sections, trace };
}
