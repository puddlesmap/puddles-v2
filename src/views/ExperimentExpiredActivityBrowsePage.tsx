import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'
import { BROWSE_PAGE_PROPS } from './browsePageConfigs'
import { useExperimentLifecycleNow } from '../context/ExperimentLifecycleContext'
import { getDiscoverableEventsFromCatalog } from '../utils/eventLifecycle'
import { experimentEventDetailPath } from '../utils/eventLifecycleBrowse'
import { ExperimentExpiredActivityNote } from './ExperimentExpiredActivityLayout'

export function ExperimentExpiredActivityBrowsePage() {
  const now = useExperimentLifecycleNow()
  const getEventsCatalog = useCallback(() => getDiscoverableEventsFromCatalog(now), [now])

  return (
    <BrowsePage
      {...BROWSE_PAGE_PROPS}
      discoveryGate="lifecycle-upcoming"
      getEventsCatalog={getEventsCatalog}
      buildEventDetailPath={experimentEventDetailPath}
      experimentNote={
        <ExperimentExpiredActivityNote>
          Experiment browse — only lifecycle <strong>upcoming</strong> activities appear here.{' '}
          <Link to="/experiment-expired-activity" className="experiment-expired-activity-note__link">
            Back to experiment hub
          </Link>
        </ExperimentExpiredActivityNote>
      }
    />
  )
}
