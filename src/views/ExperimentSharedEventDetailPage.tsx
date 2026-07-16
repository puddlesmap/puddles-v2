import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import {
  SHARED_EVENT_LAYOUTS,
  SharedEventDesignLayout,
  SharedEventLayoutSwitcher,
  type SharedEventLayoutId,
} from '../components/event-detail/SharedEventDesignLayouts'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { getCatalogEventById, getPublicEventById, isEventIndexable } from '../utils/eventPages'
import {
  experimentSharedEventDetailPath,
  getSharedEventNearbyActivities,
} from '../utils/sharedEventNearby'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { ExperimentSharedEventNote } from './ExperimentSharedEventLayout'

function parseLayout(value: string | null): SharedEventLayoutId {
  if (value && (SHARED_EVENT_LAYOUTS as readonly string[]).includes(value)) {
    return value as SharedEventLayoutId
  }
  return 'airbnb-v3'
}

export function ExperimentSharedEventDetailPage() {
  const { eventId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const simulateModal = searchParams.get('mode') === 'modal'
  const layout = parseLayout(searchParams.get('layout'))
  const { close, hasInAppReturn } = useCloseEventDetail()

  const catalogEvent = eventId ? getCatalogEventById(eventId) : undefined
  const publicEvent = eventId ? getPublicEventById(eventId) : undefined
  const isIndexable = publicEvent ? isEventIndexable(publicEvent) : false

  const nearbyEvents = useMemo(
    () => (publicEvent ? getSharedEventNearbyActivities(publicEvent, 6) : []),
    [publicEvent],
  )

  if (!catalogEvent) {
    return (
      <div className="experiment-shared-event-detail layout-shell-app">
        <ExperimentSharedEventNote>
          Shared event experiment — event not found.{' '}
          <Link to="/experiment-shared-event" className="experiment-shared-event-note__link">
            Back to hub
          </Link>
        </ExperimentSharedEventNote>
        <EventUnavailableState hasInAppReturn={false} onClose={() => undefined} />
      </div>
    )
  }

  if (simulateModal) {
    return (
      <div className="experiment-shared-event-detail experiment-shared-event-detail--modal">
        <div className="experiment-shared-event-modal-chrome">
          <ExperimentSharedEventNote>
            Modal simulation — opened from Home, Browse, or Map.{' '}
            <Link
              to={experimentSharedEventDetailPath(eventId, 'direct')}
              className="experiment-shared-event-note__link"
            >
              Switch to direct link view
            </Link>
          </ExperimentSharedEventNote>
        </div>

        <div className="experiment-shared-event-modal-stage">
          <div className="experiment-shared-event-modal-backdrop" aria-hidden>
            <div className="experiment-shared-event-modal-backdrop__inner layout-shell-app">
              <p className="experiment-shared-event-modal-backdrop__label">Browse · background page</p>
            </div>
          </div>

          <div className="experiment-shared-event-modal-overlay" role="presentation">
            <div className="experiment-shared-event-modal-dialog">
              {publicEvent && isIndexable ? (
                <EventDetailView
                  event={publicEvent}
                  analyticsSource="discovery"
                  hasInAppReturn
                  onClose={close}
                  presentation="overlay"
                  shareInHeader={false}
                />
              ) : (
                <EventUnavailableState hasInAppReturn onClose={close} />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="experiment-shared-event-detail experiment-shared-event-detail--direct">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <SharedEventLayoutSwitcher eventId={eventId} active={layout} />

      <div className="experiment-shared-event-direct-note layout-container">
        <ExperimentSharedEventNote>
          Direct shared-link layouts for design review (Airbnb / Luma / Eventbrite refs).{' '}
          <Link to="/experiment-shared-event" className="experiment-shared-event-note__link">
            Back to hub
          </Link>
        </ExperimentSharedEventNote>
      </div>

      {publicEvent && isIndexable ? (
        <SharedEventDesignLayout
          event={publicEvent}
          nearbyEvents={nearbyEvents}
          layout={layout}
          buildNearbyEventHref={(id) => experimentSharedEventDetailPath(id, 'direct', layout)}
        />
      ) : (
        <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
      )}

      <Footer fullBleed className="mt-0" />
    </div>
  )
}
