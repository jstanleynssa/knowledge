import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { getAllPosts, getPostBySlug, getRelatedPosts, displayDate, isoDate, postUrl, seoTitle, seoDescription } from '@/lib/blog-posts'
import type { BlogPost } from '@/lib/blog-types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://arpinstitute.com'

/**
 * Strip all Kajabi artifacts from body_mdx.
 * Returns { body, disclaimer } — disclaimer is any trailing italic
 * paragraph pulled out for rendering separately below the post.
 */
function cleanBody(mdx: string): { body: string; disclaimer: string | null } {
  const lines = mdx.split('\n')
  let i = 0

  // ── Leading artifacts ───────────────────────────────────────────────────
  if (lines[i]?.startsWith('# ')) i++
  if (lines[i] === '') i++
  if (lines[i]?.includes('/blog?tag=')) i++
  if (lines[i] === '') i++
  if (lines[i]?.startsWith('![')) i++
  if (lines[i] === '') i++

  let body = lines.slice(i).join('\n').trim()

  // ── Trailing Kajabi artifacts ──────────────────────────────────────────────
  body = body.replace(/\n{1,3}#{1,6}\s*Find [aA] NSSA[\s\S]*$/, '').trim()
  const catIdx = body.search(/\n+Categories\n/)
  if (catIdx !== -1) body = body.slice(0, catIdx).trim()
  const followIdx = body.search(/\n+Follow Us\n/)
  if (followIdx !== -1) body = body.slice(0, followIdx).trim()

  // ── Extract trailing italic disclaimer ───────────────────────────────────────
  // Match a trailing paragraph that is entirely italic (_..._) — typical
  // for educational/legal disclaimers added by NSSA authors.
  let disclaimer: string | null = null
  const discMatch = body.match(/\n\n(_[^\n]{20,}_)\s*$/)
  if (discMatch) {
    disclaimer = discMatch[1].replace(/^_|_$/g, '').trim()
    body = body.slice(0, body.length - discMatch[0].length).trim()
  }

  return { body, disclaimer }
}

// ── Static generation ──────────────────────────────────────────────────────
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export const dynamic = 'force-dynamic'

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }

  const canonical = postUrl(post.slug)
  const title = seoTitle(post)
  const description = seoDescription(post)
  const iso = isoDate(post)

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: iso || undefined,
      images: post.hero_image_url
        ? [{ url: post.hero_image_url, alt: post.hero_image_alt ?? title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.hero_image_url ? [post.hero_image_url] : [],
    },
  }
}

