import type { Event } from '../../types/event'

interface EventLocationUpdatedBannerProps {
  event: Event
}

/** Cancel-style notice when an editor confirmed a venue move (event stays Published). */
export function EventLocationUpdatedBanner({ event }: EventLocationUpdatedBannerProps) {
  const from = event.locationChangedFrom?.trim()
  if (!from) return null

  const venue = event.venue?.trim() || 'the new location'
  const schedule = `Now at ${venue} · was ${from}`

  return (
    <section
      className="event-lifecycle-banner event-location-updated-banner"
      aria-labelledby="event-location-updated-banner-title"
    >
      <div
        id="event-location-updated-banner-title"
        className="event-lifecycle-banner__header event-modal-trust-header"
      >
        <span className="event-modal-trust-header-label event-lifecycle-banner__label">
          Location updated.
        </span>
        <span className="event-modal-trust-timestamp event-lifecycle-banner__schedule">
          {schedule}
        </span>
      </div>
    </section>
  )
}
