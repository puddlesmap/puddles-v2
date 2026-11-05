import type { Event } from '../types/event'
import { parseEventDateTime, zonedCalendarDate } from './dates'
import { eventDetailUrl, isOfficialEventUrl } from './eventPages'
import { getSeasonalAvailability } from './formatSeasonalSchedule'
import { getEventDirectionsDestination } from './maps'

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'puddles-event'
}

/** RFC 5545 §3.1 — fold content lines at 75 octets; continuations start with a space. */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  return chunks.join('\r\n')
}

/** UTC with trailing Z — Apple Calendar rejects floating local DTSTAMP/DTSTART. */
function toIcsDateTimeUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function toCompactYmd(ymd: string): string {
  return ymd.replace(/-/g, '')
}

function addOneDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return zonedCalendarDate(d)
}

/** Best calendar day: next open → opening → date → today. */
export function resolveCalendarYmd(event: Event, now: Date = new Date()): string {
  const avail = getSeasonalAvailability(event, now)
  return (
    avail.nextRelevantYmd?.trim() ||
    event.openingDate?.trim() ||
    event.date?.trim() ||
    zonedCalendarDate(now)
  )
}

type CalendarPayload =
  | { kind: 'timed'; start: Date; end: Date }
  | { kind: 'allDay'; startYmd: string; endYmdExclusive: string }

function resolveCalendarPayload(event: Event): CalendarPayload {
  const timedStart = parseEventDateTime(event.date, event.startTime)
  if (timedStart) {
    let end = event.endTime?.trim() ? parseEventDateTime(event.date, event.endTime) : null
    if (!end || end <= timedStart) {
      end = new Date(timedStart.getTime() + 60 * 60 * 1000)
    }
    return { kind: 'timed', start: timedStart, end }
  }

  const startYmd = resolveCalendarYmd(event)
  return { kind: 'allDay', startYmd, endYmdExclusive: addOneDayYmd(startYmd) }
}

export function getCalendarLocation(event: Event): string {
  const venue = event.venue?.trim()
  const address = event.address?.trim()
  const city = event.city?.trim()

  if (venue && address) return `${venue}, ${address}`
  if (venue && city) return `${venue}, ${city}`
  return getEventDirectionsDestination(event) ?? ''
}

export function getCalendarDescription(event: Event): string {
  const parts: string[] = []

  if (event.description?.trim()) {
    parts.push(event.description.trim())
    parts.push('')
  }

  parts.push('Event details on Puddles')
  parts.push(eventDetailUrl(event))
  parts.push('')

  if (isOfficialEventUrl(event.eventUrl)) {
    parts.push('Official event information')
    parts.push(event.eventUrl!.trim())
    parts.push('')
  }

  parts.push('Added from Puddles — The Tot Map.')
  parts.push('Event details may change. Please confirm with the organizer before heading out.')

  return parts.join('\n')
}

/** Always available — timed when we have a start time, otherwise all-day for the parent to edit. */
export function canAddEventToCalendar(_event: Event): boolean {
  return true
}

function toGoogleCalendarUtc(date: Date): string {
  return toIcsDateTimeUtc(date)
}

export function buildGoogleCalendarUrl(event: Event): string | null {
  const payload = resolveCalendarPayload(event)
  const dates =
    payload.kind === 'timed'
      ? `${toGoogleCalendarUtc(payload.start)}/${toGoogleCalendarUtc(payload.end)}`
      : `${toCompactYmd(payload.startYmd)}/${toCompactYmd(payload.endYmdExclusive)}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    details: getCalendarDescription(event),
  })

  const location = getCalendarLocation(event)
  if (location) params.set('location', location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent || ''
  return (
    /FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter/i.test(ua) ||
    /Messenger/i.test(ua) ||
    (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) ||
    (/Android/i.test(ua) && /;\s*wv\)/i.test(ua))
  )
}

export type AddEventToCalendarResult = 'ics' | 'google' | false

export function addEventToCalendar(event: Event): AddEventToCalendarResult {
  const googleUrl = buildGoogleCalendarUrl(event)
  if (!googleUrl) return false

  if (isLikelyInAppBrowser()) {
    window.open(googleUrl, '_blank', 'noopener,noreferrer')
    return 'google'
  }

  if (downloadEventIcs(event)) return 'ics'

  window.open(googleUrl, '_blank', 'noopener,noreferrer')
  return 'google'
}

export function getEventRouteCardSubtext(event: Event): string {
  const venue = event.venue?.trim()
  const address = event.address?.trim()
  const city = event.city?.trim()

  if (venue && address) return `${venue} · ${address}`
  if (venue && city) return `${venue} · ${city}`
  return getEventDirectionsDestination(event) ?? ''
}

export function downloadEventIcs(event: Event): boolean {
  const payload = resolveCalendarPayload(event)
  const now = new Date()
  const uid = `${event.id.replace(/[^\w.@-]/g, '-') || 'event'}@puddles.app`
  const location = getCalendarLocation(event)
  const description = getCalendarDescription(event)

  const startEndLines =
    payload.kind === 'timed'
      ? [`DTSTART:${toIcsDateTimeUtc(payload.start)}`, `DTEND:${toIcsDateTimeUtc(payload.end)}`]
      : [
          `DTSTART;VALUE=DATE:${toCompactYmd(payload.startYmd)}`,
          `DTEND;VALUE=DATE:${toCompactYmd(payload.endYmdExclusive)}`,
        ]

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Puddles//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    // DTSTAMP must be UTC (RFC 5545) — floating local stamps make Apple Calendar refuse the import.
    `DTSTAMP:${toIcsDateTimeUtc(now)}`,
    ...startEndLines,
    `SUMMARY:${escapeIcsText(event.title)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    `DESCRIPTION:${escapeIcsText(description)}`,
    // Reminder via .ics VALARM (Apple/Outlook/Google file import). Google TEMPLATE links cannot set reminders.
    ...(payload.kind === 'timed'
      ? [
          'BEGIN:VALARM',
          'TRIGGER:-P1D',
          'ACTION:DISPLAY',
          'DESCRIPTION:Puddles reminder',
          'END:VALARM',
        ]
      : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line))

  const body = `${lines.map(foldIcsLine).join('\r\n')}\r\n`
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(event.title)}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately can truncate the download on Safari/macOS → Calendar "Import failed to save."
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)

  return true
}
