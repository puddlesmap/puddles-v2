import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { DiscoveryEmptyState } from '../components/empty-states/DiscoveryEmptyState'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import {
  cityBrowseHref,
  cityIntroCopy,
  cityMapHref,
  LOCAL_CITY_ROUTES,
  type LocalCitySlug,
} from '../config/localRoutes'
import { getPublicEventsFromCatalog } from '../data/events'
import { useEventNavigation } from '../hooks/useEventNavigation'
import type { Event } from '../types/event'
import { filterEvents } from '../utils/filters'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

function sortEventsByUpcomingDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.startTime.localeCompare(b.startTime)
  })
}

interface CityLandingPageProps {
  citySlug: LocalCitySlug
}

export function CityLandingPage({ citySlug }: CityLandingPageProps) {
  const city = LOCAL_CITY_ROUTES[citySlug]
  const openEvent = useEventNavigation()

  const events = useMemo(
    () => sortEventsByUpcomingDate(filterEvents(getPublicEventsFromCatalog(), { city })),
    [city],
  )

  const resultsLabel =
    events.length === 1
      ? `1 upcoming activity in ${city}`
      : `${events.length} upcoming activities in ${city}`

  return (
    <div className="city-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer layout="wide" className="city-page-body browse-content">
        <header className="city-page-hero">
          <h1 className="city-page-title">{city} activities for ages 0&ndash;5</h1>
          <p className="city-page-intro supporting-copy">{cityIntroCopy(citySlug)}</p>
          <div className="city-page-actions">
            <Link to={cityBrowseHref(citySlug)} className="btn-primary">
              Browse activities
            </Link>
            <Link to={cityMapHref(citySlug)} className="btn-secondary">
              View map
            </Link>
          </div>
        </header>

        <section className="city-page-events" aria-labelledby={`city-events-${citySlug}`}>
          <h2 id={`city-events-${citySlug}`} className="city-page-events-title">
            Upcoming activities
          </h2>

          {events.length > 0 ? (
            <p className="browse-results-count">{resultsLabel}</p>
          ) : null}

          {events.length === 0 ? (
            <DiscoveryEmptyState variant="refined-home" />
          ) : (
            <div className="browse-event-grid motion-feed-in">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="grid"
                  discovery
                  onClick={() => openEvent(event, 'browse_list')}
                />
              ))}
            </div>
          )}
        </section>
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}
