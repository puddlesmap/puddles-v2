import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'

export function ExperimentHomePage() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined"
      shellClassName="home-experiment-shell--refined"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      trailing={
        <p className="home-experiment-note home-experiment-note--refined">
          Home experiment —{' '}
          <Link to="/" className="home-experiment-note-link">
            view current home
          </Link>
        </p>
      }
    />
  )
}
