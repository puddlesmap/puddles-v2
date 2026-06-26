import { Marker } from 'react-leaflet'
import { createUserLocationIcon } from './mapPins'

interface MapUserLocationProps {
  coords: { lat: number; lng: number } | null
}

export function MapUserLocation({ coords }: MapUserLocationProps) {
  if (!coords) return null

  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={createUserLocationIcon()}
      interactive={false}
      zIndexOffset={2000}
    />
  )
}
