import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { LocalGuideCard } from '../components/guides/LocalGuideCard'
import { HALLOWEEN_GUIDE_PATH } from '../data/halloweenGuide'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

/** Directory of published guides. The card is the same one used on seasonal collections. */
export function GuidesIndexPage() {
  return (
    <div className="about-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer className="pt-6 md:pt-10">
        <LocalGuideCard href={HALLOWEEN_GUIDE_PATH} />
      </PageContainer>
      <Footer />
    </div>
  )
}
