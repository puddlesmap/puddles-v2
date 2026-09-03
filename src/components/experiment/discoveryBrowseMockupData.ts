import { getPublicEventsFromCatalog } from '../../data/events'
import {
  getSeasonalCollectionForExperiment,
  resolveFeaturedSeasonalEvents,
} from '../../data/seasonalDiscovery'
import type { ActivityType, Event } from '../../types/event'
import { isFreeCost } from '../../types/event'
import { formatCostBadgeLabel } from '../../utils/eventCost'
import { getEventCardAgeLabel } from '../../utils/ageRange'
import { formatCardDateTime } from '../../utils/dates'
import { eventDetailPath } from '../../utils/eventPages'
import { getEventDisplayCategory, getEventImageUrl } from '../../utils/eventImages'
import { formatEventCardLocation } from '../../utils/maps'
import {
  SEASONAL_BADGE_FALL,
  SEASONAL_BADGE_HALLOWEEN,
  SEASONAL_BADGE_HOLIDAY,
  getSeasonalEditorialBadgeForEvent,
  isFallPickCandidate,
  isHalloweenCollectionCandidate,
  isHalloweenPickCandidate,
  isHolidayPickCandidate,
} from '../../utils/seasonalEditorialBadges'
import type { DiscoveryBadgeData, DiscoveryV3CardData } from './DiscoveryV3Card'

const NEW_DISCOVERY_TYPES = new Set<ActivityType>(['Festivals & Community', 'Parent & Me'])

export interface BrowseMockupBadgeCounts {
  fallPick: number
  halloweenPick: number
  holidayPick: number
  totalBadged: number
}

let browseMockupBadgePlan: Map<string, DiscoveryBadgeData> | null = null

export function formatDiscoveryCardCost(cost: string): string {
  if (isFreeCost(cost)) return 'Free'
  const trimmed = formatCostBadgeLabel(cost)
  if (trimmed === 'Paid') return 'Paid'
  if (trimmed === 'Low-cost') return 'Low-cost'
  return trimmed
}

export function formatDiscoveryImagePrice(cost: string): string {
  const badge = formatCostBadgeLabel(cost)
  if (badge === 'Free') return 'Free'
  if (badge === 'Paid') return '$'
  return cost
}

function getPrimaryType(event: Event): ActivityType | undefined {
  return getEventDisplayCategory(event) ?? event.types[0]
}

export { isFallPickCandidate }

export interface SeasonalEditorialComparisonPair {
  event: Event
  badge: DiscoveryBadgeData
}

/** One Fall Pick and one Halloween Pick event for side-by-side mocks (date-forced themes). */
export function getSeasonalEditorialComparisonPairs(): SeasonalEditorialComparisonPair[] {
  const catalog = getPublicEventsFromCatalog()
  const pairs: SeasonalEditorialComparisonPair[] = []
  const seen = new Set<string>()

  const samples: Array<{ label: string; asOf: Date; matches: (event: Event) => boolean }> = [
    {
      label: SEASONAL_BADGE_FALL.label,
      asOf: new Date('2026-09-15T12:00:00'),
      matches: isFallPickCandidate,
    },
    {
      label: SEASONAL_BADGE_HALLOWEEN.label,
      asOf: new Date('2026-10-15T12:00:00'),
      matches: isHalloweenCollectionCandidate,
    },
  ]

  for (const sample of samples) {
    const match = catalog.find((event) => {
      if (seen.has(event.id)) return false
      return sample.matches(event)
    })

    if (!match) continue

    const badge = getSeasonalEditorialBadgeForEvent(match, sample.asOf)
    if (!badge) continue

    pairs.push({ event: match, badge })
    seen.add(match.id)
  }

  return pairs
}

function resetBrowseMockupBadgePlan() {
  browseMockupBadgePlan = new Map()
}

function rememberBadge(event: Event, badge: DiscoveryBadgeData) {
  if (!browseMockupBadgePlan) resetBrowseMockupBadgePlan()
  browseMockupBadgePlan!.set(event.id, badge)
}

export function getBrowseMockupBadgeForEvent(event: Event): DiscoveryBadgeData | null {
  return browseMockupBadgePlan?.get(event.id) ?? null
}

function pickEvents(
  catalog: Event[],
  count: number,
  matches: (event: Event) => boolean,
  reservedIds: Set<string>,
): Event[] {
  const picked: Event[] = []

  for (const event of catalog) {
    if (reservedIds.has(event.id)) continue
    if (!matches(event)) continue
    picked.push(event)
    reservedIds.add(event.id)
    if (picked.length >= count) break
  }

  return picked
}

/** Curate seasonal editorial picks for the main browse feed mock. */
function buildBrowseMockupBadgePlan(
  catalog: Event[],
  excludeIds: ReadonlySet<string>,
): Map<string, DiscoveryBadgeData> {
  resetBrowseMockupBadgePlan()
  const reservedIds = new Set(excludeIds)

  const fallPickEvents = pickEvents(catalog, 3, isFallPickCandidate, reservedIds)
  fallPickEvents.forEach((event) => rememberBadge(event, SEASONAL_BADGE_FALL))

  const halloweenEvents = pickEvents(catalog, 2, isHalloweenPickCandidate, reservedIds)
  halloweenEvents.forEach((event) => rememberBadge(event, SEASONAL_BADGE_HALLOWEEN))

  const holidayEvents = pickEvents(catalog, 2, isHolidayPickCandidate, reservedIds)
  holidayEvents.forEach((event) => rememberBadge(event, SEASONAL_BADGE_HOLIDAY))

  return browseMockupBadgePlan!
}

