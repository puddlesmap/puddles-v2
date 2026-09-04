import type { Event } from '../types/event'
import { ALL_EVENTS, getPublicEventsFromCatalog } from './events'
import seasonalCurationOverrides from './seasonal-curation-overrides.json'
import { zonedCalendarDate } from '../utils/dates'

/** Hard max cards on the Home seasonal discovery band (one row). */
export const MAX_SEASONAL_FEATURED_HOME = 4

export type SeasonalCollectionSlug = 'hello-fall' | 'halloween-with-little-ones'

export interface SeasonalAccent {
  /** Month / theme eyebrow label color */
  eyebrow: string
  background: string
  border: string
  glow: string
  /** Home band title — defaults to charcoal in CSS */
  title?: string
  /** Home band description — defaults to muted in CSS */
  description?: string
  /** Home band header CTA — defaults to charcoal in CSS */
  cta?: string
}

export interface SeasonalCollection {
  slug: SeasonalCollectionSlug
  title: string
  subtitle: string
  description: string
  /** Short line under the module title on Home */
  moduleTagline: string
  ctaLabel: string
  timingLabel: string
  /** Decorative emoji for the module header */
  decor: [string, string, string]
  /** Clay seasonal illustration (public/seasonal) */
  illustrationSrc: string
  /** Pastel accent for the module shell + eyebrow */
  accent: SeasonalAccent
  /**
   * Home carousel picks with editorial date windows (~2–3 weeks each).
   * Rotating out of featured does not remove from collectionEventIds.
   */
  featuredWindows: SeasonalFeaturedWindow[]
  /** Full set for the collection page (may include extras beyond the carousel) */
  collectionEventIds: string[]
  /**
   * Optional secondary “worth a drive” picks outside core cities.
   * Only used on collection pages that opt into geographic sections.
   */
  driveEventIds?: string[]
  /** Collection-page section copy when geographic split is enabled */
  closeToHome?: {
    title: string
    subtitle: string
  }
  worthADrive?: {
    title: string
    subtitle: string
  }
  activeFrom: string
  activeUntil: string
}

/** Home carousel slot — see `.cursor/rules/seasonal-discovery-featured.mdc` */
export interface SeasonalFeaturedWindow {
  eventId: string
  featuredFrom: string
  featuredUntil: string
  /** When true, intended to stay featured across its full window (festival anchor, series row). */
  anchor?: boolean
  /** Editorial note for calendar / launch review */
  note?: string
}

export type SeasonalFeaturedWindowStatus = 'active' | 'upcoming' | 'past'

export function getSeasonalFeaturedWindowStatus(
  window: SeasonalFeaturedWindow,
  today: string,
): SeasonalFeaturedWindowStatus {
  if (today < window.featuredFrom) return 'upcoming'
  if (today > window.featuredUntil) return 'past'
  return 'active'
}

export function isSeasonalFeaturedWindowActive(
  window: SeasonalFeaturedWindow,
  now: Date = new Date(),
): boolean {
  const today = zonedCalendarDate(now)
  return window.featuredFrom <= today && today <= window.featuredUntil
}

export interface FeaturedHomeCandidate {
  eventId: string
  anchor: boolean
  featuredFrom: string
  featuredUntil: string
  note?: string
  /** Index in featuredWindows (editorial order). */
  order: number
}

/**
 * Active featured windows for Pacific “today”, deduped by eventId (first wins).
 * Does not apply the Home max-4 cap.
 */
export function getActiveFeaturedCandidates(
  collection: SeasonalCollection,
  now: Date = new Date(),
): FeaturedHomeCandidate[] {
  const seen = new Set<string>()
  const candidates: FeaturedHomeCandidate[] = []

  collection.featuredWindows.forEach((window, order) => {
    if (!isSeasonalFeaturedWindowActive(window, now)) return
    if (seen.has(window.eventId)) return
    seen.add(window.eventId)
    candidates.push({
      eventId: window.eventId,
      anchor: Boolean(window.anchor),
      featuredFrom: window.featuredFrom,
      featuredUntil: window.featuredUntil,
      note: window.note,
      order,
    })
  })

  return candidates
}

function rankFeaturedForHome(candidates: FeaturedHomeCandidate[]): FeaturedHomeCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.anchor !== b.anchor) return a.anchor ? -1 : 1
    return a.order - b.order
  })
}

/** Featured carousel IDs for Home — Pacific today, anchors first, max 4. */
export function getFeaturedEventIdsForDate(
  collection: SeasonalCollection,
  now: Date = new Date(),
): string[] {
  return rankFeaturedForHome(getActiveFeaturedCandidates(collection, now))
    .slice(0, MAX_SEASONAL_FEATURED_HOME)
    .map((row) => row.eventId)
}

