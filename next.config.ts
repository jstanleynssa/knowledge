import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reference pages are pure SSG: no client JS, immutable after publish.
  // The API route (/api/publish-webhook) needs server runtime → can't use output:'export'.
  // Vercel handles SSG pages natively without full static export.

  // Disable x-powered-by header (clean responses)
  poweredByHeader: false,

  // Strict headers for security
  async headers() {
    return [
      {
        // Immutable cache for static assets
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Reference pages: 1-hour CDN, 7-day stale-while-revalidate
        source: '/(social-security|irmaa)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=604800' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
