import type { Event } from '../types/event'
import { getEventAddressLine, getEventRoomLine } from './maps'
import { eventDetailUrl, isOfficialEventUrl } from './eventPages'

const PACIFIC_TIMEZONE = 'America/Los_Angeles'

function toPacificIsoDateTime(date: string, time: string): string | null {
  if (!date || !time) return null

  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const probe = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(probe.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    timeZoneName: 'shortOffset',
  }).formatToParts(probe)

  const offsetPart = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-8'
  const offset = offsetPart.replace('GMT', '')
  const normalizedOffset = offset.includes(':') ? offset : `${offset}:00`
  const paddedHours = String(hours).padStart(2, '0')

  return `${date}T${paddedHours}:${match[2]}:00${normalizedOffset}`
}

function buildLocation(event: Event) {
  const venue = event.venue?.trim()
  const room = getEventRoomLine(event)
  const addressLine = getEventAddressLine(event)
  const name = [venue, room].filter(Boolean).join(room && venue ? ' — ' : '') || venue || addressLine

  if (!name && !addressLine && !event.city) return null

  const location: Record<string, unknown> = {
    '@type': 'Place',
  }

  if (name) location.name = name

  if (addressLine || event.city) {
    location.address = {
      '@type': 'PostalAddress',
      ...(addressLine ? { streetAddress: addressLine } : {}),
      ...(event.city ? { addressLocality: event.city } : {}),
      addressRegion: 'CA',
      addressCountry: 'US',
    }
  }

  if (Number.isFinite(event.lat) && Number.isFinite(event.lng)) {
    location.geo = {
      '@type': 'GeoCoordinates',
      latitude: event.lat,
      longitude: event.lng,
    }
  }

  return location
}

export function buildEventJsonLd(event: Event): Record<string, unknown> | null {
  const name = event.title?.trim()
  const startDate = toPacificIsoDateTime(event.date, event.startTime)
  const location = buildLocation(event)

  if (!name || !startDate || !location) return null

  const endDate = toPacificIsoDateTime(event.date, event.endTime)
  const pageUrl = eventDetailUrl(event)
  const officialUrl = isOfficialEventUrl(event.eventUrl) ? event.eventUrl.trim() : null
  const description = event.description?.trim()
  const imageUrl = event.imageUrl?.trim()
  const categories = event.categoryTags.length > 0 ? event.categoryTags : event.types

  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate,
    url: pageUrl,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location,
  }

  if (endDate) payload.endDate = endDate
  if (description) payload.description = description
  if (imageUrl) payload.image = [imageUrl]
  if (officialUrl) payload.sameAs = officialUrl
  if (event.ageRange?.trim()) {
    payload.audience = {
      '@type': 'PeopleAudience',
      suggestedMinAge: event.ageMin,
      suggestedMaxAge: event.ageMax,
    }
  }
  if (categories.length > 0) {
    payload.about = categories
  }

  if (event.cost === 'Free') {
    payload.isAccessibleForFree = true
    payload.offers = {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      url: officialUrl ?? pageUrl,
      availability: 'https://schema.org/InStock',
    }
  }

  return payload
}

export function eventStructuredDataId(event: Pick<Event, 'id'>): string {
  return `puddles-event-jsonld-${event.id}`
}
