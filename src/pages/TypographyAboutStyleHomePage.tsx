import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function TypographyAboutStyleHomePage() {
  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined"
      shellClassName="home-experiment-shell--refined typography-about-style-shell"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      trailing={
        <p className="typography-about-style-note home-experiment-note--refined">
          Typography experiment — About tagline style (600 / #1e293b).{' '}
          <Link to="/" className="typography-about-style-note-link">
            view current Home
          </Link>
        </p>
      }
    />
  )
}
