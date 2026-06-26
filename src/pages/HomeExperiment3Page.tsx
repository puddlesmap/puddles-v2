import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment3Page() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--accent"
      heroVariant="experiment3"
      trailing={
        <p className="home-experiment-note">
          Home experiment 3 —{' '}
          <Link to="/" className="home-experiment-note-link">
            view current home
          </Link>
        </p>
      }
    />
  )
}
