import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment4Page() {
  return (
    <HomeExperimentPage
      heroVariant="default"
      trailing={
        <p className="home-experiment-note">
          Home experiment 4 —{' '}
          <Link to="/home-v1" className="home-experiment-note-link">
            view home v1
          </Link>
        </p>
      }
    />
  )
}
