import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact ARPI',
  description:
    'Get in touch with the Advanced Retirement Planning Institute — questions about NSSA®, IRMAACP™, or CELP® credentials, CE credits, institutional partnerships, or team access.',
  keywords: [
    'contact ARPI',
    'NSSA certification contact',
    'retirement planning credentials inquiry',
    'social security training contact',
  ],
  alternates: { canonical: 'https://arpinstitute.com/contact' },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'Contact ARPI',
    description: 'Get in touch with ARPI — questions about credentials, CE credits, or institutional partnerships.',
    url: 'https://arpinstitute.com/contact',
  },
  robots: { index: true, follow: true },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
