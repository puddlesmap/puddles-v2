import type { TemporalTab } from './dates'
import type { BrowseFilters } from './filters'
import type { Event } from '../types/event'
import {
  HOME_MAP_ALL_CITIES_BOUNDS_PADDING,
  HOME_MAP_AREA_BOUNDS,
  HOME_MAP_CITY_BOUNDS_PADDING,
  HOME_MAP_CITY_CENTERS,
  HOME_MAP_CITY_VIEWPORT_ZOOM,
  HOME_MAP_PREVIEW_MAP_SIZE,
  HOME_MAP_PREVIEW_VIEWPORT,
  type HomeMapAreaKey,
  type HomeMapViewport,
} from '../components/browse/mapViewConfig'
import { getHomeFilterResultsSummary } from './browseResultsCopy'
import type { MapBoundsBox } from './mapBounds'
import { projectLatLngToMapPercent } from './mapBounds'

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

export type { HomeMapViewport } from '../components/browse/mapViewConfig'

export interface HomeMapPreviewFraming {
  areaBounds: MapBoundsBox
  boundsPadding: number
  anchorPoints?: Array<{ lat: number; lng: number }>
  viewport: HomeMapViewport
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

function getCityViewport(city: Exclude<HomeMapAreaKey, 'all'>): HomeMapViewport {
  return {
    center: HOME_MAP_CITY_CENTERS[city],
    zoom: HOME_MAP_CITY_VIEWPORT_ZOOM,
    mapWidth: HOME_MAP_PREVIEW_MAP_SIZE.width,
    mapHeight: HOME_MAP_PREVIEW_MAP_SIZE.height,
  }
}

function getAllCitiesViewport(): HomeMapViewport {
  return {
    center: HOME_MAP_PREVIEW_VIEWPORT.center,
    zoom: HOME_MAP_PREVIEW_VIEWPORT.zoom,
    mapWidth: HOME_MAP_PREVIEW_MAP_SIZE.width,
    mapHeight: HOME_MAP_PREVIEW_MAP_SIZE.height,
  }
}

export function resolveHomeMapPreviewFraming(
  whereMode: HomeWhereMode,
  _events: Event[],
  _userCoords?: { lat: number; lng: number } | null,
): HomeMapPreviewFraming {
  if (whereMode.kind === 'nearby' || whereMode.value === 'all') {
    return {
      areaBounds: HOME_MAP_AREA_BOUNDS.all,
      boundsPadding: HOME_MAP_ALL_CITIES_BOUNDS_PADDING,
      viewport: getAllCitiesViewport(),
    }
  }

  return {
    areaBounds: HOME_MAP_AREA_BOUNDS[whereMode.value],
    boundsPadding: HOME_MAP_CITY_BOUNDS_PADDING,
    viewport: getCityViewport(whereMode.value),
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

const HOME_MAP_PREVIEW_MAX_PINS = 3

const ALL_CITIES_PIN_ORDER: Array<keyof typeof HOME_MAP_CITY_CENTERS> = [
  'Palo Alto',
  'Los Altos',
  'Mountain View',
]

function projectPointToPin(
  lat: number,
  lng: number,
  viewport: HomeMapViewport,
  isMain: boolean,
): HomeMapPinPosition {
  const { top, left } = projectLatLngToMapPercent(
    lat,
    lng,
    viewport.center,
    viewport.zoom,
    viewport.mapWidth,
    viewport.mapHeight,
  )

  return { top, left, isMain }
}

/** Decorative pins anchored to city centers and projected onto the preview viewport. */
export function getHomeMapDecorativePinPositions(
  count: number,
  whereMode: HomeWhereMode,
  viewport: HomeMapViewport,
): HomeMapPinPosition[] {
  if (count <= 0) return []

  if (whereMode.kind === 'city' && whereMode.value !== 'all') {
    const center = HOME_MAP_CITY_CENTERS[whereMode.value]
    return [projectPointToPin(center.lat, center.lng, viewport, true)]
  }

  const pinCount = Math.min(count, HOME_MAP_PREVIEW_MAX_PINS)
  return ALL_CITIES_PIN_ORDER.slice(0, pinCount).map((city, index) => {
    const center = HOME_MAP_CITY_CENTERS[city]
    return projectPointToPin(center.lat, center.lng, viewport, index === 0)
  })
}
