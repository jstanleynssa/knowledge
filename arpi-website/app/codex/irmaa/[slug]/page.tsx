/**
 * IRMAA reference page — SSG
 * Route: /irmaa/[slug]
 */

import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/codex-supabase';
import { seoTitle } from '@/lib/seo';
import { ReferencePageComponent } from '@/components/codex/ReferencePage';
import { resolvePageComponents } from '@/lib/codex-components';
import type { ReferencePage } from '@/lib/codex-types';

// ISR: generate on first request and cache for 24 hours.
// No pages are pre-built at deploy time — all slugs are valid (dynamicParams defaults to true).
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('title, seo_title, meta_description, og_image_url')
    .eq('slug', slug)
    .eq('category', 'irmaa')
    .eq('status', 'published')
    .single();

  if (!data) return {};

  return {
    title: data.seo_title || seoTitle(data.title),
    description: data.meta_description,
    // Override layout's fallback canonical with the page-specific URL
    alternates: {
      canonical: `https://arpinstitute.com/codex/irmaa/${slug}`,
    },
    openGraph: {
      images: data.og_image_url ? [data.og_image_url] : [],
    },
  };
}

export default async function IrmaaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data } = await supabase
    .from('reference_pages')
    .select('*')
    .eq('slug', slug)
    .eq('category', 'irmaa')
    .eq('status', 'published')
    .single();

  if (!data) notFound();

  const page = data as ReferencePage;
  const components = await resolvePageComponents(page.body_sections);

  return <ReferencePageComponent page={page} components={components} embedded />;
}
