import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { NSSA_PROFESSIONS } from '@/lib/nssa-professions'
import { IRMAACP_PROFESSIONS } from '@/lib/irmaacp-professions'
import { PROFESSIONS as CELP_PROFESSIONS } from '@/lib/celp-professions'
import { buildSlugIndex } from '@/lib/slug'

export const revalidate = 86400 // regenerate every 24 hours

import { AXIOM_ENABLED } from '@/lib/flags'

const SITE = 'https://arpinstitute.com'

function url(path: string, priority: number, changeFreq: MetadataRoute.Sitemap[number]['changeFrequency'] = 'monthly', lastMod?: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE}${path}`,
    lastModified: lastMod ?? new Date().toISOString().split('T')[0],
    changeFrequency: changeFreq,
    priority,
  }
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = sb()

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    url('/',              1.0, 'weekly'),
    url('/credentials',  0.9, 'monthly'),
    url('/credentials/nssa',     0.9, 'monthly'),
    url('/credentials/irmaacp',  0.9, 'monthly'),
    url('/credentials/celp',     0.9, 'monthly'),
    url('/enroll',        0.9, 'monthly'),
    url('/about',         0.7, 'monthly'),
    url('/mission',       0.6, 'monthly'),
    url('/blog',          0.8, 'weekly'),
    url('/ce-credits',    0.7, 'monthly'),
    url('/find-an-advisor', 0.8, 'weekly'),
    url('/contact',       0.6, 'monthly'),
    url('/press',         0.5, 'monthly'),
    url('/careers',            0.5, 'monthly'),
    url('/partners/iarfc',     0.7, 'monthly'),
    url('/partners/win-group', 0.7, 'monthly'),
    url('/partners/pinnacle',  0.7, 'monthly'),
    url('/privacy',       0.3, 'yearly'),
    url('/terms',         0.3, 'yearly'),
    ...(AXIOM_ENABLED ? [url('/axiom', 0.8, 'monthly')] : []),
    url('/codex',         0.7, 'weekly'),
    url('/codex/social-security', 0.7, 'weekly'),
    url('/codex/irmaa',   0.7, 'weekly'),
  ]

  // ── Credential profession pages ───────────────────────────────────────────
  const credentialPages: MetadataRoute.Sitemap = [
    ...NSSA_PROFESSIONS.map(p => url(`/credentials/nssa/${p.id}`, 0.8, 'monthly')),
    ...IRMAACP_PROFESSIONS.map(p => url(`/credentials/irmaacp/${p.id}`, 0.8, 'monthly')),
    ...CELP_PROFESSIONS.map(p => url(`/credentials/celp/${p.id}`, 0.8, 'monthly')),
  ]

  // ── Codex articles ────────────────────────────────────────────────────────
  const [{ data: ssArticles }, { data: irmaaArticles }] = (await Promise.all([
    supabase.from('reference_pages').select('slug, updated_at').eq('category', 'social-security').eq('status', 'published'),
    supabase.from('reference_pages').select('slug, updated_at').eq('category', 'irmaa').eq('status', 'published'),
  ])) as [{ data: { slug: string; updated_at: string | null }[] | null }, { data: { slug: string; updated_at: string | null }[] | null }]

  const codexPages: MetadataRoute.Sitemap = [
    ...(ssArticles ?? []).map(a => url(`/codex/social-security/${a.slug}`, 0.7, 'monthly', a.updated_at?.split('T')[0])),
    ...(irmaaArticles ?? []).map(a => url(`/codex/irmaa/${a.slug}`, 0.7, 'monthly', a.updated_at?.split('T')[0])),
  ]

  // ── Blog posts ────────────────────────────────────────────────────────────
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, legacy_published_at')
    .eq('status', 'published')
    .order('legacy_published_at', { ascending: false }) as unknown as { data: { slug: string; updated_at: string | null; legacy_published_at: string | null }[] | null }

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(p =>
    url(`/blog/${p.slug}`, 0.6, 'monthly', (p.updated_at ?? p.legacy_published_at)?.split('T')[0])
  )

  // ── Advisor directory profiles ─────────────────────────────────────────────
  let members: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('members')
      // id required for collision-safe slug disambiguation
      .select('id, email, first_name, last_name, city, state, bio, enrolled_at')
      .or('nssa_certified.eq.true,irmaa_certified.eq.true')
      .not('is_active', 'eq', false)
      .not('directory_opt_out', 'eq', true)
      .not('admin_directory_exclude', 'eq', true)
      .not('bio', 'is', null)
      .neq('bio', '')
      .range(from, from + 999)
    if (error || !data?.length) break
    members = members.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  // Strip members whose bio is only empty HTML tags (e.g. <p></p>)
  const eligible = members.filter(m =>
    (m.bio ?? '').replace(/<[^>]*>/g, '').trim().length > 0
  )

  const { byEmail } = buildSlugIndex(eligible)

  const directoryPages: MetadataRoute.Sitemap = [...byEmail.entries()].map(([email, slug]) => {
    const member = eligible.find(m => m.email === email)
    return url(`/find-an-advisor/${slug}`, 0.5, 'monthly', member?.enrolled_at?.split('T')[0])
  })

  return [
    ...staticPages,
    ...credentialPages,
    ...codexPages,
    ...blogPages,
    ...directoryPages,
  ]
}
