import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function TypographyExperimentHomePage() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined"
      shellClassName="home-experiment-shell--refined typography-experiment-shell"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      trailing={
        <p className="typography-experiment-note home-experiment-note--refined">
          Typography experiment — Share-style hero title.{' '}
          <Link to="/" className="typography-experiment-note-link">
            view current Home
          </Link>
        </p>
      }
    />
  )
}
