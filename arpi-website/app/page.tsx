import type { Metadata } from 'next'
export { default } from './_coming-soon'

export const metadata: Metadata = {
  title: { absolute: 'Social Security, Medicare & Retirement Planning Certifications for Financial Advisors | ARPI' },
  description: 'Earn the NSSA®, IRMAACP™, or CELP® designation — rigorous credentials for financial professionals specializing in Social Security, Medicare, IRMAA, and retirement planning. Trusted by 5,000+ advisors nationwide.',
  keywords: [
    'social security certification financial advisors',
    'Medicare certification financial advisors',
    'retirement planning certification',
    'IRMAA certification',
    'social security training',
    'social security course financial advisors',
    'Medicare training financial professionals',
    'retirement planning course',
    'NSSA certification',
    'IRMAACP certification',
  ],
  alternates: { canonical: 'https://arpinstitute.com' },
  openGraph: {
    type: 'website',
    title: 'Social Security, Medicare & Retirement Planning Certifications for Financial Advisors | ARPI',
    description: 'Earn the NSSA®, IRMAACP™, or CELP® designation — rigorous credentials for financial professionals specializing in Social Security, Medicare, IRMAA, and retirement planning.',
    url: 'https://arpinstitute.com',
    images: [{ url: 'https://arpinstitute.com/assets/arpi-logo-new.png', width: 1200, height: 630, alt: 'ARPI — Advanced Retirement Planning Institute' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Security, Medicare & Retirement Planning Certifications for Financial Advisors | ARPI',
    description: 'Earn the NSSA®, IRMAACP™, or CELP® designation. Rigorous credentials for financial advisors specializing in Social Security, Medicare, and IRMAA.',
    images: ['https://arpinstitute.com/assets/arpi-logo-new.png'],
  },
  robots: { index: true, follow: true },
}
