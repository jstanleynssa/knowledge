// Root layout — minimal shell for the knowledge base
// Reference pages are self-contained HTML documents (ReferencePageComponent)
// and don't use this layout. The layout serves the KB index/category pages.
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NSSA Knowledge Base',
  description:
    'Plain-language Social Security and IRMAA reference, verified against SSA POMS and reviewed by subject-matter experts.',
  metadataBase: new URL('https://www.nssapros.com'),
  alternates: {
    canonical: 'https://www.nssapros.com/codex',
  },
  openGraph: {
    type: 'website',
    siteName: 'NSSA Knowledge Base',
    url: 'https://www.nssapros.com/codex',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
