import type { TemporalTab } from './dates'
import type { BrowseFilters } from './filters'
import type { Event } from '../types/event'
import {
  HOME_MAP_ALL_CITIES_BOUNDS_PADDING,
  HOME_MAP_AREA_BOUNDS,
  HOME_MAP_CITY_BOUNDS_PADDING,
  HOME_MAP_NEARBY_BOUNDS_PADDING,
} from '../components/browse/mapViewConfig'
import { getHomeFilterResultsSummary } from './browseResultsCopy'
import type { MapBoundsBox } from './mapBounds'
import { getBoundsFromPoints, getEventsWithCoordinates } from './mapBounds'

export type HomeWhereMode =
  | { kind: 'nearby' }
  | { kind: 'city'; value: 'all' | 'Palo Alto' | 'Los Altos' | 'Mountain View' }

export interface HomeMapPreviewContext {
  whereMode: HomeWhereMode
  temporalTab: TemporalTab
  eventCount: number
  hasNearbyCoords: boolean
  isRequesting: boolean
}

function getNearLocationLabel(whereMode: HomeWhereMode): string {
  if (whereMode.kind === 'nearby') return 'you'
  if (whereMode.kind === 'city' && whereMode.value === 'all') return 'all cities'
  return whereMode.value
}

function formatActivitiesNear(count: number, location: string): string {
  const noun = count === 1 ? 'activity' : 'activities'
  return `${count} ${noun} near ${location}`
}

export function getHomeMapPreviewStatus({
  whereMode,
  eventCount,
  hasNearbyCoords,
  isRequesting,
}: HomeMapPreviewContext): string {
  if (isRequesting) return 'Finding nearby activities…'

  if (whereMode.kind === 'nearby' && !hasNearbyCoords) {
    return 'Enable location to see nearby activities'
  }

  const location = getNearLocationLabel(whereMode)

  if (eventCount === 0) {
    return `No activities near ${location}`
  }

  return formatActivitiesNear(eventCount, location)
}

/** Map preview footer label only — no result counts (experiment-home). */
export function getHomeMapPreviewLabelRefined(whereMode: HomeWhereMode): string {
  if (whereMode.kind === 'nearby') return 'Near you'
  if (whereMode.kind === 'city' && whereMode.value === 'all') return 'Nearby cities'
  return whereMode.value
}

export interface HomeMapPreviewFraming {
  areaBounds: MapBoundsBox
  boundsPadding: number
  anchorPoints?: Array<{ lat: number; lng: number }>
}

const MAX_NEARBY_PREVIEW_SPAN = 0.42

function isReasonableNearbySpan(bounds: MapBoundsBox): boolean {
  return bounds.north - bounds.south <= MAX_NEARBY_PREVIEW_SPAN && bounds.east - bounds.west <= MAX_NEARBY_PREVIEW_SPAN
}

export function resolveHomeMapPreviewFraming(
  whereMode: HomeWhereMode,
  events: Event[],
  userCoords?: { lat: number; lng: number } | null,
): HomeMapPreviewFraming {
  if (whereMode.kind === 'nearby') {
    if (userCoords) {
      const mappable = getEventsWithCoordinates(events)
      const anchorPoints = [
        { lat: userCoords.lat, lng: userCoords.lng },
        ...mappable.map((event) => ({ lat: event.lat, lng: event.lng })),
      ]
      const anchorBounds = getBoundsFromPoints(anchorPoints)

      if (anchorBounds && isReasonableNearbySpan(anchorBounds)) {
        return {
          areaBounds: anchorBounds,
          boundsPadding: HOME_MAP_NEARBY_BOUNDS_PADDING,
          anchorPoints,
        }
      }

      if (mappable.length > 0) {
        const eventBounds = getBoundsFromPoints(
          mappable.map((event) => ({ lat: event.lat, lng: event.lng })),
        )
        if (eventBounds) {
          return {
            areaBounds: eventBounds,
            boundsPadding: HOME_MAP_NEARBY_BOUNDS_PADDING,
          }
        }
      }
    }

    return {
      areaBounds: HOME_MAP_AREA_BOUNDS.all,
      boundsPadding: HOME_MAP_ALL_CITIES_BOUNDS_PADDING,
    }
  }

  if (whereMode.value === 'all') {
    return {
      areaBounds: HOME_MAP_AREA_BOUNDS.all,
      boundsPadding: HOME_MAP_ALL_CITIES_BOUNDS_PADDING,
    }
  }

  return {
    areaBounds: HOME_MAP_AREA_BOUNDS[whereMode.value],
    boundsPadding: HOME_MAP_CITY_BOUNDS_PADDING,
  }
}

