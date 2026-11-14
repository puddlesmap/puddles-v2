import { getPublicEventsFromCatalog } from '../data/events'
import { upcomingSeasonalPageEvents } from '../data/seasonalDiscovery'
import { isFreeCost, type DayFilter, type Event, type TimeFilter, type ActivityType } from '../types/event'
import { isSeasonalAdminListing } from './adminSeasonalEvents'
import type { TemporalTab } from './dates'
import { getAnchorDate } from './dates'
import {
  eventMatchesDayFilter,
  eventMatchesTemporalTab,
  eventMatchesTimeFilter,
} from './eventSessions'
import { matchesBrowseCityFilter } from './cityRegions'
import { scheduleSortYmd, spannedScheduleMatchesWhen } from './formatSeasonalSchedule'
import { isDiscoverableLifecycleEvent } from './eventLifecycle'
import { isOutOfAgeAudienceForPublic } from './eventAudienceAge'
import { isPublicEvent } from './publishing'
import {
  getBrowseAgeChipLabel,
  isPublicAgeEligible,
  matchesPublicAgeFilter,
  type AgeFilter,
} from './ageRange'
import { eventMatchesPickedYmd } from './pickedDate'
import { NEARBY_RADIUS_MILES, filterEventsByRadius } from './geo'

export type { AgeFilter }

export interface BrowseFilters {
  city: string
  day: DayFilter
  time: TimeFilter
  age: AgeFilter
  types: ActivityType[]
  cityLocked: boolean
  /** Current seasonal collection, including worth-a-drive picks. */
  seasonal: boolean
  /** Free admission. */
  free: boolean
}

export const DEFAULT_BROWSE_FILTERS: BrowseFilters = {
  city: 'all',
  day: 'anytime',
  time: 'any',
  age: 'all',
  types: [],
  cityLocked: false,
  seasonal: false,
  free: false,
}

function matchesAge(event: Event, age: AgeFilter): boolean {
  return matchesPublicAgeFilter(event.ageRange, age)
}

function matchesCity(event: Event, city: string): boolean {
  return matchesBrowseCityFilter(event.city, city)
}

export type DiscoveryGate = 'public' | 'lifecycle-upcoming'

export function filterEvents(
  events: Event[],
  opts: {
    city?: string
    temporalTab?: TemporalTab
    browse?: Partial<BrowseFilters>
    discoveryGate?: DiscoveryGate
  },
): Event[] {
  const { city = 'all', temporalTab, browse, discoveryGate = 'public' } = opts
  const anchor = getAnchorDate()
  const now = new Date()
  const seasonalPageEvents = discoveryGate === 'public' ? upcomingSeasonalPageEvents(now) : []
  const seasonalPageIds = new Set(seasonalPageEvents.map((event) => event.id))
  const seen = new Set(events.map((event) => event.id))
  const source = [
    ...events,
    ...seasonalPageEvents.filter((event) => !seen.has(event.id)),
  ]

  return source.filter((event) => {
    if (discoveryGate === 'lifecycle-upcoming') {
      if (!isDiscoverableLifecycleEvent(event, now)) return false
    } else if (!seasonalPageIds.has(event.id) && !isPublicEvent(event, now)) {
      return false
    }
    if (!isPublicAgeEligible(event.ageRange)) return false
    if (isOutOfAgeAudienceForPublic(event)) return false

    if (!matchesCity(event, city)) return false

    if (
      temporalTab &&
      !eventMatchesTemporalTab(event, temporalTab, anchor, now) &&
      !spannedScheduleMatchesWhen(event, temporalTab, anchor, now)
    ) {
      return false
    }

    if (browse) {
      const f = { ...DEFAULT_BROWSE_FILTERS, ...browse }
      if (!matchesCity(event, f.city)) return false
      if (
        !eventMatchesDayFilter(event, f.day, anchor, now) &&
        !spannedScheduleMatchesWhen(event, f.day, anchor, now)
      ) {
        return false
      }
      if (!eventMatchesTimeFilter(event, f.time)) return false
      if (!matchesAge(event, f.age)) return false
      if (f.types.length > 0 && !f.types.some((t) => event.types.includes(t))) return false
      if (f.seasonal && !isSeasonalAdminListing(event)) return false
      if (f.free && !isFreeCost(event.cost)) return false
    }

    return true
  })
}

/** Chronological feed order — next open day, then start time, then title. */
export function sortEventsBySchedule(
  events: Event[],
  now: Date = new Date(),
  opts?: { forYmd?: string | null },
): Event[] {
  const forYmd = opts?.forYmd?.trim() || null
  return [...events].sort((a, b) => {
    const aYmd = forYmd || scheduleSortYmd(a, now)
    const bYmd = forYmd || scheduleSortYmd(b, now)
    const byDate = aYmd.localeCompare(bYmd)
    if (byDate !== 0) return byDate
    const byTime = (a.startTime || '').localeCompare(b.startTime || '')
    if (byTime !== 0) return byTime
    return a.title.localeCompare(b.title)
  })
}

