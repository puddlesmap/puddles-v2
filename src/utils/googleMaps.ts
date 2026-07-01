import { createStaticMapsUrl } from '@vis.gl/react-google-maps'
import type { Event } from '../types/event'
import { HOME_MAP_PREVIEW_STATIC_BOUNDS_PADDING } from '../components/browse/mapViewConfig'
import {
  expandMapBounds,
  getBoundsFromPoints,
  getMapViewportForBounds,
  type MapBoundsBox,
} from './mapBounds'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''

export function hasGoogleMapsApiKey(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0
}

/** Slightly muted roadmap — closer to the current Carto preview feel. */
export const MUTED_GOOGLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -55 }, { lightness: 8 }] },
  { elementType: 'labels.text.fill', stylers: [{ saturation: -35 }, { lightness: 20 }] },
  { elementType: 'labels.text.stroke', stylers: [{ lightness: 100 }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ saturation: -40 }, { lightness: 10 }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -45 }, { lightness: 12 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ saturation: -30 }, { lightness: 10 }] },
]

export function buildEventStaticMapUrl(lat: number, lng: number): string | null {
  if (!hasGoogleMapsApiKey()) return null

  return createStaticMapsUrl({
    apiKey: GOOGLE_MAPS_API_KEY,
    width: 640,
    height: 360,
    scale: 2,
    center: { lat, lng },
    zoom: 15,
  })
}

export interface DiscoveryStaticMapOptions {
  /** Wider framing for compact home preview cards. */
  looseFraming?: boolean
  areaBounds?: MapBoundsBox
  anchorPoints?: Array<{ lat: number; lng: number }>
  boundsPadding?: number
}

function buildStaticMapFromViewport(
  center: { lat: number; lng: number },
  zoom: number,
): string {
  return createStaticMapsUrl({
    apiKey: GOOGLE_MAPS_API_KEY,
    width: 640,
    height: 320,
    scale: 2,
    center,
    zoom,
    region: 'US',
  })
}

export function buildDiscoveryStaticMapUrl(
  events: Event[],
  options: DiscoveryStaticMapOptions = {},
): string | null {
  if (!hasGoogleMapsApiKey()) return null

  const mappable = events.filter(
    (event) => Number.isFinite(event.lat) && Number.isFinite(event.lng),
  )

  const {
    looseFraming = false,
    areaBounds,
    anchorPoints,
    boundsPadding = looseFraming ? HOME_MAP_PREVIEW_STATIC_BOUNDS_PADDING : 0.08,
  } = options

  if (anchorPoints && anchorPoints.length > 0) {
    const pointBounds = getBoundsFromPoints(anchorPoints)
    if (!pointBounds) return null

    const viewport = getMapViewportForBounds(pointBounds, {
      paddingRatio: boundsPadding,
      zoomOffset: 1,
    })
    return buildStaticMapFromViewport(viewport.center, viewport.zoom)
  }

  if (areaBounds) {
    const viewport = getMapViewportForBounds(areaBounds, {
      paddingRatio: boundsPadding,
      zoomOffset: 1,
    })
    return buildStaticMapFromViewport(viewport.center, viewport.zoom)
  }

  if (mappable.length === 0) return null

  if (mappable.length === 1) {
    return buildStaticMapFromViewport(
      { lat: mappable[0].lat, lng: mappable[0].lng },
      looseFraming ? 12 : 13,
    )
  }

  const eventBounds = getBoundsFromPoints(
    mappable.map((event) => ({ lat: event.lat, lng: event.lng })),
  )
  if (!eventBounds) return null

  const viewport = getMapViewportForBounds(
    expandMapBounds(
      eventBounds,
      looseFraming ? HOME_MAP_PREVIEW_STATIC_BOUNDS_PADDING : boundsPadding,
    ),
    { zoomOffset: looseFraming ? 0 : 1 },
  )

  return buildStaticMapFromViewport(viewport.center, viewport.zoom)
}

export function boundsBoxFromGoogle(bounds: google.maps.LatLngBounds) {
  const northEast = bounds.getNorthEast()
  const southWest = bounds.getSouthWest()

  return {
    north: northEast.lat(),
    south: southWest.lat(),
    east: northEast.lng(),
    west: southWest.lng(),
  }
}
