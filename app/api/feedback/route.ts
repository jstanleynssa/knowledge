/**
 * POST /api/feedback
 *
 * Captures agent answer feedback and writes to verified_answers on approve/correct.
 *
 * feedback_type:
 *   'approve'  — answer was correct as-is → save to verified_answers
 *   'correct'  — answer had errors → save corrected version to verified_answers
 *   'reject'   — answer was wrong / unusable → log only, don't save as verified
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    question,
    original_answer,
    corrected_answer,
    verdict,
    primary_sources,
    sections_used,
    feedback_type,   // 'approve' | 'correct' | 'reject'
    correction_tags, // string[]
    correction_note, // string
    category,        // 'social-security' | 'irmaa'
  } = body;

  if (!question || !original_answer || !feedback_type) {
    return NextResponse.json({ error: 'question, original_answer, and feedback_type required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Always log to answer_feedback
  const { error: fbErr } = await supabase.from('answer_feedback').insert({
    question,
    original_answer,
    corrected_answer:  corrected_answer ?? null,
    verdict:           verdict ?? null,
    primary_sources:   primary_sources ?? [],
    sections_used:     sections_used ?? [],
    feedback_type,
    correction_tags:   correction_tags ?? [],
    correction_note:   correction_note ?? null,
    category:          category ?? 'social-security',
    saved_to_verified: feedback_type === 'reject' ? false : true,
  });
  if (fbErr) console.error('feedback insert error:', fbErr.message);

  // For approve or correct: save to verified_answers with embedding
  if (feedback_type === 'approve' || feedback_type === 'correct') {
    const finalAnswer = feedback_type === 'correct' ? (corrected_answer ?? original_answer) : original_answer;

    try {
      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
      });
      const embedding = embRes.data[0].embedding;

      const { error: vaErr } = await supabase.from('verified_answers').insert({
        question,
        answer:          finalAnswer,
        primary_sources: primary_sources ?? [],
        answered_by:     feedback_type === 'correct' ? 'human-corrected' : 'agent-approved',
        category:        category ?? 'social-security',
        status:          'published',
        embedding,
        last_reviewed:   today,
      });
      if (vaErr) console.error('verified_answers insert error:', vaErr.message);
    } catch (e) {
      console.error('embedding error:', e);
    }
  }

  // Generate a brief learning analysis for correct/reject/approve feedback
  let analysis = '';
  try {
    const feedbackLabel = feedback_type === 'approve' ? 'verified as correct'
      : feedback_type === 'correct' ? 'corrected with a suggestion'
      : 'flagged as wrong';
    const analysisRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content: `You are a Social Security and IRMAA research AI that just received feedback on one of your answers. 
In 1-2 concise sentences, explain what you learned or confirmed from this feedback. 
Be specific about the rule, section, or concept involved. Speak in first person. Be professional and precise.`,
        },
        {
          role: 'user',
          content: [
            `Question: ${question}`,
            `Feedback: ${feedbackLabel}`,
            correction_note ? `Reviewer note: ${correction_note}` : '',
            correction_tags?.length ? `Issue tags: ${(correction_tags as string[]).join(', ')}` : '',
            `Answer excerpt: ${original_answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)}`,
          ].filter(Boolean).join('\n'),
        },
      ],
    });
    analysis = analysisRes.choices[0].message.content?.trim() ?? '';
  } catch (e) {
    console.error('feedback analysis error:', e);
  }

  return NextResponse.json({ ok: true, analysis });
}
