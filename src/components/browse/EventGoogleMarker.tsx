import { useMemo } from 'react'
import { Marker, useApiIsLoaded } from '@vis.gl/react-google-maps'
import type { Event } from '../../types/event'
import { EVENT_MARKER_SRC, getEventPinDimensions } from './mapPins'

interface EventGoogleMarkerProps {
  event: Event
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (eventId: string | null) => void
}

export function EventGoogleMarker({
  event,
  selected,
  hovered,
  onSelect,
  onHover,
}: EventGoogleMarkerProps) {
  const apiLoaded = useApiIsLoaded()
  const { width, height } = getEventPinDimensions(selected, hovered)

  const icon = useMemo(() => {
    if (!apiLoaded || typeof google === 'undefined') return undefined

    return {
      url: EVENT_MARKER_SRC,
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height),
    }
  }, [apiLoaded, height, width])

  return (
    <Marker
      position={{ lat: event.lat, lng: event.lng }}
      icon={icon}
      zIndex={selected ? 1000 : hovered ? 500 : 0}
      onClick={onSelect}
      onMouseOver={() => onHover(event.id)}
      onMouseOut={() => onHover(null)}
    />
  )
}
