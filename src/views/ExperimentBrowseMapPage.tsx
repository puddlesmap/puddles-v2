import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

export function ExperimentBrowseMapPage() {
  return (
    <BrowsePage
      shellClassName="browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--map-interaction"
      resultsCountStyle="contextual"
      mapInteractionMode="connected"
      defaultViewMode="map"
      experimentNote={
        <p className="browse-experiment-note">
          Map interaction prototype — now live on{' '}
          <Link to="/browse?view=map" className="browse-experiment-note-link">
            Browse
          </Link>
        </p>
      }
    />
  )
}
