import type { ActivityType, DayFilter, TimeFilter } from '../types/event'
import type { AgeFilter } from './ageRange'
import type { EventOpenSource } from '../types/analytics'
import type { Event } from '../types/event'
import type { TemporalTab } from './dates'

const IN_MARKET_CITIES = new Set(['palo alto', 'los altos', 'mountain view'])

const ACTIVITY_TYPE_SLUGS: Record<ActivityType, string> = {
  Stories: 'stories',
  'Music & Movement': 'music_movement',
  'Arts & Crafts': 'arts_crafts',
  'Build & Explore': 'build_explore',
  Outdoor: 'outdoor',
  'Social & Play': 'social_play',
  Classes: 'classes',
  Other: 'other',
}

export function activityTypeSlug(type: ActivityType): string {
  return ACTIVITY_TYPE_SLUGS[type]
}

export function dateFilterSlug(day: DayFilter | TemporalTab): string {
  if (day === 'weekend') return 'this_weekend'
  return day
}

export function timeFilterSlug(time: TimeFilter): string {
  if (time === 'after-lunch') return 'after_lunch'
  if (time === 'late-afternoon') return 'late_afternoon'
  return time
}

export function ageFilterSlug(age: AgeFilter): string {
  if (age === '0-2') return '0_2'
  if (age === '2-5') return '2_5'
  return age
}

export function citySlug(city: string): string {
  const normalized = city.trim().toLowerCase()
  if (normalized === 'all' || normalized === 'all cities') return 'all'
  if (normalized === 'nearby') return 'nearby'
  if (normalized === 'palo alto') return 'palo_alto'
  if (normalized === 'los altos') return 'los_altos'
  if (normalized === 'mountain view') return 'mountain_view'
  return normalized.replace(/\s+/g, '_')
}

export function sourceContextSlug(source: EventOpenSource): string {
  switch (source) {
    case 'browse_list':
      return 'browse'
    case 'browse_map':
      return 'map'
    case 'city_landing':
      return 'city_page'
    case 'discovery':
      return 'browse'
    default:
      return source
  }
}

export function primaryEventCategory(event: Event): string {
  const primary = event.types[0]
  return primary ? activityTypeSlug(primary) : 'other'
}

/** Bucket free-text location to in-market city slug or `other` — never send raw ZIP/email. */
export function bucketRequestedLocation(input: string): string {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return 'other'

  for (const city of IN_MARKET_CITIES) {
    if (normalized.includes(city)) {
      return citySlug(city)
    }
  }

  return 'other'
}