/** Explain Home featured selection for mockups / ops review. */
export function explainFeaturedHomeSelection(
  collection: SeasonalCollection,
  now: Date = new Date(),
): {
  today: string
  max: number
  active: FeaturedHomeCandidate[]
  selected: FeaturedHomeCandidate[]
  truncated: FeaturedHomeCandidate[]
} {
  const today = zonedCalendarDate(now)
  const active = getActiveFeaturedCandidates(collection, now)
  const ranked = rankFeaturedForHome(active)
  const selected = ranked.slice(0, MAX_SEASONAL_FEATURED_HOME)
  const truncated = ranked.slice(MAX_SEASONAL_FEATURED_HOME)
  return { today, max: MAX_SEASONAL_FEATURED_HOME, active, selected, truncated }
}

/** All event IDs that appear in featured windows (any date) — for review tooling. */
export function getAllFeaturedCandidateIds(collection: SeasonalCollection): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const window of collection.featuredWindows) {
    if (seen.has(window.eventId)) continue
    seen.add(window.eventId)
    ids.push(window.eventId)
  }
  return ids
}

export function resolveFeaturedSeasonalEvents(
  collection: SeasonalCollection,
  catalog: Event[] = getPublicEventsFromCatalog(),
  now: Date = new Date(),
): Event[] {
  return resolveSeasonalEvents(getFeaturedEventIdsForDate(collection, now), catalog)
}

/**
 * Saved seasonal eyebrow palette + clay illustrations for collection themes.
 * Soft/muted so themes stay distinct without competing with brand blue.
 * Visual review: /seasonal-eyebrow-colors.html
 * Illustrations: /public/seasonal/*
 */
export const SEASONAL_EYEBROW_PALETTE = [
  {
    timing: 'September',
    theme: 'Hello, Fall',
    emoji: '🍎',
    hex: '#c47a3a',
    note: 'Warm harvest amber',
    slug: 'hello-fall' as const,
    illustrationSrc: '/seasonal/hello-fall.png',
  },
  {
    timing: 'October',
    theme: 'Halloween with little ones',
    emoji: '🎃',
    hex: '#b45309',
    note: 'Deeper pumpkin / terracotta',
    slug: 'halloween-with-little-ones' as const,
    illustrationSrc: '/seasonal/halloween-with-little-ones.png',
  },
  {
    timing: 'November',
    theme: 'Fall gatherings',
    emoji: '🍁',
    hex: '#9a3412',
    note: 'Maple rust / muted cranberry',
    slug: null,
    illustrationSrc: '/seasonal/thanksgiving-fall-outings.png',
  },
  {
    timing: 'December',
    theme: 'Holiday magic',
    emoji: '✨',
    hex: '#5f7a4a',
    note: 'Soft evergreen (alt gold: #b8953d)',
    slug: null,
    illustrationSrc: '/seasonal/holiday-magic.png',
  },
  {
    timing: 'January',
    theme: 'Rainy-day favorites',
    emoji: '🌧',
    hex: '#5b7c99',
    note: 'Cool slate-blue near brand soft',
    slug: null,
    illustrationSrc: '/seasonal/rainy-day-favorites.png',
  },
  {
    timing: 'February',
    theme: "Valentine's / Lunar New Year",
    emoji: '❤️',
    hex: '#d97884',
    note: 'Soft coral near --color-accent-coral',
    slug: null,
    illustrationSrc: '/seasonal/valentines-lunar-new-year.png',
  },
  {
    timing: 'Spring',
    theme: 'Flowers, farms & Easter',
    emoji: '🌸',
    hex: '#4f9d78',
    note: 'Soft leaf near --color-accent-leaf',
    slug: null,
    illustrationSrc: '/seasonal/flowers-farms-easter.png',
  },
  {
    timing: 'Summer',
    theme: 'Summer favorites',
    emoji: '☀️',
    hex: '#d49a12',
    note: 'Sunny gold near --color-accent-sunny',
    slug: null,
    illustrationSrc: '/seasonal/summer-favorites.png',
  },
] as const

export type SeasonalEyebrowTiming = (typeof SEASONAL_EYEBROW_PALETTE)[number]['timing']

export function getSeasonalEyebrowColor(timing: string): string {
  const match = SEASONAL_EYEBROW_PALETTE.find((entry) => entry.timing === timing)
  return match?.hex ?? '#c47a3a'
}

export function getSeasonalIllustrationSrc(timing: string): string | undefined {
  return SEASONAL_EYEBROW_PALETTE.find((entry) => entry.timing === timing)?.illustrationSrc
}

