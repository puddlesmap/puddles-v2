import type { Event } from '../types/event'
import { haversineDistanceMeters } from './geo'

/** Default center: Palo Alto area */
export const DEFAULT_MAP_CENTER: [number, number] = [37.4219, -122.1142]

export interface MapBoundsBox {
  north: number
  south: number
  east: number
  west: number
}

export function getEventsMapCenter(events: Event[]): [number, number] {
  if (events.length === 0) return DEFAULT_MAP_CENTER

  const lat = events.reduce((sum, event) => sum + event.lat, 0) / events.length
  const lng = events.reduce((sum, event) => sum + event.lng, 0) / events.length
  return [lat, lng]
}

export function getEventsWithCoordinates(events: Event[]): Event[] {
  return events.filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
}

export function boundsBoxFromLeaflet(bounds: {
  getNorth: () => number
  getSouth: () => number
  getEast: () => number
  getWest: () => number
}): MapBoundsBox {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}

export function isEventInBounds(event: Event, bounds: MapBoundsBox): boolean {
  if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return false
  return (
    event.lat >= bounds.south &&
    event.lat <= bounds.north &&
    event.lng >= bounds.west &&
    event.lng <= bounds.east
  )
}

export function filterEventsInBounds(events: Event[], bounds: MapBoundsBox): Event[] {
  return events.filter((event) => isEventInBounds(event, bounds))
}

/** True when the map center has moved meaningfully from the search baseline. */
export function hasMapMovedFromBaseline(
  currentCenter: { lat: number; lng: number },
  baselineCenter: { lat: number; lng: number },
  thresholdMeters = 450,
): boolean {
  return haversineDistanceMeters(currentCenter, baselineCenter) > thresholdMeters
}
