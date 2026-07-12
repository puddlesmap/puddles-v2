import type { Event } from '../types/event'
import { absoluteUrl, SITE } from '../config/site'
import { formatModalDate, formatTime } from './dates'
import { getEventImageUrl, isMissingEventImage } from './eventImages'
import { eventDetailUrl } from './eventPages'

const META_SEP = ' · '

export function joinMetaParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(META_SEP)
}

function titleIncludesVenue(title: string, venue: string): boolean {
  return title.toLowerCase().includes(venue.toLowerCase())
}

/** Share/display title — append venue when it is not already in the title. */
export function eventShareDisplayTitle(event: Pick<Event, 'title' | 'venue'>): string {
  const title = event.title.trim()
  const venue = event.venue?.trim()
  if (!venue || titleIncludesVenue(title, venue)) return title
  return `${title} at ${venue}`
}

/** Relative date for native share (Today/Tomorrow allowed). */
export function formatEventShareDateLine(event: Pick<Event, 'date'>, now: Date = new Date()): string {
  return formatModalDate(event.date, now)
}

/** Absolute calendar date for SEO/OG (no Today/Tomorrow). */
export function formatEventMetaDateLine(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr.trim()

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatEventShareTimeLine(event: Pick<Event, 'startTime'>): string {
  const start = event.startTime?.trim()
  if (!start) return ''
  return formatTime(start)
}

export function formatEventShareDateTimeLine(
  event: Pick<Event, 'date' | 'startTime'>,
  now: Date = new Date(),
): string {
  return joinMetaParts([formatEventShareDateLine(event, now), formatEventShareTimeLine(event)])
}

export function formatEventMetaDateTimeLine(event: Pick<Event, 'date' | 'startTime'>): string {
  return joinMetaParts([formatEventMetaDateLine(event.date), formatEventShareTimeLine(event)])
}

export function formatEventLocationLine(event: Pick<Event, 'venue' | 'city'>): string {
  return joinMetaParts([event.venue?.trim(), event.city?.trim()])
}

export function formatEventOgLocationPhrase(event: Pick<Event, 'venue' | 'city'>): string {
  const venue = event.venue?.trim()
  const city = event.city?.trim()
  if (venue && city) return `${venue}, ${city}`
  return venue || city || ''
}

export function eventPageTitle(event: Pick<Event, 'title'>): string {
  return `${event.title.trim()} · Puddles`
}

export function eventMetaDescription(event: Event): string {
  return joinMetaParts([
    formatEventMetaDateTimeLine(event),
    event.city?.trim(),
  ])
}

export function eventOgDescription(event: Event): string {
  return joinMetaParts([
    formatEventMetaDateTimeLine(event),
    formatEventOgLocationPhrase(event),
  ])
}

export function eventOgImageUrl(event: Event): string {
  if (isMissingEventImage(event.imageUrl)) {
    return absoluteUrl(SITE.ogImagePath)
  }

  const resolved = getEventImageUrl(event).trim()
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved
  }

  return absoluteUrl(resolved)
}

export interface NativeSharePayload {
  title: string
  text: string
  url: string
}

export function buildNativeSharePayload(
  event: Event,
  url: string = eventDetailUrl(event),
  now: Date = new Date(),
): NativeSharePayload {
  const title = eventShareDisplayTitle(event)
  const text = [
    title,
    formatEventShareDateTimeLine(event, now),
    event.city?.trim(),
  ]
    .map((line) => line?.trim())
    .filter(Boolean)
    .join('\n')

  return { title, text, url }
}

export function buildClipboardShareText(
  event: Event,
  url: string = eventDetailUrl(event),
  now: Date = new Date(),
): string {
  const { text, url: shareUrl } = buildNativeSharePayload(event, url, now)
  return [text, shareUrl].filter(Boolean).join('\n')
}
