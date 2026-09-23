// components/AdvisorMap.js
// Self-contained interactive US map, rendered directly with d3-geo (NO
// react-simple-maps). CLIENT-ONLY: imported into pages/index.js via
// next/dynamic({ ssr: false }).
//
// WHY no react-simple-maps: that library (v3, 2022) crashes against React 18 /
// modern d3 with "Invalid attempt to destructure non-iterable instance", both
// at build-time prerender and at client runtime. Since the app already depends
// on d3-geo + topojson-client, we render the states as plain SVG <path> and the
// advisors as <circle>, and implement zoom/pan as an animated SVG <g transform>.
// This removes the fragile dependency entirely while preserving every
// interaction: zoom-to-state on click, ZIP-proximity zoom, hover badges,
// click-to-navigate, designation cross-fade, and the +/- zoom controls.
//
// Drag-to-pan: pointer events on the SVG accumulate a [dragDx, dragDy] offset
// (in SVG coordinate space) that is folded into the transform alongside the
// fitted-view center. The offset resets whenever the fitted view changes (new
// state / ZIP / cleared). Clicks on dots and states are suppressed when the
// pointer moved more than DRAG_THRESHOLD px during the interaction.

import { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { feature } from 'topojson-client'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { stateCode } from '@/lib/geo'
import usTopo from '@/lib/us-states.json'

const NSSA  = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' }
const IRMAA = { light: '#fce7f3', medium: '#9d174d', dark: '#7f1424' }
const GRAY  = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', dark: '#1f2937' }

function Silhouette({ size }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e2e5ea', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
        <circle cx="32" cy="24" r="13" fill="#b9bec7" />
        <path d="M9 60c0-13 10.3-21 23-21s23 8 23 21z" fill="#b9bec7" />
      </svg>
    </div>
  )
}

const MAP_W = 975, MAP_H = 610

// How many screen pixels the pointer must move before we treat the interaction
// as a drag (and suppress the click handler on release).
const DRAG_THRESHOLD = 4

const projection = geoAlbersUsa().translate([MAP_W / 2, MAP_H / 2])
const pathGen = geoPath(projection)

const STATE_FEATURES = (() => {
  try {
    const fc = feature(usTopo, usTopo.objects.states)
    return fc.features.map(f => ({
      name: (f.properties && f.properties.name) || '',
      d: pathGen(f) || '',
    })).filter(s => s.d)
  } catch (e) {
    return []
  }
})()

// Resolve dot fill color based on the active designation filter.
function dotColor(a, designation, overrideColor) {
  if (overrideColor) return overrideColor
  if (designation === 'nssa')  return NSSA.medium
  if (designation === 'irmaa') return IRMAA.medium
  if (designation === 'both')  return '#7B4F9E'
  return a.nssa && a.irmaa ? '#7B4F9E' : a.irmaa ? IRMAA.medium : NSSA.medium
}

