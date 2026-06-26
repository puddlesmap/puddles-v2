import { createStaticMapsUrl } from '@vis.gl/react-google-maps'
import type { Event } from '../types/event'

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

export function buildDiscoveryStaticMapUrl(events: Event[]): string | null {
  if (!hasGoogleMapsApiKey()) return null

  const mappable = events.filter(
    (event) => Number.isFinite(event.lat) && Number.isFinite(event.lng),
  )
  if (mappable.length === 0) return null

  if (mappable.length === 1) {
    return createStaticMapsUrl({
      apiKey: GOOGLE_MAPS_API_KEY,
      width: 640,
      height: 320,
      scale: 2,
      center: { lat: mappable[0].lat, lng: mappable[0].lng },
      zoom: 13,
    })
  }

  return createStaticMapsUrl({
    apiKey: GOOGLE_MAPS_API_KEY,
    width: 640,
    height: 320,
    scale: 2,
    visible: mappable.map((event) => ({ lat: event.lat, lng: event.lng })),
  })
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
