import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event } from '../../types/event'
import { DEFAULT_MAP_CENTER, hasMapMovedFromBaseline } from '../../utils/mapBounds'
import {
  BROWSE_MAP_BOUNDS_PADDING,
  BROWSE_MAP_DEFAULT_ZOOM,
  BROWSE_MAP_SINGLE_EVENT_ZOOM,
} from './mapViewConfig'

interface MapSearchAreaDetectorProps {
  resetKey: string
  active: boolean
  onMovedAway: () => void
  onReset: () => void
}

export function MapSearchAreaDetector({
  resetKey,
  active,
  onMovedAway,
  onReset,
}: MapSearchAreaDetectorProps) {
  const map = useMap()
  const baselineRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    onReset()
    baselineRef.current = null

    const timer = window.setTimeout(() => {
      const center = map.getCenter()
      baselineRef.current = { lat: center.lat, lng: center.lng }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [resetKey, map, onReset])

  useEffect(() => {
    if (!active) return

    function handleMoveEnd() {
      const baseline = baselineRef.current
      if (!baseline) return

      const center = map.getCenter()
      if (hasMapMovedFromBaseline({ lat: center.lat, lng: center.lng }, baseline)) {
        onMovedAway()
      }
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)
    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [active, map, onMovedAway])

  return null
}

export function MapFitEvents({
  events,
  resetKey,
  boundsPadding = BROWSE_MAP_BOUNDS_PADDING,
  defaultZoom = BROWSE_MAP_DEFAULT_ZOOM,
  singleEventZoom = BROWSE_MAP_SINGLE_EVENT_ZOOM,
}: {
  events: Event[]
  resetKey: string
  boundsPadding?: number
  defaultZoom?: number
  singleEventZoom?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (events.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, defaultZoom)
      return
    }

    if (events.length === 1) {
      map.setView([events[0].lat, events[0].lng], singleEventZoom)
      return
    }

    const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng] as [number, number]))
    map.fitBounds(bounds.pad(boundsPadding), { animate: true })
  }, [boundsPadding, defaultZoom, events, resetKey, map, singleEventZoom])

  return null
}

export function MapFitBounds({
  bounds,
  resetKey,
  boundsPadding = BROWSE_MAP_BOUNDS_PADDING,
}: {
  bounds: { north: number; south: number; east: number; west: number }
  resetKey: string
  boundsPadding?: number
}) {
  const map = useMap()

  useEffect(() => {
    const leafletBounds = L.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east],
    )
    map.fitBounds(leafletBounds.pad(boundsPadding), { animate: false })
  }, [bounds, boundsPadding, resetKey, map])

  return null
}

export function MapFitPoints({
  points,
  resetKey,
  boundsPadding = BROWSE_MAP_BOUNDS_PADDING,
  singlePointZoom = BROWSE_MAP_SINGLE_EVENT_ZOOM,
}: {
  points: Array<{ lat: number; lng: number }>
  resetKey: string
  boundsPadding?: number
  singlePointZoom?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, singlePointZoom)
      return
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], singlePointZoom)
      return
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]))
    map.fitBounds(bounds.pad(boundsPadding), { animate: false })
  }, [boundsPadding, points, resetKey, map, singlePointZoom])

  return null
}
