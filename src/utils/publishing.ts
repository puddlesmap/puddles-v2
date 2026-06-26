import type { Event, EventStatus } from '../types/event'

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

/** TRUE when the event end (or end of day) is before now. */
export function computeIsPast(
  date: string,
  endTime: string,
  referenceDate: Date = new Date(),
): boolean {
  if (!date) return false
  const end = endTime || '23:59'
  const eventEnd = new Date(`${date}T${end}:00`)
  if (Number.isNaN(eventEnd.getTime())) {
    return new Date(`${date}T23:59:59`).getTime() < referenceDate.getTime()
  }
  return eventEnd.getTime() < referenceDate.getTime()
}

/** Public website gate: Status = Published AND Is Past = FALSE. */
export function computeIsLive(status: EventStatus, isPast: boolean): boolean {
  return status === 'Published' && !isPast
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
}): Pick<Event, 'status' | 'isPast' | 'isLive'> {
  const isPast = input.isPastRaw ?? computeIsPast(input.date, input.endTime)
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
  const isPast = computeIsPast(event.date, event.endTime)
  const isLive = computeIsLive(event.status, isPast)
  return { ...event, isPast, isLive }
}

/** Website publishing rule: only Events tab rows where Is Live = TRUE. */
export function isPublicEvent(event: Event): boolean {
  return event.isLive === true
}

export function formatPublishingYesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}
