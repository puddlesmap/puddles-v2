import type { Event } from '../types/event'

export const NEARBY_RADIUS_MILES = 5

const METERS_PER_MILE = 1609.344
const EARTH_RADIUS_METERS = 6371000

export interface GeoPoint {
  lat: number
  lng: number
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE
}

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function eventDistanceMeters(event: Event, origin: GeoPoint): number | null {
  if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return null
  return haversineDistanceMeters(origin, { lat: event.lat, lng: event.lng })
}

export function filterEventsByRadius(
  events: Event[],
  origin: GeoPoint,
  radiusMiles: number,
): Event[] {
  const radiusMeters = milesToMeters(radiusMiles)
  return events.filter((event) => {
    const distance = eventDistanceMeters(event, origin)
    return distance !== null && distance <= radiusMeters
  })
}

export function sortEventsByDistance(events: Event[], origin: GeoPoint): Event[] {
  return [...events].sort((a, b) => {
    const distA = eventDistanceMeters(a, origin) ?? Number.POSITIVE_INFINITY
    const distB = eventDistanceMeters(b, origin) ?? Number.POSITIVE_INFINITY
    return distA - distB
  })
}

export function formatNearbyContextLabel(radiusMiles: number): string {
  return `Within ${radiusMiles} mi of you`
}
