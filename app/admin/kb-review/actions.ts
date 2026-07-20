'use server';

import { revalidatePath } from 'next/cache';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { Category, BodySection, FaqItem, WorkedExample, PrimarySource } from '@/lib/types';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ADMIN_EMAIL = 'jstanley@nssapros.com';

export type SectionFeedbackMap = Record<number, { type: 'verified' | 'flag'; note?: string }>;

export type EditableFields = {
  title: string;
  seo_title: string;
  meta_description: string;
  eyebrow: string;
  quick_answer: string;
  body_sections: BodySection[];
  worked_example: WorkedExample | null;
  faq: FaqItem[];
  primary_sources: PrimarySource[];
  reviewer: string;
  deprecation_note: string;
};

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getSessionReviewer() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');

  if (user.email === ADMIN_EMAIL) {
    return { email: user.email, displayName: 'Jason Stanley' };
  }

  const service = createServiceClient();
  const { data: reviewer } = await service
    .from('kb_reviewers')
    .select('display_name')
    .eq('email', user.email)
    .single();

  if (!reviewer) throw new Error('Not authorized');
  return { email: user.email, displayName: reviewer.display_name as string };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Save edits as draft (stay on page). */
export async function saveDraft(pageId: string, fields: EditableFields): Promise<void> {
  await getSessionReviewer();
  const service = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await service
    .from('reference_pages')
    .update({
      title:            fields.title,
      seo_title:        fields.seo_title,
      meta_description: fields.meta_description,
      eyebrow:          fields.eyebrow || null,
      quick_answer:     fields.quick_answer,
      body_sections:    fields.body_sections,
      worked_example:   fields.worked_example || null,
      faq:              fields.faq,
      primary_sources:  fields.primary_sources,
      reviewer:         fields.reviewer || null,
      deprecation_note: fields.deprecation_note || null,
      date_modified:    today,
    })
    .eq('id', pageId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/kb-review/${pageId}`);
  revalidatePath('/admin/kb-review');
}

/** Save edits + approve in one shot — redirects to queue. */
export async function saveAndApprove(pageId: string, fields: EditableFields): Promise<void> {
  const { displayName } = await getSessionReviewer();
  const service = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await service
    .from('reference_pages')
    .update({
      title:                fields.title,
      seo_title:            fields.seo_title,
      meta_description:     fields.meta_description,
      eyebrow:              fields.eyebrow || null,
      quick_answer:         fields.quick_answer,
      body_sections:        fields.body_sections,
      worked_example:       fields.worked_example || null,
      faq:                  fields.faq,
      primary_sources:      fields.primary_sources,
      reviewer:             fields.reviewer || null,
      deprecation_note:     fields.deprecation_note || null,
      status:               'published',
      date_published:       today,
      approved_by:          displayName,
      approved_at:          new Date().toISOString(),
      source_last_verified: today,
      date_modified:        today,
    })
    .eq('id', pageId);

  if (error) throw new Error(error.message);

  // Seed verified_answers from approved page — non-fatal, never blocks approval — the h1 becomes the question,
  // quick_answer becomes the verified answer. This pre-fills the agent's
  // few-shot corpus with every expert-approved KB page automatically.
  try {
    const service2 = createServiceClient();
    const { data: page } = await service2
      .from('reference_pages')
      .select('h1, title, quick_answer, primary_sources, category')
      .eq('id', pageId)
      .single();

    if (page?.quick_answer) {
      const question = page.h1 || page.title;
      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
      });
      const embedding = embRes.data[0].embedding;
      const today2 = new Date().toISOString().split('T')[0];

      // Upsert — if this page was previously approved, update the answer
      const { data: existing } = await service2
        .from('verified_answers')
        .select('id')
        .eq('question', question)
        .eq('category', page.category)
        .single();

      if (existing) {
        await service2.from('verified_answers').update({
          answer: page.quick_answer, embedding, last_reviewed: today2,
          primary_sources: page.primary_sources ?? [],
        }).eq('id', existing.id);
      } else {
        await service2.from('verified_answers').insert({
          question,
          answer:          page.quick_answer,
          primary_sources: page.primary_sources ?? [],
          answered_by:     displayName,
          category:        page.category,
          status:          'published',
          embedding,
          last_reviewed:   today2,
        });
      }
    }
  } catch (e) {
    console.error('verified_answers seed error (non-fatal):', e);
  }

  revalidatePath('/admin/kb-review');
  // NOTE: do NOT call redirect() here — this action is called from a client component
  // with try/catch. redirect() throws NEXT_REDIRECT which gets caught as an error,
  // showing a spurious alert. The client (ReviewEditor) handles navigation after this returns.
}

/** Mark a page as superseded with a public deprecation note. */
export async function supersedePageAction(
  pageId: string,
  deprecationNote: string,
): Promise<void> {
  const { displayName } = await getSessionReviewer();
  const service = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await service
    .from('reference_pages')
    .update({
      status:           'superseded',
      deprecation_note: deprecationNote || null,
      approved_by:      displayName,
      approved_at:      new Date().toISOString(),
      date_modified:    today,
    })
    .eq('id', pageId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/kb-review');
  // NOTE: client handles navigation after this returns (same reason as saveAndApprove above).
}
