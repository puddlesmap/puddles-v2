import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event } from '../../types/event'
import { DEFAULT_MAP_CENTER, hasMapMovedFromBaseline } from '../../utils/mapBounds'

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
}: {
  events: Event[]
  resetKey: string
}) {
  const map = useMap()

  useEffect(() => {
    if (events.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, 12)
      return
    }

    if (events.length === 1) {
      map.setView([events[0].lat, events[0].lng], 14)
      return
    }

    const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.18), { animate: true })
  }, [events, resetKey, map])

  return null
}
