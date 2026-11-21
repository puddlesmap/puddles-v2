import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const REMINDER_CONSENT_VERSION = 'v1'
export const SITE_TIMEZONE = 'America/Los_Angeles'
export const REMINDER_SEND_HOUR_PT = 9

const TIP_PREFIX_RE = /^[a-z]+\|/i

export function zonedCalendarDate(now = new Date(), timeZone = SITE_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function zonedHour(now = new Date(), timeZone = SITE_TIMEZONE) {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(now)
  const n = Number(hour)
  return Number.isFinite(n) ? n : null
}

export function addDaysYmd(ymd, days) {
  const base = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(base.getTime())) return ymd
  base.setDate(base.getDate() + days)
  return zonedCalendarDate(base)
}

function formatTime12(time) {
  const match = String(time || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ''
  let hours = Number(match[1])
  const minutes = match[2]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return minutes === '00' ? `${hours} ${ampm}` : `${hours}:${minutes} ${ampm}`
}

function formatHoursRange(startTime, endTime) {
  const start = formatTime12(startTime)
  const end = formatTime12(endTime)
  if (!start) return ''
  if (!end || end === start) return start
  return `${start}–${end}`
}

function formatWhenLine(event, eventYmd) {
  const d = new Date(`${eventYmd}T12:00:00`)
  const dayPart = Number.isNaN(d.getTime())
    ? eventYmd
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const hours = formatHoursRange(event.startTime, event.endTime)
  return hours ? `${dayPart} · ${hours}` : dayPart
}

function stripTipPrefix(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return ''
  return trimmed.replace(TIP_PREFIX_RE, '').trim()
}

/** One practical tip line — skip empty and very schedule-like lines. */
export function pickEmailTipLine(event) {
  const raw = String(event.tips || '').trim()
  if (!raw) return ''
  const lines = raw.split('\n').map(stripTipPrefix).filter(Boolean)
  for (const line of lines) {
    if (/^(open|opens|through|daily|weekends?|sat|sun|mon|tue|wed|thu|fri)/i.test(line)) continue
    if (/\d{1,2}:\d{2}/.test(line) && /\d{1,2}\/\d{1,2}/.test(line)) continue
    return line.length > 220 ? `${line.slice(0, 217)}…` : line
  }
  return lines[0] || ''
}

export function canOfferSavedReminder(event) {
  if (!event || !event.id) return false
  if (event.status === 'Cancelled' || event.status === 'Draft') return false
  if (event.scheduleKind === 'seasonal-run') return false
  if (event.sessions && event.sessions.length > 0) return true
  if (event.scheduleKind === 'multi-day') return Boolean(event.openingDate || event.date)
  return Boolean((event.date || '').trim())
}

function eventSessions(event) {
  if (event.sessions && event.sessions.length > 0) {
    return [...event.sessions].sort((a, b) => a.date.localeCompare(b.date))
  }
  if (event.date) {
    return [{ date: event.date, startTime: event.startTime, endTime: event.endTime }]
  }
  return []
}

/** Pacific calendar day the reminder is for when sending today (day before). */
export function reminderEventYmdForSendToday(event, todayYmd) {
  const tomorrow = addDaysYmd(todayYmd, 1)
  if (!canOfferSavedReminder(event)) return null

  if (event.scheduleKind === 'multi-day') {
    const opening = (event.openingDate || event.date || '').trim()
    return opening === tomorrow ? opening : null
  }

  for (const session of eventSessions(event)) {
    if (session.date === tomorrow) return tomorrow
  }
  return null
}

export function isEventSendableForReminder(event, now = new Date()) {
  if (!event || event.status !== 'Published') return false
  if (event.status === 'Cancelled') return false
  if (!canOfferSavedReminder(event)) return false

  const today = zonedCalendarDate(now)
  const eventYmd = reminderEventYmdForSendToday(event, today)
  if (!eventYmd) return false

  const effectiveEnd = eventEffectiveEndIso(event)
  if (effectiveEnd && now.getTime() > Date.parse(effectiveEnd)) return false
  return true
}

function eventEffectiveEndIso(event) {
  const sessions = eventSessions(event)
  const last = sessions[sessions.length - 1]
  if (event.scheduleKind === 'seasonal-run' || event.scheduleKind === 'multi-day') {
    const closing = (event.closingDate || '').trim()
    if (closing) return `${closing}T23:59:59`
    return null
  }
  if (!last?.date) return null
  const endTime = (last.endTime || last.startTime || '23:59').trim()
  return `${last.date}T${endTime}:00`
}

let catalogCache = null
export function loadPublishedEventsCatalog() {
  if (catalogCache) return catalogCache
  const candidates = [
    path.join(process.cwd(), 'src/data/sheet-events.json'),
    path.join(process.cwd(), 'data/sheet-events.json'),
    '/var/task/src/data/sheet-events.json',
  ]
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue
      const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
      catalogCache = new Map(
        (Array.isArray(rows) ? rows : [])
          .filter((row) => row?.id && row.status === 'Published')
          .map((row) => [String(row.id), row]),
      )
      return catalogCache
    } catch {
      /* try next */
    }
  }
  catalogCache = new Map()
  return catalogCache
}

export function buildReminderEmailPayload(event, eventYmd, siteUrl = 'https://puddlesmap.com') {
  const base = String(siteUrl || 'https://puddlesmap.com').replace(/\/$/, '')
  const venue = [event.venue, event.city].filter(Boolean).join(' · ')
  const eventPath = `/event/${encodeURIComponent(event.id)}`
  return {
    eventTitle: event.title || 'Saved activity',
    whenLine: formatWhenLine(event, eventYmd),
    whereLine: venue || event.city || '',
    tipLine: pickEmailTipLine(event),
    /** V1.1 primary CTA — absolute HTTPS .ics (or equivalent) for the occurrence; wire endpoint before live send. */
    calendarUrl: `${base}${eventPath}?src=reminder_calendar`,
    eventUrl: `${base}${eventPath}?src=reminder`,
    manageUrl: `${base}/saved`,
  }
}

export function reminderTurnOffToken(userId, eventId, secret) {
  if (!secret?.trim() || !userId || !eventId) return ''
  const payload = `${userId}:${eventId}`
  const sig = crypto.createHmac('sha256', secret.trim()).update(payload).digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifyReminderTurnOffToken(token, secret) {
  if (!secret?.trim() || !token) return null
  const parts = String(token).split('.')
  if (parts.length !== 2) return null
  try {
    const payload = Buffer.from(parts[0], 'base64url').toString('utf8')
    const [userId, eventId] = payload.split(':')
    if (!userId || !eventId) return null
    const expected = reminderTurnOffToken(userId, eventId, secret)
    if (!expected || expected.length !== token.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) return null
    return { userId, eventId }
  } catch {
    return null
  }
}
