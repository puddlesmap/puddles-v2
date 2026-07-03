import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { StaticMap } from '@vis.gl/react-google-maps'
import 'leaflet/dist/leaflet.css'
import type { Event } from '../types/event'
import { buildEventStaticMapUrl, hasGoogleMapsApiKey } from '../utils/googleMaps'
import { getEventMapCoordinates, getEventMapMarkerAddress } from '../utils/maps'

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function LeafletMapViewSync({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: false })

    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [lat, lng, zoom, map])

  return null
}

interface EventRouteMapPreviewProps {
  event: Event
}

export function EventRouteMapPreview({ event }: EventRouteMapPreviewProps) {
  const coordinates = getEventMapCoordinates(event)
  if (!coordinates) return null

  const { lat, lng } = coordinates
  const markerAddress = getEventMapMarkerAddress(event)
  const staticMapUrl = buildEventStaticMapUrl(lat, lng, markerAddress)

  if (hasGoogleMapsApiKey() && staticMapUrl) {
    return (
      <StaticMap
        url={staticMapUrl}
        className="event-modal-route-card-leaflet event-modal-route-card-static-map"
      />
    )
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="event-modal-route-card-leaflet"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer url={MAP_TILE_URL} />
      <LeafletMapViewSync lat={lat} lng={lng} zoom={15} />
    </MapContainer>
  )
}