// ── JSON-LD ────────────────────────────────────────────────────────────────
function buildJsonLd(post: BlogPost) {
  const iso = isoDate(post)
  const wordCount = post.body_mdx
    ? post.body_mdx.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).length
    : undefined

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': postUrl(post.slug),
    url: postUrl(post.slug),
    headline: seoTitle(post),
    description: seoDescription(post),
    datePublished: iso,
    dateModified: post.content_updated_at ?? post.updated_at ?? iso,
    ...(wordCount ? { wordCount } : {}),
    image: post.hero_image_url
      ? { '@type': 'ImageObject', url: post.hero_image_url, width: 1200, height: 630 }
      : undefined,
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Advanced Retirement Planning Institute',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Advanced Retirement Planning Institute',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/blog/nssa-logo.png',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post.slug) },
    keywords: post.categories?.map(c => c.name).join(', '),
    isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog`, name: 'ARPI Blog' },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl(post.slug) },
    ],
  }

  return [articleLd, breadcrumbLd]
}

// ── Smart CTA ─────────────────────────────────────────────────────────────
const IRMAA_CATEGORY_SLUGS = new Set(['irmaa','medicare','medicare-advantage','original-medicare','part-b','premiums'])
const IRMAA_CATEGORY_NAMES = new Set(['irmaa','medicare','medicare advantage','original medicare','part b','premiums'])

type CTAVariant = 'irmaa' | 'ss' | 'default'

function detectVariant(_post: BlogPost): CTAVariant {
  // Always use the default unified CTA — covers both SS and IRMAA certifications
  return 'default'
}

const CTA_CONTENT = {
  irmaa: {
    eyebrow:  'Medicare & IRMAA planning',
    heading:  'Work with an IRMAACP™-Certified Advisor',
    body:     'IRMAA surcharges can add thousands to your Medicare costs each year. An IRMAACP™-certified advisor knows the strategies to manage your MAGI, appeal determinations, and plan ahead for each bracket tier.',
    btn:      'Find a Medicare Specialist →',
    href:     '/find-an-advisor',
  },
  ss: {
    eyebrow:  'Social Security strategy',
    heading:  'Work with an NSSA®-Certified Advisor',
    body:     'The difference between a good and great Social Security claiming strategy can be worth tens of thousands of dollars. An NSSA®-certified advisor helps you find it.',
    btn:      'Find a Social Security Specialist →',
    href:     '/find-an-advisor',
  },
  default: {
    eyebrow:  'Work with a specialist',
    heading:  'Find an NSSA®-Certified Advisor Near You',
    body:     'Every advisor in our directory is certified in Social Security, Medicare planning, or both — trained to help you maximize your benefits and minimize costly mistakes.',
    btn:      'Search the Directory →',
    href:     '/find-an-advisor',
  },
} satisfies Record<CTAVariant, { eyebrow: string; heading: string; body: string; btn: string; href: string }>

const CTA_STYLES: Record<CTAVariant, { aside: string; eyebrow: string; body: string; btn: string }> = {
  irmaa: {
    aside:   'bg-nssa-red-900',
    eyebrow: 'text-nssa-red-300',
    body:    'text-nssa-red-100',
    btn:     'bg-nssa-red-500 hover:bg-nssa-red-400',
  },
  ss: {
    aside:   'bg-nssa-blue-900',
    eyebrow: 'text-nssa-blue-300',
    body:    'text-nssa-blue-100',
    btn:     'bg-nssa-blue-500 hover:bg-nssa-blue-400',
  },
  default: {
    aside:   'bg-nssa-navy',
    eyebrow: 'text-nssa-blue-300',
    body:    'text-nssa-blue-100',
    btn:     'bg-nssa-blue-500 hover:bg-nssa-blue-400',
  },
}

function AdvisorCTA({ post }: { post: BlogPost }) {
  const variant = detectVariant(post)
  const cta = CTA_CONTENT[variant]
  const styles = CTA_STYLES[variant]
  return (
    <aside className={`my-10 rounded-xl text-white p-6 sm:p-8 ${styles.aside}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${styles.eyebrow}`}>
            {cta.eyebrow}
          </p>
          <h3 className="text-lg font-bold mb-2">{cta.heading}</h3>
          <p className={`text-sm leading-relaxed ${styles.body}`}>{cta.body}</p>
        </div>
        <a
          href={cta.href}
          className={`flex-shrink-0 text-white font-semibold text-sm px-6 py-3 rounded-lg transition text-center ${styles.btn}`}
        >
          {cta.btn}
        </a>
      </div>
    </aside>
  )
}

// ── Time-bound banner ──────────────────────────────────────────────────────
function TimeBoundBanner({ post }: { post: BlogPost }) {
  if (!post.is_time_bound) return null
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      <strong>Note:</strong> This article contains time-sensitive information
      {post.as_of_date ? ` as of ${new Date(post.as_of_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : ''}.
      Figures such as IRMAA brackets, Part B premiums, and benefit amounts change annually.{' '}
      <a href="https://arpinstitute.com/codex" className="underline font-medium">
        See current figures →
      </a>
    </div>
  )
}

