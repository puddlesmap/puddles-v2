import { ALL_EVENTS, getPublicEventsFromCatalog } from '../data/events'
import type { Event } from '../types/event'
import { isPublicAgeEligible } from './ageRange'
import { absoluteUrl } from '../config/site'
import { isPublicEvent } from './publishing'

export function eventDetailPath(event: Pick<Event, 'id'>): string {
  return `/event/${event.id}`
}

export function eventDetailUrl(event: Pick<Event, 'id'>): string {
  return absoluteUrl(eventDetailPath(event))
}

export function eventIdFromPathname(pathname: string): string | null {
  if (!pathname.startsWith('/event/')) return null
  const id = pathname.slice('/event/'.length)
  return id || null
}

export function getCatalogEventById(id: string): Event | undefined {
  return ALL_EVENTS.find((event) => event.id === id)
}

export function getPublicEventById(id: string, now: Date = new Date()): Event | undefined {
  return getPublicEventsFromCatalog(now).find((event) => event.id === id)
}

export function isEventIndexable(event: Event, now: Date = new Date()): boolean {
  return isPublicEvent(event, now) && isPublicAgeEligible(event.ageRange)
}

export function isOfficialEventUrl(url?: string): boolean {
  const trimmed = url?.trim()
  if (!trimmed || trimmed === '#') return false

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function eventDocumentTitle(event: Pick<Event, 'title'>): string {
  return `${event.title} · Puddles`
}

export function eventMetaDescription(event: Event): string {
  const description = event.description?.trim()
  if (description) {
    return description.length > 155 ? `${description.slice(0, 152)}…` : description
  }

  return `${event.title} in ${event.city}.`
}
