import { getPublicEnv } from './env'

/** CARTO Voyager — free with a basemap API key (carto.com/basemaps/apikey). */
const CARTO_VOYAGER_TILE =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * OSM raster tiles — no API key. Temporary Leaflet fallback when Google Maps and
 * CARTO keys are unset. Prefer Google Maps for production (see docs/google-maps.md).
 * Keep traffic light; heavy production use should not rely on openstreetmap.org tiles.
 */
const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export type LeafletBasemap = {
  url: string
  attribution: string
  /** Leaflet TileLayer subdomains */
  subdomains: string[]
}

/** @deprecated Use getLeafletBasemap().attribution */
export const CARTO_BASEMAP_ATTRIBUTION = CARTO_ATTRIBUTION

/**
 * Leaflet tile config when Google Maps is unavailable.
 * Prefer CARTO when keyed; otherwise OSM so tiles are not “API key required”.
 */
export function getLeafletBasemap(): LeafletBasemap {
  const cartoKey = getPublicEnv('CARTO_BASEMAP_API_KEY')
  if (cartoKey) {
    return {
      url: `${CARTO_VOYAGER_TILE}?key=${encodeURIComponent(cartoKey)}`,
      attribution: CARTO_ATTRIBUTION,
      subdomains: ['a', 'b', 'c', 'd'],
    }
  }

  return {
    url: OSM_TILE,
    attribution: OSM_ATTRIBUTION,
    subdomains: ['a', 'b', 'c'],
  }
}

/** @deprecated Use getLeafletBasemap().url */
export function getCartoVoyagerTileUrl(): string {
  return getLeafletBasemap().url
}
