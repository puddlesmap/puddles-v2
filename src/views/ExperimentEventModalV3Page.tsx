import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

const BROWSE_PROPS = {
  shellClassName:
    'browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--map-interaction browse-page-shell--event-modal-experiment',
  resultsCountStyle: 'contextual' as const,
  mapInteractionMode: 'connected' as const,
}

export function ExperimentEventModalV3Page() {
  return (
    <BrowsePage
      {...BROWSE_PROPS}
      experimentNote={
        <p className="browse-experiment-note event-modal-experiment-note">
          Event modal v3 — now the live desktop modal. Open any activity to review. Mobile keeps the
          classic modal.{' '}
          <Link to="/browse" className="browse-experiment-note-link">
            Back to live browse
          </Link>
          {' · '}
          <Link to="/experiment-event-modal" className="browse-experiment-note-link">
            Wide modal experiment
          </Link>
        </p>
      }
    />
  )
}