/**
 * Editorial seasonal collections — not a new event taxonomy.
 * Themes transition with local activity patterns (Hello, Fall → Halloween in early October).
 *
 * **One live theme at a time:** Home band, collection page, and Fall/Halloween Pick badges all
 * follow `activeFrom` / `activeUntil` via `getActiveSeasonalCollection()`. Never show Fall Pick and
 * Halloween Pick together. The same event may appear in both collections and switch badge labels
 * at the theme swap (e.g. pumpkin farm: Fall Pick in September → Halloween Pick in October).
 *
 * **Browse window:** public discovery shows roughly the next **60 days** (`PUBLIC_DISPLAY_WINDOW_DAYS`)
 * — from early September that reaches ~end of October. Seasonal inventory can coexist in the feed;
 * only the active theme’s badge/module is editorial.
 *
 * **Litmus (every theme):** if it isn’t special because of this season / month, don’t make it a
 * seasonal pick — keep year-round classes in regular browse. Full rules:
 * `.cursor/rules/seasonal-discovery-featured.mdc`
 *
 * Featured rotation: `featuredWindows` = temporary Home carousel (~2–3 wk); `collectionEventIds` =
 * close-to-home season set; `driveEventIds` = worth-a-drive anchors.
 *
 * Intent (Hello Fall): Fall = what’s especially worth doing with little ones **right now** — not
 * “Fall = pumpkins.”
 */
export const HELLO_FALL_CURATION = {
  tagline: 'Farms, outdoor days, festivals & community celebrations.',
  pillars: [
    {
      id: 'harvest-farms',
      label: 'Harvest & farms',
      examples: 'Pumpkin patches, apple picking, farm days',
    },
    {
      id: 'outdoor-fall',
      label: 'Outdoor fall outings',
      examples: 'Nature, outdoor events, fall family activities',
    },
    {
      id: 'seasonal-celebrations',
      label: 'Seasonal celebrations',
      examples: 'Mid-Autumn Festival, Diwali, community fall festivals',
    },
  ],
  principles: [
    'Litmus: if it isn’t special because it’s fall / September, don’t make it a Fall Pick',
    'Prioritize events genuinely good for ages 0–5',
    'Rotate time-sensitive festivals closer to their actual dates',
    'Keep the collection tight (~6–8) and featured at roughly 3–6 picks — not a September events dump',
    'Recurring Parent & Me / Stories / Music classes belong in regular browse — not Hello, Fall editorial',
  ],
} as const

