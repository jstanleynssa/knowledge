/**
 * robots.txt — allow all crawlers including AI indexers
 * Served at /robots.txt by Next.js
 */
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard crawlers + AI indexers: all allowed, full access
      {
        userAgent: [
          '*',
          'GPTBot',
          'ClaudeBot',
          'PerplexityBot',
          'OAI-SearchBot',
          'Google-Extended',
          'anthropic-ai',
          'cohere-ai',
        ],
        allow: '/',
      },
    ],
    sitemap: 'https://knowledge.nssapros.com/sitemap.xml',
    host: 'https://knowledge.nssapros.com',
  };
}
