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
          <Link to="/home-v1" className="home-experiment-note-link">
            view home v1
          </Link>
        </p>
      }
    />
  )
}