export const SEASONAL_COLLECTIONS: SeasonalCollection[] = [
  {
    slug: 'hello-fall',
    title: 'Hello, Fall',
    subtitle: 'Hello, Fall',
    timingLabel: 'September',
    description:
      'Farms, outdoor days & seasonal celebrations — close to home or worth a little drive.',
    moduleTagline:
      'Farms, outdoor days & seasonal celebrations — close to home or worth a little drive.',
    ctaLabel: 'See all',
    decor: ['🍎', '🍂', '🌾'],
    illustrationSrc: '/seasonal/hello-fall.png',
    accent: {
      eyebrow: '#b45309',
      background: '#ffd8a8',
      border: '#f0c080',
      glow: 'rgba(255, 216, 168, 0.32)',
      title: '#7c2d12',
      description: '#9a3412',
      cta: '#7c2d12',
    },
    featuredWindows: [
      {
        eventId: '16188977',
        featuredFrom: '2026-09-01',
        featuredUntil: '2026-09-13',
        note: 'Mid-Autumn story celebration — early September seasonal anchor',
      },
      {
        eventId: 'disc-storytime-with-jasmine-fang-beneath-the--2026-09-13-watchlist-linden-2026-09-13',
        featuredFrom: '2026-09-01',
        featuredUntil: '2026-09-13',
        note: 'Mid-Autumn picture-book storytime',
      },
      {
        eventId: 'watchlist-google-endless-summer-festival-2026-09-12',
        featuredFrom: '2026-09-08',
        featuredUntil: '2026-09-14',
        note: 'September outdoor plaza festival — magic, chalk, crafts',
      },
      {
        eventId: 'free-in-store-kids-workshops-school-bus-organizer-home-depot-2026-09-05-09-00',
        featuredFrom: '2026-09-01',
        featuredUntil: '2026-09-07',
        note: 'Optional light September / back-to-school pick',
      },
      {
        eventId: 'seasonal-drive-lemos-farm-pumpkin-patch-2026-09-05',
        featuredFrom: '2026-09-04',
        featuredUntil: '2026-09-21',
        note: 'Worth a drive · coastal pumpkin farm opens Labor Day weekend',
      },
      {
        eventId: 'seasonal-drive-garin-apple-festival-2026-09-06',
        featuredFrom: '2026-09-04',
        featuredUntil: '2026-09-06',
        note: 'Worth a drive · one-day harvest festival — drop after Sep 6',
      },
      {
        eventId: 'seasonal-drive-roaring-camp-labor-day-2026-09-05',
        featuredFrom: '2026-09-04',
        featuredUntil: '2026-09-07',
        note: 'Optional short-term Fall Pick · Labor Day weekend only — remove from Seasonal after Sep 7',
      },
      {
        eventId: 'seasonal-drive-sf-chinatown-autumn-moon-festival-2026-09-19',
        featuredFrom: '2026-09-15',
        featuredUntil: '2026-09-21',
        note: 'SF Chinatown Mid-Autumn street festival — drive pick',
      },
      {
        eventId: 'disc-author-event-celebrate-the-mooncake-fest-2026-09-23-6a6cdceee30fe4845965ed72',
        featuredFrom: '2026-09-15',
        featuredUntil: '2026-09-24',
        note: 'Mooncake Festival story + craft',
      },
      {
        eventId: 'seasonal-drive-farmer-johns-pumpkin-farm-2026-09-04',
        featuredFrom: '2026-09-04',
        featuredUntil: '2026-09-20',
        note: 'Coastal harvest open — first pumpkin farm of the season',
      },
      {
        eventId: 'seasonal-drive-cdm-mid-autumn-moon-festival-2026-09-26',
        featuredFrom: '2026-09-20',
        featuredUntil: '2026-09-27',
        note: 'CDM Mid-Autumn — lion dance, mooncakes, lanterns',
      },
      {
        eventId: 'seasonal-drive-bay-area-chuseok-festival-2026-09-26',
        featuredFrom: '2026-09-20',
        featuredUntil: '2026-09-27',
        note: 'Korean Chuseok harvest festival — Presidio drive pick',
      },
      {
        eventId: 'harvest-history-festival-heritage-park-2026-09-26-09-00',
        featuredFrom: '2026-09-15',
        featuredUntil: '2026-09-28',
        anchor: true,
        note: 'Harvest festival anchor — late September',
      },
      {
        eventId: 'seasonal-drive-spina-farms-pumpkin-patch-2026-09-17',
        featuredFrom: '2026-09-17',
        featuredUntil: '2026-09-28',
        note: 'South Bay pumpkin patch — feature when it opens, not earlier',
      },
      {
        eventId: 'watchlist-mini-yoga-treehouse-2026-09-26',
        featuredFrom: '2026-09-20',
        featuredUntil: '2026-09-27',
        note: 'Sunnyvale pop-up family yoga on the Treehouse lawn — late September Fall Pick',
      },
      {
        eventId: 'watchlist-sunnyvale-diwali-sacas-2026-10-03',
        featuredFrom: '2026-09-28',
        featuredUntil: '2026-10-05',
        anchor: true,
        note: 'Sunnyvale Diwali Kids Zone — early October',
      },
      {
        eventId: 'watchlist-sunnyvale-mid-autumn-festival-2026-10-03',
        featuredFrom: '2026-09-28',
        featuredUntil: '2026-10-05',
        note: 'Sunnyvale Mid-Autumn downtown — same weekend as Diwali',
      },
      {
        eventId: 'disc-creepy-carrots-peninsula-youth-theatre-2026-10-10-watchlist-pyt-creepy-carrots-2026-10-10-',
        featuredFrom: '2026-09-29',
        featuredUntil: '2026-10-05',
        note: 'Transition blend — early Halloween preview while module title stays Fall',
      },
    ],
    collectionEventIds: [
      'harvest-history-festival-heritage-park-2026-09-26-09-00',
      '16188977',
      'disc-storytime-with-jasmine-fang-beneath-the--2026-09-13-watchlist-linden-2026-09-13',
      'disc-author-event-celebrate-the-mooncake-fest-2026-09-23-6a6cdceee30fe4845965ed72',
      'watchlist-google-endless-summer-festival-2026-09-12',
      'watchlist-mini-yoga-treehouse-2026-09-26',
      'watchlist-sunnyvale-diwali-sacas-2026-10-03',
      'watchlist-sunnyvale-mid-autumn-festival-2026-10-03',
      'free-in-store-kids-workshops-school-bus-organizer-home-depot-2026-09-05-09-00',
    ],
    driveEventIds: [
      'seasonal-drive-lemos-farm-pumpkin-patch-2026-09-05',
      'seasonal-drive-garin-apple-festival-2026-09-06',
      'seasonal-drive-roaring-camp-labor-day-2026-09-05',
      'seasonal-drive-farmer-johns-pumpkin-farm-2026-09-04',
      'seasonal-drive-spina-farms-pumpkin-patch-2026-09-17',
      'seasonal-drive-sf-chinatown-autumn-moon-festival-2026-09-19',
      'seasonal-drive-cdm-mid-autumn-moon-festival-2026-09-26',
      'seasonal-drive-bay-area-chuseok-festival-2026-09-26',
    ],
    closeToHome: {
      title: 'Close to home',
      subtitle: 'Palo Alto · Los Altos · Mountain View · Sunnyvale',
    },
    worthADrive: {
      title: 'Worth a little drive',
      subtitle: 'Farm days & standout fall outings a little farther afield.',
    },
    // Through Diwali / Sunnyvale Mid-Autumn weekend; Halloween module starts Oct 6
    activeFrom: '2026-09-01',
    activeUntil: '2026-10-05',
  },
  {
    slug: 'halloween-with-little-ones',
    title: 'Sweet, spooky-season outings for ages 0–5.',
    subtitle: 'Halloween with little ones',
    timingLabel: 'October',
    description: 'Sweet, spooky-season outings for ages 0–5.',
    moduleTagline: 'Pumpkin patches, costumes & toddler-friendly Halloween',
    ctaLabel: 'See all Halloween favorites',
    decor: ['🎃', '👻', '🍬'],
    illustrationSrc: '/seasonal/halloween-with-little-ones.png',
    accent: {
      eyebrow: getSeasonalEyebrowColor('October'),
      background: 'linear-gradient(135deg, #fff6ee 0%, #fcefe4 45%, #f3ebe6 100%)',
      border: '#ebd2c0',
      glow: 'rgba(249, 115, 22, 0.16)',
    },
    featuredWindows: [
      {
        eventId: 'disc-creepy-carrots-peninsula-youth-theatre-2026-10-10-watchlist-pyt-creepy-carrots-2026-10-10-',
        featuredFrom: '2026-10-06',
        featuredUntil: '2026-10-12',
        note: 'Module launch — gentle Halloween theater',
      },
      {
        eventId: 'halloween-costume-game-night-town-hall-council-chambers-2026-10-17-18-00',
        featuredFrom: '2026-10-01',
        featuredUntil: '2026-10-18',
      },
      {
        eventId: 'monster-bash-rengstorff-park-2026-10-24-10-00',
        featuredFrom: '2026-10-10',
        featuredUntil: '2026-10-25',
        anchor: true,
      },
      {
        eventId: 'disc-halloween-magic-at-gamble-garden-2026-10-24-watchlist-gamble-halloween-magic-2026-10',
        featuredFrom: '2026-10-15',
        featuredUntil: '2026-10-28',
      },
      {
        eventId: 'disc-jack-o-lantern-jamboree-2026-10-28-698e5b7094297d3600abe212',
        featuredFrom: '2026-10-20',
        featuredUntil: '2026-10-28',
      },
      {
        eventId: 'disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30',
        featuredFrom: '2026-10-25',
        featuredUntil: '2026-10-31',
        note: 'Halloween week anchor',
      },
    ],
    collectionEventIds: [
      'disc-creepy-carrots-peninsula-youth-theatre-2026-10-10-watchlist-pyt-creepy-carrots-2026-10-10-',
      'halloween-costume-game-night-town-hall-council-chambers-2026-10-17-18-00',
      'monster-bash-rengstorff-park-2026-10-24-10-00',
      'disc-halloween-magic-at-gamble-garden-2026-10-24-watchlist-gamble-halloween-magic-2026-10',
      'disc-jack-o-lantern-jamboree-2026-10-28-698e5b7094297d3600abe212',
      'disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30',
    ],
    driveEventIds: [
      // Spanning Fall → Halloween: same farms keep the seasonal badge under the new theme
      'seasonal-drive-spina-farms-pumpkin-patch-2026-09-17',
      'seasonal-drive-farmer-johns-pumpkin-farm-2026-09-04',
      'spooky-times-at-deer-holloween-farm-deer-hollow-farm-2026-10-17-10-00',
      'seasonal-drive-grimm-manor-san-jose-2026-10-10',
      'seasonal-drive-spooktacular-lego-redwood-city-2026-10-12',
      'seasonal-drive-haunted-train-ardenwood-2026-10-18',
    ],
    closeToHome: {
      title: 'Close to home',
      subtitle: 'Palo Alto · Los Altos · Mountain View · Sunnyvale',
    },
    worthADrive: {
      title: 'Worth a little drive',
      subtitle: 'A few extra-special Halloween picks nearby.',
    },
    activeFrom: '2026-10-06',
    activeUntil: '2026-10-31',
  },
]

