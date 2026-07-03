import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const venueGeoData = JSON.parse(readFileSync(join(__dirname, '../data/venue-geo.json'), 'utf8'))

export const VENUE_ALIASES = venueGeoData.venueAliases
export const VENUE_GEO = venueGeoData.venueGeo
export const VENUE_ADDRESSES = venueGeoData.venueAddresses
export const CITY_CENTERS = venueGeoData.cityCenters
export const LEGACY_PLACEHOLDER_COORDS = venueGeoData.legacyPlaceholderCoords

export function canonicalVenue(venue) {
  return VENUE_ALIASES[venue] ?? venue
}

export function getCityCenter(city) {
  return CITY_CENTERS[city] ?? CITY_CENTERS['Palo Alto']
}
