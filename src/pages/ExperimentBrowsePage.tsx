import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

export function ExperimentBrowsePage() {
  return (
    <BrowsePage
      shellClassName="browse-page-shell--experiment"
      experimentNote={
        <p className="browse-experiment-note">
          Browse experiment —{' '}
          <Link to="/browse" className="browse-experiment-note-link">
            view current browse
          </Link>
        </p>
      }
    />
  )
}
