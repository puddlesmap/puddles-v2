import { createStaticMapsUrl } from '@vis.gl/react-google-maps'
import type { Event } from '../types/event'
import { HOME_MAP_PREVIEW_STATIC_BOUNDS_PADDING, type HomeMapViewport } from '../components/browse/mapViewConfig'
import {
  expandMapBounds,
  getBoundsFromPoints,
  getMapViewportForBounds,
  type MapBoundsBox,
} from './mapBounds'

import { getPublicEnv } from './env'

export const GOOGLE_MAPS_API_KEY = getPublicEnv('GOOGLE_MAPS_API_KEY')

export function hasGoogleMapsApiKey(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0
}

/**
 * Modern clean roadmap — cool greys, white roads, soft blue water, minimal clutter.
 * Applied on browse Google Map via `styles={...}`.
 */
export const MUTED_GOOGLE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8f9fb' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 2 }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ visibility: 'on' }, { color: '#e8f0e9' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d1d5db' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e5e7eb' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d1d5db' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#93a4b8' }],
  },
]

export function buildEventStaticMapUrl(
  lat: number,
  lng: number,
  markerAddress?: string | null,
): string | null {
  if (!hasGoogleMapsApiKey()) return null

  if (markerAddress) {
    return createStaticMapsUrl({
      apiKey: GOOGLE_MAPS_API_KEY,
      width: 640,
      height: 360,
      scale: 2,
      markers: [{ location: markerAddress }],
      visible: [markerAddress],
      zoom: 15,
      region: 'US',
    })
  }

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
  fixedViewport?: HomeMapViewport
}

function buildStaticMapFromViewport(
  center: { lat: number; lng: number },
  zoom: number,
  mapSize = { width: 640, height: 320 },
): string {
  return createStaticMapsUrl({
    apiKey: GOOGLE_MAPS_API_KEY,
    width: mapSize.width,
    height: mapSize.height,
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
    fixedViewport,
  } = options

  if (fixedViewport) {
    return buildStaticMapFromViewport(
      fixedViewport.center,
      fixedViewport.zoom,
      { width: fixedViewport.mapWidth, height: fixedViewport.mapHeight },
    )
  }

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