function AdvisorMap({
  mapView, zoomNudge, mapZoomed, mapMarkers, allMarkers, passesDesignation,
  designation, dotColorOverride,
  stateFilter, stateList, setStateFilter,
  onMarkerClick,
  // Optional: base path for the hover-popup profile link.
  // Defaults to '/find-an-advisor' (NSSA advisor directory).
  // Pass '/find-a-partner' for the CELP partner directory.
  profileBase,
}) {
  const resolvedProfileBase = profileBase ?? '/find-an-advisor'
  const zoom = Math.min(Math.max(mapView.zoom * zoomNudge, 1), 16)
  const z = Math.pow(zoom, 0.7)

  // ── Hover / popup state ───────────────────────────────────────────────────
  const [hovered, setHovered] = useState(null)   // { advisor, x, y } in viewport coords
  const [popState, setPopState] = useState('in') // 'in' | 'out' | 'steady'
  const dismissTimer = useRef(null)

  const showPreview = useCallback((advisor, x, y) => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null }
    setPopState('in')
    setHovered({ advisor, x, y })
  }, [])

  const hidePreview = useCallback(() => {
    setPopState('out')
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => { setHovered(null); setPopState('in'); dismissTimer.current = null }, 300)
  }, [])

  const stabilizePreview = useCallback(() => {
    if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null }
    setPopState('steady')
  }, [])

  // ── Drag state ────────────────────────────────────────────────────────────
  // dragOffset: accumulated pan in SVG coordinate space (persists across drags).
  // dragStart:  screen-pixel position where the current drag began (or null).
  // dragging:   true while pointer is down and has exceeded the threshold.
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  // hasDragged: latches true the first time the user drags within a given view,
  // and stays true until the view resets. Used to swap mapMarkers → allMarkers
  // so adjacent-state advisors appear as soon as the user starts panning.
  const [hasDragged, setHasDragged] = useState(false)
  const dragStart   = useRef(null)   // { screenX, screenY, offsetX, offsetY }
  const dragging    = useRef(false)  // exceeded threshold during this pointer-down
  const wasDragged  = useRef(false)  // used to suppress click on pointer-up
  const svgRef      = useRef(null)

  // Which marker set to render: once the user has dragged at all within a
  // zoomed view, switch to allMarkers (no state boundary) so advisors in
  // neighbouring states appear as the map pans. Falls back to mapMarkers when
  // there's no stateFilter active (ZIP proximity or national view) since in
  // those cases mapMarkers and allMarkers are already equivalent.
  const activeMarkers = (hasDragged && stateFilter && allMarkers) ? allMarkers : mapMarkers

  // Reset drag offset and hasDragged whenever the fitted view changes (state / ZIP / cleared).
  // We key on the serialised center + zoom so we only reset on real view changes.
  const viewKey = `${mapView.center[0]},${mapView.center[1]},${mapView.zoom}`
  const prevViewKey = useRef(viewKey)
  useEffect(() => {
    if (prevViewKey.current !== viewKey) {
      setDragOffset({ x: 0, y: 0 })
      setHasDragged(false)
      setHovered(null)
      if (dismissTimer.current) { clearTimeout(dismissTimer.current); dismissTimer.current = null }
      prevViewKey.current = viewKey
    }
  }, [viewKey])

  // Convert a screen-pixel delta to SVG coordinate space.
  // The SVG is rendered at its natural aspect ratio inside whatever container
  // width the browser gives it. We read the rendered width off the element to
  // get the pixel→SVG scale factor, then divide by the current zoom so the map
  // moves 1:1 with the pointer regardless of zoom level.
  const screenDeltaToSvg = useCallback((dScreenX, dScreenY) => {
    const el = svgRef.current
    if (!el) return { dx: 0, dy: 0 }
    const renderedWidth = el.getBoundingClientRect().width
    const svgScale = MAP_W / renderedWidth  // SVG units per screen pixel
    return {
      dx: dScreenX * svgScale / zoom,
      dy: dScreenY * svgScale / zoom,
    }
  }, [zoom])

  const handlePointerDown = useCallback((e) => {
    // Only drag with primary button (left-click / touch)
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = {
      screenX: e.clientX,
      screenY: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    }
    dragging.current  = false
    wasDragged.current = false
    // Suppress transition during drag so the map moves 1:1 with pointer
    svgRef.current?.querySelector('.map-zoom-group')?.classList.add('map-zoom-group--dragging')
  }, [dragOffset])

  const handlePointerMove = useCallback((e) => {
    if (!dragStart.current) return
    const dScreen = {
      x: e.clientX - dragStart.current.screenX,
      y: e.clientY - dragStart.current.screenY,
    }
    // Cross the threshold? Mark as a real drag and hide the hover badge.
    if (!dragging.current) {
      if (Math.abs(dScreen.x) > DRAG_THRESHOLD || Math.abs(dScreen.y) > DRAG_THRESHOLD) {
        dragging.current   = true
        wasDragged.current = true
        setHasDragged(true)
        hidePreview()
      } else {
        return
      }
    }
    const { dx, dy } = screenDeltaToSvg(dScreen.x, dScreen.y)
    setDragOffset({
      x: dragStart.current.offsetX + dx,
      y: dragStart.current.offsetY + dy,
    })
  }, [screenDeltaToSvg, hidePreview])

  const handlePointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragStart.current = null
    dragging.current  = false
    // Restore transition after drag ends
    svgRef.current?.querySelector('.map-zoom-group')?.classList.remove('map-zoom-group--dragging')
    // wasDragged.current stays true until the next pointerDown so the click
    // handler (which fires after pointerUp) can suppress itself.
  }, [])

  // ── Transform ─────────────────────────────────────────────────────────────
  const transform = useMemo(() => {
    const c = projection(mapView.center)
    const px = (c && isFinite(c[0])) ? c[0] : MAP_W / 2
    const py = (c && isFinite(c[1])) ? c[1] : MAP_H / 2
    const tx = MAP_W / 2 - px * zoom + dragOffset.x * zoom
    const ty = MAP_H / 2 - py * zoom + dragOffset.y * zoom
    return `translate(${tx} ${ty}) scale(${zoom})`
  }, [mapView.center, zoom, dragOffset])

  // ── Jitter overlapping dots ───────────────────────────────────────────────
  // Groups dots by proximity in SVG space (not exact pixel match), so advisors
  // in nearby-but-distinct cities (e.g. Honolulu + Pearl City) still fan out
  // when they visually overlap at the current zoom level.
  const jitteredMarkers = useMemo(() => {
    const projected = []
    
    for (const a of activeMarkers) {
      const p = projection([a.coords.lng, a.coords.lat])
      if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue
      projected.push({ a, px: p[0], py: p[1] })
    }
    
    // Cluster radius in SVG units — dots closer than this are fanned out.
    // Fixed in projection coordinate space (not zoom-scaled) so clustered dot
    // positions don't shift as the zoom animates.
    const CLUSTER_RADIUS = 6
    
    const assigned = new Array(projected.length).fill(-1)
    const groups = []

    for (let i = 0; i < projected.length; i++) {
      if (assigned[i] !== -1) continue
      const group = [i]
      for (let j = i + 1; j < projected.length; j++) {
        if (assigned[j] !== -1) continue
        const dx = projected[i].px - projected[j].px
        const dy = projected[i].py - projected[j].py
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < CLUSTER_RADIUS) {
          group.push(j)
          assigned[j] = groups.length
        }
      }
      assigned[i] = groups.length
      groups.push(group)
    }

    const out = []
    const FAN_RADIUS = 12  // Fan distance in SVG coordinate space (zoom-independent)
    for (const group of groups) {
      if (group.length === 1) {
        const m = projected[group[0]]
        out.push({ a: m.a, x: m.px, y: m.py })
        continue
      }
      
      // Compute centroid of the group, fan dots out radially from it.
      const cx = group.reduce((s, i) => s + projected[i].px, 0) / group.length
      const cy = group.reduce((s, i) => s + projected[i].py, 0) / group.length
      
      group.forEach((idx, i) => {
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
        out.push({
          a: projected[idx].a,
          x: cx + FAN_RADIUS * Math.cos(angle),
          y: cy + FAN_RADIUS * Math.sin(angle),
        })
      })
    }
    return out
  }, [activeMarkers])

  const popup = hovered?.advisor ? createPortal(
    <a
      href={`${resolvedProfileBase}/${hovered.advisor.slug}`}
      tabIndex={-1}
      className={popState === 'out' ? 'advisor-pop-out' : popState === 'in' ? 'advisor-pop' : ''}
      onMouseEnter={stabilizePreview}
      onMouseLeave={hidePreview}
      style={{
        position: 'fixed',
        left: hovered.x + 14,
        top: hovered.y - 10,
        zIndex: 9999,
        background: 'white',
        textDecoration: 'none',
        color: 'inherit',
        border: `1px solid ${GRAY.border}`,
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        padding: '10px 12px',
        width: '240px',
        display: 'block',
        transformOrigin: 'top left',
        cursor: 'pointer',
        ...(popState === 'steady' ? { opacity: 1, transform: 'scale(1) translateY(0)' } : null),
        ...(hovered.x > window.innerWidth - 270 ? {
          transform: (popState === 'steady' ? 'scale(1) translateY(0) ' : '') + 'translateX(calc(-100% - 28px))'
        } : null),
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {hovered.advisor.photo
          ? <><img src={hovered.advisor.photo} alt="" width="44" height="44" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { const fb = e.currentTarget.nextElementSibling; e.currentTarget.style.display = 'none'; if (fb) fb.style.display = 'flex' }} /><div style={{ display: 'none' }}><Silhouette size={44} /></div></>
          : <Silhouette size={44} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: '14px', color: GRAY.dark, lineHeight: 1.2 }}>{hovered.advisor.name}</div>
          {hovered.advisor.title && <div style={{ fontSize: '12px', color: GRAY.text, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hovered.advisor.title}</div>}
          {(hovered.advisor.city || hovered.advisor.stateCode) && <div style={{ fontSize: '12px', color: GRAY.text }}>{[hovered.advisor.city, hovered.advisor.stateCode].filter(Boolean).join(', ')}</div>}
          <div style={{ fontSize: '11px', color: NSSA.medium, marginTop: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>View profile <span style={{ fontSize: '13px' }}>→</span></div>
        </div>
      </div>
    </a>,
    document.body
  ) : null

  return (
    <>
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="rsm-svg"
      style={{
        width: '100%', height: 'auto', display: 'block',
        cursor: dragging.current ? 'grabbing' : (mapZoomed ? 'grab' : 'default'),
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      role="img"
      aria-label="Map of NSSA and IRMAACP certified advisors across the United States"
      onPointerDown={mapZoomed ? handlePointerDown : undefined}
      onPointerMove={mapZoomed ? handlePointerMove : undefined}
      onPointerUp={mapZoomed ? handlePointerUp : undefined}
      onPointerCancel={mapZoomed ? handlePointerUp : undefined}
    >
      <g
        className="map-zoom-group"
        transform={transform}
      >
        {/* States */}
        {STATE_FEATURES.map(s => {
          const code = s.name ? stateCode(s.name) : ''
          const clickable = !stateFilter && code && stateList.some(([c]) => c === code)
          return (
            <path
              key={s.name}
              d={s.d}
              onClick={clickable && !wasDragged.current
                ? () => { setStateFilter(code); setHovered(null) }
                : undefined}
              style={{
                fill: '#e9eef2',
                stroke: 'white',
                strokeWidth: 0.75 / z,
                outline: 'none',
                cursor: clickable ? (dragging.current ? 'grabbing' : 'pointer') : 'inherit',
                transition: 'fill 0.15s ease',
              }}
              onMouseEnter={clickable ? (e) => { e.currentTarget.style.fill = '#d6e3ec' } : undefined}
              onMouseLeave={clickable ? (e) => { e.currentTarget.style.fill = '#e9eef2' } : undefined}
            />
          )
        })}

        {/* Advisor dots */}
        {jitteredMarkers.map(({ a, x, y }) => {
          const visible = passesDesignation(a)
          const radius = (mapZoomed ? 5 : 4) / z
          const color = dotColor(a, designation, dotColorOverride)
          return (
            <circle
              key={a.slug}
              className="map-marker"
              cx={x}
              cy={y}
              r={radius}
              fill={color}
              stroke="white"
              strokeWidth={1.2 / z}
              style={{
                opacity: visible ? 0.85 : 0,
                transition: 'opacity 0.35s ease-in-out, fill 0.25s ease-in-out',
                pointerEvents: visible && mapZoomed ? 'auto' : 'none',
                cursor: mapZoomed ? (dragging.current ? 'grabbing' : 'pointer') : 'default',
              }}
              onClick={visible && mapZoomed
                ? () => { if (!wasDragged.current) onMarkerClick(a) }
                : undefined}
              onMouseEnter={visible && mapZoomed ? (e) => {
                if (dragging.current) return
                showPreview(a, e.clientX, e.clientY)
              } : undefined}
              onMouseLeave={visible && mapZoomed ? hidePreview : undefined}
            />
          )
        })}
      </g>
    </svg>
    {popup}
    </>
  )
}

export default memo(AdvisorMap)
