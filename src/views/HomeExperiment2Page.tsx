import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment2Page() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--v2"
      heroVariant="experiment2"
      trailing={
        <p className="home-experiment-note">
          Home experiment 2 —{' '}
          <Link to="/home-v1" className="home-experiment-note-link">
            view home v1
          </Link>
        </p>
      }
    />
  )
}
