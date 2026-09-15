'use client'

import { useState } from 'react'
import { REFERRAL_PARTNERS } from '@/lib/celp-referral-partners'

export default function ReferralInteractive() {
  const [selectedId, setSelectedId] = useState(REFERRAL_PARTNERS[0].id)

  const selected = REFERRAL_PARTNERS.find((p) => p.id === selectedId) ?? REFERRAL_PARTNERS[0]

  return (
    <section className="ri-section">
      <div className="container">
        <p className="section-eyebrow">Referral Network</p>
        <h2 className="section-h2">A Built-In Referral Ecosystem</h2>
        <p className="section-intro">
          CELP® professionals sit at the center of a network of professionals who all serve
          the same families — but none of them coordinate across disciplines. You become
          the connector every family needs.
        </p>

        {/* ── Pill row ── */}
        <div className="ri-pills" role="tablist" aria-label="Referral partners">
          {REFERRAL_PARTNERS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === selectedId}
              aria-controls="ri-panel"
              onClick={() => setSelectedId(p.id)}
              className={`ri-pill${p.id === selectedId ? ' ri-pill--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Content panel ── */}
        <div
          id="ri-panel"
          role="tabpanel"
          key={selectedId}
          className="ri-panel"
        >
          <div className="ri-panel-left">
            <p className="ri-partner-label">For {selected.label}</p>
            <h3 className="ri-headline">{selected.headline}</h3>
            <p className="ri-body">{selected.body}</p>
          </div>
          <div className="ri-panel-right">
            <a href={`/partners/apply?role=${selected.id}`} className="ri-connect-btn">
              Connect with a CELP® Professional →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Section wrapper ── */
        .ri-section {
          padding: 80px 0;
          background: var(--green-xlight);
        }

        /* ── Pill row ── */
        .ri-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 28px;
        }
        .ri-pill {
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
        .ri-pill:hover:not(.ri-pill--active) {
          background: var(--green-xlight);
        }
        .ri-pill--active {
          background: var(--green-dark);
          color: #fff;
          border-color: var(--green-dark);
        }

        /* ── Content panel ── */
        @keyframes riFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ri-panel {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          padding: 40px;
          display: flex;
          gap: 48px;
          align-items: flex-start;
          animation: riFadeUp 0.28s ease-out;
        }
        .ri-panel-left {
          flex: 1;
          min-width: 0;
        }
        .ri-panel-right {
          display: flex;
          align-items: flex-start;
          flex-shrink: 0;
          padding-top: 4px;
        }

        /* ── Panel content ── */
        .ri-partner-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--green-dark);
          margin: 0 0 10px;
        }
        .ri-headline {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.125rem, 2vw, 1.375rem);
          font-weight: 700;
          color: var(--green-900);
          margin: 0 0 14px;
          line-height: 1.3;
        }
        .ri-body {
          font-size: 0.9875rem;
          color: #374151;
          line-height: 1.75;
          margin: 0;
        }
        .ri-connect-btn {
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
        .ri-connect-btn:hover {
          background: var(--green-900);
          border-color: var(--green-900);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ri-panel {
            flex-direction: column;
            gap: 28px;
            padding: 28px 24px;
            border-radius: 16px;
          }
          .ri-panel-right {
            padding-top: 0;
          }
          .ri-connect-btn {
            white-space: normal;
          }
        }
        @media (max-width: 540px) {
          .ri-section {
            padding: 64px 0;
          }
          .ri-pill {
            font-size: 0.8125rem;
            padding: 8px 16px;
          }
        }
      `}</style>
    </section>
  )
}