export function countBrowseMockupBadges(events: Event[]): BrowseMockupBadgeCounts {
  let fallPick = 0
  let halloweenPick = 0
  let holidayPick = 0

  for (const event of events) {
    const badge = getBrowseMockupBadgeForEvent(event)
    if (!badge) continue

    if (badge.label === SEASONAL_BADGE_FALL.label) fallPick += 1
    if (badge.label === SEASONAL_BADGE_HALLOWEEN.label) halloweenPick += 1
    if (badge.label === SEASONAL_BADGE_HOLIDAY.label) holidayPick += 1
  }

  return {
    fallPick,
    halloweenPick,
    holidayPick,
    totalBadged: fallPick + halloweenPick + holidayPick,
  }
}

export function eventToDiscoveryCard(
  event: Event,
): DiscoveryV3CardData & { href: string } {
  return eventToDiscoveryCardWithBadge(event, getBrowseMockupBadgeForEvent(event))
}

export function eventToDiscoveryCardWithBadge(
  event: Event,
  badge: DiscoveryBadgeData | null,
): DiscoveryV3CardData & { href: string } {
  const primaryType = getPrimaryType(event) ?? 'Other'

  return {
    title: event.title,
    when: formatCardDateTime(event.date, event.startTime),
    location: formatEventCardLocation(event),
    city: event.city?.trim() ?? '',
    type: primaryType,
    age: getEventCardAgeLabel(event.ageRange),
    cost: formatDiscoveryCardCost(event.cost),
    imageUrl: getEventImageUrl(event),
    badge,
    href: eventDetailPath(event),
  }
}

/** Launch-expansion carousel — activity type lives in metadata, not on the image. */
export function getNewDiscoveryBadgeForEvent(_event: Event): DiscoveryBadgeData | null {
  return null
}

export function getSeasonalBadgeForEvent(event: Event): DiscoveryBadgeData | null {
  return getSeasonalEditorialBadgeForEvent(event)
}

export function getNewDiscoveryMockupEvents(limit = 4): Event[] {
  const catalog = getPublicEventsFromCatalog()
  const picked: Event[] = []
  const seen = new Set<string>()

  for (const type of NEW_DISCOVERY_TYPES) {
    const match = catalog.find((event) => {
      if (seen.has(event.id)) return false
      return getPrimaryType(event) === type
    })

    if (match) {
      picked.push(match)
      seen.add(match.id)
    }
  }

  const sunnyvale = catalog.find((event) => event.city === 'Sunnyvale' && !seen.has(event.id))
  if (sunnyvale) {
    picked.push(sunnyvale)
    seen.add(sunnyvale.id)
  }

  return picked.slice(0, limit)
}

export function getSeasonalMockupEvents(limit = 4): Event[] {
  return resolveFeaturedSeasonalEvents(getSeasonalCollectionForExperiment()).slice(
    0,
    limit,
  )
}

export function getDiscoveryBrowseMockupFeed(): {
  newDiscoveryEvents: Event[]
  seasonalEvents: Event[]
  feedEvents: Event[]
  badgeCounts: BrowseMockupBadgeCounts
} {
  const catalog = getPublicEventsFromCatalog()
  const newDiscoveryEvents = getNewDiscoveryMockupEvents()
  const seasonalEvents = getSeasonalMockupEvents()
  const sectionIds = new Set([
    ...newDiscoveryEvents.map((event) => event.id),
    ...seasonalEvents.map((event) => event.id),
  ])

  buildBrowseMockupBadgePlan(catalog, sectionIds)

  const showcaseEvents = catalog.filter(
    (event) => getBrowseMockupBadgeForEvent(event) !== null && !sectionIds.has(event.id),
  )

  const feedExcludeIds = new Set([
    ...sectionIds,
    ...showcaseEvents.map((event) => event.id),
  ])

  const rest = catalog.filter((event) => !feedExcludeIds.has(event.id))
  const feedEvents = [...showcaseEvents, ...rest].slice(0, 24)
  const badgeCounts = countBrowseMockupBadges(feedEvents)

  return {
    newDiscoveryEvents,
    seasonalEvents,
    feedEvents,
    badgeCounts,
  }
}

/** Events with long venue lines — useful for card body layout comparisons. */
export function getBrowseCardLayoutComparisonEvents(limit = 6): Event[] {
  const catalog = getPublicEventsFromCatalog()

  const scored = catalog
    .map((event) => ({
      event,
      location: formatEventCardLocation(event),
    }))
    .filter(({ event, location }) => event.city?.trim() && location.length > 0)
    .sort((a, b) => b.location.length - a.location.length)

  const longVenue = scored.slice(0, Math.ceil(limit * 0.67)).map(({ event }) => event)
  const seen = new Set(longVenue.map((event) => event.id))

  for (const { event } of scored) {
    if (longVenue.length >= limit) break
    if (seen.has(event.id)) continue
    longVenue.push(event)
    seen.add(event.id)
  }

  return longVenue.slice(0, limit)
}

export function resolveReferenceCardBadge(event: Event): DiscoveryBadgeData | null {
  return getBrowseMockupBadgeForEvent(event) ?? getSeasonalEditorialBadgeForEvent(event)
}

export function getBrowseCardDesignReferenceEvents(limit = 6): Event[] {
  const feed = getDiscoveryBrowseMockupFeed()
  const picked: Event[] = []
  const seen = new Set<string>()

  const add = (event?: Event) => {
    if (!event || seen.has(event.id)) return
    picked.push(event)
    seen.add(event.id)
  }

  for (const event of feed.newDiscoveryEvents) add(event)
  for (const event of feed.seasonalEvents) add(event)

  for (const event of getPublicEventsFromCatalog()) {
    if (getBrowseMockupBadgeForEvent(event)) add(event)
  }

  for (const event of getBrowseCardLayoutComparisonEvents(4)) add(event)

  return picked.slice(0, limit)
}
