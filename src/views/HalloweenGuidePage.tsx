import { AppHeader } from '../components/layout/AppHeader'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { Footer } from '../components/layout/Footer'
import { HALLOWEEN_GUIDE_COVER } from '../data/halloweenGuide'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import { HalloweenGuideIntro } from './HalloweenGuideIntro'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'

export function HalloweenGuidePage() {
  return (
    <div className="guide-page gct-page gct-page--abn-index halloween-guide-dimmed">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        below={<HomeLaunchAnnouncement />}
      />
      <article className="guide-page skin skin--column">
        <HalloweenGuideIntro idPrefix="guide" indexId="guide-index" />
        <HalloweenGuideDraft
          idPrefix="guide"
          jumps={false}
          rail={false}
          cover={HALLOWEEN_GUIDE_COVER}
          showMap
          heading="h1"
          suppressHero
          suppressCover
          hideEventsCta
        />
      </article>
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
