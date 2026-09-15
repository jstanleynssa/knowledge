'use client'

import { useState } from 'react'
import { NSSA_PROFESSIONS } from '@/lib/nssa-professions'

// ─── Brand tokens ─────────────────────────────────────────────
const PRIMARY = 'var(--blue-400)'
const DARK = '#0c334c'
const LIGHT = '#d6eaf4'
const MID = '#47a2da'

export default function NssaWhoForInteractive() {
  const [selectedId, setSelectedId] = useState(NSSA_PROFESSIONS[0].id)

  const selected = NSSA_PROFESSIONS.find((p) => p.id === selectedId) ?? NSSA_PROFESSIONS[0]

  return (
    <section className="nwfi-section">
      <div className="container">
        <p className="section-eyebrow">WHO THIS IS FOR</p>
        <h2 className="section-h2">Built for Professionals Like You</h2>
        <p className="section-intro">
          NSSA® is designed for any professional who helps clients navigate retirement — regardless of how you hold your license or what products you offer. If your clients have a Social Security number, you need this credential.
        </p>

        {/* ── Pill row ── */}
        <div className="nwfi-pills" role="tablist" aria-label="Professions">
          {NSSA_PROFESSIONS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === selectedId}
              aria-controls="nwfi-panel"
              onClick={() => setSelectedId(p.id)}
              className={`nwfi-pill${p.id === selectedId ? ' nwfi-pill--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Content panel — key triggers the CSS animation on tab change ── */}
        <div
          id="nwfi-panel"
          role="tabpanel"
          key={selectedId}
          className="nwfi-panel"
        >
          <div className="nwfi-panel-left">
            <h3 className="nwfi-headline">{selected.headline}</h3>
            <p className="nwfi-body">{selected.body}</p>
            <a
              href="/enroll?course=nssa"
              className="nwfi-enroll-btn"
            >
              Enroll as a {selected.label} →
            </a>
          </div>
          <div className="nwfi-panel-right">
            <a
              href={`/credentials/nssa/${selected.id}`}
              className="nwfi-learn-more"
            >
              Learn More about NSSA® for {selected.label} →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Section wrapper ── */
        .nwfi-section {
          padding: 80px 0;
          background: ${LIGHT};
        }

        /* ── Pill row ── */
        .nwfi-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 28px;
        }
        .nwfi-pill {
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
        .nwfi-pill:hover:not(.nwfi-pill--active) {
          background: rgba(12, 51, 76, 0.06);
        }
        .nwfi-pill--active {
          background: ${DARK};
          color: #fff;
          border-color: ${DARK};
        }

        /* ── Content panel ── */
        @keyframes nwfiFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nwfi-panel {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          padding: 40px;
          display: flex;
          gap: 48px;
          align-items: flex-start;
          animation: nwfiFadeUp 0.28s ease-out;
        }
        .nwfi-panel-left {
          flex: 1;
          min-width: 0;
        }
        .nwfi-panel-right {
          display: flex;
          align-items: flex-start;
          flex-shrink: 0;
          padding-top: 4px;
        }

        /* ── Panel content ── */
        .nwfi-headline {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.125rem, 2vw, 1.375rem);
          font-weight: 700;
          color: ${DARK};
          margin: 0 0 14px;
          line-height: 1.3;
        }
        .nwfi-body {
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.75;
          margin: 0 0 28px;
        }
        .nwfi-enroll-btn {
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
        .nwfi-enroll-btn:hover {
          background: ${MID};
          border-color: ${MID};
        }
        .nwfi-learn-more {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${DARK};
          text-decoration: underline;
          text-underline-offset: 3px;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .nwfi-learn-more:hover {
          color: ${MID};
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .nwfi-panel {
            flex-direction: column;
            gap: 28px;
            padding: 28px 24px;
            border-radius: 16px;
          }
          .nwfi-panel-right {
            padding-top: 0;
          }
          .nwfi-enroll-btn {
            white-space: normal;
          }
          .nwfi-learn-more {
            white-space: normal;
          }
        }
        @media (max-width: 540px) {
          .nwfi-section {
            padding: 64px 0;
          }
          .nwfi-pill {
            font-size: 0.8125rem;
            padding: 8px 16px;
          }
        }
      `}</style>
    </section>
  )
}
