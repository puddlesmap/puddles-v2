/**
 * Long-duration / seasonal When (Browse card vs event page WHEN vs rail).
 *
 * Browse card — “When can I go next?” → status + that day’s hours only
 *   Opens Sep 17 · hours | Opens TOMORROW · hours | Open TODAY · hours | Next open WEDNESDAY · hours
 *
 * Event page WHEN — “What is the full schedule?”
 *   Status (Opens… / Open TODAY / Next open…) → recurrence · hours
 *   → optional italic scheduleNote → Through date when known
 *   Omit Through when no published closing date (never invent one).
 *
 * Rail — compact status + hours + optional Through (Paid stays above in UI)
 *
 * Wording: Opens / Open TODAY / Next open WEEKDAY; Through (not Ends); never invent a close date.
 */
import type { Event } from '../types/event'
import {
  formatCardDateTime,
  formatEventTimeRange,
  formatTime,
  getEventEffectiveEnd,
  zonedCalendarDate,
} from './dates'

export type DiscoveryWhenParts = {
  primary: string
  secondary?: string
  /** Single line for v3 cards: primary · secondary */
  line: string
}

/** One line in event-page WHEN (status / schedule / note / Through). */
export type SeasonalWhenRow = {
  text: string
  /** Smaller italic caveat under the schedule line. */
  variant?: 'default' | 'note'
}

export type SeasonalDetailWhen = {
  rows: SeasonalWhenRow[]
  /** Compact action-rail lines: status, hours, optional Through (no scheduleNote). */
  rail: string[]
}

export type SeasonalDiscoveryBucket =
  | 'openToday'
  | 'openingSoon'
  | 'closedToday'
  | 'future'
  | 'ended'

export type SeasonalAvailability = {
  bucket: SeasonalDiscoveryBucket
  /** Parent-facing status line (Opens… / Open TODAY / Next open WEDNESDAY). */
  statusLabel: string
  /** YYYY-MM-DD used for sorting within a bucket. */
  nextRelevantYmd: string
  opening: string
  closing: string
  recurring: string
  hours: string
  hoursOk: boolean
  openToday: boolean
}

type SeasonalFields = Pick<
  Event,
  | 'date'
  | 'startTime'
  | 'endTime'
  | 'scheduleKind'
  | 'openingDate'
  | 'closingDate'
  | 'recurringDaysLabel'
  | 'scheduleNote'
>

function asWhenRows(texts: string[]): SeasonalWhenRow[] {
  return texts.filter(Boolean).map((text) => ({ text }))
}

function buildSeasonalDetailRows(
  avail: SeasonalAvailability,
  scheduleNote: string,
  options: { includeScheduleLine: boolean },
): SeasonalWhenRow[] {
  const scheduleLine = avail.hoursOk
    ? `${avail.recurring} · ${avail.hours}`
    : avail.recurring
  const throughLine = avail.closing ? `Through ${formatShortOpenDate(avail.closing)}` : ''
  const note = scheduleNote.trim()

  const rows: SeasonalWhenRow[] = [{ text: avail.statusLabel }]
  if (options.includeScheduleLine && scheduleLine) {
    rows.push({ text: scheduleLine })
  }
  if (note) {
    rows.push({ text: note, variant: 'note' })
  }
  if (throughLine) {
    rows.push({ text: throughLine })
  }
  return rows.filter((row) => Boolean(row.text))
}

const WEEKDAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
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

function hoursLabel(event: SeasonalFields): string {
  return formatEventTimeRange(event.startTime, event.endTime).replace(/ – /g, '–')
}

function joinWhen(primary: string, secondary?: string): string {
  if (!secondary) return primary
  return `${primary} · ${secondary}`
}

function weekdayIndexFromYmd(ymd: string): number {
  return new Date(`${ymd}T12:00:00`).getDay()
}

/**
 * Parse labels like Daily, Wed–Sun, Mon–Fri, Sat & Sun into JS weekday indices.
 * Unparseable → all days (safe default; never invent a wrong Next open).
 */
