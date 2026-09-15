// app/partners/page.tsx
// CELP® Partner Directory — public, client-rendered.
// Mirrors the Find an Advisor page layout: filter panel left, map right, cards below.
// Data is fetched on mount from /api/partners (approved celp_partners only).
// No individual profile pages — cards are info-only, not links.

'use client'

import dynamic from 'next/dynamic'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { STATE_NAMES, TERRITORY_CODES } from '@/lib/geo'
import { getStateView } from '@/lib/stateView'
import { REFERRAL_PARTNERS } from '@/lib/celp-referral-partners'

// Client-only map (react-simple-maps / d3-geo are not SSR-safe in this config).
const AdvisorMap = dynamic(() => import('@/components/directory/AdvisorMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        aspectRatio: '975 / 610',
        background: '#eef1f4',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '14px',
      }}
    >
      Loading map…
    </div>
  ),
})

// ── Color tokens ─────────────────────────────────────────────────────────────
const GREEN = '#2a6b54'
const GREEN_LIGHT = '#d9ede5'
const BLUE = '#1C80BC' // map dot color (all partners)
const GRAY = {
  text: '#6b7280',
  bg: '#f3f4f6',
  border: '#e5e7eb',
  dark: '#1f2937',
}

const RADIUS_OPTIONS = [10, 25, 50, 100, 250]

const DIRECTION_LABELS: Record<string, string> = {
  send: 'Sends referrals',
  receive: 'Receives referrals',
  both: 'Both directions',
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: number
  role_id: string
  role_label: string
  first_name: string
  last_name: string
  organization: string | null
  street_address: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  clients_per_year: string | null
  referral_direction: 'send' | 'receive' | 'both'
  about: string | null
}

// Client-enriched shape expected by AdvisorMap and card renderer.
interface PartnerRow extends Partner {
  /** String(id) — used as React key by AdvisorMap circle elements. */
  slug: string
  /** Normalized 2-letter state code. */
  stateCode: string | null
  /** {lat, lng} for map dots; null when lat/lng absent from DB row. */
  coords: { lat: number; lng: number } | null
  /** Display name (first + last). */
  name: string
  /** Always false — AdvisorMap colors by these; we let all dots use NSSA blue. */
  nssa: false
  irmaa: false
  /** Set when ZIP proximity filter active; Infinity = no coords. */
  distance?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function transformPartner(p: Partner): PartnerRow {
  const stateCode = p.state ? p.state.trim().toUpperCase() : null
  const coords =
    p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null
  return {
    ...p,
    slug: String(p.id),
    stateCode,
    coords,
    name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    nssa: false,
    irmaa: false,
  }
}

// Haversine distance (miles). Inlined to avoid pulling geo.js client-side
// unnecessarily (though AdvisorMap already bundles it via its own import).
function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')

