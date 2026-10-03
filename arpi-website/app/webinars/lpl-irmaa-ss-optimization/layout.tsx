import type { Metadata } from 'next'

const OG_IMAGE = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/webinars/irmaa-avoidance-ss-optimization-cover.png'

export const metadata: Metadata = {
  title: { absolute: 'IRMAA Avoidance & Social Security Optimization | ARPI Webinar for LPL Advisors' },
  description: 'Watch the recording from our webinar on IRMAA avoidance and Social Security optimization with Tom Hegna, Todd Valles, and Jim Blair — with exclusive pricing for LPL Financial advisors.',
  alternates: { canonical: 'https://arpinstitute.com/webinars/lpl-irmaa-ss-optimization' },
  openGraph: {
    type: 'website',
    url: 'https://arpinstitute.com/webinars/lpl-irmaa-ss-optimization',
    title: 'IRMAA Avoidance & Social Security Optimization | ARPI Webinar for LPL Advisors',
    description: 'Watch the recording from our webinar with Tom Hegna, Todd Valles, and Jim Blair — exclusive pricing for LPL Financial advisors.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    siteName: 'Advanced Retirement Planning Institute',
  },
  robots: { index: true, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
