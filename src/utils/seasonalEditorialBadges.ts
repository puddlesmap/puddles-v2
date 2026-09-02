import type { Event } from '../types/event'
import type { DiscoveryBadgeData } from '../components/experiment/DiscoveryV3Card'
import { isEventInSeasonalCollection } from '../data/seasonalDiscovery'

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

export function isHalloweenPickCandidate(event: Event): boolean {
  const title = event.title.toLowerCase()
  return (
    title.includes('halloween') ||
    title.includes('trick-or-treat') ||
    title.includes('trick or treat') ||
    event.imageUrl.includes('halloween')
  )
}

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

export function isFallPickCandidate(event: Event): boolean {
  if (isHalloweenPickCandidate(event) || isHolidayPickCandidate(event)) return false
  return isEventInSeasonalCollection(event.id, 'hello-fall')
}

/** Editorial image badge — seasonal picks only. Off on seasonal collection/band; on in mixed browse/home feeds. */
export function getSeasonalEditorialBadgeForEvent(event: Event): DiscoveryBadgeData | null {
  if (isHalloweenPickCandidate(event)) return SEASONAL_BADGE_HALLOWEEN
  if (isHolidayPickCandidate(event)) return SEASONAL_BADGE_HOLIDAY
  if (isFallPickCandidate(event)) return SEASONAL_BADGE_FALL
  return null
}
