import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

export function ExperimentBrowse3Page() {
  return (
    <BrowsePage
      shellClassName="browse-page-shell--experiment browse-page-shell--experiment-3"
      resultsCountStyle="contextual"
      experimentNote={
        <p className="browse-experiment-note browse-experiment-note--v3">
          Browse experiment 3 — Airbnb-like filters, cards, and local context.{' '}
          <Link to="/experiment-browse" className="browse-experiment-note-link">
            view experiment browse
          </Link>
          {' · '}
          <Link to="/browse" className="browse-experiment-note-link">
            view current browse
          </Link>
        </p>
      }
    />
  )
}
