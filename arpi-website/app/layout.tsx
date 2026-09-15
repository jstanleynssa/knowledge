import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const GA_ID = 'G-K9PF471K7B'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ARPI — Advanced Retirement Planning Institute',
    template: '%s | ARPI',
  },
  description:
    'Earn your NSSA®, IRMAACP™, or CELP® designation and join a community of trusted financial professionals with lifetime access to annually updated courses.',
  metadataBase: new URL('https://arpinstitute.com'),
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: 'website',
    siteName: 'Advanced Retirement Planning Institute',
    url: 'https://arpinstitute.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        {/* Preconnect to font and analytics origins — eliminates DNS/TCP handshake from critical path */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://widget.rss.app" />
        <link rel="preconnect" href="https://rss.app" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://eqipvrcmugnvkextqmym.supabase.co" />
        <link rel="dns-prefetch" href="https://eqipvrcmugnvkextqmym.supabase.co" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ARPI — Advanced Retirement Planning Institute',
              url: 'https://arpinstitute.com',
              logo: 'https://arpinstitute.com/assets/arpi-logo.png',
              description: 'Professional credentials for financial advisors — NSSA®, IRMAACP™, and CELP®.',
              sameAs: ['https://www.linkedin.com/company/arpinstitute'],
            })
          }}
        />
        {children}

        {/* Google Analytics */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  )
}
