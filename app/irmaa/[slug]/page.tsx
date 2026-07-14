/**
 * IRMAA reference page — SSG
 * Route: /irmaa/[slug]
 */

import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase';
import { ReferencePageComponent } from '@/components/ReferencePage';
import type { ReferencePage } from '@/lib/types';

export const dynamicParams = false;

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('slug')
    .eq('category', 'irmaa')
    .eq('status', 'published');

  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('reference_pages')
    .select('seo_title, meta_description, og_image_url')
    .eq('slug', slug)
    .eq('category', 'irmaa')
    .eq('status', 'published')
    .single();

  if (!data) return {};

  return {
    title: data.seo_title,
    description: data.meta_description,
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

  return <ReferencePageComponent page={data as ReferencePage} />;
}
