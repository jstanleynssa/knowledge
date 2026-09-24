import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts, displayDate } from '@/lib/blog-posts'
import type { BlogPost } from '@/lib/blog-types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://arpinstitute.com'

export const metadata: Metadata = {
  title: 'Social Security & Medicare Planning Insights for Financial Advisors',
  description: 'Expert guidance on Social Security claiming strategies, Medicare enrollment, IRMAA planning, and retirement income — from ARPI-certified professionals.',
  keywords: [
    'social security planning blog',
    'Medicare planning insights',
    'IRMAA planning tips',
    'social security claiming strategies',
    'retirement income planning',
    'Medicare enrollment guidance',
    'social security advisor resources',
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'Social Security & Medicare Planning Insights for Financial Advisors',
    description: 'Expert guidance on Social Security claiming strategies, Medicare enrollment, IRMAA planning, and retirement income from ARPI-certified professionals.',
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/assets/arpi-logo-new.png`, width: 1200, height: 630, alt: 'ARPI Blog — Social Security & Medicare Insights' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Security & Medicare Planning Insights for Financial Advisors',
    description: 'Expert guidance on Social Security, Medicare, and IRMAA planning from ARPI-certified professionals.',
    images: [`${SITE_URL}/assets/arpi-logo-new.png`],
  },
  robots: { index: true, follow: true },
}

// Revalidate at most once per hour
export const revalidate = 3600

function PostCard({ post }: { post: BlogPost }) {
  const date = displayDate(post)
  return (
    <article className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {post.hero_image_url && (
        <Link href={`/blog/${post.slug}`} className="block overflow-hidden bg-gray-100 aspect-[16/9]">
          <Image
            src={post.hero_image_url}
            alt={post.hero_image_alt ?? post.title}
            width={800}
            height={450}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
      )}
      <div className="flex flex-col flex-1 p-5">
        {date && (
          <time dateTime={post.legacy_published_at ?? ''} className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {date}
          </time>
        )}
        <h2 className="text-base font-semibold text-gray-900 leading-snug mb-2 group-hover:text-arpi-green transition-colors">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {(post.excerpt ?? post.meta_description) && (
          <p className="text-sm text-gray-600 line-clamp-3 flex-1">
            {post.excerpt ?? post.meta_description}
          </p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 text-xs font-medium text-arpi-green hover:underline"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}

function FeaturedPost({ post }: { post: BlogPost }) {
  const date = displayDate(post)
  return (
    <article className="group grid md:grid-cols-2 gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow mb-10">
      {post.hero_image_url && (
        <Link href={`/blog/${post.slug}`} className="block overflow-hidden bg-gray-100">
          <Image
            src={post.hero_image_url}
            alt={post.hero_image_alt ?? post.title}
            width={900}
            height={600}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority
          />
        </Link>
      )}
      <div className="flex flex-col justify-center p-8">
        <span className="text-xs font-semibold text-nssa-gold uppercase tracking-widest mb-3">
          Latest Post
        </span>
        {date && (
          <time dateTime={post.legacy_published_at ?? ''} className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {date}
          </time>
        )}
        <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-arpi-green transition-colors">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {(post.excerpt ?? post.meta_description) && (
          <p className="text-sm text-gray-600 mb-5 line-clamp-4">
            {post.excerpt ?? post.meta_description}
          </p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-arpi-green hover:underline"
        >
          Read article →
        </Link>
      </div>
    </article>
  )
}

const PAGE_SIZE = 6

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const allPosts = await getAllPosts()
  const [featured, ...remaining] = allPosts

  // Paginate the non-featured posts
  const totalPages = Math.ceil(remaining.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const rest = remaining.slice(start, start + PAGE_SIZE)

  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ padding: '72px 0 64px' }}>
        <div className="container">
          <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
            <div className="hero-eyebrow">Insights</div>
            <h1 style={{ marginBottom: 20 }}>
              Social Security &amp; Medicare Insights
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              Expert guidance from ARPI-certified professionals — Social Security claiming strategy, Medicare enrollment, IRMAA planning, and retirement income.
            </p>
          </div>
        </div>
      </section>

    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Show featured only on page 1 */}
      {page === 1 && featured && <FeaturedPost post={featured} />}

      {/* Post grid */}
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {allPosts.length === 0 && (
        <p className="text-gray-500 text-center py-20">No posts yet.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {page > 1 && (
            <Link
              href={page - 1 === 1 ? '/blog' : `/blog?page=${page - 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
    </>
  )
}
