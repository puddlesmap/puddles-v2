import type { Event } from '../types/event'
import { getEventRouteCardSubtext } from '../utils/calendar'
import { getEventDirectionsLabel, getEventDirectionsUrl } from '../utils/maps'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../utils/analytics'
import { EventRouteMapPreview } from './EventRouteMapPreview'
import { EVENT_MARKER_SRC } from './browse/mapPins'

function hasEventCoordinates(event: Event): boolean {
  return Number.isFinite(event.lat) && Number.isFinite(event.lng)
}

interface EventRouteCardProps {
  event: Event
}

export function EventRouteCard({ event }: EventRouteCardProps) {
  const directionsUrl = getEventDirectionsUrl(event)
  if (!directionsUrl) return null

  const locationLabel = getEventRouteCardSubtext(event) || event.venue || 'Event location'
  const showMap = hasEventCoordinates(event)

  return (
    <div className="event-modal-route-card">
      <div className="event-modal-route-card-map-zone" aria-hidden="true">
        {showMap ? (
          <EventRouteMapPreview key={event.id} lat={event.lat} lng={event.lng} />
        ) : (
          <div className="event-modal-route-card-map-fallback" />
        )}
        <div className="event-modal-route-card-map-overlay" />
        {showMap && (
          <div className="event-modal-route-card-pin">
            <img
              src={EVENT_MARKER_SRC}
              alt=""
              className="event-modal-route-card-pin-icon"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="event-modal-route-card-toolbar">
        <p className="event-modal-route-card-toolbar-text">{locationLabel}</p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary event-modal-route-open-btn"
          aria-label={getEventDirectionsLabel(event)}
          onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
        >
          Open route <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  )
}
