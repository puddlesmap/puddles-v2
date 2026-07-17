import type { Event } from '../types/event'
import { parseEventDateTime } from './dates'
import { getEventDirectionsDestination } from './maps'

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'puddles-event'
}

function toIcsDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
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

  parts.push('Added from Puddles.')

  if (event.eventUrl?.trim()) {
    parts.push(`Source: ${event.eventUrl.trim()}`)
  }

  parts.push('Event details may change, please confirm with the host before heading out.')

  return parts.join('\n')
}

export function canAddEventToCalendar(event: Event): boolean {
  return parseEventDateTime(event.date, event.startTime) !== null
}

function toGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildGoogleCalendarUrl(event: Event): string | null {
  const start = parseEventDateTime(event.date, event.startTime)
  if (!start) return null

  let end = event.endTime?.trim() ? parseEventDateTime(event.date, event.endTime) : null
  if (!end || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toGoogleCalendarUtc(start)}/${toGoogleCalendarUtc(end)}`,
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
  const start = parseEventDateTime(event.date, event.startTime)
  if (!start) return false

  let end = event.endTime?.trim() ? parseEventDateTime(event.date, event.endTime) : null
  if (!end || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  const now = new Date()
  const uid = `${event.id}@puddles.app`
  const location = getCalendarLocation(event)
  const description = getCalendarDescription(event)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Puddles//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTimeLocal(now)}`,
    `DTSTART:${toIcsDateTimeLocal(start)}`,
    `DTEND:${toIcsDateTimeLocal(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    `DESCRIPTION:${escapeIcsText(description)}`,
    event.eventUrl?.trim() ? `URL:${escapeIcsText(event.eventUrl.trim())}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(event.title)}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return true
}
