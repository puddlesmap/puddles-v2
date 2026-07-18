import type { Event } from '../types/event'
import { cityBrowseHref, citySlugForCity } from '../config/localRoutes'
import type { AgeFilter } from './ageRange'
import { getDiscoverableEventsFromCatalog, getEventLifecycleStatus } from './eventLifecycle'
import { eventDetailPath } from './eventPages'

export interface LifecycleBrowseContext {
  city?: string
  types?: string[]
  age?: AgeFilter
}

function slugifyCity(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-')
}

export function buildLifecycleBrowseHref(context: LifecycleBrowseContext = {}): string {
  const params = new URLSearchParams()

  if (context.city && context.city !== 'all') {
    params.set('city', slugifyCity(context.city))
  }

  if (context.types?.length === 1) {
    params.set('activity', context.types[0]!)
  }

  if (context.age && context.age !== 'all') {
    params.set('age', context.age)
  }

  const query = params.toString()
  return query ? `/experiment-expired-activity/browse?${query}` : '/experiment-expired-activity/browse'
}

export function lifecycleBrowseContextFromEvent(event: Event): LifecycleBrowseContext {
  return {
    city: event.city,
    types: event.types.slice(0, 1),
    age: event.ageMax <= 2 ? '0-2' : event.ageMin >= 2 ? '2-5' : 'all',
  }
}

export function findNextLifecycleOccurrence(
  event: Event,
  catalog: Event[],
  now: Date = new Date(),
): Event | undefined {
  const normalizedTitle = event.title.trim().toLowerCase()

  return catalog
    .filter((candidate) => {
      if (candidate.id === event.id) return false
      if (candidate.title.trim().toLowerCase() !== normalizedTitle) return false
      if (candidate.city !== event.city) return false
      return getEventLifecycleStatus(candidate, now) === 'upcoming'
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0]
}

export function experimentEventDetailPath(event: Pick<Event, 'id'>): string {
  return `/experiment-expired-activity/event/${event.id}`
}

export function experimentNextEventPath(event: Event, catalog: Event[], now: Date = new Date()): string | null {
  const next = findNextLifecycleOccurrence(event, catalog, now)
  return next ? experimentEventDetailPath(next) : null
}

/** Where the ended/expired lifecycle CTAs point. */
export type LifecycleLinkTarget = 'production' | 'experiment'

/** Production browse href preserving city / activity / age context. */
export function productionLifecycleBrowseHref(context: LifecycleBrowseContext = {}): string {
  const params = new URLSearchParams()
  if (context.city && context.city !== 'all') {
    params.set('city', slugifyCity(context.city))
  }
  if (context.types?.length === 1) {
    params.set('activity', context.types[0]!)
  }
  if (context.age && context.age !== 'all') {
    params.set('age', context.age)
  }
  const query = params.toString()
  return query ? `/browse?${query}` : '/browse'
}

export function productionNextEventPath(
  event: Event,
  catalog: Event[],
  now: Date = new Date(),
): string | null {
  const next = findNextLifecycleOccurrence(event, catalog, now)
  return next ? eventDetailPath(next) : null
}

/** "See what's coming up nearby" — production or experiment target. */
export function resolveLifecycleNearbyHref(
  event: Event,
  target: LifecycleLinkTarget = 'production',
): string {
  const context = lifecycleBrowseContextFromEvent(event)
  return target === 'experiment'
    ? buildLifecycleBrowseHref(context)
    : productionLifecycleBrowseHref(context)
}

/** "Browse all activities" — always production browse. */
export function resolveLifecycleBrowseAllHref(event: Event): string {
  return lifecycleProductionBrowseHref(lifecycleBrowseContextFromEvent(event))
}

/** "View the next date" — production or experiment detail path. */
export function resolveLifecycleNextEventHref(
  event: Event,
  catalog: Event[],
  now: Date,
  target: LifecycleLinkTarget = 'production',
): string | null {
  return target === 'experiment'
    ? experimentNextEventPath(event, catalog, now)
    : productionNextEventPath(event, catalog, now)
}

export function lifecycleNearbyBrowseHref(event: Event): string {
  const slug = citySlugForCity(event.city)
  return slug ? cityBrowseHref(slug) : '/browse'
}

/** Preserve experiment context while linking to production browse when helpful. */
export function lifecycleProductionBrowseHref(context: LifecycleBrowseContext = {}): string {
  const params = new URLSearchParams()
  if (context.city && context.city !== 'all') {
    params.set('city', slugifyCity(context.city))
  }
  const query = params.toString()
  return query ? `/browse?${query}` : '/browse'
}

export function countUpcomingInCity(city: string, now: Date = new Date()): number {
  return getDiscoverableEventsFromCatalog(now).filter((event) => event.city === city).length
}

export { eventDetailPath }
