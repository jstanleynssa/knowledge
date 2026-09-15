'use client'

import { useState } from 'react'
import { IRMAACP_PROFESSIONS } from '@/lib/irmaacp-professions'

// ─── Brand tokens ─────────────────────────────────────────────
const DARK = '#7f1424'
const LIGHT = '#f0d4d8'
const MID = '#c13e4e'
const ACCENT = '#b02a34'

export default function IrmaacpWhoForInteractive() {
  const [selectedId, setSelectedId] = useState(IRMAACP_PROFESSIONS[0].id)

  const selected = IRMAACP_PROFESSIONS.find((p) => p.id === selectedId) ?? IRMAACP_PROFESSIONS[0]

  return (
    <section className="iwfi-section">
      <div className="container">
        <p className="section-eyebrow">WHO THIS IS FOR</p>
        <h2 className="section-h2">Built for Professionals Like You</h2>
        <p className="section-intro">
          If you work with pre-retirees, retirees, or high-income earners, IRMAA is already in your client relationships — whether you know it or not. IRMAACP™ gives you the expertise to make it a service line.
        </p>

        {/* ── Pill row ── */}
        <div className="iwfi-pills" role="tablist" aria-label="Professions">
          {IRMAACP_PROFESSIONS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === selectedId}
              aria-controls="iwfi-panel"
              onClick={() => setSelectedId(p.id)}
              className={`iwfi-pill${p.id === selectedId ? ' iwfi-pill--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Content panel — key triggers the CSS animation on tab change ── */}
        <div
          id="iwfi-panel"
          role="tabpanel"
          key={selectedId}
          className="iwfi-panel"
        >
          <div className="iwfi-panel-left">
            <h3 className="iwfi-headline">{selected.headline}</h3>
            <p className="iwfi-body">{selected.body}</p>
            <a
              href="/enroll?course=irmaacp"
              className="iwfi-enroll-btn"
            >
              Enroll as a {selected.label} →
            </a>
          </div>
          <div className="iwfi-panel-right">
            <a
              href={`/credentials/irmaacp/${selected.id}`}
              className="iwfi-learn-more"
            >
              Learn More about IRMAACP™ for {selected.label} →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Section wrapper ── */
        .iwfi-section {
          padding: 80px 0;
          background: ${LIGHT};
        }

        /* ── Pill row ── */
        .iwfi-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 28px;
        }
        .iwfi-pill {
          display: inline-block;
          padding: 9px 20px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid ${DARK};
          background: #fff;
          color: ${DARK};
          transition: background 0.16s, color 0.16s, border-color 0.16s;
          line-height: 1.4;
          font-family: inherit;
        }
        .iwfi-pill:hover:not(.iwfi-pill--active) {
          background: rgba(127, 20, 36, 0.06);
        }
        .iwfi-pill--active {
          background: ${DARK};
          color: #fff;
          border-color: ${DARK};
        }

        /* ── Content panel ── */
        @keyframes iwfiFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .iwfi-panel {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          padding: 40px;
          display: flex;
          gap: 48px;
          align-items: flex-start;
          animation: iwfiFadeUp 0.28s ease-out;
          border-top: 4px solid ${ACCENT};
        }
        .iwfi-panel-left {
          flex: 1;
          min-width: 0;
        }
        .iwfi-panel-right {
          display: flex;
          align-items: flex-start;
          flex-shrink: 0;
          padding-top: 4px;
        }

        /* ── Panel content ── */
        .iwfi-headline {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.125rem, 2vw, 1.375rem);
          font-weight: 700;
          color: ${DARK};
          margin: 0 0 14px;
          line-height: 1.3;
        }
        .iwfi-body {
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.75;
          margin: 0 0 28px;
        }
        .iwfi-enroll-btn {
          display: inline-block;
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 700;
          text-decoration: none;
          color: #fff;
          background: ${DARK};
          border: 2px solid ${DARK};
          transition: background 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .iwfi-enroll-btn:hover {
          background: ${MID};
          border-color: ${MID};
        }
        .iwfi-learn-more {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${DARK};
          text-decoration: underline;
          text-underline-offset: 3px;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .iwfi-learn-more:hover {
          color: ${MID};
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .iwfi-panel {
            flex-direction: column;
            gap: 28px;
            padding: 28px 24px;
            border-radius: 16px;
          }
          .iwfi-panel-right {
            padding-top: 0;
          }
          .iwfi-enroll-btn {
            white-space: normal;
          }
          .iwfi-learn-more {
            white-space: normal;
          }
        }
        @media (max-width: 540px) {
          .iwfi-section {
            padding: 64px 0;
          }
          .iwfi-pill {
            font-size: 0.8125rem;
            padding: 8px 16px;
          }
        }
      `}</style>
    </section>
  )
}