/** Hello Fall — discovery candidates not yet in the catalog. Approve in Admin → Discovery, then add IDs here. */
export interface HelloFallCurationCandidate {
  discoveryId: string
  title: string
  date: string
  city: string
  why: string
  priority: 'high' | 'medium' | 'low'
}

export const HELLO_FALL_DISCOVERY_PIPELINE: HelloFallCurationCandidate[] = [
  {
    discoveryId: 'seasonal-drive-lemos-farm-pumpkin-patch-2026-09-05',
    title: 'Lemos Farm Fall Pumpkin Patch',
    date: '2026-09-05',
    city: 'Half Moon Bay',
    why: 'Worth a drive · coastal pumpkin farm with rides & animals — Hello Fall only, not regular Browse.',
    priority: 'high',
  },
  {
    discoveryId: 'seasonal-drive-garin-apple-festival-2026-09-06',
    title: 'Garin Apple Festival',
    date: '2026-09-06',
    city: 'Hayward',
    why: 'Worth a drive · one-day harvest festival — Hello Fall only, not regular Browse.',
    priority: 'high',
  },
  {
    discoveryId: 'seasonal-drive-roaring-camp-labor-day-2026-09-05',
    title: 'Labor Day Weekend at Roaring Camp',
    date: '2026-09-05',
    city: 'Felton',
    why: 'Optional short-term Fall Pick · Labor Day weekend only — remove after Sep 7.',
    priority: 'medium',
  },
  {
    discoveryId: '16188977',
    title: 'Mid-Autumn Festival Story Celebration (PiggySprout)',
    date: '2026-09-12',
    city: 'Mountain View',
    why: 'Mandarin stories + hands-on Mid-Autumn activities — true fall seasonal celebration.',
    priority: 'high',
  },
  {
    discoveryId: '6a6cdceee30fe4845965ed72',
    title: 'Author Event: Celebrate the Mooncake Festival with Jasmine Fang',
    date: '2026-09-23',
    city: 'Palo Alto',
    why: 'Mooncake Festival story + craft — season-true Mid-Autumn at the library.',
    priority: 'high',
  },
  {
    discoveryId: 'harvest-history-festival-heritage-park-2026-09-26-09-00',
    title: 'Harvest History Festival',
    date: '2026-09-26',
    city: 'Mountain View',
    why: 'Late-September harvest anchor — bubbles, puppets & Immigrant House for little ones.',
    priority: 'high',
  },
  {
    discoveryId: 'watchlist-sunnyvale-diwali-sacas-2026-10-03',
    title: 'Sunnyvale Diwali Festival',
    date: '2026-10-03',
    city: 'Sunnyvale',
    why: 'Kids Zone diya painting, face paint, balloons — season-true Diwali for little ones.',
    priority: 'high',
  },
  {
    discoveryId: 'watchlist-sunnyvale-mid-autumn-festival-2026-10-03',
    title: 'Sunnyvale Mid-Autumn Festival',
    date: '2026-10-03',
    city: 'Sunnyvale',
    why: 'Downtown Mid-Autumn cultural festival same weekend as Diwali.',
    priority: 'high',
  },
  {
    discoveryId: 'watchlist-google-endless-summer-festival-2026-09-12',
    title: 'Endless Summer Festival',
    date: '2026-09-12',
    city: 'Mountain View',
    why: 'Plaza festival with magic, chalk art, crafts & kids sports zone.',
    priority: 'medium',
  },
]

