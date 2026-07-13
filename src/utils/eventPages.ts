import { ALL_EVENTS, getPublicEventsFromCatalog } from '../data/events'
import type { Event } from '../types/event'
import { isPublicAgeEligible } from './ageRange'
import { isOutOfAgeAudienceForPublic } from './eventAudienceAge'
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
  return (
    isPublicEvent(event, now) &&
    isPublicAgeEligible(event.ageRange) &&
    !isOutOfAgeAudienceForPublic(event)
  )
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

export function eventDocumentTitle(event: Pick<Event, 'title' | 'city'>): string {
  const city = event.city?.trim()
  if (city) return `${event.title} in ${city} · Puddles`
  return `${event.title} · Puddles`
}

/** Stable calendar date for SEO metadata (not relative labels like Today). */
export function formatEventSeoDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function eventMetaDescription(event: Event): string {
  const date = formatEventSeoDate(event.date)
  const venue = event.venue?.trim() || 'a local venue'
  const city = event.city?.trim() || 'the Bay Area'

  return `${event.title} on ${date} at ${venue} in ${city}. Find local activities for ages 0–5 with Puddles.`
}

/** Readable slug for future pretty URLs — not used in routing yet. */
export function eventDetailSlug(event: Pick<Event, 'title' | 'city' | 'date'>): string {
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const title = slugify(event.title)
  const city = slugify(event.city || 'bay-area')
  const date = event.date.trim()

  return [title, city, date].filter(Boolean).join('-')
}
