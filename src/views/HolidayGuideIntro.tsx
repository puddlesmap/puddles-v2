import { lazy, Suspense, useCallback, useState } from 'react'
import { GuideParentNav } from '../components/guides/GuideParentNav'
import { GuideEditorialHero } from '../components/guides/GuideEditorialHero'
import { GuideSectionNav } from '../components/guides/QuickPick'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import {
  HOLIDAY_EVENTS_HREF,
  HOLIDAY_GUIDE_COVER,
  HOLIDAY_GUIDE_CTA_LABEL,
  HOLIDAY_GUIDE_DEK,
  HOLIDAY_GUIDE_EVENT_COUNT,
  HOLIDAY_GUIDE_POSTED,
  HOLIDAY_GUIDE_READ,
  HOLIDAY_GUIDE_SECTION_NAV,
  HOLIDAY_GUIDE_SUBTITLE,
  HOLIDAY_GUIDE_TITLE,
} from '../data/holidayGuide'
import { HOLIDAY_GUIDE_MAP_CATEGORIES, HOLIDAY_GUIDE_PLACES } from '../data/holidayGuidePlaces'
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

const HOLIDAY_META = getGuideLifecycleMeta(
  GUIDES_CATALOG.find((g) => g.slug === 'holiday-lights-traditions') ?? {
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
)

const PAST_NOTE =
  'This season has ended. The recommendations below are from the 2026–27 holidays and are kept here for inspiration and planning.'

export function HolidayGuideIntro({
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
  const lifecycle = resolveGuideLifecycleState(HOLIDAY_META)
  const showCta = shouldShowGuideCollectionCta(HOLIDAY_META)
  const [internalSlug, setInternalSlug] = useState<string | null>(null)
  const selectedSlug = selectedMapSlug !== undefined ? selectedMapSlug : internalSlug
  const setSelectedSlug = onSelectMapSlug ?? setInternalSlug

  const onSelect = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug)
    },
    [setSelectedSlug],
  )

  const showMap = HOLIDAY_GUIDE_PLACES.length > 0 && hasGoogleMapsApiKey()

  return (
    <div className="gct-gutter holiday-guide-intro">
      <GuideParentNav guideSlug="holiday-lights-traditions" />
      <GuideEditorialHero
        title={`${HOLIDAY_GUIDE_TITLE} ✨`}
        subtitle={HOLIDAY_GUIDE_SUBTITLE}
        description={HOLIDAY_GUIDE_DEK}
        publicationDate={HOLIDAY_GUIDE_POSTED}
        readingTime={HOLIDAY_GUIDE_READ}
        eventCount={HOLIDAY_GUIDE_EVENT_COUNT}
        heroImage={HOLIDAY_GUIDE_COVER}
        seasonalStatus={lifecycle}
        pastSeasonNote={PAST_NOTE}
        tone="holiday"
        metaPlacement="below-dek"
        primaryCta={
          showCta
            ? {
                label: HOLIDAY_GUIDE_CTA_LABEL,
                href: HOLIDAY_EVENTS_HREF,
              }
            : null
        }
      />
      <GuideSectionNav
        id={indexId}
        items={HOLIDAY_GUIDE_SECTION_NAV.map((item) => ({
          href: `#${idPrefix}-${item.slug}`,
          label: item.label,
          imageSrc: item.imageSrc,
        }))}
      />
      {showMap ? (
        <section className="holiday-guide-map" aria-labelledby="holiday-map-title">
          <h2 id="holiday-map-title">Where the Holiday Magic Happens</h2>
          <p className="holiday-guide-map__lede">
            Choose a category to explore holiday outings around the Bay Area.
          </p>
          <Suspense fallback={<div className="guide-map guide-map--compact" aria-hidden="true" />}>
            <GuidePlacesMap
              idPrefix={idPrefix}
              places={HOLIDAY_GUIDE_PLACES}
              categories={HOLIDAY_GUIDE_MAP_CATEGORIES}
              categorySelect="single"
              defaultCategoryId="lights"
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
