import { useEffect, useRef } from 'react'
import { Marker, useApiIsLoaded, useMap } from '@vis.gl/react-google-maps'
import type { Event } from '../../types/event'
import { DEFAULT_MAP_CENTER, hasMapMovedFromBaseline } from '../../utils/mapBounds'

const LOCAL_ZOOM = 14

export function GoogleMapFitEvents({
  events,
  resetKey,
}: {
  events: Event[]
  resetKey: string
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (events.length === 0) {
      map.setCenter({ lat: DEFAULT_MAP_CENTER[0], lng: DEFAULT_MAP_CENTER[1] })
      map.setZoom(12)
      return
    }

    if (events.length === 1) {
      map.setCenter({ lat: events[0].lat, lng: events[0].lng })
      map.setZoom(14)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    events.forEach((event) => bounds.extend({ lat: event.lat, lng: event.lng }))
    map.fitBounds(bounds, 48)
  }, [events, resetKey, map])

  return null
}

export function GoogleMapSearchAreaDetector({
  resetKey,
  active,
  onMovedAway,
  onReset,
}: {
  resetKey: string
  active: boolean
  onMovedAway: () => void
  onReset: () => void
}) {
  const map = useMap()
  const baselineRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    onReset()
    baselineRef.current = null

    const timer = window.setTimeout(() => {
      const center = map?.getCenter()
      if (!center) return
      baselineRef.current = { lat: center.lat(), lng: center.lng() }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [resetKey, map, onReset])

  useEffect(() => {
    if (!map || !active) return

    const listener = map.addListener('idle', () => {
      const baseline = baselineRef.current
      if (!baseline) return

      const center = map.getCenter()
      if (!center) return

      if (hasMapMovedFromBaseline({ lat: center.lat(), lng: center.lng() }, baseline)) {
        onMovedAway()
      }
    })

    return () => listener.remove()
  }, [active, map, onMovedAway])

  return null
}

export function GoogleMapPanToEvent({
  event,
  panTrigger,
}: {
  event: Event | null
  panTrigger: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || !event || panTrigger === 0) return
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return

    map.panTo({ lat: event.lat, lng: event.lng })
    if ((map.getZoom() ?? 0) < LOCAL_ZOOM) {
      map.setZoom(LOCAL_ZOOM)
    }
  }, [event, panTrigger, map])

  return null
}

export function GoogleMapLocateHandler({
  coords,
  trigger,
}: {
  coords: { lat: number; lng: number } | null
  trigger: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || !coords || trigger === 0) return
    map.panTo(coords)
    map.setZoom(LOCAL_ZOOM)
  }, [coords, trigger, map])

  return null
}

export function GoogleMapInstanceCapture({ onReady }: { onReady: (map: google.maps.Map) => void }) {
  const map = useMap()

  useEffect(() => {
    if (map) onReady(map)
  }, [map, onReady])

  return null
}

export function GoogleUserLocationMarker({
  coords,
}: {
  coords: { lat: number; lng: number } | null
}) {
  const apiLoaded = useApiIsLoaded()

  if (!coords || !apiLoaded || typeof google === 'undefined') return null

  return (
    <Marker
      position={coords}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2f7cf6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      }}
      zIndex={2000}
      clickable={false}
    />
  )
}
