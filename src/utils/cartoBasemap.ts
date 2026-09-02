import { getPublicEnv } from './env'

/** Free CARTO raster basemap (Leaflet). Key required — see carto.com/basemaps/apikey */
const CARTO_VOYAGER_TILE_BASE =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

export const CARTO_BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export function getCartoVoyagerTileUrl(): string {
  const key = getPublicEnv('CARTO_BASEMAP_API_KEY')
  if (!key) return CARTO_VOYAGER_TILE_BASE
  return `${CARTO_VOYAGER_TILE_BASE}?key=${encodeURIComponent(key)}`
}