/** @deprecated Use SEASONAL_DISCOVERY_PIPELINE from ../utils/seasonalDiscoveryPipeline */
export { SEASONAL_DISCOVERY_PIPELINE } from '../utils/seasonalDiscoveryPipeline'

/** Full seasonal calendar for product preview (including themes without curated events yet). */
export const SEASONAL_THEME_CALENDAR = SEASONAL_EYEBROW_PALETTE.map((entry) => ({
  timing: entry.timing,
  theme: entry.theme,
  emoji: entry.emoji,
  slug: entry.slug,
  eyebrow: entry.hex,
  illustrationSrc: entry.illustrationSrc,
}))

/** Editorial schedule for product review — one live module at a time; no overlap. */
export interface SeasonalThemeScheduleEntry {
  timing: string
  theme: string
  /** Home module H2 when this theme is live */
  moduleTitle: string
  emoji: string
  slug: SeasonalCollectionSlug | null
  eyebrow: string
  illustrationSrc: string
  activeFrom: string
  activeUntil: string
  /** When next theme’s events may blend in before the title swaps */
  transitionFrom?: string
  transitionNote?: string
  /** Has curated events + collection page */
  curated: boolean
}

export type SeasonalThemeScheduleStatus =
  | 'live'
  | 'transition'
  | 'upcoming'
  | 'past'
  | 'planned'

