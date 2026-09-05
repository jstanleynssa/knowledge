'use server';

import { revalidatePath } from 'next/cache';
import { createSessionClient, createServiceClient } from '@/lib/supabase';
import type { Category, BodySection, FaqItem, WorkedExample, PrimarySource } from '@/lib/types';
import OpenAI from 'openai';
import { pingIndexNow } from '@/lib/indexnow';



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

// ─── Snapshot helper ────────────────────────────────────────────────────────

/** Write a full content snapshot to reference_pages_history. Non-fatal — never blocks the primary action. */
async function snapshotPage(
  pageId: string,
  action: 'save_draft' | 'approve' | 'send_back' | 'delete',
  actor: string,
) {
  try {
    const service = createServiceClient();
    const { data: page } = await service
      .from('reference_pages')
      .select('*')
      .eq('id', pageId)
      .single();
    if (!page) return;
    await service.from('reference_pages_history').insert({
      page_id:   pageId,
      page_slug: page.slug,
      action,
      actor,
      snapshot:  page,
    });
  } catch (e) {
    console.error('[snapshotPage] non-fatal error:', e);
  }
}

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
  try {
  const { displayName } = await getSessionReviewer();
  const service = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  await snapshotPage(pageId, 'save_draft', displayName);

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

  if (error) throw new Error('Supabase update failed: ' + error.message);
  } catch (e) {
    console.error('[saveDraft] error:', e);
    throw e;
  }
  // No revalidatePath needed for draft saves — the user stays on the page
  // and the client state is already current. Revalidation causes a server
  // component re-render that can fail; the data is safely in Supabase.
}

/** Save edits + approve in one shot — redirects to queue. */
export async function saveAndApprove(pageId: string, fields: EditableFields): Promise<void> {
  const { displayName } = await getSessionReviewer();
  await snapshotPage(pageId, 'approve', displayName);
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
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  // Sync codex_topics status → published (non-fatal).
  // Uses a two-step slug resolution: page slug first, then falls back to the
  // original generation_jobs slug (which matches codex_topics) in case the
  // page was drafted with a different slug than the topic record.
  try {
    const service = createServiceClient();
    const { data: pubPage } = await service
      .from('reference_pages')
      .select('slug, category')
      .eq('id', pageId)
      .single();

    if (pubPage) {
      // Primary: match by page slug
      const { count } = await service
        .from('codex_topics')
        .update({ status: 'published' }, { count: 'exact' })
        .eq('slug', pubPage.slug);

      if (!count || count === 0) {
        // Fallback: look up the original job slug — generation_jobs.slug is
        // always the codex_topics slug, even when the page ends up with a
        // different slug (e.g. regenerated from a different draft).
        const { data: job } = await service
          .from('generation_jobs')
          .select('slug')
          .eq('page_id', pageId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (job?.slug && job.slug !== pubPage.slug) {
          console.warn(
            `[saveAndApprove] slug mismatch — page slug="${pubPage.slug}" ` +
            `job slug="${job.slug}". Syncing codex_topics via job slug.`
          );
          await service
            .from('codex_topics')
            .update({ status: 'published' })
            .eq('slug', job.slug);
        } else {
          console.warn(
            `[saveAndApprove] codex_topics sync: no row matched slug="${pubPage.slug}" ` +
            `and no generation_jobs record found for page_id="${pageId}". ` +
            `Manual codex_topics update may be needed.`
          );
        }
      }

      pingIndexNow([{ slug: pubPage.slug, category: pubPage.category }]);
    }
  } catch (e) {
    console.error('codex_topics sync / IndexNow ping error (non-fatal):', e);
  }

  // Trigger Vercel rebuild so the newly-published page goes live immediately.
  // Non-fatal: approval is committed regardless of whether the hook succeeds.
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (deployHook) {
    fetch(deployHook, { method: 'POST' }).catch(err =>
      console.error('Deploy hook failed (non-fatal):', err)
    );
  }

  revalidatePath('/admin/kb-review', 'page');
  // NOTE: do NOT call redirect() here — this action is called from a client component
  // with try/catch. redirect() throws NEXT_REDIRECT which gets caught as an error,
  // showing a spurious alert. The client (ReviewEditor) handles navigation after this returns.
}

/** Soft-delete a page — marks as 'deleted' instead of removing the row. Snapshots first. */
export async function deletePage(pageId: string): Promise<void> {
  const { email, displayName } = await getSessionReviewer();
  const service = createServiceClient();

  // Only admin can delete; reviewers cannot
  if (email !== ADMIN_EMAIL) throw new Error('Only admins can delete pages.');

  // Safety: only allow deletion of non-published pages
  const { data: page } = await service
    .from('reference_pages')
    .select('status')
    .eq('id', pageId)
    .single();

  if (!page) throw new Error('Page not found.');
  if (page.status === 'published') throw new Error('Cannot delete a published page. Mark it superseded instead.');

  // Snapshot before soft-delete so content is always recoverable
  await snapshotPage(pageId, 'delete', displayName);

  // Soft-delete: mark as deleted rather than removing the row
  const { error } = await service
    .from('reference_pages')
    .update({ status: 'deleted' })
    .eq('id', pageId);

  if (error) throw new Error('Delete failed: ' + error.message);
  revalidatePath('/admin/kb-review', 'page');
}

/** Mark a page as superseded with a public deprecation note. */
export async function sendBackToReview(pageId: string): Promise<void> {
  const { displayName } = await getSessionReviewer();
  await snapshotPage(pageId, 'send_back', displayName);
  const service = createServiceClient();
  const { data: page } = await service
    .from('reference_pages')
    .select('slug')
    .eq('id', pageId)
    .single();
  const { error } = await service
    .from('reference_pages')
    .update({ status: 'in_review', source_last_verified: null })
    .eq('id', pageId);
  if (error) throw new Error(error.message);
  // Sync codex_topics back to in_review (non-fatal)
  if (page?.slug) {
    try {
      await service.from('codex_topics').update({ status: 'in_review' }).eq('slug', page.slug);
    } catch (e) {
      console.error('codex_topics sync error (non-fatal):', e);
    }
  }
  revalidatePath('/admin/kb-review', 'page');
}

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
  revalidatePath('/admin/kb-review', 'page');
  // NOTE: client handles navigation after this returns (same reason as saveAndApprove above).
}
