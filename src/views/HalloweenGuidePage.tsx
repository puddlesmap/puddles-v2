import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { HALLOWEEN_COLLECTION_PATH, HALLOWEEN_GUIDE_COVER } from '../data/halloweenGuide'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'

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
        <article className="guide-page__article">
          <HalloweenGuideDraft
            idPrefix="guide"
            jumps={false}
            rail={false}
            cover={HALLOWEEN_GUIDE_COVER}
            showMap
            heading="h1"
          />
        </article>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}