export const SEASONAL_THEME_SCHEDULE: SeasonalThemeScheduleEntry[] = [
  {
    timing: 'September',
    theme: 'Hello, Fall',
    moduleTitle: 'Fall with little ones',
    emoji: '🍎',
    slug: 'hello-fall',
    eyebrow: getSeasonalEyebrowColor('September'),
    illustrationSrc: '/seasonal/hello-fall.png',
    activeFrom: '2026-09-01',
    activeUntil: '2026-10-05',
    transitionFrom: '2026-09-29',
    transitionNote:
      'Sep 29–Oct 5: Diwali / Sunnyvale Mid-Autumn weekend; optional early Halloween featured blend; title + badges swap to Halloween Oct 6. Browse still shows ~60 days of inventory (~through late October).',
    curated: true,
  },
  {
    timing: 'October',
    theme: 'Halloween with little ones',
    moduleTitle: 'Sweet, spooky-season outings for ages 0–5.',
    emoji: '🎃',
    slug: 'halloween-with-little-ones',
    eyebrow: getSeasonalEyebrowColor('October'),
    illustrationSrc: '/seasonal/halloween-with-little-ones.png',
    activeFrom: '2026-10-06',
    activeUntil: '2026-10-31',
    transitionNote:
      'Replaces Fall module + Fall Pick badges Oct 6. Spanning picks (e.g. pumpkin farms) keep a seasonal badge as Halloween Pick; Fall-only events drop the badge but stay in regular browse.',
    curated: true,
  },
  {
    timing: 'November',
    theme: 'Fall gatherings',
    moduleTitle: 'Fall gatherings with little ones',
    emoji: '🍁',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('November'),
    illustrationSrc: '/seasonal/thanksgiving-fall-outings.png',
    activeFrom: '2026-11-01',
    activeUntil: '2026-11-23',
    transitionFrom: '2026-11-18',
    transitionNote: 'Nov 18–23: preview holiday events; title swaps Nov 24.',
    curated: false,
  },
  {
    timing: 'December',
    theme: 'Holiday magic',
    moduleTitle: 'Holiday magic with little ones',
    emoji: '✨',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('December'),
    illustrationSrc: '/seasonal/holiday-magic.png',
    activeFrom: '2026-11-24',
    activeUntil: '2026-12-31',
    transitionNote: 'Holiday module replaces Fall gatherings Nov 24.',
    curated: false,
  },
  {
    timing: 'January',
    theme: 'Rainy-day favorites',
    moduleTitle: 'Rainy-day favorites',
    emoji: '🌧',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('January'),
    illustrationSrc: '/seasonal/rainy-day-favorites.png',
    activeFrom: '2027-01-01',
    activeUntil: '2027-02-14',
    curated: false,
  },
  {
    timing: 'February',
    theme: "Valentine's / Lunar New Year",
    moduleTitle: "Valentine's & Lunar New Year with little ones",
    emoji: '❤️',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('February'),
    illustrationSrc: '/seasonal/valentines-lunar-new-year.png',
    activeFrom: '2027-02-15',
    activeUntil: '2027-03-31',
    curated: false,
  },
  {
    timing: 'Spring',
    theme: 'Flowers, farms & Easter',
    moduleTitle: 'Flowers, farms & Easter',
    emoji: '🌸',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('Spring'),
    illustrationSrc: '/seasonal/flowers-farms-easter.png',
    activeFrom: '2027-04-01',
    activeUntil: '2027-05-31',
    curated: false,
  },
  {
    timing: 'Summer',
    theme: 'Summer favorites',
    moduleTitle: 'Summer favorites',
    emoji: '☀️',
    slug: null,
    eyebrow: getSeasonalEyebrowColor('Summer'),
    illustrationSrc: '/seasonal/summer-favorites.png',
    activeFrom: '2027-06-01',
    activeUntil: '2027-08-31',
    curated: false,
  },
]

export function formatSeasonalDateRange(activeFrom: string, activeUntil: string): string {
  const start = new Date(`${activeFrom}T12:00:00`)
  const end = new Date(`${activeUntil}T12:00:00`)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const yearFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (start.getFullYear() === end.getFullYear()) {
    return `${fmt.format(start)} – ${yearFmt.format(end)}`
  }

  return `${yearFmt.format(start)} – ${yearFmt.format(end)}`
}

