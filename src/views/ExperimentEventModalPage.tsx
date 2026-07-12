import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

const BROWSE_PROPS = {
  shellClassName:
    'browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--map-interaction browse-page-shell--event-modal-experiment',
  resultsCountStyle: 'contextual' as const,
  mapInteractionMode: 'connected' as const,
}

export function ExperimentEventModalPage() {
  return (
    <BrowsePage
      {...BROWSE_PROPS}
      experimentNote={
        <p className="browse-experiment-note event-modal-experiment-note">
          Event modal experiment — on desktop, open any activity to preview the wide 2-column
          overlay.{' '}
          <Link to="/browse" className="browse-experiment-note-link">
            Back to live browse
          </Link>
        </p>
      }
    />
  )
}
