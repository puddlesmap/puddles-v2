/** Shared publishing logic for parse-sheet and documentation parity with Google Sheets. */

export const EVENT_STATUSES = ['Draft', 'Published', 'Hidden', 'Expired']

/** Rolling public calendar window — today through this many days ahead (inclusive). */
export const PUBLIC_DISPLAY_WINDOW_DAYS = 60

/** Demo anchor — matches src/utils/dates.ts ANCHOR_DATE for consistent local builds. */
export const DEFAULT_PUBLISHING_REFERENCE = '2026-06-05T12:00:00'

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function parseEventDay(date) {
  if (!date) return null
  const raw = String(date).trim()
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return startOfDay(new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`))
  const parsed = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed)
}

export function isWithinPublicDisplayWindow(
  date,
  anchor = startOfDay(new Date(DEFAULT_PUBLISHING_REFERENCE)),
  windowDays = PUBLIC_DISPLAY_WINDOW_DAYS,
) {
  const eventDay = parseEventDay(date)
  if (!eventDay) return false
  const today = startOfDay(anchor)
  const lastVisibleDay = startOfDay(addDays(anchor, windowDays))
  return eventDay >= today && eventDay <= lastVisibleDay
}

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

export function isPublicEvent(event, now = new Date(DEFAULT_PUBLISHING_REFERENCE)) {
  if (event.status !== 'Published') return false
  if (computeIsPast(event.date, event.endTime, now)) return false
  return isWithinPublicDisplayWindow(event.date, startOfDay(now))
}

/** Google Sheets formula helpers (column letters are examples — adjust to your sheet). */
export const SHEET_FORMULAS = {
  isPast: `=OR(
  EventDateCell + EventEndTimeCell < NOW(),
  AND(EventDateCell <> "", EventEndTimeCell = "", EventDateCell < TODAY())
)`,
  isLive: '=AND(StatusCell="Published", IsPastCell=FALSE)',
}
