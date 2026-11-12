import { lazy, Suspense, useCallback, useState } from 'react'
import { GuideParentNav } from '../components/guides/GuideParentNav'
import { GuideEditorialHero } from '../components/guides/GuideEditorialHero'
import { GuideSectionNav } from '../components/guides/QuickPick'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import {
  HOLIDAY_STORIES_CTA_LABEL,
  HOLIDAY_STORIES_EVENTS_HREF,
  HOLIDAY_STORIES_GUIDE_COVER,
  HOLIDAY_STORIES_GUIDE_DEK,
  HOLIDAY_STORIES_GUIDE_EVENT_COUNT,
  HOLIDAY_STORIES_GUIDE_POSTED,
  HOLIDAY_STORIES_GUIDE_READ,
  HOLIDAY_STORIES_GUIDE_SECTION_NAV,
  HOLIDAY_STORIES_GUIDE_SUBTITLE,
  HOLIDAY_STORIES_GUIDE_TITLE,
} from '../data/holidayStoriesGuide'
import {
  HOLIDAY_STORIES_GUIDE_MAP_CATEGORIES,
  HOLIDAY_STORIES_GUIDE_PLACES,
} from '../data/holidayStoriesGuidePlaces'
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
  GUIDES_CATALOG.find((g) => g.slug === 'holiday-stories-play') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

const PAST_NOTE =
  'This season has ended. The recommendations below are from the 2026–27 holidays and are kept here for inspiration and planning.'

export function HolidayStoriesGuideIntro({
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

  const showMap = HOLIDAY_STORIES_GUIDE_PLACES.length > 0 && hasGoogleMapsApiKey()

  return (
    <div className="gct-gutter holiday-guide-intro">
      <GuideParentNav guideSlug="holiday-stories-play" />
      <GuideEditorialHero
        title={`${HOLIDAY_STORIES_GUIDE_TITLE} 🎭`}
        subtitle={HOLIDAY_STORIES_GUIDE_SUBTITLE}
        description={HOLIDAY_STORIES_GUIDE_DEK}
        publicationDate={HOLIDAY_STORIES_GUIDE_POSTED}
        readingTime={HOLIDAY_STORIES_GUIDE_READ}
        eventCount={HOLIDAY_STORIES_GUIDE_EVENT_COUNT}
        heroImage={HOLIDAY_STORIES_GUIDE_COVER}
        seasonalStatus={lifecycle}
        pastSeasonNote={PAST_NOTE}
        tone="holiday"
        metaPlacement="below-dek"
        primaryCta={
          showCta
            ? {
                label: HOLIDAY_STORIES_CTA_LABEL,
                href: HOLIDAY_STORIES_EVENTS_HREF,
              }
            : null
        }
      />
      <GuideSectionNav
        id={indexId}
        items={HOLIDAY_STORIES_GUIDE_SECTION_NAV.map((item) => ({
          href: `#${idPrefix}-${item.slug}`,
          label: item.label,
          imageSrc: item.imageSrc,
        }))}
      />
      {showMap ? (
        <section className="holiday-guide-map" aria-labelledby="holiday-stories-map-title">
          <h2 id="holiday-stories-map-title">Explore the locations</h2>
          <p className="holiday-guide-map__lede">
            See where these shows, stories, and winter play experiences are happening across the Bay
            Area.
          </p>
          <Suspense fallback={<div className="guide-map guide-map--compact" aria-hidden="true" />}>
            <GuidePlacesMap
              idPrefix={idPrefix}
              places={HOLIDAY_STORIES_GUIDE_PLACES}
              categories={HOLIDAY_STORIES_GUIDE_MAP_CATEGORIES}
              categorySelect="single"
              defaultCategoryId="theater"
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
