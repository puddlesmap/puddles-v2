import { Link, useNavigate } from 'react-router-dom'
import type { Event } from '../../types/event'
import { LOCAL_CITY_ROUTES, type LocalCitySlug } from '../../config/localRoutes'
import { eventDetailPath } from '../../utils/eventPages'
import { EventCard } from '../EventCard'
import { buildSharedEventBrowseHref, sharedEventCityLabel } from '../../utils/sharedEventNearby'

interface SharedEventNearbySectionProps {
  event: Event
  nearbyEvents: Event[]
  /** Airbnb v3 copy + explore links */
  variant?: 'default' | 'v3'
  /** Defaults to production /event/:id */
  buildEventHref?: (eventId: string) => string
}

const EXPLORE_CITY_ORDER: LocalCitySlug[] = ['palo-alto', 'los-altos', 'mountain-view']

function V3NearbyFooter({ city }: { city: string }) {
  const cityLabel = sharedEventCityLabel(city)
  const thisWeekHref = buildSharedEventBrowseHref(city)
  const otherCities = EXPLORE_CITY_ORDER.filter(
    (slug) => LOCAL_CITY_ROUTES[slug].toLowerCase() !== city.trim().toLowerCase(),
  )

  return (
    <div className="shared-event-nearby__footer">
      <Link to={thisWeekHref} className="shared-event-nearby__see-all">
        See all activities this week in {cityLabel} →
      </Link>

      <div className="shared-event-nearby__places">
        <p className="shared-event-nearby__places-title">Nearby places to explore</p>
        <ul className="shared-event-nearby__places-list">
          {otherCities.map((slug) => (
            <li key={slug}>
              <Link
                to={buildSharedEventBrowseHref(LOCAL_CITY_ROUTES[slug])}
                className="shared-event-nearby__places-link"
              >
                {LOCAL_CITY_ROUTES[slug]} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function SharedEventNearbySection({
  event,
  nearbyEvents,
  variant = 'default',
  buildEventHref = (eventId) => eventDetailPath({ id: eventId }),
}: SharedEventNearbySectionProps) {
  const navigate = useNavigate()
  const city = sharedEventCityLabel(event.city || '')
  const browseHref = buildSharedEventBrowseHref(event.city || '')
  const isV3 = variant === 'v3'
  const cards = isV3 ? nearbyEvents.slice(0, 3) : nearbyEvents

  return (
    <section
      className={['shared-event-nearby', isV3 ? 'shared-event-nearby--v3' : ''].filter(Boolean).join(' ')}
      aria-labelledby="shared-event-nearby-title"
    >
      <h2 id="shared-event-nearby-title" className="shared-event-nearby__title">
        {isV3 ? 'More nearby for little ones' : 'More for little ones nearby'}
      </h2>

      {cards.length > 0 ? (
        isV3 ? (
          <div className="browse-page-shell browse-page-shell--experiment browse-page-shell--experiment-2-column shared-event-nearby__browse-shell">
            <div className="browse-content shared-event-nearby__browse">
              <ul className="browse-event-grid shared-event-nearby__cards" aria-label="Nearby activities">
                {cards.map((nearbyEvent) => (
                  <li key={nearbyEvent.id} className="shared-event-nearby__card">
                    <EventCard
                      event={nearbyEvent}
                      variant="compact-grid"
                      discovery
                      onClick={() => navigate(buildEventHref(nearbyEvent.id))}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <ul className="shared-event-nearby__grid">
            {cards.map((nearbyEvent) => (
              <li key={nearbyEvent.id}>
                <EventCard
                  event={nearbyEvent}
                  variant="grid"
                  discovery
                  onClick={() => navigate(buildEventHref(nearbyEvent.id))}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="shared-event-nearby__empty">
          No other upcoming activities in {city} right now — browse the full calendar for nearby options.
        </p>
      )}

      {isV3 ? (
        <V3NearbyFooter city={event.city || ''} />
      ) : (
        <Link to={browseHref} className="btn-secondary shared-event-nearby__cta">
          See more activities near {city}
        </Link>
      )}
    </section>
  )
}
