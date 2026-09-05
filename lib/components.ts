/**
 * Helpers for fetching reusable reference_components.
 *
 * Components are named, reusable BodySection blocks (tables, prose, etc.)
 * that can be embedded in multiple reference pages via:
 *   { type: 'component', component_key: 'irmaa-thresholds-2026', heading: '', prose: '' }
 */

import { createServiceClient } from '@/lib/supabase';
import type { BodySection, ReferenceComponent } from '@/lib/types';

/**
 * Scan a page's body_sections for component references, fetch them from the DB,
 * and return a Record<key, ReferenceComponent> ready to pass to ReferencePageComponent.
 * Uses the public (RLS-respecting) client — safe for SSG page routes.
 */
export async function resolvePageComponents(
  body_sections: BodySection[]
): Promise<Record<string, ReferenceComponent>> {
  const keys = body_sections
    .filter((s) => s.type === 'component' && s.component_key)
    .map((s) => s.component_key as string);

  if (keys.length === 0) return {};

  // Use service client — reference_components has no public RLS policy;
  // this only runs server-side (SSG build or server component), never in the browser.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('reference_components')
    .select('*')
    .in('key', keys);

  if (error || !data) return {};

  return Object.fromEntries(data.map((c: ReferenceComponent) => [c.key, c]));
}

/**
 * Fetch all components (admin use). Uses service client to bypass RLS.
 */
export async function fetchAllComponents(): Promise<ReferenceComponent[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('reference_components')
    .select('*')
    .order('key');
  return data ?? [];
}
