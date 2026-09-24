import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import CtaBanner from '@/components/CtaBanner'
import AboutHero from '@/components/about/AboutHero'
import AboutStats from '@/components/about/AboutStats'
import MissionSection from '@/components/about/MissionSection'
import HistorySection from '@/components/about/HistorySection'
import TeamSection from '@/components/about/TeamSection'

export const metadata: Metadata = {
  title: 'About ARPI — Advanced Retirement Planning Institute',
  description:
    'ARPI was built by Social Security and Medicare experts to give financial professionals the rigorous credentials and tools they need to serve clients with confidence. Learn about our team, mission, and the credentials we offer.',
  keywords: [
    'Advanced Retirement Planning Institute',
    'ARPI about',
    'social security training organization',
    'Medicare certification organization',
    'retirement planning credentials',
    'NSSA IRMAACP CELP',
  ],
  alternates: { canonical: 'https://arpinstitute.com/about' },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    title: 'About ARPI — Advanced Retirement Planning Institute',
    description: 'Built by Social Security and Medicare experts to give financial professionals the rigorous credentials and tools they need to serve clients with confidence.',
    url: 'https://arpinstitute.com/about',
    images: [{ url: 'https://arpinstitute.com/assets/arpi-logo-new.png', width: 1200, height: 630, alt: 'About ARPI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About ARPI — Advanced Retirement Planning Institute',
    description: 'Built by Social Security and Medicare experts to give financial professionals the rigorous credentials and tools they need.',
    images: ['https://arpinstitute.com/assets/arpi-logo-new.png'],
  },
  robots: { index: true, follow: true },
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        <AboutHero />
        <AboutStats />
        <MissionSection />
        <HistorySection />
        <TeamSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}