  // ── Filter state ──────────────────────────────────────────────────────────
  const [name, setName]           = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [directionFilter, setDirectionFilter] = useState<'' | 'send' | 'receive' | 'both'>('')
  const [stateFilter, setStateFilter] = useState('')
  const [zip, setZip]             = useState('')
  const [radius, setRadius]       = useState(50)
  const [origin, setOrigin]       = useState<{ lat: number; lng: number } | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError]   = useState('')

  // ── Map state ─────────────────────────────────────────────────────────────
  type HoveredPartner = { partner: PartnerRow; x: number; y: number }
  const [hovered, setHovered]   = useState<HoveredPartner | null>(null)
  const [popState, setPopState] = useState<'in' | 'out' | 'steady'>('in')
  const [zoomNudge, setZoomNudge] = useState(1)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mapZoomed = !!(stateFilter || origin)

  // ── Load partners ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/partners')
      .then(r => r.json())
      .then((d: { partners?: Partner[]; error?: string }) => {
        if (d.partners) {
          setPartners(d.partners.map(transformPartner))
        } else {
          setLoadError(d.error ?? 'Failed to load partners.')
        }
      })
      .catch(() => setLoadError('Failed to load partners.'))
      .finally(() => setLoading(false))
  }, [])

  // Reset zoom when the fitted view changes.
  useEffect(() => { setZoomNudge(1) }, [stateFilter, origin])

  // ── Map hover callbacks ───────────────────────────────────────────────────
  const showPreview = useCallback((partner: PartnerRow, x: number, y: number) => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null }
    setPopState('in')
    setHovered({ partner, x, y })
  }, [])

  const hidePreview = useCallback(() => {
    setPopState('out')
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setHovered(null); setPopState('in'); dismissTimer.current = null
    }, 300)
  }, [])

  const stabilizePreview = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null }
    setPopState('steady')
  }, [])

  // ── ZIP proximity ─────────────────────────────────────────────────────────
  const applyZip = useCallback(async () => {
    const z = zip.trim()
    if (!z) { setOrigin(null); setZipError(''); return }
    setZipLoading(true); setZipError('')
    try {
      const r = await fetch(`/api/zip?z=${encodeURIComponent(z)}`)
      if (!r.ok) {
        setOrigin(null)
        setZipError('Location not found — try a ZIP or "City, ST"')
        return
      }
      const c: { lat: number; lng: number } = await r.json()
      setStateFilter('') // proximity is national; clear state constraint
      setOrigin(c)
    } catch {
      setOrigin(null); setZipError('Could not look up location')
    } finally {
      setZipLoading(false)
    }
  }, [zip])

  const clearProximity = useCallback(() => {
    setZip(''); setOrigin(null); setZipError('')
  }, [])

  const clearAll = useCallback(() => {
    setName(''); setSelectedRoles(new Set()); setDirectionFilter(''); setStateFilter('')
    setZip(''); setOrigin(null); setZipError('')
  }, [])

  // ── Derived state (state list from actual data) ───────────────────────────
  const stateList = useMemo(() => {
    const codes = [
      ...new Set(partners.map(p => p.stateCode).filter(Boolean)),
    ] as string[]
    const states = codes
      .filter(c => !TERRITORY_CODES.has(c))
      .map(c => [c, (STATE_NAMES as Record<string, string>)[c] ?? c] as [string, string])
      .sort((a, b) => a[1].localeCompare(b[1]))
    const territories = codes
      .filter(c => TERRITORY_CODES.has(c))
      .map(c => [c, (STATE_NAMES as Record<string, string>)[c] ?? c] as [string, string])
      .sort((a, b) => a[1].localeCompare(b[1]))
    return { states, territories }
  }, [partners])

  // ── Filtered list for results cards (all filters) ─────────────────────────
  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase()
    let list = partners.filter(p => {
      if (stateFilter && p.stateCode !== stateFilter) return false
      if (selectedRoles.size > 0 && !selectedRoles.has(p.role_id)) return false
      if (directionFilter) {
        if (directionFilter === 'send'    && p.referral_direction !== 'send'    && p.referral_direction !== 'both') return false
        if (directionFilter === 'receive' && p.referral_direction !== 'receive' && p.referral_direction !== 'both') return false
        if (directionFilter === 'both'    && p.referral_direction !== 'both') return false
      }
      if (q) {
        const hay = `${p.name} ${p.organization ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (origin) {
      list = list
        .map(p => ({
          ...p,
          distance: p.coords ? milesBetween(origin, p.coords) : Infinity,
        }))
        .filter(p => (p.distance ?? Infinity) <= radius)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    } else {
      list = [...list].sort((a, b) =>
        (a.organization ?? '').localeCompare(b.organization ?? '')
      )
    }
    return list
  }, [partners, name, stateFilter, selectedRoles, directionFilter, origin, radius])

  // ── Map markers: all filters EXCEPT direction (smooth dot cross-fade) ─────
  const mapMarkers = useMemo(() => {
    const q = name.trim().toLowerCase()
    let list = partners.filter(p => {
      if (!p.coords) return false
      if (stateFilter && p.stateCode !== stateFilter) return false
      if (selectedRoles.size > 0 && !selectedRoles.has(p.role_id)) return false
      if (q) {
        const hay = `${p.name} ${p.organization ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (origin) {
      list = list
        .map(p => ({ ...p, distance: milesBetween(origin, p.coords!) }))
        .filter(p => (p.distance ?? Infinity) <= radius)
    }
    return list
  }, [partners, name, stateFilter, selectedRoles, origin, radius])

  // ── All markers without state constraint (for drag-pan over state border) ─
  const allMarkers = useMemo(() => {
    const q = name.trim().toLowerCase()
    let list = partners.filter(p => {
      if (!p.coords) return false
      if (selectedRoles.size > 0 && !selectedRoles.has(p.role_id)) return false
      if (q) {
        const hay = `${p.name} ${p.organization ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (origin) {
      list = list
        .map(p => ({ ...p, distance: milesBetween(origin, p.coords!) }))
        .filter(p => (p.distance ?? Infinity) <= radius)
    }
    return list
  }, [partners, name, selectedRoles, origin, radius])

  // All partner dots always pass (direction filter is card-only).
  const passesDesignation = useCallback((_p?: unknown) => true, [])

  // ── Map view ──────────────────────────────────────────────────────────────
  const mapView = useMemo(() => {
    if (origin) return { center: [origin.lng, origin.lat], zoom: 6 }
    if (stateFilter) {
      const v = getStateView(stateFilter, mapMarkers)
      if (v) return v
    }
    return { center: [-96, 38], zoom: 1 }
  }, [mapMarkers, stateFilter, origin])

  // ── Helpers for render ─────────────────────────────────────────────────────
  const hasFilters = !!(name || selectedRoles.size > 0 || stateFilter || directionFilter || origin)
  const hasNarrowingFilter = !!(name || stateFilter || origin)

  const scrollToCard = useCallback((p: PartnerRow) => {
    const el = document.getElementById(`partner-${p.id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .dir-top {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          align-items: stretch;
          margin-bottom: 2.5rem;
        }
        .map-wrap {
          background: ${GRAY.bg};
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .partner-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
        }
        .filter-input {
          width: 100%;
          padding: 11px 13px;
          font-size: 15px;
          border: 1px solid ${GRAY.border};
          border-radius: 8px;
          box-sizing: border-box;
          font-family: inherit;
          background: white;
          outline: none;
          color: ${GRAY.dark};
        }
        .filter-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: ${GRAY.dark};
          margin-bottom: 6px;
          font-family: Inter, system-ui, sans-serif;
        }
        .partner-card {
          background: white;
          border: 1px solid ${GRAY.border};
          border-radius: 12px;
          padding: 1.25rem;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .partner-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .p-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          border-radius: 4px;
          padding: 2px 7px;
        }
        @keyframes badgePop {
          0%   { opacity: 0; transform: scale(0.85) translateY(4px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes badgePopOut {
          0%   { opacity: 1; transform: scale(1)   translateY(0);   }
          100% { opacity: 0; transform: scale(0.9) translateY(3px); }
        }
        .partner-pop     { animation: badgePop    0.16s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .partner-pop-out { animation: badgePopOut 0.16s ease-in forwards; }
        @media (max-width: 1024px) {
          .dir-top          { grid-template-columns: 1fr; }
          .partner-cards    { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .partner-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ color: GRAY.dark, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />

        {/* ── Hero ── */}
        <section className="hero" style={{ padding: '72px 0 64px' }}>
          <div className="container">
            <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
              <div className="hero-eyebrow">CELP® Partner Network</div>
              <h1 style={{ marginBottom: 20 }}>Find a CELP® Partner</h1>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                Connect with professionals who coordinate end-of-life financial transitions —
                estate planning attorneys, CPAs, hospice organizations, senior care providers,
                and more.
              </p>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <section style={{ padding: '2rem', flex: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: GRAY.text }}>
                Loading partners…
              </div>
            )}

            {/* Error */}
            {!loading && loadError && (
              <div style={{ background: GRAY.bg, borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: GRAY.text }}>
                <p style={{ margin: 0 }}>{loadError}</p>
              </div>
            )}

            {/* Zero partners (network still building) */}
            {!loading && !loadError && partners.length === 0 && (
              <div style={{ background: GRAY.bg, borderRadius: 12, padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
                <h2
                  style={{
                    fontFamily: 'var(--font-merriweather), Georgia, serif',
                    fontSize: '1.4rem',
                    color: GRAY.dark,
                    margin: '0 0 12px',
                  }}
                >
                  The CELP® Partner Network is growing.
                </h2>
                <p style={{ color: GRAY.text, margin: '0 0 24px' }}>
                  Check back soon — or apply to join.
                </p>
                <a href="/partners/apply" className="btn-primary">
                  Apply to Join →
                </a>
              </div>
            )}

            {/* Directory (partners exist) */}
            {!loading && !loadError && partners.length > 0 && (
              <>
                {/* ── Top row: filters + map ── */}
                <div className="dir-top">

                  {/* Filters panel */}
                  <div>
                    {/* Name / org search */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="filter-label">Search by name or organization</label>
                      <input
                        className="filter-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Smith or Sunrise Hospice"
                      />
                    </div>

                    {/* Partner type — multi-select checkbox list */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="filter-label" style={{ margin: 0 }}>Partner Type</span>
                        {selectedRoles.size > 0 && (
                          <button
                            onClick={() => setSelectedRoles(new Set())}
                            style={{
                              background: 'none', border: 'none', padding: 0,
                              fontSize: '12px', color: GREEN, cursor: 'pointer',
                              textDecoration: 'underline', fontFamily: 'inherit',
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          maxHeight: '220px',
                          overflowY: 'auto',
                          border: `1px solid ${GRAY.border}`,
                          borderRadius: '8px',
                          background: 'white',
                          padding: '6px 0',
                        }}
                      >
                        {REFERRAL_PARTNERS.map(rp => {
                          const checked = selectedRoles.has(rp.id)
                          return (
                            <label
                              key={rp.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: checked ? GRAY.dark : GRAY.text,
                                fontWeight: checked ? 600 : 400,
                                background: checked ? GREEN_LIGHT : 'transparent',
                                transition: 'background 0.1s',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setSelectedRoles(prev => {
                                    const next = new Set(prev)
                                    if (next.has(rp.id)) next.delete(rp.id)
                                    else next.add(rp.id)
                                    return next
                                  })
                                }}
                                style={{ accentColor: GREEN, width: 14, height: 14, flexShrink: 0 }}
                              />
                              {rp.label}
                            </label>
                          )
                        })}
                      </div>
                      {selectedRoles.size > 0 && (
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: GRAY.text }}>
                          {selectedRoles.size} of {REFERRAL_PARTNERS.length} selected
                        </p>
                      )}
                    </div>

                    {/* Referral direction toggle */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="filter-label">Referral direction</label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(
                          [
                            ['', 'All'],
                            ['send', 'Sends referrals'],
                            ['receive', 'Receives referrals'],
                            ['both', 'Both directions'],
                          ] as [string, string][]
                        ).map(([val, label]) => {
                          const active = directionFilter === val
                          return (
                            <button
                              key={val}
                              onClick={() =>
                                setDirectionFilter(val as '' | 'send' | 'receive' | 'both')
                              }
                              style={{
                                padding: '8px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                fontFamily: 'Inter, system-ui, sans-serif',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                border: `1.5px solid ${active ? GREEN : GRAY.border}`,
                                background: active ? GREEN : 'white',
                                color: active ? 'white' : GRAY.dark,
                                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                              }}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* State dropdown */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="filter-label">State or Territory</label>
                      <select
                        className="filter-input"
                        value={stateFilter}
                        onChange={e => {
                          setStateFilter(e.target.value)
                          setHovered(null)
                        }}
                      >
                        <option value="">All states &amp; territories</option>
                        <optgroup label="States">
                          {stateList.states.map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                          ))}
                        </optgroup>
                        {stateList.territories.length > 0 && (
                          <optgroup label="Territories">
                            {stateList.territories.map(([code, label]) => (
                              <option key={code} value={code}>{label}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* ZIP proximity */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="filter-label">Near a ZIP or city</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="filter-input"
                          value={zip}
                          onChange={e => setZip(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') applyZip() }}
                          placeholder="ZIP or city"
                          style={{ flex: '0 0 120px' }}
                        />
                        <select
                          className="filter-input"
                          value={radius}
                          onChange={e => setRadius(Number(e.target.value))}
                          style={{ flex: 1 }}
                        >
                          {RADIUS_OPTIONS.map(r => (
                            <option key={r} value={r}>{r} miles</option>
                          ))}
                        </select>
                        <button
                          onClick={applyZip}
                          disabled={zipLoading}
                          style={{
                            flex: '0 0 auto',
                            padding: '0 16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: 'Inter, system-ui, sans-serif',
                            cursor: zipLoading ? 'not-allowed' : 'pointer',
                            borderRadius: '8px',
                            border: 'none',
                            background: GREEN,
                            color: 'white',
                            opacity: zipLoading ? 0.7 : 1,
                          }}
                        >
                          {zipLoading ? '…' : 'Go'}
                        </button>
                      </div>
                      {zipError && (
                        <p style={{ color: '#9d174d', fontSize: '13px', margin: '6px 0 0' }}>
                          {zipError}
                        </p>
                      )}
                      {origin && (
                        <button
                          onClick={clearProximity}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: GREEN,
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '6px 0 0',
                            textDecoration: 'underline',
                          }}
                        >
                          Clear location filter
                        </button>
                      )}
                    </div>

                    {/* Clear all */}
                    {hasFilters && (
                      <button
                        onClick={clearAll}
                        style={{
                          background: 'none',
                          border: `1px solid ${GRAY.border}`,
                          borderRadius: 8,
                          padding: '8px 14px',
                          fontSize: '13px',
                          color: GRAY.text,
                          cursor: 'pointer',
                          width: '100%',
                          fontFamily: 'inherit',
                        }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>

                  {/* Map (right, large) — client-only via dynamic import */}
                  <div className="map-wrap">
                    <div style={{ position: 'relative' }}>
                      {/* AdvisorMap.js is a plain JS file; prop types are not
                          checked by TypeScript. We cast showPreview to satisfy
                          the JS component's call signature (advisor, x, y). */}
                      <AdvisorMap
                        mapView={mapView}
                        zoomNudge={zoomNudge}
                        mapZoomed={mapZoomed}
                        mapMarkers={mapMarkers}
                        allMarkers={allMarkers}
                        passesDesignation={passesDesignation}
                        designation=""
                        dotColorOverride={GREEN}
                        stateFilter={stateFilter}
                        stateList={stateList.states}
                        setStateFilter={setStateFilter}
                        setHovered={setHovered}
                        showPreview={(a: PartnerRow, x: number, y: number) =>
                          showPreview(a, x, y)
                        }
                        hidePreview={hidePreview}
                        onMarkerClick={(a: PartnerRow) => scrollToCard(a)}
                      />

                      {/* Zoom controls */}
                      <div
                        style={{
                          position: 'absolute',
                          right: '12px',
                          bottom: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          zIndex: 4,
                        }}
                      >
                        <button
                          aria-label="Zoom in"
                          onClick={() => setZoomNudge(z => Math.min(z * 1.5, 8))}
                          style={{
                            width: '34px', height: '34px', borderRadius: '8px',
                            border: `1px solid ${GRAY.border}`, background: 'white',
                            color: GRAY.dark, fontSize: '20px', fontWeight: 700,
                            lineHeight: 1, cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >+</button>
                        <button
                          aria-label="Zoom out"
                          onClick={() => setZoomNudge(z => Math.max(z / 1.5, 0.4))}
                          style={{
                            width: '34px', height: '34px', borderRadius: '8px',
                            border: `1px solid ${GRAY.border}`, background: 'white',
                            color: GRAY.dark, fontSize: '22px', fontWeight: 700,
                            lineHeight: 1, cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >−</button>
                      </div>

                      {/* Hover preview (shown only when map is zoomed) */}
                      {hovered && mapZoomed && (
                        <div
                          className={
                            popState === 'out'
                              ? 'partner-pop-out'
                              : popState === 'in'
                                ? 'partner-pop'
                                : ''
                          }
                          onMouseEnter={stabilizePreview}
                          onMouseLeave={hidePreview}
                          style={{
                            position: 'absolute',
                            left: hovered.x > 700 ? hovered.x - 234 : hovered.x + 14,
                            top: hovered.y - 10,
                            zIndex: 5,
                            background: 'white',
                            border: `1px solid ${GRAY.border}`,
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                            padding: '10px 12px',
                            width: '220px',
                            maxWidth: 'calc(100% - 20px)',
                            transformOrigin: 'top left',
                            ...(popState === 'steady'
                              ? { opacity: 1, transform: 'scale(1) translateY(0)' }
                              : {}),
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: GRAY.dark,
                              lineHeight: 1.3,
                              marginBottom: 2,
                            }}
                          >
                            {hovered.partner.name}
                          </div>
                          {hovered.partner.organization && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: GRAY.text,
                                marginBottom: 4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {hovered.partner.organization}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: GREEN, fontWeight: 600 }}>
                            {hovered.partner.role_label}
                          </div>
                          {(hovered.partner.city || hovered.partner.stateCode) && (
                            <div style={{ fontSize: '11px', color: GRAY.text, marginTop: 2 }}>
                              {[hovered.partner.city, hovered.partner.stateCode]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Map legend */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: '0.75rem',
                        fontSize: '12px',
                        color: GRAY.text,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: GREEN,
                            display: 'inline-block',
                          }}
                        />
                        CELP® Partner
                      </span>
                      {mapZoomed && (
                        <span>· hover a dot for details</span>
                      )}
                      {hasNarrowingFilter && mapMarkers.length > 0 && (
                        <span>
                          · {mapMarkers.length.toLocaleString()} on map
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Results grid ── */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: 'var(--font-merriweather), Georgia, serif',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: GRAY.dark,
                        margin: 0,
                      }}
                    >
                      {hasNarrowingFilter ? (
                        <>
                          {filtered.length.toLocaleString()}{' '}
                          {filtered.length === 1 ? 'Partner' : 'Partners'}
                          {origin ? ` within ${radius} miles` : ''}
                        </>
                      ) : (
                        'CELP® Partner Organizations'
                      )}
                    </h2>
                  </div>

                  {filtered.length === 0 ? (
                    <div
                      style={{
                        background: GRAY.bg,
                        borderRadius: '12px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: GRAY.text,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '16px' }}>
                        No partners match your filters.
                      </p>
                      {hasFilters && (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '14px' }}>
                          <button
                            onClick={clearAll}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: GREEN,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontSize: 'inherit',
                              padding: 0,
                              fontFamily: 'inherit',
                            }}
                          >
                            Clear filters
                          </button>
                          {' '}to see all partners.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="partner-cards">
                      {filtered.map(p => (
                        <div
                          key={p.id}
                          id={`partner-${p.id}`}
                          className="partner-card"
                        >
                          {/* Name + organization */}
                          <div style={{ marginBottom: '0.65rem' }}>
                            <h3
                              style={{
                                fontFamily: 'Inter, system-ui, sans-serif',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                margin: '0 0 2px',
                                color: GRAY.dark,
                                lineHeight: 1.25,
                              }}
                            >
                              {p.name}
                            </h3>
                            {p.organization && (
                              <p
                                style={{
                                  fontSize: '14px',
                                  color: GRAY.text,
                                  margin: 0,
                                  fontWeight: 500,
                                }}
                              >
                                {p.organization}
                              </p>
                            )}
                          </div>

                          {/* Role badge */}
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span
                              className="p-badge"
                              style={{ background: GREEN_LIGHT, color: GREEN }}
                            >
                              {p.role_label}
                            </span>
                          </div>

                          {/* Address */}
                          {(p.city || p.stateCode) && (
                            <p style={{ fontSize: '13px', color: GRAY.text, margin: '0 0 8px' }}>
                              {p.street_address
                                ? [p.street_address, p.city, `${p.stateCode ?? ''} ${p.zip ?? ''}`.trim()].filter(Boolean).join(', ')
                                : [p.city, `${p.stateCode ?? ''} ${p.zip ?? ''}`.trim()].filter(Boolean).join(', ')}
                              {origin &&
                                p.distance !== undefined &&
                                p.distance !== Infinity
                                ? ` · ${Math.round(p.distance)} mi`
                                : ''}
                            </p>
                          )}

                          {/* Direction + clients/year badges */}
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <span
                              className="p-badge"
                              style={{
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              {DIRECTION_LABELS[p.referral_direction] ??
                                p.referral_direction}
                            </span>
                            {p.clients_per_year && (
                              <span
                                className="p-badge"
                                style={{
                                  background: GRAY.bg,
                                  color: GRAY.text,
                                }}
                              >
                                {p.clients_per_year} clients/yr
                              </span>
                            )}
                          </div>

                          {/* About blurb (≤150 chars) */}
                          {p.about && (
                            <p
                              style={{
                                fontSize: '13px',
                                color: GRAY.text,
                                margin: 0,
                                lineHeight: 1.55,
                              }}
                            >
                              {p.about.length > 150
                                ? p.about.slice(0, 150).trimEnd() + '…'
                                : p.about}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
