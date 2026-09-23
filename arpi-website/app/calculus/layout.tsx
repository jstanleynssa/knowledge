import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CALCULUS — Social Security Breakeven Calculator for Financial Advisors',
  description:
    'Compare two Social Security filing strategies side-by-side. SSA Period Life Tables built in. Correct spousal benefit math. Save unlimited client scenarios and print PDF output.',
  alternates: { canonical: 'https://arpinstitute.com/calculus' },
  openGraph: {
    type: 'website',
    url: 'https://arpinstitute.com/calculus',
    title: 'CALCULUS — Social Security Breakeven Calculator',
    description:
      'Purpose-built for financial advisors. Two strategies, side-by-side. SSA life tables. Correct spousal math. Save and print every scenario.',
    siteName: 'Advanced Retirement Planning Institute',
  },
}

export default function CalculusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
