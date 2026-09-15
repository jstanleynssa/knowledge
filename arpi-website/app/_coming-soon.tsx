import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon — ARPI',
  description:
    'The Advanced Retirement Planning Institute is launching soon. Rigorous credentials, active community, and continuously updated expertise for financial professionals.',
}

export default function ComingSoon() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#111827',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Top accent line */}
      <div style={{ height: '3px', background: 'var(--green-mid)', flexShrink: 0 }} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Link href="/working-home" style={{ marginBottom: '32px', display: 'block' }}>
          <Image
            src="/assets/arpi-logo-white-notext.png"
            alt="ARPI"
            width={72}
            height={72}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>

        {/* Brand name */}
        <p
          style={{
            fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--green-mid)',
            marginBottom: '40px',
          }}
        >
          Advanced Retirement Planning Institute
        </p>

        {/* Accent divider */}
        <div
          style={{
            width: '48px',
            height: '3px',
            background: 'var(--green-mid)',
            marginBottom: '40px',
          }}
        />

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-merriweather), Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: '24px',
            maxWidth: '640px',
          }}
        >
          Something Exceptional
          <br />
          Is Coming
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '1.05rem',
            color: '#9ca3af',
            lineHeight: 1.75,
            maxWidth: '520px',
            marginBottom: '0px',
          }}
        >
          We&rsquo;re putting the finishing touches on a new home for the most rigorous
          retirement planning credentials in the profession.
        </p>


      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            color: '#6b7280',
          }}
        >
          © {new Date().getFullYear()} Advanced Retirement Planning Institute. All rights reserved.
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <span style={{ color: '#4b5563' }}>FINRA-Recognized Designations</span>
        </p>
      </footer>
    </main>
  )
}