// ── Superseded banner ─────────────────────────────────────────────────────
function SupersededBanner({ post }: { post: BlogPost }) {
  if (!post.is_superseded) return null
  const note = post.superseded_note?.trim() ||
    'The rules or provisions described in this article have changed. This post is kept for historical reference only.'
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <div className="flex gap-2">
        <span className="text-base leading-none mt-0.5">⚠️</span>
        <div>
          <strong className="font-semibold">This information may no longer apply.</strong>{' '}
          {note}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const date = displayDate(post)
  const iso  = isoDate(post)
  const jsonLdArray = buildJsonLd(post)
  const related = await getRelatedPosts(post, 3)
  const { body: cleanedBody, disclaimer } = cleanBody(post.body_mdx ?? '')

  return (
    <>
      {jsonLdArray.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex gap-1.5 items-center">
          <a href="https://arpinstitute.com" className="hover:text-arpi-green">ARPI</a>
          <span>/</span>
          <a href={`${SITE_URL}/blog`} className="hover:text-arpi-green">Blog</a>
          <span>/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </nav>

        {/* Categories hidden — Kajabi import tags are too noisy */}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Dek / subtitle */}
        {post.dek && (
          <p className="text-lg text-gray-600 mb-4 leading-relaxed">{post.dek}</p>
        )}

        {/* Byline */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <div className="w-9 h-9 rounded-full bg-arpi-green flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AR
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">ARPI Editorial Team</p>
            {date && (
              <time dateTime={iso} className="text-xs text-gray-400">{date}</time>
            )}
          </div>
        </div>

        {/* Hero image */}
        {post.hero_image_url && (
          <div className="mb-8 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={post.hero_image_url}
              alt={post.hero_image_alt ?? post.title}
              width={900}
              height={500}
              sizes="(max-width: 768px) 100vw, 900px"
              className="w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Superseded warning */}
        <SupersededBanner post={post} />

        {/* Time-bound warning */}
        <TimeBoundBanner post={post} />

        {/* Body */}
        <div className="prose prose-lg prose-gray max-w-none
          prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-1
          prose-h2:mt-7 prose-h3:mt-5
          prose-a:text-arpi-green prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-blockquote:border-nssa-navy prose-blockquote:text-gray-600
          prose-code:text-arpi-green prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded
          prose-img:rounded-lg">
          {post.body_md_published ? (
            // Edited HTML from rich text editor
            <div dangerouslySetInnerHTML={{ __html: post.body_md_published }} />
          ) : cleanedBody ? (
            // Original markdown from Kajabi import
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({ src, alt, ...props }) => {
                  const srcStr = typeof src === 'string' ? src : ''
                  if (srcStr.includes('kajabi-cdn.com') || srcStr.includes('kajabi-storefronts')) return null
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={src} alt={alt ?? ''} {...props} className="rounded-lg w-full" />
                },
              }}
            >
              {cleanedBody}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">Content not available.</p>
          )}
        </div>

        {/* CTA — replaces Kajabi sidebar */}
        <AdvisorCTA post={post} />

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 mb-5">More from ARPI</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map(rel => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group flex flex-col gap-2"
                >
                  {rel.hero_image_url && (
                    <div className="overflow-hidden rounded-lg bg-gray-100 aspect-[16/9]">
                      <Image
                        src={rel.hero_image_url}
                        alt={rel.hero_image_alt ?? rel.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-900 group-hover:text-arpi-green leading-snug line-clamp-2 transition-colors">
                    {rel.title}
                  </p>
                  <p className="text-xs text-gray-400">{displayDate(rel)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back link + disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-arpi-green hover:underline font-medium">
            ← Back to all posts
          </Link>
          <p className="mt-6 text-xs text-gray-400 leading-relaxed">
            The content on this blog is for informational purposes only and is not legal, financial, or professional advice. Social Security and Medicare rules change periodically, so some information may become outdated. For the most accurate advice, consult a certified National Social Security Advisor (NSSA®) or IRMAACP™-credentialed advisor. Social Security Professionals, LLC, NSSA®, and the Advanced Retirement Planning Institute (ARPI) are not responsible for any errors, omissions, or actions taken based on this blog's content. Use of this blog does not create a client relationship, and all information is provided "as is" without guarantees. By using this blog, you agree to hold Social Security Professionals, LLC, NSSA®, and ARPI harmless from any claims or liabilities arising from its content. For personalized guidance, connect with an ARPI-credentialed professional.
          </p>
        </div>
      </article>
    </>
  )
}
