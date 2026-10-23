import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { HALLOWEEN_COLLECTION_PATH, HALLOWEEN_GUIDE_COVER } from '../data/halloweenGuide'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'

export function HalloweenGuidePage() {
  return (
    <div className="guide-page">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer className="guide-page__wrap layout-container">
        <Link className="guide-page__back" to={HALLOWEEN_COLLECTION_PATH}>
          ← Halloween with little ones
        </Link>
        <article className="guide-page skin skin--column">
          <HalloweenGuideDraft
            idPrefix="guide"
            jumps
            rail={false}
            cover={HALLOWEEN_GUIDE_COVER}
            showMap
            heading="h1"
            share
          />
        </article>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
      <a className="gsl-totop" href="#guide-index" aria-label="Back to sections">
        <svg width="18" height="12" viewBox="0 5.5 20 8.5" aria-hidden="true">
          <path
            d="M4.5 12.25 10 6.75 15.5 12.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Top</span>
      </a>
    </div>
  )
}
