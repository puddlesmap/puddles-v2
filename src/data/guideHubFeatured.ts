import type { SeasonalCollectionSlug } from './seasonalDiscovery'
import {
  getGuidesForCollection,
  type GuideCatalogEntry,
} from './guidesCatalog'
import { zonedCalendarDate } from '../utils/dates'

export type GuideHubFeaturedWindow = {
  guideSlug: string
  featuredFrom: string
  featuredUntil: string
}

export type GuideHubFeaturedConfig = {
  windows: GuideHubFeaturedWindow[]
  /** Manual editorial override — used when that guide is live. */
  featuredGuideSlugOverride?: string | null
}

/**
 * Seasonal hub Explore-the-guides featured rotation.
 * Dates are inclusive calendar days in America/Los_Angeles.
 */
export const GUIDE_HUB_FEATURED_BY_COLLECTION: Partial<
  Record<SeasonalCollectionSlug, GuideHubFeaturedConfig>
> = {
  'holiday-magic': {
    windows: [
      {
        guideSlug: 'holiday-lights-traditions',
        featuredFrom: '2026-11-12',
        featuredUntil: '2026-12-14',
      },
      {
        guideSlug: 'holiday-stories-play',
        featuredFrom: '2026-12-15',
        featuredUntil: '2026-12-25',
      },
      {
        guideSlug: 'hello-new-year',
        featuredFrom: '2026-12-26',
        featuredUntil: '2027-01-06',
      },
    ],
  },
}

function isLiveGuide(guide: GuideCatalogEntry | undefined): guide is GuideCatalogEntry {
  return Boolean(guide && guide.status === 'live' && guide.href)
}

function isWindowActive(window: GuideHubFeaturedWindow, today: string): boolean {
  return window.featuredFrom <= today && today <= window.featuredUntil
}

function findGuide(
  guides: GuideCatalogEntry[],
  slug: string,
): GuideCatalogEntry | undefined {
  return guides.find((g) => g.slug === slug)
}

/**
 * Resolve which guide should lead the seasonal hub Explore panel.
 * Only published (live + href) guides can be featured.
 */
export function resolveFeaturedGuideForCollection(
  collectionSlug: SeasonalCollectionSlug,
  now: Date = new Date(),
  config: GuideHubFeaturedConfig | undefined = GUIDE_HUB_FEATURED_BY_COLLECTION[collectionSlug],
): GuideCatalogEntry | undefined {
  const guides = getGuidesForCollection(collectionSlug)
  if (guides.length === 0) return undefined

  const today = zonedCalendarDate(now)
  const liveGuides = guides.filter(isLiveGuide)

  if (config?.featuredGuideSlugOverride) {
    const override = findGuide(guides, config.featuredGuideSlugOverride)
    if (isLiveGuide(override)) return override
  }

  if (config?.windows?.length) {
    const active = config.windows.find((window) => isWindowActive(window, today))
    if (active) {
      const scheduled = findGuide(guides, active.guideSlug)
      if (isLiveGuide(scheduled)) return scheduled
    }

    // Most recently eligible: last window that already ended whose guide is live
    const endedLive = [...config.windows]
      .filter((window) => window.featuredUntil < today)
      .reverse()
      .map((window) => findGuide(guides, window.guideSlug))
      .find(isLiveGuide)
    if (endedLive) return endedLive

    // Or first upcoming window that is already live (early publish)
    const upcomingLive = config.windows
      .filter((window) => window.featuredFrom > today)
      .map((window) => findGuide(guides, window.guideSlug))
      .find(isLiveGuide)
    if (upcomingLive) return upcomingLive
  }

  if (liveGuides.length === 0) return undefined
  return [...liveGuides].sort((a, b) => b.sortKey.localeCompare(a.sortKey))[0]
}

/**
 * Collection guides ordered for the hub: featured first, then stable sortKey.
 */
export function orderGuidesForCollectionHub(
  collectionSlug: SeasonalCollectionSlug,
  now: Date = new Date(),
  config?: GuideHubFeaturedConfig,
): GuideCatalogEntry[] {
  const guides = getGuidesForCollection(collectionSlug)
  if (guides.length === 0) return []

  const featured = resolveFeaturedGuideForCollection(collectionSlug, now, config)
  if (!featured) return guides

  const supporting = guides.filter((g) => g.slug !== featured.slug)
  return [featured, ...supporting]
}
