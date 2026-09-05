import type { Event } from '../types/event'
import { isPublicAgeEligible } from './ageRange'
import { ALL_EVENTS, ALL_SEASONAL_DRIVE_EVENTS } from '../data/events'
import {
  addDays,
  getEventEffectiveEnd,
  parseEventDateTime,
  parseFlexibleDate,
} from './dates'
import { computeIsPast, isPublicEvent, isWithinPublicDisplayWindow } from './publishing'
import { EXPERIMENT_CANCELLED_EVENT_IDS } from '../data/experimentExpiredActivity'

/** Hidden editorial picks that still get `/event/:id` from seasonal collection cards. */
const SEASONAL_DRIVE_DETAIL_IDS = new Set(ALL_SEASONAL_DRIVE_EVENTS.map((event) => event.id))

export type EventLifecycleStatus = 'upcoming' | 'ended' | 'archived' | 'cancelled'

export const LIFECYCLE_ARCHIVE_DAYS = 90

export function isEventCancelledForLifecycle(event: Event): boolean {
  return EXPERIMENT_CANCELLED_EVENT_IDS.has(event.id)
}

export function getEventEffectiveEndTime(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'scheduleKind' | 'closingDate' | 'openingDate'>,
): Date | null {
  // Seasonal / multi-day runs last through closingDate (end of that calendar day).
  if (event.scheduleKind === 'seasonal-run' || event.scheduleKind === 'multi-day') {
    const closing = (event.closingDate || '').trim()
    if (closing) {
      // End of the closing calendar day (Pacific), not opening-day hours.
      return parseEventDateTime(closing, '23:59') ?? parseFlexibleDate(closing)
    }
    // No published close — stay upcoming (do not treat opening day endTime as season end).
    return null
  }
  return getEventEffectiveEnd(event.date, event.startTime, event.endTime)
}

export function getEventArchiveTime(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'scheduleKind' | 'closingDate' | 'openingDate'>,
): Date | null {
  const effectiveEnd = getEventEffectiveEndTime(event)
  if (!effectiveEnd) return null
  return addDays(effectiveEnd, LIFECYCLE_ARCHIVE_DAYS)
}

/** Derived lifecycle — never persisted. */
export function getEventLifecycleStatus(event: Event, now: Date = new Date()): EventLifecycleStatus {
  if (event.status === 'Cancelled' || isEventCancelledForLifecycle(event)) return 'cancelled'

  const effectiveEnd = getEventEffectiveEndTime(event)
  if (!effectiveEnd) return 'upcoming'

  const archiveTime = addDays(effectiveEnd, LIFECYCLE_ARCHIVE_DAYS)
  if (now.getTime() > archiveTime.getTime()) return 'archived'
  if (now.getTime() > effectiveEnd.getTime()) return 'ended'
  return 'upcoming'
}

export function isDiscoverableLifecycleEvent(event: Event, now: Date = new Date()): boolean {
  if (event.status !== 'Published') return false
  if (!isPublicAgeEligible(event.ageRange)) return false
  if (getEventLifecycleStatus(event, now) !== 'upcoming') return false
  return isWithinPublicDisplayWindow(event.date)
}

export function isLifecycleDetailAccessible(event: Event): boolean {
  // Draft = unavailable. Hidden is unavailable unless it is a seasonal Worth-a-drive
  // editorial pick (cards link to /event/:id; Browse/sitemap stay gated via Published).
  if (event.status === 'Draft') return false
  if (event.status === 'Hidden') return SEASONAL_DRIVE_DETAIL_IDS.has(event.id)
  return true
}

export function isLifecycleEventIndexable(event: Event, now: Date = new Date()): boolean {
  return isDiscoverableLifecycleEvent(event, now)
}

export function isLifecycleEventNoIndex(event: Event, now: Date = new Date()): boolean {
  const status = getEventLifecycleStatus(event, now)
  return status === 'archived' || status === 'ended' || status === 'cancelled'
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Dynamic date label for lifecycle banners.
 * Single day → "July 11"; multi-day → "July 11–13" or "July 30 – August 2".
 */
export function formatLifecycleDateLabel(event: Event): string | null {
  const start = parseFlexibleDate(event.date)
  if (!start || Number.isNaN(start.getTime())) return null

  const effectiveEnd = getEventEffectiveEndTime(event)
  if (effectiveEnd && !isSameCalendarDay(start, effectiveEnd)) {
    if (start.getMonth() === effectiveEnd.getMonth()) {
      return `${formatMonthDay(start)}\u2013${effectiveEnd.getDate()}`
    }
    return `${formatMonthDay(start)} \u2013 ${formatMonthDay(effectiveEnd)}`
  }

  return formatMonthDay(start)
}

export function formatLifecycleEndedPhrase(event: Event): string {
  const label = formatLifecycleDateLabel(event)
  if (!label) return 'It took place recently.'
  return label.includes('\u2013') ? `It took place from ${label}.` : `It took place on ${label}.`
}

export function formatLifecycleCancelledPhrase(event: Event): string {
  const label = formatLifecycleDateLabel(event)
  if (!label) return 'It was originally scheduled recently.'
  return `It was originally scheduled for ${label}.`
}

export function getDiscoverableEventsFromCatalog(now: Date = new Date()): Event[] {
  return ALL_EVENTS.filter((event) => isDiscoverableLifecycleEvent(event, now))
}

export function getAllCatalogEventsForLifecycle(): Event[] {
  return ALL_EVENTS
}

export function getLifecycleDetailEventById(id: string): Event | undefined {
  const event = getAllCatalogEventsForLifecycle().find((row) => row.id === id)
  if (!event || !isLifecycleDetailAccessible(event)) return undefined
  return event
}

/** Compare legacy public gate vs lifecycle discovery for experiment diagnostics. */
export function getLifecycleDiscoveryDelta(now: Date = new Date()): {
  legacyPublicCount: number
  lifecycleUpcomingCount: number
  endedVisibleInLegacy: number
} {
  const all = getAllCatalogEventsForLifecycle()
  const legacyPublic = all.filter((event) => isPublicEvent(event, now))
  const lifecycleUpcoming = all.filter((event) => isDiscoverableLifecycleEvent(event, now))
  const endedVisibleInLegacy = legacyPublic.filter(
    (event) => getEventLifecycleStatus(event, now) !== 'upcoming',
  ).length

  return {
    legacyPublicCount: legacyPublic.length,
    lifecycleUpcomingCount: lifecycleUpcoming.length,
    endedVisibleInLegacy,
  }
}

export function isLegacyPastMatch(event: Event, now: Date = new Date()): boolean {
  return computeIsPast(event.date, event.startTime, event.endTime, now)
}
