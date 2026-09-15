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
  title: 'About Us',
  description:
    'ARPI was built by Social Security and Medicare experts to give financial professionals the rigorous credentials and tools they need to serve clients with confidence.',
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
