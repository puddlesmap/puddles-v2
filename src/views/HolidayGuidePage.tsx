import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GuideDesktopTocRail } from '../components/guides/GuideDesktopTocRail'
import {
  GuideFBleedHero,
  GuideFExploreHeader,
  GuideFInlineCtas,
  GuideFStickyNav,
  GuideFStickyScope,
  HOLIDAY_LIGHTS_EXPLORE_LEDE,
  HOLIDAY_LIGHTS_FINDER_LEDE,
} from '../components/guides/GuideFChrome'
import { GuideMapExploreOverlay } from '../components/guides/GuideMapExploreOverlay'
import { GuideRelatedFooter } from '../components/guides/GuideRelatedFooter'
import { MoreFromCollectionGuides } from '../components/guides/MoreFromCollectionGuides'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import {
  HOLIDAY_EVENTS_HREF,
  HOLIDAY_GUIDE_COVER,
  HOLIDAY_GUIDE_CTA_BROWSE_LABEL,
  HOLIDAY_GUIDE_CTA_DEK,
  HOLIDAY_GUIDE_CTA_TITLE,
  HOLIDAY_GUIDE_DEK,
  HOLIDAY_GUIDE_EVENT_COUNT,
  HOLIDAY_GUIDE_OUTING_IMAGES,
  HOLIDAY_GUIDE_PATH,
  HOLIDAY_GUIDE_PUBLISH_ON,
  HOLIDAY_GUIDE_SECTION_NAV,
  HOLIDAY_GUIDE_SLUG,
  HOLIDAY_GUIDE_TITLE,
  HOLIDAY_MAGIC_GUIDE_EYEBROW,
  HOLIDAY_MAGIC_GUIDE_META,
} from '../data/holidayGuide'
import { HOLIDAY_GUIDE_MAP_CATEGORIES, HOLIDAY_GUIDE_PLACES } from '../data/holidayGuidePlaces'
import { useGuideVisitLifecycle } from '../hooks/useGuideVisitLifecycle'
import { useScrollToHashOnMount } from '../hooks/useScrollToHashOnMount'
import { useStructuredData } from '../hooks/useStructuredData'
import { trackGuideMapOpened } from '../utils/analytics'
import { zonedCalendarDate } from '../utils/dates'
import { markGuideMapAssisted } from '../utils/discoveryAttribution'
import { guideCommonProps } from '../utils/guideVisitAnalytics'
import {
  getGuideLifecycleMeta,
  resolveGuideLifecycleState,
} from '../utils/guideLifecycle'
import { buildGuideArticleJsonLd } from '../utils/guideStructuredData'
import { HolidayGuideDraft } from './HolidayGuideDraft'
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

const HOLIDAY_META = getGuideLifecycleMeta(
  GUIDES_CATALOG.find((g) => g.slug === 'holiday-lights-traditions') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

export function HolidayGuidePage() {
  if (zonedCalendarDate() < HOLIDAY_GUIDE_PUBLISH_ON) {
    return <Navigate to="/guides" replace />
  }
  return <HolidayGuidePageLive />
}

function HolidayGuidePageLive() {
  useGuideVisitLifecycle(HOLIDAY_GUIDE_SLUG, 'v2')
  useScrollToHashOnMount()
  const lifecycle = resolveGuideLifecycleState(HOLIDAY_META)
  const [mapOpen, setMapOpen] = useState(false)
  const [savedScroll, setSavedScroll] = useState(0)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const openMap = useCallback(() => {
    setSavedScroll(window.scrollY)
    setMapOpen(true)
    markGuideMapAssisted()
    trackGuideMapOpened(HOLIDAY_GUIDE_SLUG, guideCommonProps(HOLIDAY_GUIDE_SLUG))
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

  const articleJsonLd = useMemo(
    () =>
      buildGuideArticleJsonLd({
        headline: `${HOLIDAY_GUIDE_TITLE} ✨`,
        description: HOLIDAY_GUIDE_DEK,
        path: HOLIDAY_GUIDE_PATH,
        image: HOLIDAY_GUIDE_COVER,
        datePublished: '2026-11-12',
      }),
    [],
  )
  useStructuredData('puddles-holiday-lights-guide-jsonld', articleJsonLd)

  return (
    <div className="guide-page gct-page gct-page--abn-index holiday-guide-dimmed holiday-guide-hub-chrome holiday-guide-f gdm-shell gdm-shell--h gdm-shell--flat">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <article className="guide-page skin skin--column">
        <GuideFBleedHero
          coverSrc={HOLIDAY_GUIDE_COVER}
          eyebrow={HOLIDAY_MAGIC_GUIDE_EYEBROW}
          title={HOLIDAY_GUIDE_TITLE}
          meta={HOLIDAY_MAGIC_GUIDE_META}
          shareUrl={`https://puddlesmap.com${HOLIDAY_GUIDE_PATH}`}
          shareTitle={HOLIDAY_GUIDE_TITLE}
          guideSlug={HOLIDAY_GUIDE_SLUG}
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
            items={HOLIDAY_GUIDE_SECTION_NAV}
            guideSlug={HOLIDAY_GUIDE_SLUG}
          />
          <div className="gdm-h-split">
            <div className="gdm-h-split__main">
              <HolidayGuideDraft
                idPrefix={ID_PREFIX}
                jumps={false}
                rail={false}
                cover={HOLIDAY_GUIDE_COVER}
                heading="h1"
                suppressHero
                suppressCover
                hideEventsCta
                suppressClosing
                linkFinder
                finderLayout="bullets"
                imageOverrides={HOLIDAY_GUIDE_OUTING_IMAGES}
                trackSections={false}
                beforeFinder={<p className="gdm-wire-lede">{HOLIDAY_LIGHTS_FINDER_LEDE}</p>}
                afterFinder={
                  <>
                    <GuideFInlineCtas
                      onOpenMap={openMap}
                      collectionHref={HOLIDAY_EVENTS_HREF}
                      collectionEventCount={HOLIDAY_GUIDE_EVENT_COUNT}
                      showCollectionCta={false}
                    />
                    <GuideFExploreHeader lede={HOLIDAY_LIGHTS_EXPLORE_LEDE} />
                  </>
                }
                afterBody={
                  <>
                    <MoreFromCollectionGuides
                      collectionSlug="holiday-magic"
                      currentSlug="holiday-lights-traditions"
                    />
                    <GuideRelatedFooter
                      relatedGuides={[]}
                      seasonalHref={HOLIDAY_EVENTS_HREF}
                      seasonalTitle={HOLIDAY_GUIDE_CTA_TITLE}
                      seasonalDek={HOLIDAY_GUIDE_CTA_DEK}
                      seasonalLinkLabel={HOLIDAY_GUIDE_CTA_BROWSE_LABEL}
                      guideSlug={HOLIDAY_GUIDE_SLUG}
                      destinationKind="collection"
                    />
                  </>
                }
              />
            </div>
            <aside className="gdm-h-split__rail">
              <GuideDesktopTocRail
                idPrefix={ID_PREFIX}
                items={HOLIDAY_GUIDE_SECTION_NAV}
                guideSlug={HOLIDAY_GUIDE_SLUG}
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
        places={HOLIDAY_GUIDE_PLACES}
        categories={HOLIDAY_GUIDE_MAP_CATEGORIES}
        selectedSlug={selectedSlug}
        onSelectSlug={setSelectedSlug}
        defaultCategoryId="lights"
        guideSlug={HOLIDAY_GUIDE_SLUG}
      />
    </div>
  )
}
