import { type Metadata } from 'next'
import EnrollClient from './EnrollClient'
import { fmt, SAVINGS_3 } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Enroll — Choose Your ARPI Credentials',
  description:
    `Build your ARPI credential package. Select NSSA®, IRMAACP™, and/or CELP® — bundle pricing applies automatically and saves you up to ${fmt(SAVINGS_3)} vs. individual enrollment.`,
}

type Props = {
  searchParams: Promise<{ course?: string; bundle?: string }>
}

export default async function EnrollPage({ searchParams }: Props) {
  const { course, bundle } = await searchParams
  return (
    <EnrollClient
      defaultCourse={course}
      pickTwo={bundle === '2'}
    />
  )
}
