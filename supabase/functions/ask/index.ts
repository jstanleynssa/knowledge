/**
 * Supabase Edge Function: ask
 *
 * Identical pipeline to the Vercel /api/ask route, but runs inside Supabase
 * Edge Functions with a 150-second timeout budget — removing the Vercel 60 s
 * serverless constraint for long conversations.
 *
 * Same SSE event protocol as the Vercel route:
 *   data: {"type":"status","message":"…"}\n\n
 *   data: {"type":"retrieval_done","queries":[…],"parties":[…],"category":"…"}\n\n
 *   data: {"type":"answer_start","verdict":"…","verdict_summary":"…"}\n\n
 *   data: {"type":"token","text":"…"}\n\n
 *   data: {"type":"done",…}\n\n
 *
 * Auth:
 *   If AXIOM_SESSION_SECRET is set, requires Authorization: Bearer <jwt>
 *   signed with that secret (HS256). Returns 401 on failure.
 *   If the secret is not set, auth is skipped (useful during development).
 *
 * Deploy:
 *   supabase functions deploy ask --project-ref eqipvrcmugnvkextqmym
 *
 * Required secrets (supabase secrets set --project-ref eqipvrcmugnvkextqmym):
 *   OPENAI_API_KEY
 *   AXIOM_SESSION_SECRET  (optional — omit to disable auth)
 *   SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are injected automatically.
 */

// deno-lint-ignore-file no-explicit-any

import OpenAI from 'npm:openai@^4';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2';

// ── Constants ─────────────────────────────────────────────────────────────────

const EMBED_MODEL = 'text-embedding-3-small';
const RRF_K       = 60;
const ALL_SOURCES = ['poms', 'cfr', 'handbook', 'cms', 'medicare'] as const;
type  SourceType  = typeof ALL_SOURCES[number];
const ENC         = new TextEncoder();

// ── Clients ───────────────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey: key });
}

function getSupabase(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── JWT auth ──────────────────────────────────────────────────────────────────

async function verifyAuth(authHeader: string | null): Promise<boolean> {
  const secret = Deno.env.get('AXIOM_SESSION_SECRET');
  if (!secret) return true; // auth disabled in dev

  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);

  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return false;

    const keyData = ENC.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify'],
    );

    const signingInput = ENC.encode(`${headerB64}.${payloadB64}`);
    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify('HMAC', cryptoKey, sig, signingInput);
    if (!valid) return false;

    // Check expiry
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

interface Interpretation {
  retrieval_queries: string[];
  clean_question: string;
  parties: string[];
  benefit_types: string[];
  is_evaluating_advice: boolean;
  is_followup: boolean;
  category: 'social-security' | 'irmaa';
}

interface RetrievedSection {
  section_number: string;
  title: string | null;
  full_text: string;
  source_url: string;
  score: number;
}

// ── [1] Query interpretation ──────────────────────────────────────────────────

async function interpretQuery(
  question: string,
  history: HistoryMessage[],
): Promise<Interpretation> {
  const contextSummary = history.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 1200)}`).join('\n')}`
    : '';

  const res = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a Social Security and IRMAA query interpreter. Given an advisor's question, extract:

1. retrieval_queries: array of 2-3 SHORT, DISTINCT search queries (10-15 words each) targeting DIFFERENT aspects of the question for the SSA POMS corpus.
2. clean_question: standalone question with all pronouns and references resolved using conversation history. Must be fully self-contained.
3. parties: array describing each person in the scenario with age, status, benefit type.
4. benefit_types: array — "retirement","spousal","survivor","disability","irmaa","wep","gpo","deemed_filing","earnings_test" etc.
5. is_evaluating_advice: true ONLY if the advisor is presenting specific advice and asking whether it is correct.
6. is_followup: true if this question refers to context from a prior turn.
7. category: "social-security" or "irmaa"

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
      is_followup:          parsed.is_followup ?? false,
      category:             parsed.category ?? 'social-security',
    };
  } catch {
    return { retrieval_queries: [question], clean_question: question, parties: [], benefit_types: [], is_evaluating_advice: false, is_followup: false, category: 'social-security' };
  }
}

