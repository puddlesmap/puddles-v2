import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GuideDesktopTocRail } from '../components/guides/GuideDesktopTocRail'
import {
  GuideFBleedHero,
  GuideFExploreHeader,
  GuideFInlineCtas,
  GuideFStickyNav,
  GuideFStickyScope,
} from '../components/guides/GuideFChrome'
import { GuideMapExploreOverlay } from '../components/guides/GuideMapExploreOverlay'
import { GuideRelatedFooter } from '../components/guides/GuideRelatedFooter'
import { MoreFromCollectionGuides } from '../components/guides/MoreFromCollectionGuides'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import {
  HELLO_NEW_YEAR_CTA_BROWSE_LABEL,
  HELLO_NEW_YEAR_CTA_DEK,
  HELLO_NEW_YEAR_CTA_TITLE,
  HELLO_NEW_YEAR_EVENTS_HREF,
  HELLO_NEW_YEAR_FINDER_LEDE,
  HELLO_NEW_YEAR_GUIDE_COVER,
  HELLO_NEW_YEAR_GUIDE_META,
  HELLO_NEW_YEAR_GUIDE_PATH,
  HELLO_NEW_YEAR_GUIDE_PUBLISH_ON,
  HELLO_NEW_YEAR_GUIDE_SECTION_NAV,
  HELLO_NEW_YEAR_GUIDE_SLUG,
  HELLO_NEW_YEAR_GUIDE_TITLE,
} from '../data/helloNewYearGuide'
import {
  HELLO_NEW_YEAR_GUIDE_MAP_CATEGORIES,
  HELLO_NEW_YEAR_GUIDE_PLACES,
} from '../data/helloNewYearGuidePlaces'
import { HOLIDAY_GUIDE_EVENT_COUNT, HOLIDAY_MAGIC_GUIDE_EYEBROW } from '../data/holidayGuide'
import { useGuideVisitLifecycle } from '../hooks/useGuideVisitLifecycle'
import { trackGuideMapOpened } from '../utils/analytics'
import { zonedCalendarDate } from '../utils/dates'
import { markGuideMapAssisted } from '../utils/discoveryAttribution'
import { guideCommonProps } from '../utils/guideVisitAnalytics'
import {
  getGuideLifecycleMeta,
  resolveGuideLifecycleState,
} from '../utils/guideLifecycle'
import { HelloNewYearGuideDraft } from './HelloNewYearGuideDraft'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'
import './holiday-guide-ambience.css'
import '../components/guides/guideFChrome.css'
import '../components/guides/guideDesktopToc.css'

const INDEX_ID = 'guide-index'
const ID_PREFIX = 'guide'

const PAST_NOTE =
  'This season has ended. The recommendations below are from the 2026–27 holidays and are kept here for inspiration and planning.'

