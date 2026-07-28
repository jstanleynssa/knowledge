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

    // Extract any POMS/CFR/Handbook section numbers mentioned in the correction note
    // and merge them into primary_sources so they appear as clickable citations.
    // Patterns: RS 00615.690, HI 01101.020, GN 00204.020, 20 CFR 404.313, HBK 0720, etc.
    const mergedSources = [...(primary_sources ?? [])];
    if (feedback_type === 'correct' && correction_note) {
      const sectionPattern = /\b(?:RS|GN|HI|SI|DI|RM|SM|MS|PR|PS|NL|TN|HBK)\s+\d{5}\.\d{3}[A-Z0-9]*|\b20\s+CFR\s+\d+\.\d+|\bHBK\s+\d+/gi;
      const rawMatches: string[] = (correction_note.match(sectionPattern) ?? []) as string[];
      const mentioned: string[] = [...new Set(rawMatches.map((s: string) => s.trim().replace(/\s+/g, ' ')))]
      for (const sec of mentioned) {
        const normalized = sec.replace(/\s+/g, ' ');
        if (!mergedSources.some((s: { section_number: string }) => s.section_number === normalized)) {
          // Build a POMS URL for RS/GN/HI etc.
          const pomsMatch = normalized.match(/^([A-Z]{2})\s+(\d{5})\.(\d{3})/i);
          const url = pomsMatch
            ? `https://secure.ssa.gov/apps10/poms.nsf/lnx/${pomsMatch[1].toLowerCase()}${pomsMatch[2]}${pomsMatch[3]}000`
            : '';
          mergedSources.push({ section_number: normalized, url, tag: 'Source' });
        }
      }
    }

    try {
      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
      });
      const embedding = embRes.data[0].embedding;

      const { error: vaErr } = await supabase.from('verified_answers').insert({
        question,
        answer:          finalAnswer,
        primary_sources: mergedSources,
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
      model: 'gpt-4o',
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
    analysis = 'Feedback saved — unable to generate learning summary at this time.';
  }

  // Ensure analysis is never empty so the UI card always renders
  if (!analysis) analysis = 'Feedback saved to the verified answers corpus.';

  return NextResponse.json({ ok: true, analysis });
}