export function parseRecurringWeekdays(label: string): Set<number> {
  const text = label.trim().toLowerCase()
  const all = new Set([0, 1, 2, 3, 4, 5, 6])
  if (!text || text === 'daily' || text === 'every day' || text === 'everyday') {
    return all
  }
  // Display labels like "Open Weekends" / "Weekends" → Sat + Sun
  if (/\bweekends?\b/.test(text) && !/\b(mon|tue|wed|thu|fri|sun|sat)[a-z]*\b/.test(text.replace(/\bweekends?\b/g, ''))) {
    return new Set([0, 6])
  }

  const days = new Set<number>()

  const rangeMatch = text.match(
    /\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\s*[–-]\s*(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/,
  )
  if (rangeMatch) {
    const start = WEEKDAY_ALIASES[rangeMatch[1]]
    const end = WEEKDAY_ALIASES[rangeMatch[2]]
    if (start != null && end != null) {
      if (start <= end) {
        for (let i = start; i <= end; i += 1) days.add(i)
      } else {
        for (let i = start; i <= 6; i += 1) days.add(i)
        for (let i = 0; i <= end; i += 1) days.add(i)
      }
      return days
    }
  }

  for (const token of text.split(/[^a-z]+/)) {
    const idx = WEEKDAY_ALIASES[token]
    if (idx != null) days.add(idx)
  }

  return days.size > 0 ? days : all
}

function isOpenOnYmd(openDays: Set<number>, ymd: string): boolean {
  return openDays.has(weekdayIndexFromYmd(ymd))
}

/** Next calendar day on/after `fromYmd` that is an operating day, within optional close. */
export function nextOperatingYmd(
  fromYmd: string,
  openDays: Set<number>,
  closingYmd?: string,
): string | null {
  for (let i = 0; i < 14; i += 1) {
    const ymd = addDaysYmd(fromYmd, i)
    if (closingYmd && ymd > closingYmd) return null
    if (isOpenOnYmd(openDays, ymd)) return ymd
  }
  return null
}

function opensStatusLabel(opening: string, today: string): string {
  const tomorrow = addDaysYmd(today, 1)
  if (opening === tomorrow) return 'Opens TOMORROW'
  return `Opens ${formatShortOpenDate(opening)}`
}

/**
 * Shared availability for seasonal-run and (for sorting) one-time events.
 */
export function getSeasonalAvailability(
  event: SeasonalFields,
  now: Date = new Date(),
): SeasonalAvailability {
  const today = zonedCalendarDate(now)
  const recurring = (event.recurringDaysLabel || 'Daily').trim() || 'Daily'
  const hours = hoursLabel(event)
  const hoursOk = hours !== '—'
  const openDays = parseRecurringWeekdays(recurring)

  if (event.scheduleKind === 'seasonal-run') {
    const opening = (event.openingDate || event.date || '').trim()
    const closing = (event.closingDate || '').trim()

    if (closing && today > closing) {
      return {
        bucket: 'ended',
        statusLabel: `Closed · was ${formatRangeLabel(opening || event.date, closing)}`,
        nextRelevantYmd: closing,
        opening,
        closing,
        recurring,
        hours,
        hoursOk,
        openToday: false,
      }
    }

    if (opening && today < opening) {
      return {
        bucket: 'openingSoon',
        statusLabel: opensStatusLabel(opening, today),
        nextRelevantYmd: opening,
        opening,
        closing,
        recurring,
        hours,
        hoursOk,
        openToday: false,
      }
    }

    // In season (or open day with no close)
    const openToday = isOpenOnYmd(openDays, today)
    if (openToday) {
      return {
        bucket: 'openToday',
        statusLabel: 'Open TODAY',
        nextRelevantYmd: today,
        opening: opening || event.date,
        closing,
        recurring,
        hours,
        hoursOk,
        openToday: true,
      }
    }

    const next = nextOperatingYmd(addDaysYmd(today, 1), openDays, closing || undefined)
    if (next) {
      const weekday = WEEKDAY_NAMES[weekdayIndexFromYmd(next)]
      return {
        bucket: 'closedToday',
        statusLabel: `Next open ${weekday}`,
        nextRelevantYmd: next,
        opening: opening || event.date,
        closing,
        recurring,
        hours,
        hoursOk,
        openToday: false,
      }
    }

    return {
      bucket: 'ended',
      statusLabel: closing
        ? `Closed · was ${formatRangeLabel(opening || event.date, closing)}`
        : 'Closed',
      nextRelevantYmd: closing || today,
      opening: opening || event.date,
      closing,
      recurring,
      hours,
      hoursOk,
      openToday: false,
    }
  }

  // One-time / default — hide from seasonal discovery only after effective end
  // (endTime, or start + default duration). Same calendar day stays visible until then.
  const eventDate = (event.date || '').trim()
  const effectiveEnd = getEventEffectiveEnd(event.date, event.startTime, event.endTime)
  if (effectiveEnd && now.getTime() > effectiveEnd.getTime()) {
    return {
      bucket: 'ended',
      statusLabel: formatCardDateTime(event.date, event.startTime, now),
      nextRelevantYmd: eventDate || today,
      opening: eventDate,
      closing: eventDate,
      recurring: '',
      hours,
      hoursOk,
      openToday: false,
    }
  }
  if (eventDate === today) {
    return {
      bucket: 'openToday',
      statusLabel: 'Open TODAY',
      nextRelevantYmd: today,
      opening: eventDate,
      closing: eventDate,
      recurring: '',
      hours,
      hoursOk,
      openToday: true,
    }
  }
  return {
    bucket: eventDate ? 'future' : 'openingSoon',
    statusLabel: eventDate ? `Opens ${formatShortOpenDate(eventDate)}` : hours,
    nextRelevantYmd: eventDate || today,
    opening: eventDate,
    closing: eventDate,
    recurring: '',
    hours,
    hoursOk,
    openToday: false,
  }
}

const BUCKET_RANK: Record<SeasonalDiscoveryBucket, number> = {
  openToday: 0,
  openingSoon: 1,
  closedToday: 2,
  future: 3,
  ended: 4,
}

/** Browse card: next actionable open + hours only. */
export function formatSeasonalBrowseWhen(
  event: SeasonalFields,
  now: Date = new Date(),
): DiscoveryWhenParts {
  if (event.scheduleKind !== 'seasonal-run') {
    const line = formatCardDateTime(event.date, event.startTime, now)
    return { primary: line, line }
  }

  const avail = getSeasonalAvailability(event, now)
  if (avail.bucket === 'ended') {
    return { primary: avail.statusLabel, line: avail.statusLabel }
  }

  const primary = avail.statusLabel
  const secondary = avail.hoursOk ? avail.hours : undefined
  return { primary, secondary, line: joinWhen(primary, secondary) }
}

/** Event detail WHEN rows + compact action-rail lines. */
export function formatSeasonalDetailWhen(
  event: SeasonalFields,
  now: Date = new Date(),
): SeasonalDetailWhen {
  if (event.scheduleKind !== 'seasonal-run') {
    const line = formatCardDateTime(event.date, event.startTime, now)
    const hours = hoursLabel(event)
    return {
      rows: asWhenRows([line, hours !== '—' ? hours : '']),
      rail: [line, hours !== '—' ? hours : ''].filter(Boolean),
    }
  }

  const avail = getSeasonalAvailability(event, now)
  const note = (event.scheduleNote || '').trim()

  if (avail.bucket === 'ended') {
    return { rows: [{ text: avail.statusLabel }], rail: [avail.statusLabel] }
  }

  const throughLine = avail.closing ? `Through ${formatShortOpenDate(avail.closing)}` : ''
  const rail = [
    avail.statusLabel,
    avail.hoursOk ? avail.hours : '',
    throughLine,
  ].filter(Boolean)

  // openingSoon / openToday / closedToday / in-season — same row shape
  return {
    rows: buildSeasonalDetailRows(avail, note, { includeScheduleLine: true }),
    rail,
  }
}

/**
 * Card + legacy callers — browse-shaped seasonal When (no full season range on cards).
 */
export function formatDiscoveryWhen(
  event: SeasonalFields,
  now: Date = new Date(),
): DiscoveryWhenParts {
  return formatSeasonalBrowseWhen(event, now)
}

/**
 * Order seasonal discovery cards for Home / Hello Fall collection.
 * Drops only events whose final occurrence has ended (effective end / closing day).
 * Curation IDs stay in seasonalDiscovery data — this only filters the public list.
 * Event detail pages still resolve ended rows and show the lifecycle Ended state.
 */
export function sortSeasonalDiscoveryEvents<T extends Event>(
  events: T[],
  now: Date = new Date(),
): T[] {
  const decorated = events.map((event, originalIndex) => {
    const avail = getSeasonalAvailability(event, now)
    return { event, originalIndex, avail }
  })

  // Exclude from public seasonal discovery once the last day/time has passed.
  // Seasonal-run with no closingDate never ends here (stays upcoming).
  const active = decorated.filter((row) => row.avail.bucket !== 'ended')

  active.sort((a, b) => {
    const rank = BUCKET_RANK[a.avail.bucket] - BUCKET_RANK[b.avail.bucket]
    if (rank !== 0) return rank
    if (a.avail.nextRelevantYmd !== b.avail.nextRelevantYmd) {
      return a.avail.nextRelevantYmd < b.avail.nextRelevantYmd ? -1 : 1
    }
    const aTime = a.event.startTime || ''
    const bTime = b.event.startTime || ''
    if (aTime !== bTime) return aTime < bTime ? -1 : 1
    return a.originalIndex - b.originalIndex
  })

  return active.map((row) => row.event)
}

/** Hours only helper for mockup secondary lines. */
export function formatOperatingHoursLine(startTime: string, endTime: string): string {
  const start = formatTime(startTime)
  const end = formatTime(endTime)
  if (!start) return '—'
  if (!end || end === start) return start
  return `${start}–${end}`
}
