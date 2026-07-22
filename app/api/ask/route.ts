/**
 * POST /api/ask
 *
 * Advisor-facing question answering agent.
 * - Party/scenario decomposition before retrieval
 * - Multi-query hybrid retrieval (2-3 targeted sub-queries)
 * - Verified answers corpus injection (pre-seeded from KB pages + feedback)
 * - Grounding via o4-mini with chain-of-thought
 * - Self-verification gate
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { hybridRetrieve, type RetrievedSection } from '@/scripts/retrieval/hybrid';
import { verifyClaims } from '@/scripts/draft/verify';
import { createServiceClient } from '@/lib/supabase';
import type { PrimarySource } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

interface Interpretation {
  retrieval_queries: string[];     // 2-3 targeted sub-queries for multi-hop retrieval
  clean_question: string;          // standalone, resolved question
  parties: string[];               // e.g. ["client (age 62, $800 own benefit)", "spouse (FRA 67)"]
  benefit_types: string[];
  is_evaluating_advice: boolean;
  category: 'social-security' | 'irmaa';
}

// ── [1] Query interpretation with party decomposition ──────────────────────────

async function interpretQuery(question: string, history: HistoryMessage[]): Promise<Interpretation> {
  const contextSummary = history.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`).join('\n')}`
    : '';

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a Social Security and IRMAA query interpreter. Given an advisor's question, extract:

1. retrieval_queries: array of 2-3 SHORT, DISTINCT search queries (10-15 words each) targeting DIFFERENT aspects of the question for the SSA POMS corpus. For a spousal/deemed filing question, generate one query per rule involved.
2. clean_question: standalone question with all pronouns resolved from conversation history.
3. parties: array describing each person in the scenario with age, status, benefit type. e.g. ["primary worker (age 64, $3800 PIA, not yet filed)", "spouse (age 62, filing for spousal benefit)"]
4. benefit_types: array — "retirement","spousal","survivor","disability","irmaa","wep","gpo","deemed_filing","earnings_test" etc.
5. is_evaluating_advice: true if the advisor is checking whether specific advice is correct.
6. category: "social-security" or "irmaa"

Return JSON only.`,
      },
      { role: 'user', content: question + contextSummary },
    ],
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
    return {
      retrieval_queries:    Array.isArray(parsed.retrieval_queries) ? parsed.retrieval_queries : [question],
      clean_question:       parsed.clean_question ?? question,
      parties:              parsed.parties ?? [],
      benefit_types:        parsed.benefit_types ?? [],
      is_evaluating_advice: parsed.is_evaluating_advice ?? false,
      category:             parsed.category ?? 'social-security',
    };
  } catch {
    return { retrieval_queries: [question], clean_question: question, parties: [], benefit_types: [], is_evaluating_advice: false, category: 'social-security' };
  }
}

// ── [2] Multi-query retrieval with deduplication ───────────────────────────────

async function multiQueryRetrieve(queries: string[], topKPerQuery = 8): Promise<RetrievedSection[]> {
  // Run all queries in parallel
  const results = await Promise.all(
    queries.map(q => hybridRetrieve(q, { topK: topKPerQuery }).catch(() => ({ sections: [], trace: {} as any })))
  );

  // Merge + deduplicate: keep highest score per section
  const bySection = new Map<string, RetrievedSection>();
  for (const { sections } of results) {
    for (const s of sections) {
      const existing = bySection.get(s.section_number);
      if (!existing || s.score > existing.score) {
        bySection.set(s.section_number, s);
      }
    }
  }

  // Sort by score descending, cap at 15 total
  return [...bySection.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

// ── [3] Verified answers retrieval ────────────────────────────────────────────

async function getVerifiedContext(question: string, category: string): Promise<string> {
  try {
    // Embed the question
    const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: question });
    const embedding = embRes.data[0].embedding;

    const supabase = createServiceClient();
    // Find similar verified answers
    const { data } = await supabase.rpc('match_verified_answers', {
      query_embedding: embedding,
      match_count: 3,
      match_threshold: 0.75,
      filter_category: category,
    });

    if (!data || data.length === 0) {
      // Fallback: pull from approved reference pages
      const { data: pages } = await supabase
        .from('reference_pages')
        .select('title, h1, quick_answer, primary_sources')
        .eq('status', 'published')
        .eq('category', category)
        .limit(3);

      if (!pages || pages.length === 0) return '';

      return '\n\n--- VERIFIED REFERENCE PAGES (approved by expert reviewers) ---\n' +
        pages.map(p => `Title: ${p.h1 || p.title}\n${p.quick_answer}`).join('\n\n---\n');
    }

    return '\n\n--- VERIFIED ANSWERS (confirmed correct by expert reviewers) ---\n' +
      (data as any[]).map((va: any) => `Q: ${va.question}\nA: ${va.answer}`).join('\n\n---\n');
  } catch {
    return '';
  }
}

// ── [4] Grounded answer ───────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `You are an expert Social Security and IRMAA research assistant for financial advisors.
You answer questions about Social Security rules and Medicare/IRMAA, grounded strictly in the provided source sections.

RULES:
0. DECOMPOSE FIRST. Identify each party in the scenario (name, age, filing status, benefit type). Work through the applicable rules for each party in sequence. Only then write the answer.
1. ANSWER DIRECTLY. Lead with the direct answer — correct/incorrect/yes/no first, then explain why.
2. GROUND IN SOURCES ONLY. Every specific rule, percentage, dollar amount, age threshold, or formula must come verbatim from the provided source sections or verified references. Never import knowledge from training data.
3. EVALUATE ADVICE WHEN ASKED. If the advisor is asking whether specific advice is correct, state clearly: "The advice is correct / incorrect / partially correct" and explain exactly what is wrong.
4. CITE SECTIONS. After each claim, cite the section number in parentheses, e.g. (RS 00615.201).
5. FLAG GAPS. If you cannot find a relevant source, write: [SOURCE GAP: description].
6. NEVER GUESS. If sources don't cover the question, say so explicitly.
7. NEVER SPEAK AS THE SSA. You are a research tool, not an SSA representative. Never use first-person SSA voice: never write "tell us", "we require", "our records", "contact us", or any language that implies you are SSA. Always refer to SSA in the third person: "SSA requires", "the Social Security Administration provides".
8. USE THIRD PERSON FOR THE CLIENT/SITUATION. Refer to the people in the scenario as "the client", "the individual", "the primary worker", "the spouse" — not "you" or "your". You are briefing an advisor about their client, not speaking directly to the client.

OUTPUT FORMAT (JSON):
{
  "verdict": "correct" | "incorrect" | "partial" | "no_advice_to_evaluate" | "uncertain",
  "verdict_summary": "one sentence",
  "answer": "full HTML answer. Use proper HTML: <p> for paragraphs (never omit closing tags), <ul><li> for bullet lists, <ol><li> for numbered lists — NEVER write inline markers like '1.' or '•'. Separate distinct topics into separate <p> blocks. Do not dump everything into one paragraph.",
  "primary_sources": [{ "section_number": string, "url": string, "tag": "Source" }],
  "gaps": ["description of any SOURCE GAPs"]
}`;

async function generateAnswer(
  cleanQuestion: string,
  parties: string[],
  isEvaluatingAdvice: boolean,
  sections: RetrievedSection[],
  verifiedContext: string,
  history: HistoryMessage[],
): Promise<{ verdict: string; verdict_summary: string; answer: string; primary_sources: PrimarySource[]; gaps: string[] }> {
  const MAX_CHARS = 10000;
  const sourceBlock = sections
    .map(s => {
      const text = s.full_text.length > MAX_CHARS ? s.full_text.slice(0, MAX_CHARS) + '\n[... truncated ...]' : s.full_text;
      return `--- SOURCE: ${s.section_number} ---\nTitle: ${s.title ?? '(none)'}\nURL: ${s.source_url}\n\n${text}`;
    })
    .join('\n\n');

  const availableSections = sections.map(s => s.section_number).join(', ');
  const priorContext = history.length > 0
    ? `CONVERSATION SO FAR:\n${history.slice(-6).map(m => `${m.role === 'user' ? 'ADVISOR' : 'YOU'}: ${m.content.slice(0, 400)}`).join('\n')}\n\n`
    : '';
  const partyContext = parties.length > 0 ? `PARTIES IN THIS SCENARIO:\n${parties.map(p => `• ${p}`).join('\n')}\n\n` : '';

  const userPrompt = `${priorContext}${partyContext}QUESTION: ${cleanQuestion}

${isEvaluatingAdvice ? 'NOTE: Evaluate whether the described advice is correct.\n\n' : ''}AVAILABLE SECTION NUMBERS (only cite these exact IDs in primary_sources):
${availableSections}
${verifiedContext}

SOURCE SECTIONS:
${sourceBlock}`;

  const res = await openai.chat.completions.create({
    model: 'o4-mini',
    reasoning_effort: 'medium',
    max_completion_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'developer' as any, content: AGENT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  } as any);

  try {
    const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
    return {
      verdict:         parsed.verdict ?? 'uncertain',
      verdict_summary: parsed.verdict_summary ?? '',
      answer:          parsed.answer ?? '',
      primary_sources: (parsed.primary_sources ?? []).map((s: any) => ({ section_number: s.section_number, url: s.url ?? '', tag: 'Source' })),
      gaps:            parsed.gaps ?? [],
    };
  } catch {
    return { verdict: 'uncertain', verdict_summary: 'Failed to parse response', answer: '', primary_sources: [], gaps: [] };
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { question, history = [] } = await req.json().catch(() => ({ question: '', history: [] }));
  if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 });

  // [1] Interpret + decompose
  const interpreted = await interpretQuery(question, history);

  // [2] Multi-query retrieval
  const sections = await multiQueryRetrieve(interpreted.retrieval_queries);

  if (sections.length === 0) {
    return NextResponse.json({
      verdict: 'uncertain', verdict_summary: 'No relevant POMS sections found.',
      answer: '<p>No relevant source sections found. Try rephrasing or narrowing the topic.</p>',
      primary_sources: [], gaps: ['No sections retrieved'],
      retrieval_queries: interpreted.retrieval_queries, sections_used: [],
    });
  }

  // [3] Verified context (approved KB pages + feedback corpus)
  const verifiedContext = await getVerifiedContext(interpreted.clean_question, interpreted.category);

  // [4] Generate grounded answer
  const result = await generateAnswer(
    interpreted.clean_question,
    interpreted.parties,
    interpreted.is_evaluating_advice,
    sections,
    verifiedContext,
    history,
  );

  // [5] Verify
  const citedInRetrieved = result.primary_sources.filter(s => sections.some(r => r.section_number === s.section_number));
  const draftForVerify = {
    quick_answer: result.answer,
    body_sections: [],
    faq: [],
    primary_sources: citedInRetrieved.map(s => ({ section_number: s.section_number, url: s.url })),
  };
  const verification = citedInRetrieved.length > 0
    ? verifyClaims(draftForVerify, sections)
    : { passed: true, verified_count: 0, unverified: [], all_specifics: [] };

  return NextResponse.json({
    ...result,
    retrieval_queries: interpreted.retrieval_queries,
    parties:           interpreted.parties,
    clean_question:    interpreted.clean_question,
    category:          interpreted.category,
    sections_used:     sections.map(s => ({ section_number: s.section_number, title: s.title, score: s.score, source_url: s.source_url })),
    verification:      { passed: verification.passed, unverified: verification.unverified },
  });
}
