import {
  HALLOWEEN_GUIDE_COVER,
  HALLOWEEN_GUIDE_PATH,
  HALLOWEEN_GUIDE_READ,
} from './halloweenGuide'
import {
  HOLIDAY_GUIDE_COVER,
  HOLIDAY_GUIDE_DEK,
  HOLIDAY_GUIDE_PATH,
  HOLIDAY_GUIDE_POSTED,
  HOLIDAY_GUIDE_READ,
  HOLIDAY_GUIDE_TITLE,
} from './holidayGuide'
import {
  HOLIDAY_STORIES_GUIDE_COVER,
  HOLIDAY_STORIES_GUIDE_DEK,
  HOLIDAY_STORIES_GUIDE_POSTED,
  HOLIDAY_STORIES_GUIDE_READ,
  HOLIDAY_STORIES_GUIDE_TITLE,
} from './holidayStoriesGuide'
import {
  HELLO_NEW_YEAR_GUIDE_COVER,
  HELLO_NEW_YEAR_GUIDE_DEK,
  HELLO_NEW_YEAR_GUIDE_POSTED,
  HELLO_NEW_YEAR_GUIDE_READ,
  HELLO_NEW_YEAR_GUIDE_TITLE,
} from './helloNewYearGuide'

import type { SeasonalCollectionSlug } from './seasonalDiscovery'
import type { GuideLifecycleKind, GuideLifecycleState } from '../utils/guideLifecycle'

export type GuideCatalogStatus = 'live' | 'soon'

export type GuideSeason = 'spring' | 'summer' | 'fall' | 'winter'

/** Editorial topic chips on /guides — only topics with live guides are shown. */
export const GUIDE_TOPIC_LABELS = [
  'Seasonal',
  'Local Favorites',
  'Travel',
  'Community',
  'Parent Resources',
  'From Puddles',
] as const

export type GuideTopic = (typeof GUIDE_TOPIC_LABELS)[number]

export interface GuideCatalogEntry {
  slug: string
  title: string
  dek: string
  /** Display date, e.g. October 22, 2026 */
  posted: string
  monthGuideLabel: string
  season: GuideSeason
  sortKey: string
  cover: string
  href: string | null
  status: GuideCatalogStatus
  readTime?: string
  featured?: boolean
  /**
   * When false, omit from the public /guides library (status may still be soon).
   * Defaults to true when omitted.
   */
  listOnGuidesHome?: boolean
  /** Topic chips; omit or empty until published under a topic. */
  topics?: GuideTopic[]
  /** Seasonal vs evergreen browsing CTA lifecycle. */
  lifecycleKind?: GuideLifecycleKind
  /** Linked seasonal collection for Browse CTA + season dates. */
  collectionSlug?: SeasonalCollectionSlug
  /** Editorial force for archive / reactivation. */
  lifecycleOverride?: GuideLifecycleState
}

