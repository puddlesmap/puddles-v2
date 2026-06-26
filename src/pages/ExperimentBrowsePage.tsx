import { Link } from 'react-router-dom'
import { BrowsePage } from './BrowsePage'

export function ExperimentBrowsePage() {
  return (
    <BrowsePage
      shellClassName="browse-page-shell--experiment"
      experimentNote={
        <p className="browse-experiment-note">
          Browse experiment —{' '}
          <Link to="/browse-v1" className="browse-experiment-note-link">
            view browse v1
          </Link>
        </p>
      }
    />
  )
}
