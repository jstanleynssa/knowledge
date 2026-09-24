import type { Metadata } from 'next'

const OG_IMAGE = 'https://arpinstitute.com/assets/axiom-offer.png'

export const metadata: Metadata = {
  title: { absolute: 'Social Security & Medicare Regulatory Intelligence for Financial Advisors | AXIOM' },
  description:
    'Get instant, citation-backed answers to Social Security and Medicare regulatory questions — grounded in POMS, CFR, CMS, and Medicare.gov. Built for financial advisors. Try free for 7 days.',
  keywords: [
    'social security tool for financial advisors',
    'social security regulation lookup',
    'social security questions answered',
    'Medicare regulation tool',
    'POMS lookup tool',
    'SSA POMS search',
    'social security compliance tool',
    'social security advisor software',
    'Medicare advisor tool',
    'IRMAA regulatory tool',
    'social security CFR lookup',
  ],
  alternates: { canonical: 'https://arpinstitute.com/axiom' },
  openGraph: {
    type: 'website',
    url: 'https://arpinstitute.com/axiom',
    title: 'Social Security & Medicare Regulatory Intelligence for Financial Advisors | AXIOM',
    description:
      'Instant, citation-backed answers to Social Security and Medicare questions — grounded in POMS, CFR, CMS, and Medicare.gov. Try free for 7 days.',
    siteName: 'Advanced Retirement Planning Institute',
    images: [{ url: OG_IMAGE, width: 1280, height: 720, alt: 'AXIOM — Social Security & Medicare Regulatory Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Security & Medicare Regulatory Intelligence for Financial Advisors | AXIOM',
    description:
      'Instant, citation-backed answers to Social Security and Medicare regulatory questions. Every answer grounded in federal law. Try free for 7 days.',
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export default function AxiomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
