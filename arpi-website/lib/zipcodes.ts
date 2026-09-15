// lib/zipcodes.ts
// Thin wrapper around the existing zip-centroids dataset and geo.js helpers.
// Server-side only — the zip-centroids JSON is ~1.1MB and must not be bundled
// into client components.
//
// The zip-centroids.json file does NOT include city/state names — only lat/lng.
// For CELP partner lookup we only need coordinates; city+state come from the
// form itself. getZipInfo returns city/state as empty strings when unavailable.

import zipCentroids from './zip-centroids.json'

export interface ZipInfo {
  lat: number
  lng: number
  city: string
  state: string
}

/**
 * Look up coordinates for a US ZIP code.
 * Accepts messy input ("02072-1234", " 90210 ", etc.).
 * Returns null if not found.
 * city and state are always empty strings (not in dataset); callers supply
 * them from the form.
 */
export function getZipCoords(zip: string): ZipInfo | null {
  if (!zip) return null
  const m = String(zip).match(/\d+/)
  if (!m) return null
  const z = m[0].slice(0, 5).padStart(5, '0')
  const hit = (zipCentroids as unknown as Record<string, [number, number]>)[z]
  if (!hit) return null
  return { lat: hit[0], lng: hit[1], city: '', state: '' }
}

/** Haversine distance in miles between two lat/lng points. */
export function milesBetween(
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
