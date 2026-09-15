'use client'

import { useState } from 'react'
import { PROFESSIONS, type Profession } from '@/lib/celp-professions'
import { CAREER_PERSONAS, type CareerPersona } from '@/lib/celp-career-personas'

const DARK   = '#1a4a37'
const MID    = '#2a6b54'
const LIGHT  = '#d9ede5'
const XLIGHT = '#f0f9f5'

function Check({ color = MID }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// Enhancement Track — each tag maps to a profession ID
const ENHANCEMENT_WHO: { label: string; id: string }[] = [
  { label: 'Financial Advisors',         id: 'financial-advisors' },
  { label: 'Trust Officers',             id: 'trust-officers' },
  { label: 'Insurance Agents',           id: 'insurance-agents' },
  { label: 'Estate Planning Attorneys',  id: 'estate-attorneys' },
  { label: 'Elder Law Attorneys',        id: 'elder-law-attorneys' },
  { label: 'CPAs',                       id: 'cpas' },
  { label: 'Medicare Advisors',          id: 'medicare-advisors' },
  { label: 'Senior Living Consultants',  id: 'senior-living-consultants' },
  { label: 'Care Managers',             id: 'care-managers' },
  { label: 'Social Workers',             id: 'social-workers' },
  { label: 'Funeral Directors',          id: 'funeral-planners' },
]

const CAREER_WHO: { label: string; id: string }[] = [
  { label: 'Career changers seeking meaningful work',         id: 'career-changers' },
  { label: 'Professionals displaced by automation',           id: 'displaced-by-ai' },
  { label: 'Personal experience navigating a family estate',  id: 'personal-experience' },
  { label: 'Building an independent practice',               id: 'independent-practice' },
  { label: 'Retired professionals — ready for a second act', id: 'second-act' },
]

const ENHANCEMENT_BENEFITS = [
  "A credential that signals genuine end-of-life expertise to clients and referral partners",
  "A structured framework for the complex conversations you're already having",
  "New service revenue from your existing client base",
  "A referral network across estate law, hospice, senior living, and beyond",
  "Relationships that make you the first call when families face life's most difficult transition",
]

const CAREER_BENEFITS = [
  "No products to sell. No firm to join. No investment license required.",
  "A universal market — every family with aging parents needs this service",
  "Immediate referral relationships built in from day one",
  "Work that can't be automated — human coordination at life's hardest moments",
  "Massive unmet demand with no established profession filling the role",
]

// ── Profession Modal ──────────────────────────────────────────────────────────
function ProfessionModal({ profession, onClose }: { profession: Profession; onClose: () => void }) {
  function handleApply() {
    onClose()
    setTimeout(() => {
      document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: '#fff',
            cursor: 'pointer', fontSize: 18, color: 'var(--ink-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >×</button>

        {/* Header */}
        <div style={{ background: DARK, padding: '36px 40px 32px', borderRadius: '16px 16px 0 0' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: 999, marginBottom: 16,
          }}>
            CELP® for {profession.label}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-merriweather), Georgia, serif',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: 700, color: '#fff',
            lineHeight: 1.28, margin: 0,
          }}>
            {profession.headline}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px 36px' }}>
          <p style={{
            fontSize: '0.9625rem', color: 'var(--ink-mid)',
            lineHeight: 1.75, margin: '0 0 28px',
          }}>
            {profession.body}
          </p>

          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-xlight)', marginBottom: 14,
          }}>
            Why CELP® fits your practice
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profession.whyBullets.map(b => (
              <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>
                <Check />
                {b}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleApply}
              style={{
                width: '100%', padding: '13px 24px',
                background: MID, color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: '0.9375rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              Apply for Consideration
            </button>
            <a
              href={`/credentials/celp/${profession.id}`}
              style={{
                display: 'block', textAlign: 'center',
                fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--ink-light)', textDecoration: 'none',
                padding: '6px 0',
              }}
            >
              View full page for {profession.label} →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Career Persona Modal ────────────────────────────────────────────────
function PersonaModal({ persona, onClose }: { persona: CareerPersona; onClose: () => void }) {
  function handleApply() {
    onClose()
    setTimeout(() => {
      document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)', background: '#fff',
            cursor: 'pointer', fontSize: 18, color: 'var(--ink-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >×</button>

        {/* Header */}
        <div style={{ background: DARK, padding: '36px 40px 32px', borderRadius: '16px 16px 0 0' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: 999, marginBottom: 16,
          }}>
            Career Track
          </div>
          <h2 style={{
            fontFamily: 'var(--font-merriweather), Georgia, serif',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: 700, color: '#fff',
            lineHeight: 1.28, margin: 0,
          }}>
            {persona.headline}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px 36px' }}>
          <p style={{
            fontSize: '0.9625rem', color: 'var(--ink-mid)',
            lineHeight: 1.75, margin: '0 0 28px',
          }}>
            {persona.body}
          </p>

          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-xlight)', marginBottom: 14,
          }}>
            Why CELP® is right for you
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {persona.whyBullets.map(b => (
              <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>
                <Check />
                {b}
              </li>
            ))}
          </ul>

          <button
            onClick={handleApply}
            style={{
              width: '100%', padding: '13px 24px',
              background: MID, color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: '0.9375rem', fontWeight: 700,
              cursor: 'pointer', textAlign: 'center',
              fontFamily: 'inherit',
            }}
          >
            Apply for Consideration
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function CelpTwoTracks() {
  const [activeProfession, setActiveProfession] = useState<Profession | null>(null)
  const [activePersona, setActivePersona] = useState<CareerPersona | null>(null)

  function openModal(id: string) {
    const p = PROFESSIONS.find(p => p.id === id)
    if (p) setActiveProfession(p)
  }

  function openPersonaModal(id: string) {
    const p = CAREER_PERSONAS.find(p => p.id === id)
    if (p) setActivePersona(p)
  }

  function handleApply() {
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div className="container">
        <p className="section-eyebrow" style={{ textAlign: 'center' }}>Two Paths to CELP®</p>
        <h2 className="section-h2" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 16px' }}>
          The Same Credential.<br />Two Powerful Applications.
        </h2>
        <p style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--ink-light)', lineHeight: 1.72, maxWidth: 560, margin: '0 auto 56px' }}>
          Whether you want to deepen an existing practice or build something entirely new,
          CELP® gives you the credential, framework, and community to do it.
        </p>

        <div className="celp-tracks-grid">

          {/* ── Enhancement Track ── */}
          <div className="celp-track celp-track--light">
            <div className="celp-track-badge celp-track-badge--light">Enhancement Track</div>
            <h3 className="celp-track-h3 celp-track-h3--light">Already Serving These Families?</h3>
            <p className="celp-track-sub celp-track-sub--light">Add the expertise that makes you irreplaceable.</p>

            <div className="celp-track-who-label celp-track-who-label--light">Who this is for — click your role</div>
            <div className="celp-track-pills">
              {ENHANCEMENT_WHO.map(({ label, id }) => (
                <button key={id} onClick={() => openModal(id)} className="celp-role-pill celp-role-pill--light">
                  {label} →
                </button>
              ))}
            </div>

            <div className="celp-track-who-label celp-track-who-label--light" style={{ marginTop: 28 }}>
              What CELP® gives you
            </div>
            <ul className="celp-track-benefits">
              {ENHANCEMENT_BENEFITS.map(b => (
                <li key={b} className="celp-track-benefit celp-track-benefit--light">
                  <Check />
                  {b}
                </li>
              ))}
            </ul>

            <div className="celp-track-outcome celp-track-outcome--light">
              <p className="celp-track-outcome-text">
                &ldquo;You already serve these clients. CELP gives you the framework, credential, and community to serve them completely.&rdquo;
              </p>
            </div>

            <button onClick={handleApply} className="celp-track-cta celp-track-cta--light">
              Apply for Consideration
            </button>
          </div>

          {/* ── Career Track ── */}
          <div className="celp-track celp-track--dark">
            <div className="celp-track-badge celp-track-badge--dark">Career Track</div>
            <h3 className="celp-track-h3 celp-track-h3--dark">Ready to Build Something on Your Own Terms?</h3>
            <p className="celp-track-sub celp-track-sub--dark">A practice built around what matters — with growing demand and no real competition.</p>

            <div className="celp-track-who-label celp-track-who-label--dark">Who this is for — click your situation</div>
            <div className="celp-track-pills">
              {CAREER_WHO.map(({ label, id }) => (
                <button key={id} onClick={() => openPersonaModal(id)} className="celp-role-pill celp-role-pill--dark celp-role-pill--dark-btn">
                  {label} →
                </button>
              ))}
            </div>

            <div className="celp-track-who-label celp-track-who-label--dark" style={{ marginTop: 28 }}>
              What CELP® gives you
            </div>
            <ul className="celp-track-benefits">
              {CAREER_BENEFITS.map(b => (
                <li key={b} className="celp-track-benefit celp-track-benefit--dark">
                  <Check color="rgba(255,255,255,0.55)" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="celp-track-outcome celp-track-outcome--dark">
              <p className="celp-track-outcome-text">
                &ldquo;$80 trillion is changing hands. Tens of millions of families have no one to coordinate what comes next. You can be that person.&rdquo;
              </p>
            </div>

<button onClick={handleApply} className="celp-track-cta celp-track-cta--dark">
                Apply for Consideration
              </button>
          </div>

        </div>
      </div>

      {/* ── Profession Modal ── */}
      {activeProfession && (
        <ProfessionModal
          profession={activeProfession}
          onClose={() => setActiveProfession(null)}
        />
      )}

      {/* ── Persona Modal ── */}
      {activePersona && (
        <PersonaModal
          persona={activePersona}
          onClose={() => setActivePersona(null)}
        />
      )}

      <style>{`
        .celp-tracks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        .celp-track {
          border-radius: 16px;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
        }
        .celp-track--light { background: ${XLIGHT}; border: 1px solid ${LIGHT}; }
        .celp-track--dark  { background: ${DARK}; }

        .celp-track-badge {
          display: inline-block;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 999px;
          margin-bottom: 24px; width: fit-content;
        }
        .celp-track-badge--light { background: ${LIGHT}; color: ${MID}; }
        .celp-track-badge--dark  { background: rgba(255,255,255,0.15); color: #fff; }

        .celp-track-h3 {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: clamp(1.2rem, 1.8vw, 1.45rem);
          font-weight: 700; line-height: 1.25; margin: 0 0 10px;
        }
        .celp-track-h3--light { color: ${DARK}; }
        .celp-track-h3--dark  { color: #fff; }

        .celp-track-sub { font-size: 0.9375rem; margin-bottom: 28px; line-height: 1.5; }
        .celp-track-sub--light { color: var(--ink-mid); }
        .celp-track-sub--dark  { color: rgba(255,255,255,0.72); }

        .celp-track-who-label {
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px;
        }
        .celp-track-who-label--light { color: var(--ink-xlight); }
        .celp-track-who-label--dark  { color: rgba(255,255,255,0.45); }

        .celp-track-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }

        .celp-role-pill {
          font-size: 0.8rem; font-weight: 500;
          padding: 5px 12px; border-radius: 999px;
          cursor: default;
        }
        .celp-role-pill--light {
          background: #fff; border: 1px solid ${LIGHT}; color: ${MID};
          cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
          font-family: inherit;
        }
        .celp-role-pill--light:hover { background: ${MID}; color: #fff; border-color: ${MID}; }
        .celp-role-pill--dark {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.82);
        }
        .celp-role-pill--dark-btn {
          cursor: pointer; font-family: inherit;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .celp-role-pill--dark-btn:hover {
          background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.35);
          color: #fff;
        }

        .celp-track-benefits {
          list-style: none; padding: 0; margin: 0 0 28px;
          display: flex; flex-direction: column; gap: 10px; flex: 1;
        }
        .celp-track-benefit {
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 0.9rem; line-height: 1.55;
        }
        .celp-track-benefit--light { color: var(--ink-mid); }
        .celp-track-benefit--dark  { color: rgba(255,255,255,0.82); }

        .celp-track-outcome { border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; }
        .celp-track-outcome--light { background: #fff; border: 1px solid ${LIGHT}; }
        .celp-track-outcome--dark  { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); }
        .celp-track-outcome-text {
          font-family: var(--font-merriweather), Georgia, serif;
          font-size: 0.9rem; font-style: italic; line-height: 1.65; margin: 0;
        }
        .celp-track-outcome--light .celp-track-outcome-text { color: ${DARK}; }
        .celp-track-outcome--dark  .celp-track-outcome-text { color: rgba(255,255,255,0.9); }

        .celp-track-cta {
          display: block; width: 100%; text-align: center;
          padding: 13px 24px; border-radius: 8px; border: none;
          font-size: 0.9375rem; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: opacity 0.18s;
        }
        .celp-track-cta:hover { opacity: 0.88; }
        .celp-track-cta--light { background: ${MID}; color: #fff; }
        .celp-track-cta--dark  { background: #fff; color: ${DARK}; }

        .celp-track-learn-more {
          display: block; text-align: center;
          font-size: 0.875rem; font-weight: 600;
          color: rgba(255,255,255,0.6); text-decoration: none;
          transition: color 0.15s;
        }
        .celp-track-learn-more:hover { color: #fff; }

        @media (max-width: 820px) {
          .celp-tracks-grid { grid-template-columns: 1fr; }
          .celp-track { padding: 36px 28px; }
        }
      `}</style>
    </section>
  )
}
