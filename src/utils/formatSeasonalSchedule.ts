import type { Event } from '../types/event'
import {
  formatCardDateTime,
  formatEventTimeRange,
  formatTime,
  zonedCalendarDate,
} from './dates'

export type DiscoveryWhenParts = {
  primary: string
  secondary?: string
  /** Single line for v3 cards: primary · secondary */
  line: string
}

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return zonedCalendarDate(d)
}

function formatShortOpenDate(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${month} ${d.getDate()}`
}

function formatRangeLabel(from: string, to: string): string {
  return `${formatShortOpenDate(from)}–${formatShortOpenDate(to)}`
}

function hoursLabel(event: Event): string {
  return formatEventTimeRange(event.startTime, event.endTime)
}

function joinWhen(primary: string, secondary?: string): string {
  if (!secondary) return primary
  return `${primary} · ${secondary}`
}

/**
 * Card + detail date line for one-time and long-running seasonal destinations.
 * Pacific calendar “today” via zonedCalendarDate.
 */
export function formatDiscoveryWhen(
  event: Pick<
    Event,
    | 'date'
    | 'startTime'
    | 'endTime'
    | 'scheduleKind'
    | 'openingDate'
    | 'closingDate'
    | 'recurringDaysLabel'
  >,
  now: Date = new Date(),
): DiscoveryWhenParts {
  if (event.scheduleKind !== 'seasonal-run') {
    const line = formatCardDateTime(event.date, event.startTime, now)
    return { primary: line, line }
  }

  const today = zonedCalendarDate(now)
  const opening = (event.openingDate || event.date || '').trim()
  const closing = (event.closingDate || '').trim()
  const recurring = (event.recurringDaysLabel || 'Daily').trim() || 'Daily'
  const hours = hoursLabel(event as Event)
  const hoursOk = hours !== '—'

  if (closing && today > closing) {
    const primary = `Closed · was ${formatRangeLabel(opening || event.date, closing)}`
    return { primary, line: primary }
  }

  // Official open + close range (still highlight TODAY / TOMORROW when opening is near)
  if (closing && opening) {
    if (today < opening) {
      const tomorrow = addDaysYmd(today, 1)
      const primary =
        opening === tomorrow ? 'Opens TOMORROW' : `Opens ${formatShortOpenDate(opening)}`
      const secondary = hoursOk ? `${recurring} · ${hours}` : recurring
      return { primary, secondary, line: joinWhen(primary, secondary) }
    }
    if (today === opening) {
      const primary = 'Open TODAY'
      const secondary = hoursOk ? hours : recurring
      return { primary, secondary, line: joinWhen(primary, secondary) }
    }
    const primary = formatRangeLabel(opening, closing)
    const secondary = hoursOk ? `${recurring} · ${hours}` : recurring
    return { primary, secondary, line: joinWhen(primary, secondary) }
  }

  // Opening known, no official close
  if (!opening) {
    const line = formatCardDateTime(event.date, event.startTime, now)
    return { primary: line, line }
  }

  const tomorrow = addDaysYmd(today, 1)

  if (today < opening) {
    const primary =
      opening === tomorrow ? 'Opens TOMORROW' : `Opens ${formatShortOpenDate(opening)}`
    const secondary = hoursOk ? `${recurring} · ${hours}` : recurring
    return { primary, secondary, line: joinWhen(primary, secondary) }
  }

  if (today === opening) {
    const primary = 'Open TODAY'
    const secondary = hoursOk ? `${recurring} · ${hours}` : recurring
    return { primary, secondary, line: joinWhen(primary, secondary) }
  }

  // After opening, still in season (no close date)
  const openLabel =
    recurring.toLowerCase() === 'daily' ? 'Open daily' : `Open ${recurring}`
  const secondary = hoursOk ? hours : undefined
  return { primary: openLabel, secondary, line: joinWhen(openLabel, secondary) }
}

/** Hours only helper for mockup secondary lines. */
export function formatOperatingHoursLine(startTime: string, endTime: string): string {
  const start = formatTime(startTime)
  const end = formatTime(endTime)
  if (!start) return '—'
  if (!end || end === start) return start
  return `${start}–${end}`
}
