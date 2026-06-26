import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { StaticMap } from '@vis.gl/react-google-maps'
import type { Event } from '../../types/event'
import { createEventPinIcon } from '../browse/mapPins'
import { MapFitEvents } from '../browse/MapSearchAreaDetector'
import { getEventsMapCenter, getEventsWithCoordinates } from '../../utils/mapBounds'
import { buildDiscoveryStaticMapUrl, hasGoogleMapsApiKey } from '../../utils/googleMaps'
import 'leaflet/dist/leaflet.css'

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [map])

  return null
}

interface DiscoveryMapPreviewProps {
  events: Event[]
  resetKey: string
  /** When false, renders map tiles only (decorative overlay pins live in the parent). */
  showEventMarkers?: boolean
}

export function DiscoveryMapPreview({
  events,
  resetKey,
  showEventMarkers = true,
}: DiscoveryMapPreviewProps) {
  const mappable = getEventsWithCoordinates(events)
  const center = getEventsMapCenter(mappable)
  const staticMapUrl = buildDiscoveryStaticMapUrl(mappable)

  if (mappable.length === 0) return null

  if (hasGoogleMapsApiKey() && staticMapUrl) {
    return (
      <StaticMap
        key={resetKey}
        url={staticMapUrl}
        className="discovery-map-preview-canvas discovery-map-preview-static-map"
      />
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="discovery-map-preview-canvas"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer url={MAP_TILE_URL} subdomains={['a', 'b', 'c', 'd']} maxZoom={20} />
      <MapSizeFix />
      <MapFitEvents events={mappable} resetKey={resetKey} />
      {showEventMarkers
        ? mappable.map((event) => (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createEventPinIcon(false, false)}
              interactive={false}
            />
          ))
        : null}
    </MapContainer>
  )
}
