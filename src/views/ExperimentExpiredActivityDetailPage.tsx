import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { SharedEventDesignLayout } from '../components/event-detail/SharedEventDesignLayouts'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useExperimentLifecycleDocument } from '../hooks/useExperimentLifecycleDocument'
import { experimentEventDetailPath } from '../utils/eventLifecycleBrowse'
import { getSharedEventNearbyActivities } from '../utils/sharedEventNearby'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { ExperimentExpiredActivityNote } from './ExperimentExpiredActivityLayout'

export function ExperimentExpiredActivityDetailPage() {
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { catalogEvent, lifecycleStatus, now } = useExperimentLifecycleDocument()

  const nearbyEvents = useMemo(
    () => (catalogEvent ? getSharedEventNearbyActivities(catalogEvent, 6, now) : []),
    [catalogEvent, now],
  )

  return (
    <div className="experiment-expired-activity-detail experiment-expired-activity-detail--v3">
      <div className="experiment-expired-activity-detail__note-wrap">
        <ExperimentExpiredActivityNote>
          Lifecycle prototype on Airbnb v3 shared-event layout — state:{' '}
          <strong>{lifecycleStatus ?? 'unavailable'}</strong>.{' '}
          <Link to="/experiment-expired-activity" className="experiment-expired-activity-note__link">
            Hub
          </Link>
        </ExperimentExpiredActivityNote>
      </div>

      {catalogEvent && lifecycleStatus ? (
        <>
          <AppHeader
            logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
            logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
            showBrandName={false}
          />
          <SharedEventDesignLayout
            event={catalogEvent}
            nearbyEvents={nearbyEvents}
            layout="airbnb-v3"
            lifecycleStatus={lifecycleStatus}
            lifecycleNow={now}
            buildNearbyEventHref={(id) => experimentEventDetailPath({ id })}
          />
          <Footer fullBleed className="mt-0" />
        </>
      ) : (
        <div className="experiment-expired-activity-detail__body layout-shell-app">
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
        </div>
      )}
    </div>
  )
}
