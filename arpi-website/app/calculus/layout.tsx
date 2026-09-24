import type { Metadata } from 'next'

const OG_IMAGE = 'https://arpinstitute.com/assets/calculus-offer.png'

export const metadata: Metadata = {
  title: 'Social Security Breakeven Calculator for Financial Advisors | CALCULUS',
  description:
    'Calculate the exact Social Security breakeven age for any client. Two filing strategies compared side-by-side with SSA Period Life Tables and correct spousal benefit math. Try free for 7 days.',
  keywords: [
    'social security breakeven calculator',
    'social security calculator',
    'social security filing strategy calculator',
    'when to claim social security',
    'social security breakeven age',
    'spousal benefit calculator',
    'social security advisor tool',
    'financial advisor social security software',
  ],
  alternates: { canonical: 'https://arpinstitute.com/calculus' },
  openGraph: {
    type: 'website',
    url: 'https://arpinstitute.com/calculus',
    title: 'Social Security Breakeven Calculator for Financial Advisors | CALCULUS',
    description:
      'Calculate the exact Social Security breakeven age for any client. Two strategies side-by-side. SSA Period Life Tables. Correct spousal math. Try free for 7 days.',
    siteName: 'Advanced Retirement Planning Institute',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'CALCULUS — Social Security Breakeven Calculator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Security Breakeven Calculator for Financial Advisors | CALCULUS',
    description:
      'Calculate the exact Social Security breakeven age for any client. Two filing strategies compared side-by-side. Try free for 7 days.',
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export default function CalculusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
