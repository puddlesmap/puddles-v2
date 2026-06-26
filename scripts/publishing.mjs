/** Shared publishing logic for parse-sheet and documentation parity with Google Sheets. */

export const EVENT_STATUSES = ['Draft', 'Published', 'Hidden', 'Expired']

/** Demo anchor — matches src/utils/dates.ts ANCHOR_DATE for consistent local builds. */
export const DEFAULT_PUBLISHING_REFERENCE = '2026-06-05T12:00:00'

export function normalizeEventStatus(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  const match = EVENT_STATUSES.find((s) => s.toLowerCase() === raw.toLowerCase())
  return match ?? null
}

export function parseSheetBoolean(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim().toLowerCase()
  if (['true', 'yes', 'y', '1', 'checked'].includes(raw)) return true
  if (['false', 'no', 'n', '0', 'unchecked'].includes(raw)) return false
  return null
}

export function computeIsPast(date, endTime, referenceDate = new Date(DEFAULT_PUBLISHING_REFERENCE)) {
  if (!date) return false
  const end = endTime || '23:59'
  const eventEnd = new Date(`${date}T${end}:00`)
  if (Number.isNaN(eventEnd.getTime())) {
    const dayEnd = new Date(`${date}T23:59:59`)
    return dayEnd.getTime() < referenceDate.getTime()
  }
  return eventEnd.getTime() < referenceDate.getTime()
}

export function computeIsLive(status, isPast) {
  return status === 'Published' && isPast === false
}

/**
 * Migrate legacy Approved column when Status is missing.
 * Approved = FALSE → Draft
 * Approved = TRUE and Is Past = FALSE → Published
 * Approved = TRUE and Is Past = TRUE → Expired
 */
export function migrateStatusFromApproved(approved, isPast, existingStatus = null) {
  if (existingStatus) return existingStatus
  if (approved === false) return 'Draft'
  if (approved === true && isPast) return 'Expired'
  if (approved === true) return 'Published'
  // Legacy export had no publishing columns — treat upcoming as Published, past as Expired.
  return isPast ? 'Expired' : 'Published'
}

export function resolvePublishingFields({
  statusRaw,
  approvedRaw,
  isPastRaw,
  isLiveRaw,
  date,
  endTime,
  referenceDate = new Date(DEFAULT_PUBLISHING_REFERENCE),
}) {
  const isPast = isPastRaw ?? computeIsPast(date, endTime, referenceDate)
  const statusFromSheet = normalizeEventStatus(statusRaw)
  const approved = parseSheetBoolean(approvedRaw)
  const status = migrateStatusFromApproved(approved, isPast, statusFromSheet)
  const isLive = isLiveRaw ?? computeIsLive(status, isPast)

  return { status, isPast, isLive }
}

export function isPublicEvent(event) {
  return event.isLive === true
}

/** Google Sheets formula helpers (column letters are examples — adjust to your sheet). */
export const SHEET_FORMULAS = {
  isPast: `=OR(
  EventDateCell + EventEndTimeCell < NOW(),
  AND(EventDateCell <> "", EventEndTimeCell = "", EventDateCell < TODAY())
)`,
  isLive: '=AND(StatusCell="Published", IsPastCell=FALSE)',
}
