import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const BLOG_APP = 'https://blog-ten-rho-41.vercel.app'
    return [
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
        permanent: true,
      },
      {
        source: '/codex/admin/:path*',
        destination: 'https://knowledge.arpinstitute.com/codex/admin/:path*',
        permanent: false,
      },
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
