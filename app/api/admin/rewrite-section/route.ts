/**
 * POST /api/admin/rewrite-section
 *
 * Takes an existing KB section and a reviewer's feedback note, rewrites the
 * section prose to incorporate the correction, and returns the updated fields
 * plus a short "what I learned" summary to display to the reviewer.
 *
 * Output is plain text — no HTML tags — so non-technical reviewers can read
 * and further edit the result without confusion.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSessionClient } from '@/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Strip all HTML tags and normalize whitespace to plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#x2019;/g, "'").replace(/&rsquo;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req: NextRequest) {
  // Auth — must be a logged-in reviewer
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { heading, prose, note, page_title, category, citation_ref } = body;

  if (!note?.trim()) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 });
  }

  // Strip HTML from the original prose before sending to GPT
  const originalProse = stripHtml(prose ?? '');

  const categoryLabel = category === 'irmaa'
    ? 'IRMAA and Medicare surcharges'
    : 'Social Security rules and benefits';

  const systemPrompt = `You are an expert editor for the NSSA Knowledge Base, a professional reference on ${categoryLabel} for financial advisors and retirees.

A subject-matter expert reviewer has flagged a section and left a correction note. Your job is to update the section to incorporate their feedback — not replace the section with their words, but use their correction to improve the existing text.

Rules:
- Start from the ORIGINAL section content as your base.
- Incorporate the reviewer's correction accurately: add missing information, fix errors, or adjust emphasis as their note indicates.
- Keep the same professional, plain-language tone. Write for financial advisors.
- Output PLAIN TEXT ONLY. No HTML tags, no markdown, no asterisks, no bullet symbols unless the original used them.
- Return a JSON object with exactly three keys: "heading", "prose", and "learned".
  - "heading": the section heading (update only if the reviewer explicitly says to)
  - "prose": the updated section text, plain text only
  - "learned": one sentence (plain text) in first person summarizing what was corrected or added, e.g. "I learned that the SSA-44 form is filed in response to an IRMAA determination letter rather than on a fixed calendar date."
- Return raw JSON only. No code fences, no extra keys.`;

  const userPrompt = `Page title: "${page_title || 'KB Article'}"
Section heading: ${heading || '(none)'}
${citation_ref ? `Citation reference: ${citation_ref}` : ''}

Original section text:
${originalProse || '(empty)'}

Reviewer correction note:
${note}

Rewrite the section to incorporate this feedback. Return { "heading": "...", "prose": "...", "learned": "..." }.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const result = JSON.parse(raw);

    // Safety-strip any HTML that slipped through
    const safeProse   = stripHtml(typeof result.prose   === 'string' ? result.prose   : originalProse);
    const safeHeading =           typeof result.heading === 'string' ? result.heading : (heading ?? '');
    const safeLearned =           typeof result.learned === 'string' ? result.learned : '';

    return NextResponse.json({ ok: true, heading: safeHeading, prose: safeProse, learned: safeLearned });
  } catch (e) {
    console.error('rewrite-section error:', e);
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
