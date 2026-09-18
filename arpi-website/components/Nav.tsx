'use client'

import { useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import TopBar from '@/components/TopBar'
import { AXIOM_ENABLED } from '@/lib/flags'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TopBar />

      {/* RSS App ticker — full-width bar above nav */}
      <div
        style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        dangerouslySetInnerHTML={{ __html: '<rssapp-ticker id="_z6e6o2d8DQByeZOn"></rssapp-ticker>' }}
      />
      <Script src="https://widget.rss.app/v1/ticker.js" strategy="afterInteractive" />

      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            {/* Flat mobile logo — visible only on mobile, no badge drop */}
            <a href="/working-home" className="nav-logo-mobile">
              <Image src="/assets/arpi-logo-new.png" alt="ARPI" width={48} height={48} style={{ height: 48, width: 'auto', display: 'block' }} priority />
            </a>

            {/* Badge logo — desktop only */}
            <a href="/working-home" className="nav-logo" style={{ overflow: 'visible', position: 'relative', top: '23px', zIndex: 101 }}>
              <div style={{
                background: '#2a6b54',
                padding: '15px 10px',
                height: '135px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '0 0 4px 4px',
              }}>
                <Image src="/assets/arpi-logo-new.png" alt="ARPI" width={110} height={110} style={{ height: 110, width: 'auto', display: 'block' }} priority />
              </div>
            </a>

            <ul className="nav-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/credentials">Courses &amp; Certifications</a></li>
              <li><a href="/codex">Knowledge Base</a></li>
              {AXIOM_ENABLED && <li><a href="/axiom">AXIOM</a></li>}
              <li><a href="/find-an-advisor">Find an Advisor</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>

            <div className="nav-actions">
              <a href="#" className="nav-login">Log In</a>
              <a href="/enroll" className="nav-enroll">Enroll Now</a>
            </div>

            <button
              className={`nav-hamburger${open ? ' open' : ''}`}
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`nav-mobile${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="container">
          <div className="nav-mobile-inner">
            <ul className="nav-mobile-links">
              <li><a href="/about" onClick={() => setOpen(false)}>About Us</a></li>
              <li><a href="/credentials" onClick={() => setOpen(false)}>Courses &amp; Certifications</a></li>
              <li><a href="/codex" onClick={() => setOpen(false)}>Knowledge Base</a></li>
              {AXIOM_ENABLED && <li><a href="/axiom" onClick={() => setOpen(false)}>AXIOM</a></li>}
              <li><a href="/find-an-advisor" onClick={() => setOpen(false)}>Find an Advisor</a></li>
              <li><a href="/contact" onClick={() => setOpen(false)}>Contact Us</a></li>
            </ul>
            <div className="nav-mobile-actions">
              <a href="#" className="nav-login">Log In</a>
              <a href="/enroll" className="nav-enroll">Enroll Now</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
