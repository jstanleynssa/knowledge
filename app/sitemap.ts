/**
 * sitemap.xml — auto-generated from published reference_pages
 */
import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase';

export const dynamic = 'force-static';
// Rebuild sitemap on each deployment (ISR not used for sitemap)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('slug, category, date_modified, date_published')
    .eq('status', 'published');

  const pages: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
    url: `https://knowledge.nssapros.com/${row.category}/${row.slug}`,
    lastModified: row.date_modified ?? row.date_published ?? undefined,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: 'https://knowledge.nssapros.com',
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://knowledge.nssapros.com/social-security',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://knowledge.nssapros.com/irmaa',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...pages,
  ];
}
