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

export function getVenueGeo(venue, room = '') {
  const trimmedRoom = String(room).trim()
  if (trimmedRoom && VENUE_GEO[trimmedRoom]) return VENUE_GEO[trimmedRoom]

  const canonical = canonicalVenue(venue)
  return VENUE_GEO[canonical] ?? null
}

export function getVenueGeoForEvent(venue, room = '', address = '') {
  const direct = getVenueGeo(venue, room)
  if (direct) return direct

  const normalizedAddress = String(address).toLowerCase().replace(/\s+/g, ' ')
  if (!normalizedAddress) return null

  for (const [name, streetAddress] of Object.entries(VENUE_ADDRESSES)) {
    const street = streetAddress.split(',')[0].trim().toLowerCase()
    if (street.length >= 8 && normalizedAddress.includes(street)) {
      return VENUE_GEO[name] ?? null
    }
  }

  return null
}

export function getCityCenter(city) {
  return CITY_CENTERS[city] ?? CITY_CENTERS['Palo Alto']
}
