'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateReviewer(id: number, reviewer: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from('codex_topics')
    .update({ reviewer, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/codex/admin/topics');
}
