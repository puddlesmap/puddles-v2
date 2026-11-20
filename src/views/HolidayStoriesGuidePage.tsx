import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useScrollToHashOnMount } from '../hooks/useScrollToHashOnMount'
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
import { HOLIDAY_GUIDE_EVENT_COUNT, HOLIDAY_MAGIC_GUIDE_EYEBROW } from '../data/holidayGuide'
import {
  HOLIDAY_STORIES_CTA_BROWSE_LABEL,
  HOLIDAY_STORIES_CTA_DEK,
  HOLIDAY_STORIES_CTA_TITLE,
  HOLIDAY_STORIES_EVENTS_HREF,
  HOLIDAY_STORIES_FINDER_LEDE,
  HOLIDAY_STORIES_GUIDE_COVER,
  HOLIDAY_STORIES_GUIDE_META,
  HOLIDAY_STORIES_GUIDE_PATH,
  HOLIDAY_STORIES_GUIDE_PUBLISH_ON,
  HOLIDAY_STORIES_GUIDE_SECTION_NAV,
  HOLIDAY_STORIES_GUIDE_SLUG,
  HOLIDAY_STORIES_GUIDE_TITLE,
} from '../data/holidayStoriesGuide'
import {
  HOLIDAY_STORIES_GUIDE_MAP_CATEGORIES,
  HOLIDAY_STORIES_GUIDE_PLACES,
} from '../data/holidayStoriesGuidePlaces'
import { useGuideVisitLifecycle } from '../hooks/useGuideVisitLifecycle'
import { trackGuideMapOpened } from '../utils/analytics'
import { zonedCalendarDate } from '../utils/dates'
import { markGuideMapAssisted } from '../utils/discoveryAttribution'
import { guideCommonProps } from '../utils/guideVisitAnalytics'
import {
  getGuideLifecycleMeta,
  resolveGuideLifecycleState,
} from '../utils/guideLifecycle'
import { HolidayStoriesGuideDraft } from './HolidayStoriesGuideDraft'
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
  GUIDES_CATALOG.find((g) => g.slug === 'holiday-stories-play') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

export function HolidayStoriesGuidePage() {
  if (zonedCalendarDate() < HOLIDAY_STORIES_GUIDE_PUBLISH_ON) {
    return <Navigate to="/guides" replace />
  }
  return <HolidayStoriesGuidePageLive />
}

function HolidayStoriesGuidePageLive() {
  useGuideVisitLifecycle(HOLIDAY_STORIES_GUIDE_SLUG, 'v2')
  useScrollToHashOnMount()
  const lifecycle = resolveGuideLifecycleState(GUIDE_META)
  const [mapOpen, setMapOpen] = useState(false)
  const [savedScroll, setSavedScroll] = useState(0)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const openMap = useCallback(() => {
    setSavedScroll(window.scrollY)
    setMapOpen(true)
    markGuideMapAssisted()
    trackGuideMapOpened(HOLIDAY_STORIES_GUIDE_SLUG, guideCommonProps(HOLIDAY_STORIES_GUIDE_SLUG))
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
          coverSrc={HOLIDAY_STORIES_GUIDE_COVER}
          eyebrow={HOLIDAY_MAGIC_GUIDE_EYEBROW}
          title={HOLIDAY_STORIES_GUIDE_TITLE}
          meta={HOLIDAY_STORIES_GUIDE_META}
          shareUrl={`https://puddlesmap.com${HOLIDAY_STORIES_GUIDE_PATH}`}
          shareTitle={HOLIDAY_STORIES_GUIDE_TITLE}
          guideSlug={HOLIDAY_STORIES_GUIDE_SLUG}
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
            items={HOLIDAY_STORIES_GUIDE_SECTION_NAV}
            guideSlug={HOLIDAY_STORIES_GUIDE_SLUG}
          />
          <div className="gdm-h-split">
            <div className="gdm-h-split__main">
              <HolidayStoriesGuideDraft
                idPrefix={ID_PREFIX}
                finderLayout="bullets"
                linkFinder
                trackSections={false}
                beforeFinder={<p className="gdm-wire-lede">{HOLIDAY_STORIES_FINDER_LEDE}</p>}
                afterFinder={
                  <>
                    <GuideFInlineCtas
                      onOpenMap={openMap}
                      collectionHref={HOLIDAY_STORIES_EVENTS_HREF}
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
                      currentSlug="holiday-stories-play"
                    />
                    <GuideRelatedFooter
                      relatedGuides={[]}
                      seasonalHref={HOLIDAY_STORIES_EVENTS_HREF}
                      seasonalTitle={HOLIDAY_STORIES_CTA_TITLE}
                      seasonalDek={HOLIDAY_STORIES_CTA_DEK}
                      seasonalLinkLabel={HOLIDAY_STORIES_CTA_BROWSE_LABEL}
                      guideSlug={HOLIDAY_STORIES_GUIDE_SLUG}
                      destinationKind="collection"
                    />
                  </>
                }
              />
            </div>
            <aside className="gdm-h-split__rail">
              <GuideDesktopTocRail
                idPrefix={ID_PREFIX}
                items={HOLIDAY_STORIES_GUIDE_SECTION_NAV}
                guideSlug={HOLIDAY_STORIES_GUIDE_SLUG}
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
        places={HOLIDAY_STORIES_GUIDE_PLACES}
        categories={HOLIDAY_STORIES_GUIDE_MAP_CATEGORIES}
        selectedSlug={selectedSlug}
        onSelectSlug={setSelectedSlug}
        defaultCategoryId="shows"
        guideSlug={HOLIDAY_STORIES_GUIDE_SLUG}
        sectionNav={HOLIDAY_STORIES_GUIDE_SECTION_NAV}
      />
    </div>
  )
}