export function getSeasonalThemeScheduleStatus(
  entry: SeasonalThemeScheduleEntry,
  now: Date = new Date(),
): SeasonalThemeScheduleStatus {
  const today = now.toISOString().slice(0, 10)

  if (today > entry.activeUntil) return 'past'
  if (today < entry.activeFrom) return entry.curated ? 'upcoming' : 'planned'

  if (entry.transitionFrom && today >= entry.transitionFrom && today <= entry.activeUntil) {
    return 'transition'
  }

  return 'live'
}

export function getLiveSeasonalThemeScheduleEntry(
  now: Date = new Date(),
): SeasonalThemeScheduleEntry | undefined {
  const today = now.toISOString().slice(0, 10)
  return SEASONAL_THEME_SCHEDULE.find(
    (entry) => entry.activeFrom <= today && today <= entry.activeUntil,
  )
}

type SeasonalCurationOverride = {
  collectionEventIds?: string[]
  driveEventIds?: string[]
  updatedAt?: string
} | null

const CURATION_OVERRIDES = seasonalCurationOverrides as Record<
  string,
  SeasonalCurationOverride
>

function withCurationOverrides(collection: SeasonalCollection): SeasonalCollection {
  const override = CURATION_OVERRIDES[collection.slug]
  if (!override) return collection
  return {
    ...collection,
    collectionEventIds: override.collectionEventIds ?? collection.collectionEventIds,
    driveEventIds: override.driveEventIds ?? collection.driveEventIds,
  }
}

export function getSeasonalCollection(slug: string): SeasonalCollection | undefined {
  const base = SEASONAL_COLLECTIONS.find((collection) => collection.slug === slug)
  return base ? withCurationOverrides(base) : undefined
}

/** True when the event is curated in a seasonal collection (featured or full list). */
export function isEventInSeasonalCollection(
  eventId: string,
  slug: SeasonalCollectionSlug,
): boolean {
  const collection = getSeasonalCollection(slug)
  if (!collection) return false
  if (collection.collectionEventIds.includes(eventId)) return true
  return Boolean(collection.driveEventIds?.includes(eventId))
}

export function getActiveSeasonalCollection(now: Date = new Date()): SeasonalCollection | undefined {
  const today = now.toISOString().slice(0, 10)
  const base = SEASONAL_COLLECTIONS.find(
    (collection) => collection.activeFrom <= today && today <= collection.activeUntil,
  )
  return base ? withCurationOverrides(base) : undefined
}

/** Experiment / review tooling — Hello, Fall curated set (not date-gated). */
export function getSeasonalCollectionForExperiment(): SeasonalCollection {
  return getSeasonalCollection('hello-fall')!
}

/** Experiment / review tooling — Halloween curated set (not date-gated). */
export function getUpcomingSeasonalCollectionForExperiment(): SeasonalCollection {
  return getSeasonalCollection('halloween-with-little-ones')!
}

/** Days before the next theme's activeFrom when the Coming next teaser may appear. */
export const COMING_NEXT_TEASER_DAYS = 14

function pacificYmd(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function daysBetweenYmd(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T12:00:00Z`)
  const to = Date.parse(`${toYmd}T12:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

/**
 * Next curated seasonal collection to tease on Home-shaped surfaces.
 * Only returns a collection when Pacific today is within COMING_NEXT_TEASER_DAYS
 * before that theme's activeFrom (and the theme has not started yet).
 */
export function getComingNextSeasonalTeaser(
  now: Date = new Date(),
): SeasonalCollection | undefined {
  const today = pacificYmd(now)
  const next = SEASONAL_THEME_SCHEDULE.find(
    (entry) =>
      entry.curated &&
      entry.slug != null &&
      entry.activeFrom > today,
  )
  if (!next?.slug) return undefined

  const daysUntilStart = daysBetweenYmd(today, next.activeFrom)
  if (daysUntilStart < 1 || daysUntilStart > COMING_NEXT_TEASER_DAYS) {
    return undefined
  }

  return getSeasonalCollection(next.slug)
}

/** Resolve curated IDs in order. Prefer public catalog, then full sheet for editorial picks. */
export function resolveSeasonalEvents(
  eventIds: string[],
  catalog: Event[] = getPublicEventsFromCatalog(),
): Event[] {
  const publicById = new Map(catalog.map((event) => [event.id, event]))
  const allById = new Map(ALL_EVENTS.map((event) => [event.id, event]))
  return eventIds
    .map((id) => publicById.get(id) ?? allById.get(id))
    .filter((event): event is Event => Boolean(event))
}

export function seasonalCollectionPath(slug: SeasonalCollectionSlug): string {
  return `/experiment/seasonal-discovery/${slug}`
}

export function isSeasonalCollectionSlug(value: string | undefined): value is SeasonalCollectionSlug {
  return value === 'hello-fall' || value === 'halloween-with-little-ones'
}