export type BrowseListGeo = {
  lat: number
  lng: number
}

/**
 * Same filter + Nearby/ZIP radius path Browse uses for the list.
 * Prefer this (or a page `getResultCount` that calls it) over a parallel count.
 */
export function filterBrowseEventList(opts: {
  catalog: Event[]
  browse: BrowseFilters
  discoveryGate?: DiscoveryGate
  pickedYmd?: string | null
  searchAnchor?: BrowseListGeo | null
  coords?: BrowseListGeo | null
}): Event[] {
  const {
    catalog,
    browse,
    discoveryGate = 'public',
    pickedYmd = null,
    searchAnchor = null,
    coords = null,
  } = opts

  const browseForFilter = {
    ...(pickedYmd ? { ...browse, day: 'anytime' as const } : browse),
    ...(searchAnchor ? { city: 'all' as const } : null),
  }

  const base = filterEvents(catalog, { browse: browseForFilter, discoveryGate }).filter((event) =>
    pickedYmd ? eventMatchesPickedYmd(event, pickedYmd) : true,
  )

  if (searchAnchor) {
    return filterEventsByRadius(base, searchAnchor, NEARBY_RADIUS_MILES)
  }
  if (browse.city === 'nearby' && coords) {
    return filterEventsByRadius(base, coords, NEARBY_RADIUS_MILES)
  }
  return base
}

export function getFilteredCount(
  browse: BrowseFilters,
  opts?: {
    pickedYmd?: string | null
    events?: Event[]
    catalog?: Event[]
    discoveryGate?: DiscoveryGate
    searchAnchor?: BrowseListGeo | null
    coords?: BrowseListGeo | null
  },
): number {
  // Curated subsets (e.g. Holiday Magic) — do not merge extra seasonal catalog rows.
  if (opts?.events) {
    const browseForFilter = opts.pickedYmd ? { ...browse, day: 'anytime' as const } : browse
    const f = {
      ...DEFAULT_BROWSE_FILTERS,
      ...browseForFilter,
      ...(opts.searchAnchor ? { city: 'all' as const } : null),
    }
    const anchor = getAnchorDate()
    const now = new Date()
    let next = opts.events.filter((event) => {
      if (!matchesCity(event, f.city)) return false
      if (opts.pickedYmd) {
        if (!eventMatchesPickedYmd(event, opts.pickedYmd)) return false
      } else if (
        !eventMatchesDayFilter(event, f.day, anchor, now) &&
        !spannedScheduleMatchesWhen(event, f.day, anchor, now)
      ) {
        return false
      }
      if (!eventMatchesTimeFilter(event, f.time)) return false
      if (!matchesAge(event, f.age)) return false
      if (f.types.length > 0 && !f.types.some((t) => event.types.includes(t))) return false
      if (f.seasonal && !isSeasonalAdminListing(event)) return false
      if (f.free && !isFreeCost(event.cost)) return false
      return true
    })
    if (opts.searchAnchor) {
      next = filterEventsByRadius(next, opts.searchAnchor, NEARBY_RADIUS_MILES)
    } else if (browse.city === 'nearby' && opts.coords) {
      next = filterEventsByRadius(next, opts.coords, NEARBY_RADIUS_MILES)
    }
    return next.length
  }

  return filterBrowseEventList({
    catalog: opts?.catalog ?? getPublicEventsFromCatalog(),
    browse,
    discoveryGate: opts?.discoveryGate,
    pickedYmd: opts?.pickedYmd,
    searchAnchor: opts?.searchAnchor,
    coords: opts?.coords,
  }).length
}

export function hasActiveBrowseFilters(browse: BrowseFilters): boolean {
  return (
    browse.day !== 'anytime' ||
    browse.time !== 'any' ||
    browse.age !== 'all' ||
    browse.types.length > 0 ||
    browse.seasonal ||
    browse.free
  )
}

export function isBrowseFiltersDefault(browse: BrowseFilters): boolean {
  return (
    browse.city === 'all' &&
    browse.day === 'anytime' &&
    browse.time === 'any' &&
    browse.age === 'all' &&
    browse.types.length === 0 &&
    !browse.seasonal &&
    !browse.free
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
    seasonal: false,
    free: false,
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

  if (next.age !== 'all' || next.types.length > 0 || next.seasonal || next.free) {
    next = { ...next, age: 'all', types: [], seasonal: false, free: false }
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
