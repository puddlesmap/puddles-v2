import type { City } from '../types/event'
import venueGeoData from '../../data/venue-geo.json'

export type VenueGeoEntry = { city: City; lat: number; lng: number }

export const VENUE_ALIASES: Record<string, string> = venueGeoData.venueAliases
export const VENUE_GEO = venueGeoData.venueGeo as Record<string, VenueGeoEntry>
export const VENUE_ADDRESSES: Record<string, string> = venueGeoData.venueAddresses
export const CITY_CENTERS = venueGeoData.cityCenters as Record<City, { lat: number; lng: number }>
export const LEGACY_PLACEHOLDER_COORDS = venueGeoData.legacyPlaceholderCoords

export function canonicalVenue(venue: string): string {
  return VENUE_ALIASES[venue] ?? venue
}

export function getVenueGeo(venue: string, room = ''): VenueGeoEntry | null {
  const trimmedRoom = room.trim()
  if (trimmedRoom && VENUE_GEO[trimmedRoom]) return VENUE_GEO[trimmedRoom]

  const canonical = canonicalVenue(venue)
  return VENUE_GEO[canonical] ?? null
}

/** Resolve venue geo from name, room, or a matching street address when venue is blank. */
export function getVenueGeoForEvent(venue: string, room = '', address = ''): VenueGeoEntry | null {
  const direct = getVenueGeo(venue, room)
  if (direct) return direct

  const normalizedAddress = address.toLowerCase().replace(/\s+/g, ' ')
  if (!normalizedAddress) return null

  for (const [name, streetAddress] of Object.entries(VENUE_ADDRESSES)) {
    const street = streetAddress.split(',')[0].trim().toLowerCase()
    if (street.length >= 8 && normalizedAddress.includes(street)) {
      return VENUE_GEO[name] ?? null
    }
  }

  return null
}

export function getCityCenter(city: City): { lat: number; lng: number } {
  return CITY_CENTERS[city]
}

export function isPlaceholderMapCoordinates(lat: number, lng: number): boolean {
  const { lat: placeholderLat, lng: placeholderLng } = LEGACY_PLACEHOLDER_COORDS
  return (
    Math.abs(lat - placeholderLat) < 0.0001 &&
    Math.abs(lng - placeholderLng) < 0.0001
  )
}
