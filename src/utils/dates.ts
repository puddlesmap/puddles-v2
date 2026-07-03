import type { DayFilter } from '../types/event'

/** Rolling public calendar window — today through this many days ahead (inclusive). */
export const PUBLIC_DISPLAY_WINDOW_DAYS = 60

/** Optional demo override: VITE_ANCHOR_DATE=2026-06-05 */
export function getAnchorDate(): Date {
  const override = import.meta.env.VITE_ANCHOR_DATE
  if (typeof override === 'string' && override.trim()) {
    return startOfDay(new Date(`${override.trim()}T12:00:00`))
  }
  return startOfDay(new Date())
}

/** @deprecated Prefer getAnchorDate() so dates stay current. */
export const ANCHOR_DATE = getAnchorDate()

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function parseFlexibleDate(dateStr: string): Date | null {
  const raw = dateStr.trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`)

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3]
    return new Date(
      `${year}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}T12:00:00`,
    )
  }

  const parsed = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatEventDate(dateStr: string): string {
  const d = parseFlexibleDate(dateStr) ?? new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr || '—'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Admin / sheet submissions — handles ISO, M/D/YYYY, and raw sheet values. */
export function formatSubmissionWhen(
  dateStr: string,
  startTime?: string,
  endTime?: string,
): string {
  const dateLabel = dateStr ? formatEventDate(dateStr) : ''
  const timeParts: string[] = []
  if (startTime?.trim()) timeParts.push(formatTimeLabel(startTime.trim()))
  if (endTime?.trim() && endTime !== startTime) timeParts.push(formatTimeLabel(endTime.trim()))

  if (dateLabel && timeParts.length > 0) return `${dateLabel} · ${timeParts.join(' – ')}`
  if (dateLabel) return dateLabel
  if (timeParts.length > 0) return timeParts.join(' – ')
  return '—'
}

/** Admin tables — time range on its own line below the date. */
export function formatEventTimeRange(startTime?: string, endTime?: string): string {
  const timeParts: string[] = []
  if (startTime?.trim()) timeParts.push(formatTimeLabel(startTime.trim()))
  if (endTime?.trim() && endTime !== startTime) timeParts.push(formatTimeLabel(endTime.trim()))
  return timeParts.length > 0 ? timeParts.join(' – ') : '—'
}

export function formatTime(time24: string): string {
  return formatTimeLabel(time24)
}

function formatTimeLabel(time: string): string {
  const raw = time.trim()
  if (!raw) return raw
  if (/[ap]m/i.test(raw)) return raw
  const match = raw.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return raw
  const h = Number(match[1])
  const m = Number(match[2])
  if (Number.isNaN(h) || Number.isNaN(m)) return raw
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

/** Card line: TODAY · 4:00 PM, TOMORROW · 10:30 AM, or FRI, JUN 14 · 10:30 AM */
export function formatCardDateTime(
  dateStr: string,
  startTime: string,
  anchor = getAnchorDate(),
): string {
  const parsed = parseFlexibleDate(dateStr) ?? new Date(`${dateStr}T12:00:00`)
  const d = startOfDay(parsed)
  if (Number.isNaN(d.getTime())) {
    return formatTime(startTime).toUpperCase() || '—'
  }

  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))
  const time = formatTime(startTime).toUpperCase()

  if (d.getTime() === today.getTime()) return `TODAY · ${time}`
  if (d.getTime() === tomorrow.getTime()) return `TOMORROW · ${time}`

  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return `${weekday}, ${month} ${day} · ${time}`
}

/** Modal date line: Today, June 5 */
export function formatModalDate(dateStr: string, anchor = getAnchorDate()): string {
  const d = startOfDay(new Date(dateStr + 'T12:00:00'))
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))
  const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  if (d.getTime() === today.getTime()) return `Today, ${monthDay}`
  if (d.getTime() === tomorrow.getTime()) return `Tomorrow, ${monthDay}`
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

/** Modal time line: 11:30 am, or 11:30 am to 12:00 pm when end differs */
export function formatModalTimeRange(startTime: string, endTime?: string): string {
  const startRaw = startTime?.trim()
  if (!startRaw) return ''

  const start = formatTime(startRaw).toLowerCase()
  const endRaw = endTime?.trim()
  if (!endRaw || endRaw === startRaw) return start

  const end = formatTime(endRaw).toLowerCase()
  if (end === start) return start

  return `${start} to ${end}`
}

/** Nearest relevant Sat–Sun (or Sun-only on Sunday). Label always "This weekend" in UI. */
export function getThisWeekendRange(anchor = getAnchorDate()): { start: Date; end: Date; label: string } {
  const day = anchor.getDay()
  const today = startOfDay(anchor)

  if (day === 0) {
    return {
      start: today,
      end: today,
      label: formatShortDate(today),
    }
  }

  if (day === 6) {
    const sun = startOfDay(addDays(today, 1))
    return {
      start: today,
      end: sun,
      label: `${formatShortDate(today)} – ${formatShortDate(sun)}`,
    }
  }

  const sat = startOfDay(addDays(today, 6 - day))
  const sun = startOfDay(addDays(sat, 1))
  return {
    start: sat,
    end: sun,
    label: `${formatShortDate(sat)} – ${formatShortDate(sun)}`,
  }
}

/** @deprecated Prefer getThisWeekendRange */
export function getUpcomingWeekend(anchor = getAnchorDate()) {
  return getThisWeekendRange(anchor)
}

export function dateInThisWeekend(dateStr: string, anchor = getAnchorDate()): boolean {
  const parsed = parseFlexibleDate(dateStr) ?? new Date(`${dateStr}T12:00:00`)
  const d = startOfDay(parsed)
  if (Number.isNaN(d.getTime())) return false
  const { start, end } = getThisWeekendRange(anchor)
  return d >= start && d <= end
}

export type TemporalTab = 'today' | 'tomorrow' | 'weekend'

/** Compact date line under When pills (e.g. Mon, Jun 29 · Sat, Jul 4 – Sun, Jul 5). */
export function getTemporalTabSubLabel(tab: TemporalTab, anchor = getAnchorDate()): string {
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))

  if (tab === 'today') return formatShortDate(today)
  if (tab === 'tomorrow') return formatShortDate(tomorrow)

  return getThisWeekendRange(anchor).label
}

export function getTemporalTabs(anchor = getAnchorDate()) {
  return [
    { key: 'today' as TemporalTab, label: 'Today', sub: getTemporalTabSubLabel('today', anchor) },
    { key: 'tomorrow' as TemporalTab, label: 'Tomorrow', sub: getTemporalTabSubLabel('tomorrow', anchor) },
    {
      key: 'weekend' as TemporalTab,
      label: 'This weekend',
      sub: getTemporalTabSubLabel('weekend', anchor),
    },
  ]
}

export function dateInTemporalTab(dateStr: string, tab: TemporalTab, anchor = getAnchorDate()): boolean {
  const parsed = parseFlexibleDate(dateStr) ?? new Date(`${dateStr}T12:00:00`)
  const d = startOfDay(parsed)
  if (Number.isNaN(d.getTime())) return false
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))

  if (tab === 'today') return d.getTime() === today.getTime()
  if (tab === 'tomorrow') return d.getTime() === tomorrow.getTime()
  return dateInThisWeekend(dateStr, anchor)
}

export function getFirstTemporalTabWithEvents(
  events: { date: string }[],
  anchor = getAnchorDate(),
): TemporalTab {
  const order: TemporalTab[] = ['today', 'tomorrow', 'weekend']
  for (const tab of order) {
    if (events.some((event) => dateInTemporalTab(event.date, tab, anchor))) return tab
  }
  return 'today'
}

export function dateInDayFilter(dateStr: string, filter: DayFilter, anchor = getAnchorDate()): boolean {
  const parsed = parseFlexibleDate(dateStr) ?? new Date(`${dateStr}T12:00:00`)
  const d = startOfDay(parsed)
  if (Number.isNaN(d.getTime())) return false
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))
  const lastVisibleDay = startOfDay(addDays(anchor, PUBLIC_DISPLAY_WINDOW_DAYS))

  if (filter === 'today') return d.getTime() === today.getTime()
  if (filter === 'tomorrow') return d.getTime() === tomorrow.getTime()
  if (filter === 'weekend') return dateInThisWeekend(dateStr, anchor)
  return d >= today && d <= lastVisibleDay
}

export function timeInBucket(startTime: string, bucket: string): boolean {
  const hour = Number(startTime.split(':')[0])
  if (bucket === 'any') return true
  if (bucket === 'morning') return hour < 12
  if (bucket === 'after-lunch') return hour >= 12 && hour < 15
  if (bucket === 'late-afternoon') return hour >= 15 && hour < 17
  if (bucket === 'evening') return hour >= 17
  return true
}
