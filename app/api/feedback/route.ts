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

  return NextResponse.json({ ok: true });
}
