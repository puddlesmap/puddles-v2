import type { Event, EventStatus } from '../types/event'
import {
  PUBLIC_DISPLAY_WINDOW_DAYS,
  addDays,
  getAnchorDate,
  getEventEffectiveEnd,
  parseFlexibleDate,
  startOfDay,
} from './dates'

export const EVENT_STATUSES: EventStatus[] = ['Draft', 'Published', 'Hidden', 'Expired']

export function normalizeEventStatus(value: unknown): EventStatus | null {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  return EVENT_STATUSES.find((status) => status.toLowerCase() === raw.toLowerCase()) ?? null
}

export function parseSheetBoolean(value: unknown): boolean | null {
  if (value == null || value === '') return null
  const raw = String(value).trim().toLowerCase()
  if (['true', 'yes', 'y', '1', 'checked'].includes(raw)) return true
  if (['false', 'no', 'n', '0', 'unchecked'].includes(raw)) return false
  return null
}

/** TRUE when the event end (or default duration) is at or before now. */
export function computeIsPast(
  date: string,
  startTime: string,
  endTime: string,
  referenceDate: Date = new Date(),
): boolean {
  if (!date) return false
  const effectiveEnd = getEventEffectiveEnd(date, startTime, endTime)
  if (!effectiveEnd) return false
  return effectiveEnd.getTime() <= referenceDate.getTime()
}

/** Public website gate: Status = Published AND Is Past = FALSE. */
export function computeIsLive(status: EventStatus, isPast: boolean): boolean {
  return status === 'Published' && !isPast
}

/** Event date falls within the rolling public window (today … today + window days). */
export function isWithinPublicDisplayWindow(
  date: string,
  anchor: Date = getAnchorDate(),
  windowDays: number = PUBLIC_DISPLAY_WINDOW_DAYS,
): boolean {
  const parsed = parseFlexibleDate(date) ?? new Date(`${date}T12:00:00`)
  const eventDay = startOfDay(parsed)
  if (Number.isNaN(eventDay.getTime())) return false

  const today = startOfDay(anchor)
  const lastVisibleDay = startOfDay(addDays(anchor, windowDays))
  return eventDay >= today && eventDay <= lastVisibleDay
}

/**
 * Migrate legacy Approved when Status is absent.
 * Approved = FALSE → Draft
 * Approved = TRUE and Is Past = FALSE → Published
 * Approved = TRUE and Is Past = TRUE → Expired
 */
export function migrateStatusFromApproved(
  approved: boolean | null,
  isPast: boolean,
  existingStatus?: EventStatus | null,
): EventStatus {
  if (existingStatus) return existingStatus
  if (approved === false) return 'Draft'
  if (approved === true && isPast) return 'Expired'
  if (approved === true) return 'Published'
  return isPast ? 'Expired' : 'Published'
}

export function resolvePublishingFields(input: {
  statusRaw?: unknown
  approvedRaw?: unknown
  isPastRaw?: boolean | null
  isLiveRaw?: boolean | null
  date: string
  endTime: string
  startTime?: string
}): Pick<Event, 'status' | 'isPast' | 'isLive'> {
  const isPast =
    input.isPastRaw ??
    computeIsPast(input.date, input.startTime ?? input.endTime, input.endTime)
  const statusFromSheet = normalizeEventStatus(input.statusRaw)
  const approved = parseSheetBoolean(input.approvedRaw)
  const status = migrateStatusFromApproved(approved, isPast, statusFromSheet)
  const isLive = input.isLiveRaw ?? computeIsLive(status, isPast)
  return { status, isPast, isLive }
}

/** Recompute read-only publishing helpers from editorial Status + schedule. */
export function enrichPublishingFields(
  event: Omit<Event, 'isPast' | 'isLive'> & Partial<Pick<Event, 'isPast' | 'isLive'>>,
): Event {
  const isPast = computeIsPast(event.date, event.startTime, event.endTime)
  const isLive = computeIsLive(event.status, isPast)
  return { ...event, isPast, isLive }
}

/**
 * Website publishing rule:
 * Status = Published, not past, and within the rolling display window.
 */
export function isPublicEvent(event: Event, now: Date = new Date()): boolean {
  if (event.status !== 'Published') return false
  if (computeIsPast(event.date, event.startTime, event.endTime, now)) return false
  return isWithinPublicDisplayWindow(event.date)
}

export function formatPublishingYesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}