// ── [2] Retrieval ─────────────────────────────────────────────────────────────

function classifySection(sn: string): SourceType | null {
  if (/^(RS|GN|HI|SI|DI|RM|SM|MS|PR|PS|NL|TN)\s/i.test(sn)) return 'poms';
  if (/^20\s+CFR/i.test(sn))  return 'cfr';
  if (/^HBK/i.test(sn))       return 'handbook';
  if (/^CMS:/i.test(sn))      return 'cms';
  if (/^MCR:/i.test(sn))      return 'medicare';
  return null;
}

async function vectorSearch(
  supabase: SupabaseClient,
  embedding: number[],
  topK: number,
  threshold: number,
): Promise<Array<{ chunk_id: string; section_number: string; similarity: number }>> {
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_count: Math.max(topK * 4, 80),
    match_threshold: 0,
  });
  if (error) {
    console.warn('[vectorSearch] error:', error.message);
    return [];
  }
  return ((data ?? []) as any[])
    .filter((c: any) => c.similarity >= threshold)
    .slice(0, topK);
}

async function keywordSearch(
  supabase: SupabaseClient,
  query: string,
  topK: number,
): Promise<Array<{ section_number: string; title: string | null; full_text: string; source_url: string }>> {
  const results = new Map<string, any>();

  // FTS pass
  const significantWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with','that','this','from','what','when','early','late','filing','claim','before','after'].includes(w));

  const normMap: Record<string, string> = {
    spousal: 'spouse', widower: 'widow', divorced: 'divorce',
    disabled: 'disability', retirement: 'retire',
  };
  const ftsPhrase = [...new Set(significantWords)].slice(0, 6).map(w => normMap[w] ?? w).join(' ');

  if (ftsPhrase.length > 0) {
    const { data: ftsData, error: ftsErr } = await supabase.rpc('search_documents_fts', {
      fts_query: ftsPhrase,
      match_count: Math.max(topK * 2, 30),
    });
    if (ftsErr) {
      console.warn('[keywordSearch] FTS error:', ftsErr.message);
    } else {
      for (const row of (ftsData ?? []) as any[]) {
        if (!row.section_number) continue;
        const srcType = classifySection(row.section_number);
        if (!srcType || !ALL_SOURCES.includes(srcType)) continue;
        results.set(row.section_number, row);
      }
    }
  }

  // Section-number ILIKE pass (high-signal, specific terms only)
  const sectionPattern = /\b[A-Z]{2,3}\s?\d{3,5}(?:\.\d{3})?\b/g;
  const sectionMatches = query.match(sectionPattern) ?? [];
  await Promise.all(
    sectionMatches.slice(0, 4).map(term =>
      supabase
        .from('source_documents')
        .select('section_number, title, full_text, source_url')
        .ilike('full_text', `%${term}%`)
        .eq('doc_kind', 'rule')
        .in('source_type', [...ALL_SOURCES])
        .is('superseded_at', null)
        .not('section_number', 'like', 'PR %')
        .not('section_number', 'like', 'PS %')
        .limit(10)
        .then(({ data: rows }) => {
          for (const row of (rows ?? []) as any[]) {
            if (row.section_number && !results.has(row.section_number)) {
              results.set(row.section_number, row);
            }
          }
        })
    )
  );

  return [...results.values()];
}

