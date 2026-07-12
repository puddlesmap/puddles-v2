import { Link } from 'react-router-dom'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useExperimentLifecycleDocument } from '../hooks/useExperimentLifecycleDocument'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ExperimentExpiredActivityNote } from './ExperimentExpiredActivityLayout'

export function ExperimentExpiredActivityDetailPage() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { catalogEvent, lifecycleStatus, now } = useExperimentLifecycleDocument()

  const isEndedLifecycle =
    lifecycleStatus === 'ended' ||
    lifecycleStatus === 'archived' ||
    lifecycleStatus === 'cancelled'

  return (
    <div
      className={[
        'experiment-expired-activity-detail',
        isMobile ? 'experiment-expired-activity-detail--mobile' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="experiment-expired-activity-detail__note-wrap layout-shell-app">
        <ExperimentExpiredActivityNote>
          Experiment event detail — lifecycle state:{' '}
          <strong>{lifecycleStatus ?? 'unavailable'}</strong>.{' '}
          <Link to="/experiment-expired-activity" className="experiment-expired-activity-note__link">
            Hub
          </Link>
        </ExperimentExpiredActivityNote>
      </div>

      <div className="experiment-expired-activity-detail__body layout-shell-app">
        {catalogEvent && lifecycleStatus ? (
          <EventDetailView
            event={catalogEvent}
            analyticsSource="discovery"
            hasInAppReturn={hasInAppReturn}
            onClose={close}
            presentation={isMobile ? 'overlay' : 'page'}
            shareInHeader={isMobile && (isEndedLifecycle || !hasInAppReturn)}
            lifecycleStatus={lifecycleStatus}
            lifecycleNow={now}
          />
        ) : (
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
        )}
      </div>
    </div>
  )
}
