import type { ActivityType, Event } from '../types/event'
import { isFreeCost } from '../types/event'
import { getEventCardAgeLabel } from './ageRange'
import { formatCardDateTime } from './dates'
import { eventDetailPath } from './eventPages'
import { getEventDisplayCategory, getEventImageUrl } from './eventImages'
import { formatCostBadgeLabel } from './eventCost'
import { formatEventCardLocation } from './maps'
import type { DiscoveryBadgeData } from '../components/experiment/DiscoveryV3Card'

export function formatBrowseCardCost(cost: string): string {
  if (isFreeCost(cost)) return 'Free'
  const trimmed = formatCostBadgeLabel(cost)
  if (trimmed === 'Paid') return 'Paid'
  if (trimmed === 'Low-cost') return 'Low-cost'
  return trimmed
}

function getPrimaryType(event: Event): ActivityType | string {
  return getEventDisplayCategory(event) ?? event.types[0] ?? 'Other'
}

export function eventToBrowseCard(
  event: Event,
  badge: DiscoveryBadgeData | null = null,
) {
  return {
    title: event.title,
    when: formatCardDateTime(event.date, event.startTime),
    location: formatEventCardLocation(event),
    city: event.city?.trim() ?? '',
    type: getPrimaryType(event),
    age: getEventCardAgeLabel(event.ageRange),
    cost: formatBrowseCardCost(event.cost),
    imageUrl: getEventImageUrl(event),
    badge,
    href: eventDetailPath(event),
  }
}
