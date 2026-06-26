import type { Event } from '../types/event'
import { getEventDirectionsDestination } from './maps'

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'puddles-event'
}

function parseEventDateTime(dateStr: string, time24: string): Date | null {
  if (!dateStr?.trim() || !time24?.trim()) return null

  const [h, m] = time24.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null

  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null

  d.setHours(h, m, 0, 0)
  return d
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
