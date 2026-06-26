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
          <Link to="/" className="home-experiment-note-link">
            view current home
          </Link>
        </p>
      }
    />
  )
}