const GUIDE_META = getGuideLifecycleMeta(
  GUIDES_CATALOG.find((g) => g.slug === 'hello-new-year') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

export function HelloNewYearGuidePage() {
  if (zonedCalendarDate() < HELLO_NEW_YEAR_GUIDE_PUBLISH_ON) {
    return <Navigate to="/guides" replace />
  }
  return <HelloNewYearGuidePageLive />
}

function HelloNewYearGuidePageLive() {
  useGuideVisitLifecycle(HELLO_NEW_YEAR_GUIDE_SLUG, 'v2')
  const lifecycle = resolveGuideLifecycleState(GUIDE_META)
  const [mapOpen, setMapOpen] = useState(false)
  const [savedScroll, setSavedScroll] = useState(0)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const openMap = useCallback(() => {
    setSavedScroll(window.scrollY)
    setMapOpen(true)
    markGuideMapAssisted()
    trackGuideMapOpened(HELLO_NEW_YEAR_GUIDE_SLUG, guideCommonProps(HELLO_NEW_YEAR_GUIDE_SLUG))
  }, [])

  const closeMap = useCallback(() => {
    setMapOpen(false)
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScroll)
    })
  }, [savedScroll])

  const seeDetails = useCallback((slug: string) => {
    setMapOpen(false)
    requestAnimationFrame(() => {
      const id = `${ID_PREFIX}-${slug}`
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (window.location.hash !== `#${id}`) {
        history.replaceState(null, '', `#${id}`)
      }
    })
  }, [])

  return (
    <div className="guide-page gct-page gct-page--abn-index holiday-guide-dimmed holiday-guide-hub-chrome holiday-guide-f gdm-shell gdm-shell--h gdm-shell--flat">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <article className="guide-page skin skin--column">
        <GuideFBleedHero
          coverSrc={HELLO_NEW_YEAR_GUIDE_COVER}
          eyebrow={HOLIDAY_MAGIC_GUIDE_EYEBROW}
          title={HELLO_NEW_YEAR_GUIDE_TITLE}
          meta={HELLO_NEW_YEAR_GUIDE_META}
          shareUrl={`https://puddlesmap.com${HELLO_NEW_YEAR_GUIDE_PATH}`}
          shareTitle={HELLO_NEW_YEAR_GUIDE_TITLE}
          guideSlug={HELLO_NEW_YEAR_GUIDE_SLUG}
          onOpenMap={openMap}
        />
        {lifecycle === 'past' ? (
          <p className="gct-gutter holiday-guide-f__past-note" role="status">
            {PAST_NOTE}
          </p>
        ) : null}
        <GuideFStickyScope>
          <GuideFStickyNav
            idPrefix={ID_PREFIX}
            indexId={INDEX_ID}
            items={HELLO_NEW_YEAR_GUIDE_SECTION_NAV}
            guideSlug={HELLO_NEW_YEAR_GUIDE_SLUG}
          />
          <div className="gdm-h-split">
            <div className="gdm-h-split__main">
              <HelloNewYearGuideDraft
                idPrefix={ID_PREFIX}
                finderLayout="bullets"
                linkFinder
                trackSections={false}
                beforeFinder={<p className="gdm-wire-lede">{HELLO_NEW_YEAR_FINDER_LEDE}</p>}
                afterFinder={
                  <>
                    <GuideFInlineCtas
                      onOpenMap={openMap}
                      collectionHref={HELLO_NEW_YEAR_EVENTS_HREF}
                      collectionEventCount={HOLIDAY_GUIDE_EVENT_COUNT}
                      showCollectionCta={false}
                    />
                    <GuideFExploreHeader />
                  </>
                }
                afterBody={
                  <>
                    <MoreFromCollectionGuides
                      collectionSlug="holiday-magic"
                      currentSlug="hello-new-year"
                    />
                    <GuideRelatedFooter
                      relatedGuides={[]}
                      seasonalHref={HELLO_NEW_YEAR_EVENTS_HREF}
                      seasonalTitle={HELLO_NEW_YEAR_CTA_TITLE}
                      seasonalDek={HELLO_NEW_YEAR_CTA_DEK}
                      seasonalLinkLabel={HELLO_NEW_YEAR_CTA_BROWSE_LABEL}
                      guideSlug={HELLO_NEW_YEAR_GUIDE_SLUG}
                      destinationKind="collection"
                    />
                  </>
                }
              />
            </div>
            <aside className="gdm-h-split__rail">
              <GuideDesktopTocRail
                idPrefix={ID_PREFIX}
                items={HELLO_NEW_YEAR_GUIDE_SECTION_NAV}
                guideSlug={HELLO_NEW_YEAR_GUIDE_SLUG}
              />
            </aside>
          </div>
        </GuideFStickyScope>
      </article>
      <Footer fullBleed className="mt-0" />
      <GuideMapExploreOverlay
        idPrefix={ID_PREFIX}
        open={mapOpen}
        onClose={closeMap}
        onSeeDetails={seeDetails}
        places={HELLO_NEW_YEAR_GUIDE_PLACES}
        categories={HELLO_NEW_YEAR_GUIDE_MAP_CATEGORIES}
        selectedSlug={selectedSlug}
        onSelectSlug={setSelectedSlug}
        defaultCategoryId="nearby"
        guideSlug={HELLO_NEW_YEAR_GUIDE_SLUG}
        sectionNav={HELLO_NEW_YEAR_GUIDE_SECTION_NAV}
      />
    </div>
  )
}
