/**
 * POST /api/ask/rewrite
 *
 * Takes an existing agent answer and a reviewer's correction note, then
 * rewrites the answer to incorporate the feedback — same grounded approach
 * as the original answer but updated per the correction.
 *
 * Returns: { answer: string (HTML), learned: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { question, original_answer, correction_note, primary_sources } = body;

  if (!question || !original_answer || !correction_note) {
    return NextResponse.json({ error: 'question, original_answer, and correction_note required' }, { status: 400 });
  }

  const sourceCitations = (primary_sources ?? [])
    .map((s: { section_number: string }) => s.section_number)
    .join(', ');

  const systemPrompt = `You are an expert Social Security and IRMAA research assistant. A subject-matter expert has reviewed your answer and left a correction note. Rewrite the answer to incorporate their feedback accurately.

Rules:
- Start from the ORIGINAL answer as your base — do not discard it entirely.
- Incorporate the reviewer's correction: fix errors, add missing information, adjust emphasis.
- Keep all valid citations from the original. Only add or remove citations if the correction explicitly requires it.
- Output the answer as clean HTML using <p>, <ul>, <li>, <strong> etc. — same format as the original.
- Never speak as the SSA. Use third person: "SSA requires", "the rule states", etc.
- Refer to the client/scenario in third person ("the client", "the individual").
- Return a JSON object with exactly two keys:
  "answer": the rewritten HTML answer
  "learned": one concise sentence (plain text) in first person summarizing what was corrected, e.g. "I learned that..."`;

  const userPrompt = `Question: ${question}

Original answer:
${original_answer}

${sourceCitations ? `Cited sources: ${sourceCitations}\n` : ''}
Reviewer correction note:
${correction_note}

Rewrite the answer incorporating this feedback. Return { "answer": "...", "learned": "..." }.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const result = JSON.parse(raw);

    return NextResponse.json({
      ok:      true,
      answer:  typeof result.answer  === 'string' ? result.answer  : original_answer,
      learned: typeof result.learned === 'string' ? result.learned : '',
    });
  } catch (e) {
    console.error('ask/rewrite error:', e);
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