/** Editorial catalog for /guides — add rows as new guides ship. */
export const GUIDES_CATALOG: GuideCatalogEntry[] = [
  {
    slug: 'halloween-with-little-ones',
    title: 'Halloween with Little Ones',
    dek: 'Parades, patches, daytime trick-or-treat, and neighborhood traditions for ages 0–5.',
    posted: 'October 22, 2026',
    monthGuideLabel: 'October guide',
    season: 'fall',
    sortKey: '2026-10-22',
    cover: HALLOWEEN_GUIDE_COVER,
    href: HALLOWEEN_GUIDE_PATH,
    status: 'live',
    readTime: HALLOWEEN_GUIDE_READ,
    topics: ['Seasonal'],
    lifecycleKind: 'seasonal',
    collectionSlug: 'halloween-with-little-ones',
  },
  {
    slug: 'holiday-lights-traditions',
    title: HOLIDAY_GUIDE_TITLE,
    dek: HOLIDAY_GUIDE_DEK,
    posted: HOLIDAY_GUIDE_POSTED.replace(/^Posted /, ''),
    monthGuideLabel: 'Holiday guide',
    season: 'winter',
    sortKey: '2026-11-11',
    cover: HOLIDAY_GUIDE_COVER,
    href: HOLIDAY_GUIDE_PATH,
    status: 'live',
    readTime: HOLIDAY_GUIDE_READ,
    featured: true,
    topics: ['Seasonal'],
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
  {
    slug: 'holiday-stories-play',
    title: HOLIDAY_STORIES_GUIDE_TITLE,
    dek: HOLIDAY_STORIES_GUIDE_DEK,
    posted: HOLIDAY_STORIES_GUIDE_POSTED,
    monthGuideLabel: 'Holiday guide',
    season: 'winter',
    sortKey: '2026-11-19',
    cover: HOLIDAY_STORIES_GUIDE_COVER,
    href: null,
    status: 'soon',
    readTime: HOLIDAY_STORIES_GUIDE_READ,
    topics: ['Seasonal'],
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
  {
    slug: 'hello-new-year',
    title: HELLO_NEW_YEAR_GUIDE_TITLE,
    dek: HELLO_NEW_YEAR_GUIDE_DEK,
    posted: HELLO_NEW_YEAR_GUIDE_POSTED,
    monthGuideLabel: 'New Year guide',
    season: 'winter',
    sortKey: '2026-12-07',
    cover: HELLO_NEW_YEAR_GUIDE_COVER,
    href: null,
    status: 'soon',
    readTime: HELLO_NEW_YEAR_GUIDE_READ,
    topics: ['Seasonal'],
    lifecycleKind: 'seasonal',
    collectionSlug: 'holiday-magic',
  },
  {
    slug: 'hello-fall',
    title: 'Hello, Fall with Little Ones',
    dek: 'Farm mornings, story walks, and gentle outdoor plans as the weather cools.',
    posted: 'September 2026',
    monthGuideLabel: 'September guide',
    season: 'fall',
    sortKey: '2026-09-01',
    cover: '/seasonal/hello-fall.png',
    href: null,
    status: 'soon',
    listOnGuidesHome: false,
  },
  {
    slug: 'summer-splash-shade',
    title: 'Splash, Shade & Slow Mornings',
    dek: 'Spraygrounds, shaded parks, and short outings for hot South Bay days.',
    posted: 'June 2026',
    monthGuideLabel: 'Summer guide',
    season: 'summer',
    sortKey: '2026-06-01',
    cover: '/seasonal/hello-fall.png',
    href: null,
    status: 'soon',
    listOnGuidesHome: false,
  },
  {
    slug: 'spring-bloom-walks',
    title: 'Spring Bloom & Neighborhood Walks',
    dek: 'Flower spots, library lawns, and easy stroller loops as the days lengthen.',
    posted: 'April 2026',
    monthGuideLabel: 'Spring guide',
    season: 'spring',
    sortKey: '2026-04-01',
    cover: '/seasonal/hello-fall.png',
    href: null,
    status: 'soon',
    listOnGuidesHome: false,
  },
  {
    slug: 'cozy-january',
    title: 'Cozy January Indoors',
    dek: 'Story hours, museum mornings, and rainy-day backups when parks are muddy.',
    posted: 'January 2026',
    monthGuideLabel: 'January guide',
    season: 'winter',
    sortKey: '2026-01-15',
    cover: '/seasonal/holiday-magic.png',
    href: null,
    status: 'soon',
    listOnGuidesHome: false,
  },
]

const SEASON_ORDER: GuideSeason[] = ['winter', 'spring', 'summer', 'fall']

const SEASON_HEADINGS: Record<GuideSeason, { title: string; dek: string }> = {
  spring: {
    title: 'Spring',
    dek: 'Bloom walks, egg hunts, and first warm-weekend plans.',
  },
  summer: {
    title: 'Summer',
    dek: 'Splash pads, shaded parks, and slow morning outings.',
  },
  fall: {
    title: 'Fall',
    dek: 'Harvest fun, Halloween, and pumpkin-patch days.',
  },
  winter: {
    title: 'Winter',
    dek: 'Holiday lights, cozy indoor backups, and January resets.',
  },
}

export function getLiveGuideCount(): number {
  return GUIDES_CATALOG.filter((g) => g.status === 'live').length
}

/** Public /guides always shows the season library when any listed guide exists. */
export function showGuideSeasonSections(): boolean {
  return getGuidesHomeLibrary().length > 0
}

export function getFeaturedGuide(): GuideCatalogEntry {
  const featured = GUIDES_CATALOG.find((g) => g.featured && g.status === 'live')
  if (featured) return featured
  const live = GUIDES_CATALOG.filter((g) => g.status === 'live')
  if (live.length) {
    return [...live].sort((a, b) => b.sortKey.localeCompare(a.sortKey))[0]!
  }
  return GUIDES_CATALOG[0]!
}

export function getGuideStream(): GuideCatalogEntry[] {
  const featured = getFeaturedGuide()
  return [...GUIDES_CATALOG]
    .filter((g) => g.slug !== featured.slug)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
}

/** Non-featured live guides only — for the public /guides Latest row. */
export function getLiveGuideStream(): GuideCatalogEntry[] {
  return getGuideStream().filter((g) => g.status === 'live')
}

/**
 * Public /guides “More guides” cards: listed guides only, excluding the featured hero.
 * Live first (reverse-chronological), then upcoming (`soon`) by sortKey.
 */
export function getGuidesHomeLibrary(): GuideCatalogEntry[] {
  const featuredSlug = getFeaturedGuide().slug
  const listed = GUIDES_CATALOG.filter(
    (g) => g.listOnGuidesHome !== false && g.slug !== featuredSlug,
  )
  const soon = listed
    .filter((g) => g.status === 'soon')
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  const live = listed
    .filter((g) => g.status === 'live')
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  return [...live, ...soon]
}

export function getGuidesBySeason(): {
  season: GuideSeason
  heading: string
  dek: string
  guides: GuideCatalogEntry[]
}[] {
  return SEASON_ORDER.map((season) => ({
    season,
    heading: SEASON_HEADINGS[season].title,
    dek: SEASON_HEADINGS[season].dek,
    guides: GUIDES_CATALOG.filter(
      (g) => g.season === season && g.listOnGuidesHome !== false,
    ).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
  })).filter((group) => group.guides.length > 0)
}

/** Topics that have at least one live guide — for /guides secondary nav. */
export function getPublishedGuideTopics(): GuideTopic[] {
  const live = GUIDES_CATALOG.filter((g) => g.status === 'live')
  return GUIDE_TOPIC_LABELS.filter((topic) => live.some((g) => g.topics?.includes(topic)))
}

export function guideMatchesTopic(guide: GuideCatalogEntry, topic: GuideTopic | 'All'): boolean {
  if (topic === 'All') return true
  return Boolean(guide.topics?.includes(topic))
}

export function getGuideBySlug(slug: string): GuideCatalogEntry | undefined {
  return GUIDES_CATALOG.find((g) => g.slug === slug)
}

/** Sibling guides in the same seasonal collection, excluding the current guide. */
export function getSiblingGuides(
  collectionSlug: SeasonalCollectionSlug,
  currentSlug: string,
): GuideCatalogEntry[] {
  return GUIDES_CATALOG.filter(
    (g) =>
      g.collectionSlug === collectionSlug &&
      g.slug !== currentSlug &&
      g.listOnGuidesHome !== false,
  ).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

/** All guides for a seasonal hub Explore panel / carousel (fixed sort). */
export function getGuidesForCollection(collectionSlug: SeasonalCollectionSlug): GuideCatalogEntry[] {
  return GUIDES_CATALOG.filter(
    (g) => g.collectionSlug === collectionSlug && g.listOnGuidesHome !== false,
  ).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}