async function multiQueryRetrieve(
  supabase: SupabaseClient,
  queries: string[],
  embedding: number[],
): Promise<RetrievedSection[]> {
  const bySection = new Map<string, RetrievedSection>();

  await Promise.all(queries.map(async (q) => {
    const [vectorHits, kwHits] = await Promise.all([
      vectorSearch(supabase, embedding, 40, 0.50),
      keywordSearch(supabase, q, 25),
    ]);

    // Fetch full_text for vector hits by section (join via section_number)
    const vectorSNs = [...new Set(vectorHits.map((c: any) => c.section_number))];
    let docMap = new Map<string, any>();
    if (vectorSNs.length > 0) {
      const { data: docs } = await supabase
        .from('source_documents')
        .select('section_number, title, full_text, source_url')
        .in('section_number', vectorSNs)
        .is('superseded_at', null)
        .limit(vectorSNs.length);
      for (const d of (docs ?? []) as any[]) docMap.set(d.section_number, d);
    }

    // Build per-section best vector similarity
    const vectorBySN = new Map<string, number>();
    for (const c of vectorHits as any[]) {
      const prev = vectorBySN.get(c.section_number) ?? 0;
      if ((c.similarity as number) > prev) vectorBySN.set(c.section_number, c.similarity);
    }

    // Ranked lists for RRF
    const vectorRanked = [...vectorBySN.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([sn], i) => ({ sn, rank: i + 1 }));

    const kwRanked = kwHits.map((row, i) => ({ sn: row.section_number, rank: i + 1 }));

    // RRF fusion
    const rrfBySection = new Map<string, number>();
    for (const { sn, rank } of vectorRanked) {
      rrfBySection.set(sn, (rrfBySection.get(sn) ?? 0) + 1 / (RRF_K + rank));
    }
    for (const { sn, rank } of kwRanked) {
      rrfBySection.set(sn, (rrfBySection.get(sn) ?? 0) + 1 / (RRF_K + rank));
    }

    // Build RetrievedSection objects
    const allDocs = new Map<string, any>([
      ...docMap.entries(),
      ...kwHits.map(r => [r.section_number, r]),
    ]);

    for (const [sn, score] of rrfBySection.entries()) {
      const doc = allDocs.get(sn);
      if (!doc?.full_text) continue;
      const existing = bySection.get(sn);
      if (!existing || score > existing.score) {
        bySection.set(sn, {
          section_number: sn,
          title:    doc.title ?? null,
          full_text: doc.full_text,
          source_url: doc.source_url ?? '',
          score,
        });
      }
    }
  }));

  const MIN_SCORE = 0.020;
  return [...bySection.values()]
    .filter(s => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

// ── [3] Verified context ──────────────────────────────────────────────────────

async function getVerifiedContext(
  supabase: SupabaseClient,
  question: string,
  category: string,
  embedding: number[],
): Promise<string> {
  try {
    const other = category === 'irmaa' ? 'social-security' : 'irmaa';
    const [{ data: primary }, { data: secondary }] = await Promise.all([
      supabase.rpc('match_verified_answers', {
        query_embedding: embedding,
        match_count: 5,
        match_threshold: 0.70,
        filter_category: category,
      }),
      supabase.rpc('match_verified_answers', {
        query_embedding: embedding,
        match_count: 5,
        match_threshold: 0.70,
        filter_category: other,
      }),
    ]);

    const combined = [...(primary ?? []), ...(secondary ?? [])] as any[];
    if (combined.length === 0) return '';

    const lines = combined
      .filter(r => r.similarity >= 0.70)
      .slice(0, 6)
      .map(r => `Q: ${r.question}\nA: ${r.answer_text.slice(0, 1200)}`);

    return lines.length > 0
      ? `\nVERIFIED EXPERT ANSWERS (confirmed correct; treat as authoritative):\n${lines.join('\n\n')}\n`
      : '';
  } catch (e) {
    console.warn('[verifiedContext] error:', e);
    return '';
  }
}

// ── [4] Grounded answer (streaming) ──────────────────────────────────────────

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: `
TONE — FORMAL:
Write in a formal, regulatory style that mirrors SSA documentation language.
Use precise technical terminology throughout. Citations in standard parenthetical form: (RS 00615.201).`,

  balanced: `
TONE — BALANCED (DEFAULT):
Write in a professional but clear style. Use precise technical terms when needed, but explain them in plain language on first use. Avoid unnecessary government-speak.`,

  conversational: `
TONE — CONVERSATIONAL:
Write as if a Social Security expert is talking through the answer with a financial advisor colleague.

CRITICAL — OPENING LINE:
Never open with a formal verdict sentence. Use a natural direct opener: "Not quite — here's where it goes sideways." / "That's right, and here's why." etc.

Throughout: use plain language, contractions, no government-speak. Still cited, still precise.`,
};

const SYSTEM_PROMPT_BASE = `You are an expert Social Security and IRMAA research assistant for financial advisors.
Answer questions grounded strictly in the provided source sections.

RULES: Ground every claim in sources. Cite sections like (RS 00615.201). Flag gaps as [SOURCE GAP: ...]. Never speak as the SSA. Address the advisor as "you"; refer to the client in third person.

OUTPUT FORMAT (JSON):
{
  "verdict": "correct"|"incorrect"|"partial"|"no_advice_to_evaluate"|"uncertain",
  "verdict_summary": "one sentence",
  "answer": "full HTML answer using <p>, <ul><li>, <ol><li> tags — never inline '1.' or '•' markers",
  "primary_sources": [{"section_number": string, "url": string}],
  "gaps": ["…"]
}`;

async function generateAnswerStreaming(
  cleanQuestion: string,
  parties: string[],
  isEvaluatingAdvice: boolean,
  isFollowup: boolean,
  sections: RetrievedSection[],
  verifiedContext: string,
  history: HistoryMessage[],
  tone: string,
  callbacks: {
    onAnswerStart: (verdict: string, verdictSummary: string) => void;
    onToken: (text: string) => void;
  },
): Promise<{ verdict: string; verdict_summary: string; answer: string; primary_sources: any[]; gaps: string[] }> {
  const MAX_CHARS = 5000;
  const sourceBlock = sections
    .map(s => {
      const text = s.full_text.length > MAX_CHARS
        ? s.full_text.slice(0, MAX_CHARS) + '\n[... truncated ...]'
        : s.full_text;
      return `--- SOURCE: ${s.section_number} ---\nTitle: ${s.title ?? '(none)'}\nURL: ${s.source_url}\n\n${text}`;
    })
    .join('\n\n');

  const priorContext = history.length > 0
    ? `CONVERSATION SO FAR:\n${history.slice(-6).map(m => `${m.role === 'user' ? 'ADVISOR' : 'YOU'}: ${m.content.slice(0, 2000)}`).join('\n')}\n\n`
    : '';
  const partyContext = parties.length > 0
    ? `PARTIES IN THIS SCENARIO:\n${parties.map(p => `• ${p}`).join('\n')}\n\n`
    : '';
  const evalNote = isEvaluatingAdvice
    ? 'NOTE: Evaluate whether the advice is correct. Set verdict accordingly.\n\n'
    : isFollowup
    ? 'NOTE: Follow-up question. Build on prior conversation; set verdict to "no_advice_to_evaluate".\n\n'
    : 'NOTE: Genuine information request. Set verdict to "no_advice_to_evaluate".\n\n';

  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.balanced;
  const systemPrompt = SYSTEM_PROMPT_BASE + '\n\n' + toneInstruction;

  const userPrompt = `${priorContext}${partyContext}QUESTION: ${cleanQuestion}

${evalNote}AVAILABLE SECTION NUMBERS:
${sections.map(s => s.section_number).join(', ')}
${verifiedContext}

SOURCE SECTIONS:
${sourceBlock}`;

  const oaiStream = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2500,
    temperature: 0,
    stream: true,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  let fullText = '';
  let answerStartSent = false;
  let answerFieldOffset = -1;
  let inAnswerField = false;
  let inEscape = false;

  for await (const chunk of oaiStream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (!delta) continue;

    const prevLen = fullText.length;
    fullText += delta;

    if (!answerStartSent) {
      const vm = fullText.match(/"verdict"\s*:\s*"([^"]+)"/);
      const sm = fullText.match(/"verdict_summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (vm && sm) {
        const rawSummary = sm[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '\t');
        callbacks.onAnswerStart(vm[1], rawSummary);
        answerStartSent = true;
      }
    }

    if (answerFieldOffset === -1) {
      const m = /"answer"\s*:\s*"/.exec(fullText);
      if (m) { answerFieldOffset = m.index + m[0].length; inAnswerField = true; inEscape = false; }
    }

    if (inAnswerField) {
      const processFrom = Math.max(prevLen, answerFieldOffset);
      if (processFrom < fullText.length) {
        const newChars = fullText.slice(processFrom);
        let tokenText = '';
        for (let i = 0; i < newChars.length; i++) {
          const ch = newChars[i];
          if (inEscape) {
            inEscape = false;
            if (ch === '"') tokenText += '"';
            else if (ch === '\\') tokenText += '\\';
            else if (ch === '/') tokenText += '/';
            else if (ch === 'n') tokenText += '\n';
            else if (ch === 'r') { /* strip CR */ }
            else if (ch === 't') tokenText += '\t';
            else if (ch === 'u' && i + 4 < newChars.length) {
              const hex = newChars.slice(i + 1, i + 5);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) { tokenText += String.fromCharCode(parseInt(hex, 16)); i += 4; }
              else tokenText += ch;
            } else tokenText += ch;
          } else if (ch === '\\') {
            inEscape = true;
          } else if (ch === '"') {
            inAnswerField = false;
            break;
          } else {
            tokenText += ch;
          }
        }
        if (tokenText) callbacks.onToken(tokenText);
      }
    }
  }

  try {
    const parsed = JSON.parse(fullText);
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

// ── [5] Verify claims (deterministic) ────────────────────────────────────────

function extractSpecifics(text: string): string[] {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const patterns: RegExp[] = [
    /\b(?!(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])(?:\/|\b))\d+\/\d+(?:\s+of\s+1%)?/g,
    /\b\d+(?:\.\d+)?%/g,
    /\$[\d,]+(?:\.\d{2})?/g,
    /\bage\s+\d{2}\b/gi,
    /\b\d{2,3}\s+months?\b/gi,
    /\b\d{1,2}\s+years?\b/gi,
  ];
  const found = new Set<string>();
  for (const p of patterns) for (const m of clean.matchAll(p)) { const v = m[0].trim(); if (v !== '1%' && v !== '0%' && v !== '$0') found.add(v); }
  return [...found];
}

