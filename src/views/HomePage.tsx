import { HomeExperimentPage } from './HomeExperimentPage'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { useStructuredData } from '../hooks/useStructuredData'
import { websiteJsonLd, websiteStructuredDataId } from '../utils/siteStructuredData'

export function HomePage() {
  useStructuredData(websiteStructuredDataId, websiteJsonLd)

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
