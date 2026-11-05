import { HOME_MAP_CITY_CENTERS } from '../components/browse/mapViewConfig'

export type BrowseSearchAnchor = {
  lat: number
  lng: number
  label: string
}

/** Core Bay Area ZIPs → approximate centers (no external geocoder). */
const ZIP_ANCHORS: Record<string, BrowseSearchAnchor> = {
  // Palo Alto / Stanford
  '94301': { lat: 37.4443, lng: -122.1597, label: '94301' },
  '94303': { lat: 37.4419, lng: -122.143, label: '94303' },
  '94304': { lat: 37.409, lng: -122.15, label: '94304' },
  '94305': { lat: 37.4275, lng: -122.17, label: '94305' },
  '94306': { lat: 37.418, lng: -122.127, label: '94306' },
  // Los Altos / Los Altos Hills
  '94022': { lat: 37.3852, lng: -122.1141, label: '94022' },
  '94024': { lat: 37.379, lng: -122.1, label: '94024' },
  // Mountain View
  '94040': { lat: 37.3861, lng: -122.0839, label: '94040' },
  '94041': { lat: 37.389, lng: -122.078, label: '94041' },
  '94043': { lat: 37.405, lng: -122.078, label: '94043' },
  // Sunnyvale
  '94085': { lat: 37.388, lng: -122.018, label: '94085' },
  '94086': { lat: 37.3688, lng: -122.0363, label: '94086' },
  '94087': { lat: 37.35, lng: -122.03, label: '94087' },
  '94089': { lat: 37.405, lng: -122.0, label: '94089' },
}

const CITY_ALIASES: Array<{ match: RegExp; city: keyof typeof HOME_MAP_CITY_CENTERS }> = [
  { match: /^palo\s*alto$/i, city: 'Palo Alto' },
  { match: /^los\s*altos(\s*hills)?$/i, city: 'Los Altos' },
  { match: /^mountain\s*view$/i, city: 'Mountain View' },
  { match: /^mtv$/i, city: 'Mountain View' },
  { match: /^sunnyvale$/i, city: 'Sunnyvale' },
]

export function isZipQuery(raw: string): boolean {
  return /^\d{5}$/.test(raw.trim())
}

/** Resolve typed city name or 5-digit ZIP to a search anchor for ~8 mi radius. */
export function resolveBrowseSearchAnchor(raw: string): BrowseSearchAnchor | null {
  const q = raw.trim()
  if (!q) return null

  if (isZipQuery(q)) {
    return ZIP_ANCHORS[q] ?? null
  }

  for (const alias of CITY_ALIASES) {
    if (alias.match.test(q)) {
      const center = HOME_MAP_CITY_CENTERS[alias.city]
      return { lat: center.lat, lng: center.lng, label: alias.city }
    }
  }

  const lower = q.toLowerCase()
  for (const [city, center] of Object.entries(HOME_MAP_CITY_CENTERS)) {
    if (city.toLowerCase() === lower || city.toLowerCase().includes(lower)) {
      return { lat: center.lat, lng: center.lng, label: city }
    }
  }

  return null
}

export function formatSearchAnchorLocationLabel(anchor: BrowseSearchAnchor): string {
  return `Near ${anchor.label}`
}
