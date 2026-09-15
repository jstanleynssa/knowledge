'use client'

import { useState } from 'react'
import { PROFESSIONS } from '@/lib/celp-professions'

export default function WhoForInteractive() {
  const [selectedId, setSelectedId] = useState(PROFESSIONS[0].id)

  const selected = PROFESSIONS.find((p) => p.id === selectedId) ?? PROFESSIONS[0]

  return (
    <section className="wfi-section">
      <div className="container">
        <p className="section-eyebrow">WHO THIS IS FOR</p>
        <h2 className="section-h2">Built for a Wide Range of Professionals</h2>
        <p className="section-intro">
          CELP® is the only credential designed for professionals across multiple disciplines
          who all touch end-of-life planning — financial, legal, medical, and care. If your
          clients are aging, this credential is for you.
        </p>

        {/* ── Pill row ── */}
        <div className="wfi-pills" role="tablist" aria-label="Professions">
          {PROFESSIONS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === selectedId}
              aria-controls="wfi-panel"
              onClick={() => setSelectedId(p.id)}
              className={`wfi-pill${p.id === selectedId ? ' wfi-pill--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Content panel — key triggers the CSS animation on tab change ── */}
        <div
          id="wfi-panel"
          role="tabpanel"
          key={selectedId}
          className="wfi-panel"
        >
          <div className="wfi-panel-left">
            <h3 className="wfi-headline">{selected.headline}</h3>
            <p className="wfi-body">{selected.body}</p>
            <a
              href="/credentials/celp#apply"
              className="wfi-enroll-btn"
            >
              Apply for Consideration →
            </a>
          </div>
          <div className="wfi-panel-right">
            <a
              href={`/credentials/celp/${selected.id}`}
              className="wfi-learn-more"
            >
              Learn More about CELP® for {selected.label} →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Section wrapper ── */
        .wfi-section {
          padding: 80px 0;
          background: var(--green-xlight);
        }

        /* ── Pill row ── */
        .wfi-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 28px;
        }
        .wfi-pill {
          display: inline-block;
          padding: 9px 20px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid var(--green-dark);
          background: #fff;
          color: var(--green-dark);
          transition: background 0.16s, color 0.16s, border-color 0.16s;
          line-height: 1.4;
          font-family: inherit;
        }
        .wfi-pill:hover:not(.wfi-pill--active) {
          background: var(--green-xlight);
        }
        .wfi-pill--active {
          background: var(--green-dark);
          color: #fff;
          border-color: var(--green-dark);
        }

        /* ── Content panel ── */
        @keyframes wfiFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wfi-panel {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          padding: 40px;
          display: flex;
          gap: 48px;
          align-items: flex-start;
          animation: wfiFadeUp 0.28s ease-out;
        }
        .wfi-panel-left {
          flex: 1;
          min-width: 0;
        }
        .wfi-panel-right {
          display: flex;
          align-items: flex-start;
          flex-shrink: 0;
          padding-top: 4px;
        }

        /* ── Panel content ── */
        .wfi-headline {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.125rem, 2vw, 1.375rem);
          font-weight: 700;
          color: var(--green-900);
          margin: 0 0 14px;
          line-height: 1.3;
        }
        .wfi-body {
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.75;
          margin: 0 0 28px;
        }
        .wfi-enroll-btn {
          display: inline-block;
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 700;
          text-decoration: none;
          color: #fff;
          background: var(--green-dark);
          border: 2px solid var(--green-dark);
          transition: background 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .wfi-enroll-btn:hover {
          background: var(--green-900);
          border-color: var(--green-900);
        }
        .wfi-learn-more {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--green-dark);
          text-decoration: underline;
          text-underline-offset: 3px;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .wfi-learn-more:hover {
          color: var(--green-900);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .wfi-panel {
            flex-direction: column;
            gap: 28px;
            padding: 28px 24px;
            border-radius: 16px;
          }
          .wfi-panel-right {
            padding-top: 0;
          }
          .wfi-enroll-btn {
            white-space: normal;
          }
          .wfi-learn-more {
            white-space: normal;
          }
        }
        @media (max-width: 540px) {
          .wfi-section {
            padding: 64px 0;
          }
          .wfi-pill {
            font-size: 0.8125rem;
            padding: 8px 16px;
          }
        }
      `}</style>
    </section>
  )
}
