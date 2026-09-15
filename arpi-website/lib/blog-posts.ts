import { supabaseAdmin, supabaseAdminNoCache } from '@/lib/blog-supabase'
import type { BlogPost, Category } from '@/lib/blog-types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://arpinstitute.com'

// Only explicitly published posts are public. 'imported' = in review queue, not live.
const VISIBLE_STATUSES = ['published']

export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id,slug,title,dek,excerpt,hero_image_url,hero_image_alt,meta_description,legacy_published_at,published_at,status,is_time_bound,as_of_date')
    .in('status', VISIBLE_STATUSES)
    .order('legacy_published_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(`getAllPosts: ${error.message}`)

  // Posts without legacy_published_at (new AI-generated posts) use published_at for sorting
  const posts = (data ?? []) as BlogPost[]
  return posts.sort((a, b) => {
    const dateA = a.legacy_published_at ?? a.published_at ?? ''
    const dateB = b.legacy_published_at ?? b.published_at ?? ''
    return dateB.localeCompare(dateA)
  })
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // Use no-cache client so force-dynamic pages always get fresh DB content
  const { data, error } = await supabaseAdminNoCache
    .from('blog_posts')
    .select('*, body_md_published')
    .eq('slug', slug)
    .in('status', VISIBLE_STATUSES)
    .single()

  if (error || !data) return null

  // Attach categories
  const categories = await getCategoriesForPost(data.id)
  return { ...data, categories } as BlogPost
}

export async function getCategoriesForPost(postId: string): Promise<Category[]> {
  const { data } = await supabaseAdmin
    .from('blog_post_categories')
    .select('blog_categories(id,slug,name)')
    .eq('post_id', postId)

  if (!data) return []
  // Supabase returns the join as an array; take first element of each
  return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const cat = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories
      return cat ?? null
    })
    .filter(Boolean) as Category[]
}

export async function getAllCategories(): Promise<Category[]> {
  const { data } = await supabaseAdmin
    .from('blog_categories')
    .select('id,slug,name')
    .order('name')
  return (data ?? []) as Category[]
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`
}

/** Clamp a string to maxLen chars at a word boundary. */
export function clamp(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > maxLen * 0.75 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function seoTitle(post: BlogPost): string {
  return clamp(post.meta_title ?? post.title, 60)
}

export function seoDescription(post: BlogPost): string {
  const raw = post.meta_description ?? post.excerpt ?? ''
  return clamp(raw, 160)
}

/** 3 posts sharing categories with the given post; falls back to most recent. */
export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const catIds = (post.categories ?? []).map((c: { id: string }) => c.id)

  if (catIds.length > 0) {
    // Get post IDs that share at least one category
    const { data: links } = await supabaseAdmin
      .from('blog_post_categories')
      .select('post_id')
      .in('category_id', catIds)
      .neq('post_id', post.id)

    const seen = new Set<string>()
    const relatedIds: string[] = []
    for (const r of (links ?? [])) {
      if (!seen.has(r.post_id)) { seen.add(r.post_id); relatedIds.push(r.post_id) }
    }

    if (relatedIds.length >= limit) {
      const { data } = await supabaseAdmin
        .from('blog_posts')
        .select('id,slug,title,excerpt,meta_description,hero_image_url,hero_image_alt,legacy_published_at,published_at,status')
        .in('id', relatedIds)
        .in('status', ['published'])
        .order('legacy_published_at', { ascending: false, nullsFirst: false })
        .limit(limit)
      if (data && data.length >= limit) return data as BlogPost[]
    }
  }

  // Fallback: most recent posts excluding current
  const { data } = await supabaseAdmin
    .from('blog_posts')
    .select('id,slug,title,excerpt,meta_description,hero_image_url,hero_image_alt,legacy_published_at,published_at,status')
    .in('status', ['published'])
    .neq('id', post.id)
    .order('legacy_published_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []) as BlogPost[]
}

export function displayDate(post: BlogPost): string {
  const raw = post.published_at ?? post.legacy_published_at
  if (!raw) return ''
  return new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function isoDate(post: BlogPost): string {
  return post.published_at ?? post.legacy_published_at ?? ''
}
