import type { Metadata } from 'next'
import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import TrustBar from '@/components/TrustBar'
import ValueSection from '@/components/ValueSection'
import CredentialsSection from '@/components/CredentialsSection'
import BundleSection from '@/components/BundleSection'
import MembershipSection from '@/components/MembershipSection'
import AxiomSection from '@/components/AxiomSection'
import { AXIOM_ENABLED } from '@/lib/flags'
import TestimonialsSection from '@/components/TestimonialsSection'
import CtaBanner from '@/components/CtaBanner'
import BlogSection from '@/components/BlogSection'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ARPI — Advanced Retirement Planning Institute',
  description: 'Earn the NSSA®, IRMAACP™, or CELP® designation. Three rigorous credentials for financial professionals who want to master Social Security, Medicare, and end-of-life planning — and serve every client, at every stage of life.',
}

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <ValueSection />
        <CredentialsSection />
        <BundleSection />
        <MembershipSection />
        {AXIOM_ENABLED && <AxiomSection />}
        <TestimonialsSection />
        <CtaBanner />
        <Suspense fallback={null}>
          <BlogSection />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
