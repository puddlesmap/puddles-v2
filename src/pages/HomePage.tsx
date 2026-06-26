import { HomeExperimentPage } from './HomeExperimentPage'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function HomePage() {
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
    />
  )
}
