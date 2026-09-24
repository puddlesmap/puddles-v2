import type { Event } from '../types/event'
import { getThisWeekendRange, zonedCalendarDate } from './dates'
import { getSeasonalAvailability } from './formatSeasonalSchedule'

export type SeasonalTimingBucket = 'this-weekend' | 'later'

function ymdInInclusiveRange(ymd: string, startYmd: string, endYmd: string): boolean {
  return Boolean(ymd) && ymd >= startYmd && ymd <= endYmd
}

/** True when the event is happening or open during this Sat–Sun (Pacific). */
export function isSeasonalEventThisWeekend(event: Event, now: Date = new Date()): boolean {
  const avail = getSeasonalAvailability(event, now)
  if (avail.bucket === 'ended') return false

  const weekend = getThisWeekendRange(now)
  const startYmd = zonedCalendarDate(weekend.start)
  const endYmd = zonedCalendarDate(weekend.end)

  if (ymdInInclusiveRange(avail.nextRelevantYmd, startYmd, endYmd)) return true

  if (event.scheduleKind !== 'seasonal-run' && event.scheduleKind !== 'multi-day') {
    return false
  }

  const opening = avail.opening
  const closing = avail.closing
  const windowOverlapsWeekend =
    Boolean(opening) && opening <= endYmd && (!closing || closing >= startYmd)

  if (!windowOverlapsWeekend) return false

  if (avail.bucket === 'openToday' || avail.bucket === 'closedToday') return true

  // Opens before or during this weekend, so it will be in season by Saturday.
  return Boolean(opening) && opening <= endYmd
}

export function partitionSeasonalTiming<T extends Event>(
  events: T[],
  now: Date = new Date(),
): { thisWeekend: T[]; later: T[] } {
  const thisWeekend: T[] = []
  const later: T[] = []

  for (const event of events) {
    if (isSeasonalEventThisWeekend(event, now)) thisWeekend.push(event)
    else later.push(event)
  }

  return { thisWeekend, later }
}
