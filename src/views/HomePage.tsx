import { useMemo } from 'react'
import { HomeExperimentPage } from './HomeExperimentPage'
import { HomeSeasonalTeaser } from '../components/seasonal/HomeSeasonalTeaser'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { useStructuredData } from '../hooks/useStructuredData'
import { websiteJsonLd, websiteStructuredDataId } from '../utils/siteStructuredData'
import { getEventImageUrl, isEventFallbackImage } from '../utils/eventImages'
import type { Event } from '../types/event'
import {
  getActiveSeasonalCollections,
  getComingNextSeasonalTeaser,
  resolveFeaturedSeasonalEvents,
  resolveSeasonalEvents,
  seasonalCollectionPath,
  type SeasonalCollection,
} from '../data/seasonalDiscovery'
import { GUIDES_CATALOG } from '../data/guidesCatalog'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { sortSeasonalDiscoveryEvents } from '../utils/formatSeasonalSchedule'

/** Picks a parent can still open: same list as the collection page, after ended events drop off. */
function seasonalCollectionPickCount(collection: SeasonalCollection, now: Date = new Date()): number {
  const driveIds = new Set(collection.driveEventIds ?? [])
  const closeIds = collection.collectionEventIds.filter((id) => !driveIds.has(id))
  const close = sortSeasonalDiscoveryEvents(resolveSeasonalEvents(closeIds), now)
  const drive = sortSeasonalDiscoveryEvents(
    resolveSeasonalEvents(collection.driveEventIds ?? []),
    now,
  )
  return close.length + drive.length
}

/** Live guides tied to a seasonal collection (e.g. Holiday Magic hub). */
function liveGuideCountForCollection(slug: SeasonalCollection['slug']): number {
  return GUIDES_CATALOG.filter(
    (guide) => guide.collectionSlug === slug && guide.status === 'live',
  ).length
}

/** Option D Home count line: `38 activities · 1 guide` (guides omitted when 0). */
function formatHomeSeasonalCountMeta(
  activityCount: number,
  guideCount: number,
): string | null {
  if (activityCount <= 0 && guideCount <= 0) return null
  const parts: string[] = []
  if (activityCount > 0) {
    parts.push(`${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`)
  }
  if (guideCount > 0) {
    parts.push(`${guideCount} ${guideCount === 1 ? 'guide' : 'guides'}`)
  }
  return parts.join(' · ') || null
}

function bannerPhotoEvents(collection: SeasonalCollection): Event[] {
  const featured = resolveFeaturedSeasonalEvents(collection)
  const extras = resolveSeasonalEvents([
    ...collection.collectionEventIds,
    ...(collection.driveEventIds ?? []),
  ])
  const seen = new Set<string>()
  const out: Event[] = []
  const add = (event: Event, skipFallback: boolean) => {
    if (seen.has(event.id) || out.length >= 5) return
    if (skipFallback && isEventFallbackImage(getEventImageUrl(event), event)) return
    seen.add(event.id)
    out.push(event)
  }
  featured.forEach((event) => add(event, false))
  extras.forEach((event) => add(event, true))
  extras.forEach((event) => add(event, false))
  return out
}

export function HomePage({
  filterVariant = 'chips',
}: {
  filterVariant?: 'chips' | 'where-when-pill'
} = {}) {
  useStructuredData(websiteStructuredDataId, websiteJsonLd)
  const comingNext = getComingNextSeasonalTeaser()
  const collections = useMemo(() => getActiveSeasonalCollections(), [])
  const teasers = useMemo(
    () =>
      collections.map((collection) => {
        const count = seasonalCollectionPickCount(collection)
        const countMeta =
          collection.slug === 'holiday-magic'
            ? formatHomeSeasonalCountMeta(count, liveGuideCountForCollection(collection.slug))
            : null
        return {
          collection,
          events: bannerPhotoEvents(collection),
          count,
          countMeta,
          href: seasonalCollectionPath(collection.slug),
        }
      }),
    [collections],
  )

  const afterResults = (
    <>
      {comingNext ? (
        <aside
          className={[
            'seasonal-next-preview',
            comingNext.slug === 'holiday-magic' ? 'seasonal-next-preview--holiday' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="Next seasonal theme"
        >
          <p className="seasonal-next-preview__eyebrow">Coming next</p>
          <div className="seasonal-next-preview__row">
            <img
              src={comingNext.illustrationSrc}
              alt=""
              className="seasonal-next-preview__illustration"
              width={72}
              height={72}
              decoding="async"
            />
            <div className="seasonal-next-preview__copy">
              <h2 className="seasonal-next-preview__title">{comingNext.subtitle}</h2>
              <p className="seasonal-next-preview__tagline">{comingNext.moduleTagline}</p>
            </div>
          </div>
        </aside>
      ) : null}

      <SeasonalBrowseCategoriesPreview />
    </>
  )

  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band"
      shellClassName="home-experiment-shell--refined home-experiment-shell--seasonal-puddles-aligned home-seasonal-density--split-bp home-seasonal-dual-stack"
      heroVariant="refined"
      layout="refined"
      filterVariant={filterVariant}
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      headerBelow={<HomeLaunchAnnouncement />}
      venueResponsive
      topBand={
        <>
          {teasers.map(({ collection, events, count, countMeta, href }) => (
            <HomeSeasonalTeaser
              key={collection.slug}
              collection={collection}
              href={href}
              variant="band"
              proof="photo-strip"
              events={events}
              pickCount={count}
              countMeta={countMeta}
              prominent
            />
          ))}
        </>
      }
      beforeResults={
        <>
          {teasers.map(({ collection, events, count, countMeta, href }) => (
            <HomeSeasonalTeaser
              key={collection.slug}
              collection={collection}
              href={href}
              variant="band"
              proof="photo-strip"
              events={events}
              pickCount={count}
              countMeta={countMeta}
              prominent
              idSuffix="-card"
            />
          ))}
        </>
      }
      afterResults={afterResults}
    />
  )
}
