import type { TemporalTab } from './dates'
import type { BrowseFilters } from './filters'
import type { Event } from '../types/event'
import { NEARBY_RADIUS_MILES } from './geo'

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
  if (whereMode.kind === 'nearby') return 'Nearby map'
  if (whereMode.kind === 'city' && whereMode.value === 'all') return 'Nearby cities'
  return whereMode.value
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
  if (whereMode.kind === 'nearby' && !hasNearbyCoords) return null

  const countLabel = `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`

  if (whereMode.kind === 'nearby') {
    return `Within ${NEARBY_RADIUS_MILES} mi of you · ${countLabel}`
  }

  if (whereMode.kind === 'city' && whereMode.value === 'all') {
    return `All cities · ${countLabel}`
  }

  return `${whereMode.value} · ${countLabel}`
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

const PIN_LAYOUTS: Array<{ top: number; left: number }> = [
  { top: 46, left: 48 },
  { top: 32, left: 36 },
  { top: 58, left: 62 },
  { top: 38, left: 72 },
  { top: 62, left: 28 },
]

function normalize(value: number, min: number, max: number): number {
  if (max - min < 0.0001) return 50
  const ratio = (value - min) / (max - min)
  return 18 + ratio * 64
}

export function getHomeMapPinPositions(events: Event[]): HomeMapPinPosition[] {
  const mappable = events
    .filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
    .slice(0, 5)

  if (mappable.length === 0) return []

  const lats = mappable.map((event) => event.lat)
  const lngs = mappable.map((event) => event.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

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
  return PIN_LAYOUTS.slice(0, Math.min(count, 5)).map((position, index) => ({
    ...position,
    isMain: index === 0,
  }))
}
