import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

interface Post {
  slug: string
  title: string
  excerpt?: string
  display_date?: string
  hero_image_url?: string
  hero_image_alt?: string
}

async function getRecentPosts(): Promise<Post[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, display_date, hero_image_url, hero_image_alt')
      .eq('status', 'published')
      .order('legacy_published_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch {
    return []
  }
}

export default async function BlogSection() {
  const posts = await getRecentPosts()

  return (
    <section className="blog-section">
      <div className="container">
        <div className="blog-header">
          <div className="section-eyebrow">From the Blog</div>
          <h2 className="section-title">Recent Insights</h2>
          <p className="section-sub">Expert guidance on Social Security, Medicare, and retirement planning — straight from ARPI&apos;s knowledge base.</p>
        </div>

        <div className="blog-grid">
          {posts.length === 0 && <div className="blog-loading">No articles found.</div>}
          {posts.map((p) => (
            <a
              key={p.slug}
              className="blog-card"
              href={`/blog/${p.slug}`}
            >
              <div className="blog-card-img">
                {p.hero_image_url && (
                  <Image
                    src={p.hero_image_url}
                    alt={p.hero_image_alt || ''}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className="blog-card-body">
                {p.display_date && <div className="blog-card-date">{p.display_date}</div>}
                <div className="blog-card-title">{p.title}</div>
                <div className="blog-card-excerpt">{p.excerpt}</div>
                <span className="blog-card-link">Read more →</span>
              </div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <a href="/blog" className="btn-outline-dark">
            View All Articles →
          </a>
        </div>
      </div>
    </section>
  )
}
