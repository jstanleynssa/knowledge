'use client'

import { useState } from 'react'

const NAV = [
  { label: 'About Us',                 href: 'https://www.nssapros.com/about' },
  { label: 'Social Security Training', href: 'https://www.nssapros.com/social-security-training' },
  { label: 'IRMAA Medicare Training',  href: 'https://www.nssapros.com/irmaa-medicare-training-course' },
  { label: 'Find an Advisor',          href: 'https://www.nssapros.com/directory' },
  { label: 'Contact Us',               href: 'https://www.nssapros.com/contact' },
  { label: 'Log In',                   href: 'https://www.nssapros.com/login' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Logo */}
        <a href="https://www.nssapros.com" style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/blog/nssa-logo.png"
            alt="NSSA Professionals"
            style={{ height: 40, width: 'auto', display: 'block' }}
          />
        </a>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {NAV.map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontSize: 14, color: '#4b5563', textDecoration: 'none', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#13405E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          style={{ display: 'none', padding: 8, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
          className="kb-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ borderTop: '1px solid #f3f4f6', background: '#fff', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ padding: '10px 12px', borderRadius: 8, fontSize: 14, color: '#374151', textDecoration: 'none', display: 'block' }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .kb-hamburger { display: block !important; }
          nav { display: none !important; }
        }
      `}</style>
    </header>
  )
}
