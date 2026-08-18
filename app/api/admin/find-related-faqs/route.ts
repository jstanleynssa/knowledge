/**
 * POST /api/admin/find-related-faqs
 *
 * Given a flagged FAQ and a reviewer note, identifies other FAQs on the same
 * page that are semantically related — i.e., the same correction would likely
 * improve them too. Returns indices + short reasons so the reviewer can choose
 * to apply the same feedback in one click.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSessionClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { flagged_index, flagged_question, flagged_answer, note, all_faqs, page_title } = body;

  if (!note?.trim() || !flagged_question || !Array.isArray(all_faqs) || all_faqs.length < 2) {
    return NextResponse.json({ related: [] });
  }

  // Filter out the flagged FAQ itself
  const candidates = all_faqs.filter((f: { index: number }) => f.index !== flagged_index);
  if (candidates.length === 0) return NextResponse.json({ related: [] });

  const candidateList = candidates
    .map((f: { index: number; q: string; a: string }) =>
      `[${f.index}] Q: "${f.q}"\n    A: "${f.a}"`
    )
    .join('\n\n');

  const prompt = `You are reviewing a knowledge base article titled "${page_title || 'KB Article'}".

A reviewer flagged this FAQ and left a correction note:
Q: "${flagged_question}"
A: "${flagged_answer}"
Correction note: "${note}"

Here are the other FAQs on this page:
${candidateList}

Identify which of the other FAQs (if any) would benefit from the SAME correction note — meaning the correction is applicable or relevant to that question too (addresses the same concept, gap, or error).

Return a JSON object with key "related" — an array of objects, one per relevant FAQ:
{ "related": [ { "index": <number>, "reason": "<one short sentence why the same feedback applies>" } ] }

Only include FAQs where the feedback clearly applies. If none qualify, return { "related": [] }.
Return raw JSON only, no code fences.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const result = JSON.parse(raw);
    const related = Array.isArray(result.related) ? result.related : [];

    // Attach the full FAQ data so the UI can display the question text
    const faqMap = Object.fromEntries(
      all_faqs.map((f: { index: number; q: string; a: string }) => [f.index, f])
    );
    const enriched = related
      .filter((r: { index: number }) => faqMap[r.index])
      .map((r: { index: number; reason: string }) => ({
        ...r,
        q: faqMap[r.index].q,
        a: faqMap[r.index].a,
      }));

    return NextResponse.json({ related: enriched });
  } catch (e) {
    console.error('find-related-faqs error:', e);
    return NextResponse.json({ related: [] }); // Fail silently — this is a convenience feature
  }
}
