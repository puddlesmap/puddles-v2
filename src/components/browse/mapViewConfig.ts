/** Default map zoom before fit-bounds runs. Slightly wider than street-level. */
export const BROWSE_MAP_DEFAULT_ZOOM = 11

/** Zoom when focusing a single event or user location. */
export const BROWSE_MAP_FOCUS_ZOOM = 13

/** Zoom when only one event is in view — keep neighbors visible when possible. */
export const BROWSE_MAP_SINGLE_EVENT_ZOOM = 12

/** Leaflet fitBounds padding factor (higher = more zoomed out). */
export const BROWSE_MAP_BOUNDS_PADDING = 0.36

/** Google Maps fitBounds pixel padding. */
export const BROWSE_MAP_GOOGLE_FIT_PADDING = 80

/** Home map preview — wider framing so more pins and city context stay visible. */
export const HOME_MAP_PREVIEW_BOUNDS_PADDING = 0.58

/** Home map preview initial zoom before fit-bounds runs. */
export const HOME_MAP_PREVIEW_DEFAULT_ZOOM = 11

/** Home map preview zoom when only one event is in view. */
export const HOME_MAP_PREVIEW_SINGLE_EVENT_ZOOM = 11

/** Extra padding around event bounds for Google static home preview maps. */
export const HOME_MAP_PREVIEW_STATIC_BOUNDS_PADDING = 0.38

/** Geographic bounds for home preview map framing by selected area. */
export const HOME_MAP_AREA_BOUNDS = {
  all: { north: 37.485, south: 37.345, west: -122.205, east: -122.025 },
  'Palo Alto': { north: 37.478, south: 37.375, west: -122.202, east: -122.084 },
  'Los Altos': { north: 37.41, south: 37.35, west: -122.14, east: -122.07 },
  'Mountain View': { north: 37.42, south: 37.36, west: -122.12, east: -122.03 },
} as const

/** Puddles service area — pins outside this box are hidden on the home preview map. */
export const HOME_MAP_SERVICE_BOUNDS = {
  north: 37.48,
  south: 37.32,
  west: -122.2,
  east: -122.02,
} as const

/** City-center coordinates for decorative home preview pins. */
export const HOME_MAP_CITY_CENTERS = {
  'Palo Alto': { lat: 37.4419, lng: -122.143 },
  'Los Altos': { lat: 37.3852, lng: -122.1141 },
  'Mountain View': { lat: 37.3861, lng: -122.0839 },
} as const

/** Fixed viewport for the compact "Nearby cities" home preview map. */
export const HOME_MAP_PREVIEW_VIEWPORT = {
  center: { lat: 37.405, lng: -122.112 },
  zoom: 11,
} as const

/** Match `.home-map-preview__canvas` aspect ratio (21 / 9). */
export const HOME_MAP_PREVIEW_MAP_SIZE = {
  width: 840,
  height: 360,
} as const

export interface HomeMapViewport {
  center: { lat: number; lng: number }
  zoom: number
  mapWidth: number
  mapHeight: number
}

export const HOME_MAP_CITY_VIEWPORT_ZOOM = 13

export type HomeMapAreaKey = keyof typeof HOME_MAP_AREA_BOUNDS

/** Leaflet/static-map padding when fitting all three cities. */
export const HOME_MAP_ALL_CITIES_BOUNDS_PADDING = 0.04

/** Leaflet/static-map padding when focusing a single city. */
export const HOME_MAP_CITY_BOUNDS_PADDING = 0.06

/** Leaflet/static-map padding when fitting nearby pins around the user. */
export const HOME_MAP_NEARBY_BOUNDS_PADDING = 0.18
