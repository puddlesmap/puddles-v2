import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment1Page() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--v1"
      heroVariant="experiment1"
      trailing={
        <p className="home-experiment-note">
          Home experiment 1 —{' '}
          <Link to="/" className="home-experiment-note-link">
            view current home
          </Link>
        </p>
      }
    />
  )
}
