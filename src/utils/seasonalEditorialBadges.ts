import type { Event } from '../types/event'
import type { DiscoveryBadgeData } from '../components/experiment/DiscoveryV3Card'
import {
  getActiveSeasonalCollection,
  isEventInSeasonalCollection,
  type SeasonalCollectionSlug,
} from '../data/seasonalDiscovery'

export const SEASONAL_BADGE_FALL: DiscoveryBadgeData = {
  kind: 'seasonal',
  label: 'Fall Pick',
  icon: 'fall-leaf',
}

export const SEASONAL_BADGE_HALLOWEEN: DiscoveryBadgeData = {
  kind: 'seasonal',
  label: 'Halloween Pick',
  icon: 'halloween-pumpkin',
}

export const SEASONAL_BADGE_HOLIDAY: DiscoveryBadgeData = {
  kind: 'seasonal',
  label: 'Holiday Pick',
}

const BADGE_BY_ACTIVE_SLUG: Partial<Record<SeasonalCollectionSlug, DiscoveryBadgeData>> = {
  'hello-fall': SEASONAL_BADGE_FALL,
  'halloween-with-little-ones': SEASONAL_BADGE_HALLOWEEN,
}

/** Title heuristic for mockups / review — not used for live badges. */
export function isHalloweenPickCandidate(event: Event): boolean {
  const title = event.title.toLowerCase()
  return (
    title.includes('halloween') ||
    title.includes('trick-or-treat') ||
    title.includes('trick or treat') ||
    event.imageUrl.includes('halloween')
  )
}

/** Title heuristic for mockups / review — not used for live badges. */
export function isHolidayPickCandidate(event: Event): boolean {
  const title = event.title.toLowerCase()
  return (
    title.includes('holiday') ||
    title.includes('winter wonderland') ||
    title.includes('lunar new year') ||
    title.includes('hanukkah') ||
    title.includes('christmas') ||
    event.imageUrl.includes('holiday-magic')
  )
}

/** True when curated in Hello Fall (regardless of whether Fall is the live theme). */
export function isFallPickCandidate(event: Event): boolean {
  return isEventInSeasonalCollection(event.id, 'hello-fall')
}

/** True when curated in the Halloween collection (regardless of live theme). */
export function isHalloweenCollectionCandidate(event: Event): boolean {
  return isEventInSeasonalCollection(event.id, 'halloween-with-little-ones')
}

/**
 * Editorial image badge for mixed browse/home feeds.
 * One active seasonal theme at a time — never Fall Pick and Halloween Pick together.
 * Membership in the live theme’s collection/drive IDs only; title heuristics do not apply.
 * Off on seasonal collection/band (callers pass seasonalEditorial={false}).
 */
export function getSeasonalEditorialBadgeForEvent(
  event: Event,
  now: Date = new Date(),
): DiscoveryBadgeData | null {
  const active = getActiveSeasonalCollection(now)
  if (!active) return null
  if (!isEventInSeasonalCollection(event.id, active.slug)) return null
  return BADGE_BY_ACTIVE_SLUG[active.slug] ?? null
}