function normalise(text: string): string {
  return text
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\d)\s+percent/gi, '$1 percent')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')
    .replace(/\b(\d{2})\s+years?\s+old\b/gi, 'age $1')
    .replace(/\b(\d{2})\s+years?\b(?!\s+of\b)/gi, 'age $1')
    .replace(/\s+/g, ' ');
}

function verifyClaims(
  answer: string,
  sections: RetrievedSection[],
  citedSNs: string[],
  verifiedContext: string,
): { passed: boolean; unverified: Array<{ value: string; context: string }> } {
  const citedSet = new Set(citedSNs);
  const citedNorm = sections
    .filter(s => citedSet.has(s.section_number))
    .map(s => normalise(s.full_text))
    .join('\n');

  if (!citedNorm) return { passed: false, unverified: [{ value: '(all)', context: 'No cited sections matched.' }] };

  const combined = citedNorm + (verifiedContext ? '\n' + normalise(verifiedContext) : '');
  const specifics = extractSpecifics(answer);
  const unverified: Array<{ value: string; context: string }> = [];

  for (const val of specifics) {
    const normVal = normalise(val);
    if (!combined.includes(normVal)) {
      const idx = answer.indexOf(val);
      const context = idx !== -1 ? answer.slice(Math.max(0, idx - 80), idx + val.length + 80) : val;
      unverified.push({ value: val, context });
    }
  }

  return {
    passed: unverified.length === 0,
    unverified: unverified.filter(u => !u.value.startsWith('$')).slice(0, 3),
  };
}

