import { getPublicEventsFromCatalog } from '../data/events'
import type { Event } from '../types/event'
import { citySlugForCity } from '../config/localRoutes'
import { filterEvents } from './filters'

function compareEventsBySchedule(a: Event, b: Event): number {
  const dateCompare = a.date.localeCompare(b.date)
  if (dateCompare !== 0) return dateCompare
  return (a.startTime || '').localeCompare(b.startTime || '')
}

export function buildSharedEventBrowseHref(city: string): string {
  const slug = citySlugForCity(city as Event['city'])
  if (slug) return `/browse?city=${slug}`

  const fallback = city.trim().toLowerCase().replace(/\s+/g, '-')
  return fallback ? `/browse?city=${fallback}` : '/browse'
}

export function getSharedEventNearbyActivities(
  event: Event,
  limit = 3,
  now: Date = new Date(),
): Event[] {
  const city = event.city?.trim()
  if (!city) return []

  return filterEvents(getPublicEventsFromCatalog(now), { city })
    .filter((candidate) => candidate.id !== event.id)
    .sort(compareEventsBySchedule)
    .slice(0, limit)
}

export function experimentSharedEventDetailPath(
  eventId: string,
  mode: 'direct' | 'modal' = 'direct',
): string {
  const base = `/experiment-shared-event/event/${eventId}`
  return mode === 'modal' ? `${base}?mode=modal` : base
}

export function sharedEventCityLabel(city: string): string {
  return city.trim() || 'the Bay Area'
}
