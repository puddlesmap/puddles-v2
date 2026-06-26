import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'

export function HomeExperiment4Page() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--soft"
      heroVariant="experiment4"
      trailing={
        <p className="home-experiment-note">
          Home experiment 4 —{' '}
          <Link to="/" className="home-experiment-note-link">
            view current home
          </Link>
        </p>
      }
    />
  )
}
