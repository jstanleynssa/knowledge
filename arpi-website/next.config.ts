import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/tools/retirement-advisor-pro',
        destination: '/retirement-advisor-pro',
        permanent: true,
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
