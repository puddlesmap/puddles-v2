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

export function getMapBoundsCenter(bounds: MapBoundsBox): { lat: number; lng: number } {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  }
}

export function expandMapBounds(bounds: MapBoundsBox, paddingRatio: number): MapBoundsBox {
  const latSpan = Math.max(bounds.north - bounds.south, 0.01)
  const lngSpan = Math.max(bounds.east - bounds.west, 0.01)
  const padLat = latSpan * paddingRatio
  const padLng = lngSpan * paddingRatio

  return {
    north: bounds.north + padLat,
    south: bounds.south - padLat,
    east: bounds.east + padLng,
    west: bounds.west - padLng,
  }
}

export function getBoundsFromPoints(
  points: Array<{ lat: number; lng: number }>,
  minSpan = 0.035,
): MapBoundsBox | null {
  if (points.length === 0) return null

  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)
  let north = Math.max(...lats)
  let south = Math.min(...lats)
  let east = Math.max(...lngs)
  let west = Math.min(...lngs)

  if (north - south < minSpan) {
    const midLat = (north + south) / 2
    north = midLat + minSpan / 2
    south = midLat - minSpan / 2
  }

  if (east - west < minSpan) {
    const midLng = (east + west) / 2
    east = midLng + minSpan / 2
    west = midLng - minSpan / 2
  }

  return { north, south, east, west }
}

/** Zoom level that fits bounds into a static map viewport. */
export function getZoomLevelForBounds(
  bounds: MapBoundsBox,
  mapWidth: number,
  mapHeight: number,
): number {
  const WORLD_DIM = { height: 256, width: 256 }
  const ZOOM_MAX = 15
  const ZOOM_MIN = 9

  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180)
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2
  }

  const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI
  const lngDiff = bounds.east - bounds.west
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360

  const latZoom = Math.log(mapHeight / WORLD_DIM.height / latFraction) / Math.LN2
  const lngZoom = Math.log(mapWidth / WORLD_DIM.width / lngFraction) / Math.LN2

  return Math.min(Math.max(Math.floor(Math.min(latZoom, lngZoom)), ZOOM_MIN), ZOOM_MAX)
}

export function getMapViewportForBounds(
  bounds: MapBoundsBox,
  options: {
    mapWidth?: number
    mapHeight?: number
    paddingRatio?: number
    zoomOffset?: number
  } = {},
): { center: { lat: number; lng: number }; zoom: number; bounds: MapBoundsBox } {
  const {
    mapWidth = 640,
    mapHeight = 320,
    paddingRatio = 0,
    zoomOffset = 0,
  } = options
  const expandedBounds = paddingRatio > 0 ? expandMapBounds(bounds, paddingRatio) : bounds

  return {
    center: getMapBoundsCenter(expandedBounds),
    zoom: getZoomLevelForBounds(expandedBounds, mapWidth, mapHeight) + zoomOffset,
    bounds: expandedBounds,
  }
}

/** True when the map center has moved meaningfully from the search baseline. */
export function hasMapMovedFromBaseline(
  currentCenter: { lat: number; lng: number },
  baselineCenter: { lat: number; lng: number },
  thresholdMeters = 450,
): boolean {
  return haversineDistanceMeters(currentCenter, baselineCenter) > thresholdMeters
}
