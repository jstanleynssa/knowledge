'use client'

import { useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import TopBar from '@/components/TopBar'

const ICON_SIZE = 36

function ChevronDown({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className="nav-dropdown-chevron"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function Nav() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  return (
    <>
      <TopBar />

      <div
        className="rss-ticker-bar"
        style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        dangerouslySetInnerHTML={{ __html: '<rssapp-ticker id="_z6e6o2d8DQByeZOn"></rssapp-ticker>' }}
      />
      <Script src="https://widget.rss.app/v1/ticker.js" strategy="afterInteractive" />

      <nav className="nav">
        <div className="container">
          <div className="nav-inner">

            {/* Mobile logo */}
            <a href="/working-home" className="nav-logo-mobile">
              <Image src="/assets/arpi-logo-mobile.png" alt="ARPI" width={734} height={100}
                style={{ height: 32, width: 'auto', maxWidth: 220, display: 'block' }} priority />
            </a>

            {/* Desktop badge logo */}
            <a href="/working-home" className="nav-logo"
              style={{ overflow: 'visible', position: 'relative', top: '23px', zIndex: 101 }}>
              <div style={{
                background: '#2a6b54', padding: '15px 10px', height: '135px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, borderRadius: '0 0 4px 4px',
              }}>
                <Image src="/assets/arpi-logo-new.png" alt="ARPI" width={110} height={110}
                  style={{ height: 110, width: 'auto', display: 'block' }} priority />
              </div>
            </a>

            <ul className="nav-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/credentials">Courses &amp; Certifications</a></li>
              <li><a href="/codex">Knowledge Base</a></li>

              {/* Tools dropdown */}
              <li className="nav-has-dropdown">
                <span className="nav-dropdown-trigger">
                  Tools <ChevronDown />
                </span>
                <div className="nav-dropdown-panel">
                  <a href="/axiom" className="nav-dropdown-item">
                    <div className="nav-dropdown-icon" style={{ background: 'transparent' }}>
                      <Image src="/assets/axiom-round-icon.png" alt="" width={ICON_SIZE} height={ICON_SIZE} style={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div className="nav-dropdown-label">AXIOM®</div>
                      <div className="nav-dropdown-desc">Social Security &amp; Medicare answers cited to federal law</div>
                    </div>
                  </a>
                  <a href="/calculus" className="nav-dropdown-item">
                    <div className="nav-dropdown-icon" style={{ background: 'transparent' }}>
                      <Image src="/assets/calculus-round-icon.png" alt="" width={ICON_SIZE} height={ICON_SIZE} style={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div className="nav-dropdown-label">CALCULUS</div>
                      <div className="nav-dropdown-desc">Social Security breakeven calculator with spousal math</div>
                    </div>
                  </a>
                  <a href="/retirement-advisor-pro" className="nav-dropdown-item">
                    <div className="nav-dropdown-icon" style={{ background: 'transparent' }}>
                      <Image src="/assets/rap-round-icon.png" alt="" width={ICON_SIZE} height={ICON_SIZE} style={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div className="nav-dropdown-label">Retirement Advisor Pro</div>
                      <div className="nav-dropdown-desc">Full IRMAA, SS &amp; Roth conversion planning software</div>
                    </div>
                  </a>
                </div>
              </li>

              <li><a href="/find-an-advisor">Find an Advisor</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>

            <div className="nav-actions">
              <a href="#" className="nav-login">Log In</a>
              <a href="/enroll" className="nav-enroll">Enroll Now</a>
            </div>

            <button
              className={`nav-hamburger${menuOpen ? ' open' : ''}`}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`nav-mobile${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="container">
          <div className="nav-mobile-inner">
            <ul className="nav-mobile-links">
              <li><a href="/about" onClick={() => setMenuOpen(false)}>About Us</a></li>
              <li><a href="/credentials" onClick={() => setMenuOpen(false)}>Courses &amp; Certifications</a></li>
              <li><a href="/codex" onClick={() => setMenuOpen(false)}>Knowledge Base</a></li>

              {/* Tools accordion */}
              <li style={{ padding: 0 }}>
                <button
                  className="nav-mobile-group-toggle"
                  onClick={() => setToolsOpen(!toolsOpen)}
                  aria-expanded={toolsOpen}
                >
                  Tools
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: toolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.6 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className={`nav-mobile-sublinks${toolsOpen ? ' open' : ''}`}>
                  <a href="/axiom" onClick={() => setMenuOpen(false)}>AXIOM® — Social Security Answers</a>
                  <a href="/calculus" onClick={() => setMenuOpen(false)}>CALCULUS — Breakeven Calculator</a>
                  <a href="/retirement-advisor-pro" onClick={() => setMenuOpen(false)}>Retirement Advisor Pro</a>
                </div>
              </li>

              <li><a href="/find-an-advisor" onClick={() => setMenuOpen(false)}>Find an Advisor</a></li>
              <li><a href="/contact" onClick={() => setMenuOpen(false)}>Contact Us</a></li>
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
