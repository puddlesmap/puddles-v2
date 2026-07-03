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
