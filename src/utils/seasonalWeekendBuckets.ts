import type { Event } from '../types/event'
import { addDays, startOfDay, zonedCalendarDate } from './dates'
import { getSeasonalAvailability } from './formatSeasonalSchedule'

export type SeasonalTimingBucket = 'this-week' | 'later'

function ymdInInclusiveRange(ymd: string, startYmd: string, endYmd: string): boolean {
  return Boolean(ymd) && ymd >= startYmd && ymd <= endYmd
}

/** Today through six days out, Pacific — a rolling week, not Sat–Sun only. */
function thisWeekYmdRange(now: Date): { startYmd: string; endYmd: string } {
  const startYmd = zonedCalendarDate(now)
  const anchor = startOfDay(new Date(`${startYmd}T12:00:00`))
  return {
    startYmd,
    endYmd: zonedCalendarDate(addDays(anchor, 6)),
  }
}

/** True when the event is happening or open in the next seven days (Pacific). */
export function isSeasonalEventThisWeek(event: Event, now: Date = new Date()): boolean {
  const avail = getSeasonalAvailability(event, now)
  if (avail.bucket === 'ended') return false

  const { startYmd, endYmd } = thisWeekYmdRange(now)

  if (ymdInInclusiveRange(avail.nextRelevantYmd, startYmd, endYmd)) return true

  if (event.scheduleKind !== 'seasonal-run' && event.scheduleKind !== 'multi-day') {
    return false
  }

  const opening = avail.opening
  const closing = avail.closing
  const windowOverlapsWeek =
    Boolean(opening) && opening <= endYmd && (!closing || closing >= startYmd)

  if (!windowOverlapsWeek) return false

  if (avail.bucket === 'openToday' || avail.bucket === 'closedToday') return true

  // Opens before or during this rolling week, so it will be in season within seven days.
  return Boolean(opening) && opening <= endYmd
}

export function partitionSeasonalTiming<T extends Event>(
  events: T[],
  now: Date = new Date(),
): { thisWeek: T[]; later: T[] } {
  const thisWeek: T[] = []
  const later: T[] = []

  for (const event of events) {
    if (isSeasonalEventThisWeek(event, now)) thisWeek.push(event)
    else later.push(event)
  }

  return { thisWeek, later }
}
