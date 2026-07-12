import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment3Page() {
  return (
    <HomeExperimentPage
      heroVariant="experiment1"
      trailing={
        <p className="home-experiment-note">
          Home experiment 3 —{' '}
          <Link to="/home-v1" className="home-experiment-note-link">
            view home v1
          </Link>
        </p>
      }
    />
  )
}
