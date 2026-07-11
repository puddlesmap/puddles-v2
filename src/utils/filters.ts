import { getPublicEventsFromCatalog } from '../data/events'
import type { DayFilter, Event, TimeFilter, ActivityType } from '../types/event'
import type { TemporalTab } from './dates'
import { getAnchorDate, dateInDayFilter, dateInTemporalTab, isEventVisibleForTodayFilter, timeInBucket } from './dates'
import { isPublicEvent } from './publishing'
import {
  getBrowseAgeChipLabel,
  isPublicAgeEligible,
  matchesPublicAgeFilter,
  type AgeFilter,
} from './ageRange'

export type { AgeFilter }

export interface BrowseFilters {
  city: string
  day: DayFilter
  time: TimeFilter
  age: AgeFilter
  types: ActivityType[]
  cityLocked: boolean
}

export const DEFAULT_BROWSE_FILTERS: BrowseFilters = {
  city: 'all',
  day: 'anytime',
  time: 'any',
  age: 'all',
  types: [],
  cityLocked: false,
}

function matchesAge(event: Event, age: AgeFilter): boolean {
  return matchesPublicAgeFilter(event.ageRange, age)
}

function matchesCity(event: Event, city: string): boolean {
  if (city === 'all' || city === 'nearby') return true
  return event.city === city
}

export function filterEvents(
  events: Event[],
  opts: {
    city?: string
    temporalTab?: TemporalTab
    browse?: Partial<BrowseFilters>
  },
): Event[] {
  const { city = 'all', temporalTab, browse } = opts
  const anchor = getAnchorDate()
  const now = new Date()

  return events.filter((event) => {
    if (!isPublicEvent(event, now)) return false
    if (!isPublicAgeEligible(event.ageRange)) return false

    if (!matchesCity(event, city)) return false

    if (temporalTab === 'today') {
      if (!isEventVisibleForTodayFilter(event.date, event.startTime, event.endTime, anchor, now)) {
        return false
      }
    } else if (temporalTab && !dateInTemporalTab(event.date, temporalTab, anchor)) {
      return false
    }

    if (browse) {
      const f = { ...DEFAULT_BROWSE_FILTERS, ...browse }
      if (!matchesCity(event, f.city)) return false
      if (f.day === 'today') {
        if (!isEventVisibleForTodayFilter(event.date, event.startTime, event.endTime, anchor, now)) {
          return false
        }
      } else if (!dateInDayFilter(event.date, f.day, anchor)) {
        return false
      }
      if (!timeInBucket(event.startTime, f.time)) return false
      if (!matchesAge(event, f.age)) return false
      if (f.types.length > 0 && !f.types.some((t) => event.types.includes(t))) return false
    }

    return true
  })
}

export function getFilteredCount(browse: BrowseFilters): number {
  return filterEvents(getPublicEventsFromCatalog(), { browse }).length
}

export function hasActiveBrowseFilters(browse: BrowseFilters): boolean {
  return (
    browse.day !== 'anytime' ||
    browse.time !== 'any' ||
    browse.age !== 'all' ||
    browse.types.length > 0
  )
}

export function isBrowseFiltersDefault(browse: BrowseFilters): boolean {
  return (
    browse.city === 'all' &&
    browse.day === 'anytime' &&
    browse.time === 'any' &&
    browse.age === 'all' &&
    browse.types.length === 0
  )
}

export { getBrowseAgeChipLabel }

export function getBrowseActivityChipLabel(types: ActivityType[]): string {
  if (types.length === 0) return 'Activity'
  if (types.length === 1) return types[0]
  return `${types.length} activities`
}

export function getResetBrowseFilters(_current: BrowseFilters): BrowseFilters {
  return {
    city: 'all',
    cityLocked: false,
    day: 'anytime',
    time: 'any',
    age: 'all',
    types: [],
  }
}

export function getBrowseSeeUpcomingFilters(
  current: BrowseFilters,
  countFor: (filters: BrowseFilters) => number,
): BrowseFilters {
  let next: BrowseFilters = { ...current, day: 'anytime' }
  if (countFor(next) > 0) return next

  if (next.time !== 'any') {
    next = { ...next, time: 'any' }
    if (countFor(next) > 0) return next
  }

  if (next.age !== 'all' || next.types.length > 0) {
    next = { ...next, age: 'all', types: [] }
    if (countFor(next) > 0) return next
  }

  if (!current.cityLocked && next.city !== 'all') {
    next = { ...next, city: 'all', cityLocked: false }
  }

  return next
}

const DAY_LABELS: Record<DayFilter, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This weekend',
  anytime: 'Anytime',
}

const TIME_LABELS: Record<TimeFilter, string> = {
  any: 'Any time',
  morning: 'Morning',
  'after-lunch': 'After lunch',
  'late-afternoon': 'Late afternoon',
  evening: 'Evening',
}

export type BrowseEmptyStateCase =
  | 'default'
  | 'filters-active'
  | 'city'
  | 'time-window'
  | 'no-database'

export function resolveBrowseEmptyStateCase(filters: BrowseFilters): BrowseEmptyStateCase {
  if (getPublicEventsFromCatalog().length === 0) return 'no-database'
  if (isOnlyCityFilter(filters)) return 'city'
  if (isOnlyDayFilter(filters) || isOnlyTimeFilter(filters)) return 'time-window'
  if (hasActiveBrowseFilters(filters)) return 'filters-active'
  return 'default'
}

function isOnlyCityFilter(filters: BrowseFilters): boolean {
  return filters.city !== 'all' && !hasActiveBrowseFilters(filters)
}

function isOnlyDayFilter(filters: BrowseFilters): boolean {
  return (
    filters.city === 'all' &&
    filters.day !== 'anytime' &&
    filters.time === 'any' &&
    filters.age === 'all' &&
    filters.types.length === 0
  )
}

function isOnlyTimeFilter(filters: BrowseFilters): boolean {
  return (
    filters.city === 'all' &&
    filters.day === 'anytime' &&
    filters.time !== 'any' &&
    filters.age === 'all' &&
    filters.types.length === 0
  )
}

export function getBrowseEmptyStateTimeLabel(filters: BrowseFilters): string {
  if (filters.day !== 'anytime') return DAY_LABELS[filters.day]
  return TIME_LABELS[filters.time]
}
