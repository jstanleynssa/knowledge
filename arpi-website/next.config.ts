import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const BLOG_APP = 'https://blog-ten-rho-41.vercel.app'
    return [
      { source: '/blog/admin',         destination: `${BLOG_APP}/blog/admin/review` },
      { source: '/blog/admin/:path*', destination: `${BLOG_APP}/blog/admin/:path*` },
      { source: '/blog/api/:path*',   destination: `${BLOG_APP}/blog/api/:path*` },
      { source: '/blog/auth/:path*',  destination: `${BLOG_APP}/blog/auth/:path*` },
    ]
  },

  async redirects() {
    return [
      {
        source: '/tools/retirement-advisor-pro',
        destination: '/retirement-advisor-pro',
        statusCode: 301,
      },
      {
        source: '/codex/admin/:path*',
        destination: 'https://knowledge.arpinstitute.com/codex/admin/:path*',
        statusCode: 301,
      },
      // /membership → /enroll (linked from homepage, page doesn't exist)
      { source: '/membership', destination: '/enroll', statusCode: 301 },
      // /find-nssa → /find-an-advisor (legacy NSSA path)
      { source: '/find-nssa', destination: '/find-an-advisor', statusCode: 301 },
      // State browse pages don't exist but are linked from advisor profiles
      { source: '/find-an-advisor/advisors/:state', destination: '/find-an-advisor', statusCode: 301 },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'eqipvrcmugnvkextqmym.supabase.co' },
      { protocol: 'https', hostname: '**.nssapros.com' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
};

export default nextConfig;
