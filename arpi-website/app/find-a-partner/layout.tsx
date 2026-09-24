import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find a Certified End-of-Life Planning Partner',
  description:
    'Find a CELP®-certified financial advisor near you — specialists in end-of-life financial planning, estate coordination, and family financial guidance.',
  keywords: [
    'certified end of life planner near me',
    'CELP certified advisor',
    'end of life financial planner',
    'estate coordination advisor',
    'find retirement planning advisor',
    'CELP partner directory',
  ],
  alternates: { canonical: 'https://arpinstitute.com/find-a-partner' },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'Find a Certified End-of-Life Planning Partner',
    description: 'Find a CELP®-certified financial advisor near you — specialists in end-of-life financial planning, estate coordination, and family financial guidance.',
    url: 'https://arpinstitute.com/find-a-partner',
    images: [{ url: 'https://arpinstitute.com/assets/arpi-logo-new.png', width: 1200, height: 630, alt: 'Find a CELP® Partner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find a Certified End-of-Life Planning Partner',
    description: 'Find a CELP®-certified financial advisor near you.',
    images: ['https://arpinstitute.com/assets/arpi-logo-new.png'],
  },
  robots: { index: true, follow: true },
}

export default function FindAPartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
