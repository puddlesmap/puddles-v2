import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { getPublicEventsFromCatalog } from '../data/events'
import {
  experimentSharedEventDetailPath,
  getSharedEventNearbyActivities,
} from '../utils/sharedEventNearby'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { ExperimentSharedEventNote } from './ExperimentSharedEventLayout'

export function ExperimentSharedEventPage() {
  const samples = useMemo(() => {
    const catalog = getPublicEventsFromCatalog()
    const withNearby = catalog
      .map((event) => ({
        event,
        nearbyCount: getSharedEventNearbyActivities(event, 3).length,
      }))
      .filter((row) => row.nearbyCount >= 2)
      .sort((a, b) => b.nearbyCount - a.nearbyCount)
      .slice(0, 8)

    if (withNearby.length > 0) return withNearby

    return catalog.slice(0, 6).map((event) => ({
      event,
      nearbyCount: getSharedEventNearbyActivities(event, 3).length,
    }))
  }, [])

  return (
    <div className="experiment-shared-event-page">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <div className="experiment-shared-event-page__content layout-shell-app">
      <header className="experiment-shared-event-header">
        <p className="experiment-shared-event-eyebrow">Internal experiment</p>
        <h1 className="experiment-shared-event-title">Shared event URL experience</h1>
        <ExperimentSharedEventNote />
      </header>

      <section className="experiment-shared-event-panel" aria-labelledby="shared-event-scenarios">
        <h2 id="shared-event-scenarios" className="experiment-shared-event-panel__title">
          What to test
        </h2>
        <ul className="experiment-shared-event-scenarios">
          <li>
            <strong>Direct shared link</strong> — Puddles header + nav, no X, visitor intro, nearby picks,
            browse CTA.
          </li>
          <li>
            <strong>Internal modal</strong> — same event opened from Browse/Home/Map with X and overlay
            behavior unchanged.
          </li>
        </ul>
      </section>

      <section className="experiment-shared-event-panel" aria-labelledby="shared-event-samples">
        <h2 id="shared-event-samples" className="experiment-shared-event-panel__title">
          Sample events
        </h2>
        <ul className="experiment-shared-event-samples">
          {samples.map(({ event, nearbyCount }) => (
            <li key={event.id}>
              <div className="experiment-shared-event-sample">
                <div className="experiment-shared-event-sample__copy">
                  <p className="experiment-shared-event-sample__title">{event.title}</p>
                  <p className="experiment-shared-event-sample__meta">
                    {event.city} · {event.date} · {nearbyCount} nearby upcoming
                  </p>
                </div>
                <div className="experiment-shared-event-sample__actions">
                  <Link
                    to={experimentSharedEventDetailPath(event.id, 'direct')}
                    className="btn-primary experiment-shared-event-sample__btn"
                  >
                    Direct link
                  </Link>
                  <Link
                    to={experimentSharedEventDetailPath(event.id, 'modal')}
                    className="btn-secondary experiment-shared-event-sample__btn"
                  >
                    Modal
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </div>
  )
}
