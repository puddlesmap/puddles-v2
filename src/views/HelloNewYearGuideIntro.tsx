import { lazy, Suspense, useCallback, useState } from 'react'
import { GuideParentNav } from '../components/guides/GuideParentNav'
import { GuideEditorialHero } from '../components/guides/GuideEditorialHero'
import { GuideSectionNav } from '../components/guides/QuickPick'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import {
  HELLO_NEW_YEAR_CTA_LABEL,
  HELLO_NEW_YEAR_EVENTS_HREF,
  HELLO_NEW_YEAR_GUIDE_COVER,
  HELLO_NEW_YEAR_GUIDE_DEK,
  HELLO_NEW_YEAR_GUIDE_EVENT_COUNT,
  HELLO_NEW_YEAR_GUIDE_POSTED,
  HELLO_NEW_YEAR_GUIDE_READ,
  HELLO_NEW_YEAR_GUIDE_SECTION_NAV,
  HELLO_NEW_YEAR_GUIDE_SUBTITLE,
  HELLO_NEW_YEAR_GUIDE_TITLE,
} from '../data/helloNewYearGuide'
import {
  HELLO_NEW_YEAR_GUIDE_MAP_CATEGORIES,
  HELLO_NEW_YEAR_GUIDE_PLACES,
} from '../data/helloNewYearGuidePlaces'
import {
  getGuideLifecycleMeta,
  resolveGuideLifecycleState,
  shouldShowGuideCollectionCta,
} from '../utils/guideLifecycle'
import { hasGoogleMapsApiKey } from '../utils/googleMaps'
import './guide-editorial-hero.css'

const GuidePlacesMap = lazy(() =>
  import('../components/guides/GuidePlacesMap').then((mod) => ({ default: mod.GuidePlacesMap })),
)

const GUIDE_META = getGuideLifecycleMeta(
  GUIDES_CATALOG.find((g) => g.slug === 'hello-new-year') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

const PAST_NOTE =
  'This season has ended. The recommendations below are from the 2026–27 holidays and are kept here for inspiration and planning.'

export function HelloNewYearGuideIntro({
  idPrefix,
  indexId,
  selectedMapSlug,
  onSelectMapSlug,
}: {
  idPrefix: string
  indexId: string
  selectedMapSlug?: string | null
  onSelectMapSlug?: (slug: string | null) => void
}) {
  const lifecycle = resolveGuideLifecycleState(GUIDE_META)
  const showCta = shouldShowGuideCollectionCta(GUIDE_META)
  const [internalSlug, setInternalSlug] = useState<string | null>(null)
  const selectedSlug = selectedMapSlug !== undefined ? selectedMapSlug : internalSlug
  const setSelectedSlug = onSelectMapSlug ?? setInternalSlug

  const onSelect = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug)
    },
    [setSelectedSlug],
  )

  const showMap = HELLO_NEW_YEAR_GUIDE_PLACES.length > 0 && hasGoogleMapsApiKey()

  return (
    <div className="gct-gutter holiday-guide-intro">
      <GuideParentNav guideSlug="hello-new-year" />
      <GuideEditorialHero
        title={`${HELLO_NEW_YEAR_GUIDE_TITLE} 🎉`}
        subtitle={HELLO_NEW_YEAR_GUIDE_SUBTITLE}
        description={HELLO_NEW_YEAR_GUIDE_DEK}
        publicationDate={HELLO_NEW_YEAR_GUIDE_POSTED}
        readingTime={HELLO_NEW_YEAR_GUIDE_READ}
        eventCount={HELLO_NEW_YEAR_GUIDE_EVENT_COUNT}
        heroImage={HELLO_NEW_YEAR_GUIDE_COVER}
        seasonalStatus={lifecycle}
        pastSeasonNote={PAST_NOTE}
        tone="holiday"
        metaPlacement="below-dek"
        primaryCta={
          showCta
            ? {
                label: HELLO_NEW_YEAR_CTA_LABEL,
                href: HELLO_NEW_YEAR_EVENTS_HREF,
              }
            : null
        }
      />
      <GuideSectionNav
        id={indexId}
        items={HELLO_NEW_YEAR_GUIDE_SECTION_NAV.map((item) => ({
          href: `#${idPrefix}-${item.slug}`,
          label: item.label,
          imageSrc: item.imageSrc,
        }))}
      />
      {showMap ? (
        <section className="holiday-guide-map" aria-labelledby="hello-new-year-map-title">
          <h2 id="hello-new-year-map-title">Explore the locations</h2>
          <p className="holiday-guide-map__lede">
            Find an early countdown close to home or plan a day out with little ones around the Bay
            Area.
          </p>
          <Suspense fallback={<div className="guide-map guide-map--compact" aria-hidden="true" />}>
            <GuidePlacesMap
              idPrefix={idPrefix}
              places={HELLO_NEW_YEAR_GUIDE_PLACES}
              categories={HELLO_NEW_YEAR_GUIDE_MAP_CATEGORIES}
              categorySelect="single"
              defaultCategoryId="city"
              caption=""
              compact
              pinTheme="holiday"
              showLegend
              selectedSlug={selectedSlug}
              onSelectSlug={onSelect}
            />
          </Suspense>
        </section>
      ) : null}
    </div>
  )
}
