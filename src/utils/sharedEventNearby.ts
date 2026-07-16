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
  layout?: 'airbnb' | 'airbnb-v2' | 'airbnb-v3' | 'luma' | 'eventbrite',
): string {
  const base = `/experiment-shared-event/event/${eventId}`
  const params = new URLSearchParams()
  if (mode === 'modal') params.set('mode', 'modal')
  if (layout) params.set('layout', layout)
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export function sharedEventCityLabel(city: string): string {
  const trimmed = city.trim()
  if (!trimmed) return 'the Bay Area'
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/** Normalize known Bay Area city casing inside an address line. */
export function capitalizeCitiesInText(text: string, city?: string): string {
  let result = text
  const known = ['Palo Alto', 'Los Altos', 'Mountain View']
  for (const name of known) {
    result = result.replace(new RegExp(name.replace(/\s+/g, '\\s+'), 'gi'), name)
  }
  if (city?.trim()) {
    const proper = sharedEventCityLabel(city)
    const pattern = city
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+')
    result = result.replace(new RegExp(pattern, 'gi'), proper)
  }
  return result
}