// ── SSE helper ────────────────────────────────────────────────────────────────

function sseEvent(controller: ReadableStreamDefaultController, obj: object) {
  controller.enqueue(ENC.encode(`data: ${JSON.stringify(obj)}\n\n`));
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Auth
  const authed = await verifyAuth(req.headers.get('Authorization'));
  if (!authed) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Unauthorized' })}\n\n`,
      { status: 401, headers: { 'Content-Type': 'text/event-stream' } },
    );
  }

  // Parse body
  let body: { question?: string; history?: HistoryMessage[]; tone?: string };
  try { body = await req.json(); } catch { body = {}; }
  const { question = '', history = [], tone = 'balanced' } = body;
  const safeTone = ['formal', 'balanced', 'conversational'].includes(tone) ? tone : 'balanced';

  if (!question?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'question required' })}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' } },
    );
  }

  const supabase = getSupabase();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => sseEvent(controller, obj);

      try {
        // [1] Interpret
        send({ type: 'status', message: 'Analyzing question…' });
        const interpreted = await interpretQuery(question, history);

        // [2] Embed + retrieve
        send({ type: 'status', message: 'Searching sources…' });

        const embRes = await getOpenAI().embeddings.create({
          model: EMBED_MODEL,
          input: interpreted.clean_question,
        });
        const embedding = embRes.data[0].embedding;

        const [sections, verifiedContext] = await Promise.all([
          multiQueryRetrieve(supabase, interpreted.retrieval_queries, embedding),
          getVerifiedContext(supabase, interpreted.clean_question, interpreted.category, embedding),
        ]);

        // [3] Retrieval done
        send({
          type: 'retrieval_done',
          queries:  interpreted.retrieval_queries,
          parties:  interpreted.parties,
          category: interpreted.category,
        });

        if (sections.length === 0) {
          send({ type: 'answer_start', verdict: 'uncertain', verdict_summary: 'No relevant POMS sections found.' });
          send({ type: 'token', text: '<p>No relevant source sections found. Try rephrasing or narrowing the topic.</p>' });
          send({
            type: 'done',
            primary_sources: [], sections_used: [],
            verification: { passed: false, unverified: [] },
            gaps: ['No sections retrieved'], stale_warning: null,
            retrieval_queries: interpreted.retrieval_queries,
            parties: interpreted.parties,
            clean_question: interpreted.clean_question,
            category: interpreted.category,
          });
          controller.close();
          return;
        }

        // [3b] Log query (fire-and-forget)
        supabase.from('axiom_queries').insert({
          raw_question: question, clean_question: interpreted.clean_question,
          benefit_types: interpreted.benefit_types,
          category: interpreted.category, parties: interpreted.parties,
        }).then(({ error }: any) => { if (error) console.warn('[axiom_queries]', error.message); });

        // [4] Generate with streaming
        const result = await generateAnswerStreaming(
          interpreted.clean_question, interpreted.parties,
          interpreted.is_evaluating_advice, interpreted.is_followup,
          sections, verifiedContext, history, safeTone,
          {
            onAnswerStart: (verdict, verdict_summary) => send({ type: 'answer_start', verdict, verdict_summary }),
            onToken:       (text) => send({ type: 'token', text }),
          },
        );

        // [5] Verify
        const citedSNs = result.primary_sources.map((s: any) => s.section_number);
        const verification = citedSNs.length > 0
          ? verifyClaims(result.answer, sections, citedSNs, verifiedContext)
          : { passed: true, unverified: [] };

        // [5b] Stale check
        let staleWarning: string | null = null;
        try {
          if (citedSNs.length > 0) {
            const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
            const { data: staleRows } = await supabase
              .from('source_documents')
              .select('section_number')
              .in('section_number', citedSNs)
              .or(`last_checked.is.null,last_checked.lt.${ninetyDaysAgo}`)
              .limit(5);
            if (staleRows && staleRows.length > 0) {
              staleWarning = `Source currency unverified for: ${staleRows.map((r: any) => r.section_number).join(', ')}. Verify against current SSA guidance before advising clients.`;
            }
          }
        } catch { /* non-fatal */ }

        // [6] Done
        send({
          type: 'done',
          primary_sources:   result.primary_sources,
          sections_used:     sections.map(s => ({ section_number: s.section_number, title: s.title, score: s.score, source_url: s.source_url })),
          verification,
          gaps:              result.gaps,
          stale_warning:     staleWarning,
          retrieval_queries: interpreted.retrieval_queries,
          parties:           interpreted.parties,
          clean_question:    interpreted.clean_question,
          category:          interpreted.category,
        });

        controller.close();
      } catch (err: any) {
        console.error('[ask edge fn] error:', err);
        try { send({ type: 'error', message: err?.message ?? 'Internal server error' }); } catch { /* ignore */ }
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':    'text/event-stream',
      'Cache-Control':   'no-cache',
      'Connection':      'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