/** Results summary below map preview (experiment-home). */
export function getHomeResultsSummaryRefined({
  whereMode,
  eventCount,
  hasNearbyCoords,
}: {
  whereMode: HomeWhereMode
  eventCount: number
  hasNearbyCoords: boolean
}): string | null {
  if (whereMode.kind === 'nearby') {
    return getHomeFilterResultsSummary({
      whereMode: { kind: 'nearby' },
      eventCount,
      hasNearbyCoords,
    })
  }

  return getHomeFilterResultsSummary({
    whereMode: { kind: 'city', value: whereMode.value },
    eventCount,
    hasNearbyCoords: true,
  })
}

export function homeFiltersToBrowseFilters(
  whereMode: HomeWhereMode,
  temporalTab: TemporalTab,
  current: BrowseFilters,
): BrowseFilters {
  const city = whereMode.kind === 'nearby' ? 'nearby' : whereMode.value

  return {
    ...current,
    city,
    day: temporalTab,
    cityLocked: whereMode.kind === 'city' && whereMode.value !== 'all',
  }
}

export interface HomeMapPinPosition {
  top: number
  left: number
  isMain: boolean
}

const HOME_MAP_PREVIEW_MAX_PINS = 7

const PIN_LAYOUTS: Array<{ top: number; left: number }> = [
  { top: 46, left: 48 },
  { top: 30, left: 34 },
  { top: 58, left: 64 },
  { top: 36, left: 74 },
  { top: 64, left: 26 },
  { top: 42, left: 58 },
  { top: 52, left: 40 },
]

function normalize(value: number, min: number, max: number): number {
  if (max - min < 0.0001) return 50
  const ratio = (value - min) / (max - min)
  return 14 + ratio * 70
}

export function getHomeMapPinPositions(
  events: Event[],
  areaBounds?: MapBoundsBox,
): HomeMapPinPosition[] {
  const mappable = events
    .filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
    .slice(0, HOME_MAP_PREVIEW_MAX_PINS)

  if (mappable.length === 0) return []

  const minLat = areaBounds?.south ?? Math.min(...mappable.map((event) => event.lat))
  const maxLat = areaBounds?.north ?? Math.max(...mappable.map((event) => event.lat))
  const minLng = areaBounds?.west ?? Math.min(...mappable.map((event) => event.lng))
  const maxLng = areaBounds?.east ?? Math.max(...mappable.map((event) => event.lng))

  if (mappable.length === 1) {
    return [{ top: 46, left: 48, isMain: true }]
  }

  return mappable.map((event, index) => ({
    top: normalize(event.lat, minLat, maxLat),
    left: normalize(event.lng, minLng, maxLng),
    isMain: index === 0,
  }))
}

/** Fallback pin positions when events lack coordinates. */
export function getHomeMapFallbackPinPositions(count: number): HomeMapPinPosition[] {
  if (count <= 0) return []
  return PIN_LAYOUTS.slice(0, Math.min(count, HOME_MAP_PREVIEW_MAX_PINS)).map((position, index) => ({
    ...position,
    isMain: index === 0,
  }))
}
