import type { Event } from '../types/event'
import type { EventSession } from '../types/eventSession'
import type { DayFilter, TimeFilter } from '../types/event'
import {
  dateInDayFilter,
  dateInTemporalTab,
  formatTime,
  getAnchorDate,
  isEventVisibleForTodayFilter,
  timeInBucket,
  type TemporalTab,
} from './dates'

export type { EventSession }

export function getEventSessions(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
): EventSession[] {
  if (event.sessions && event.sessions.length > 0) {
    return [...event.sessions].sort((a, b) =>
      a.date === b.date
        ? (a.startTime || '').localeCompare(b.startTime || '')
        : a.date.localeCompare(b.date),
    )
  }
  if (!event.date) return []
  return [{ date: event.date, startTime: event.startTime, endTime: event.endTime }]
}

export function eventHasMultiplePerformances(
  event: Pick<Event, 'sessions'>,
): boolean {
  return (event.sessions?.length ?? 0) > 1
}

export function lastEventSession(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
): EventSession | null {
  const sessions = getEventSessions(event)
  return sessions[sessions.length - 1] ?? null
}

function formatShortRange(from: string, to: string): string {
  const a = new Date(`${from}T12:00:00`)
  const b = new Date(`${to}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return from
  const monthA = a.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const monthB = b.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  if (from === to) return `${monthA} ${a.getDate()}`
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${monthA} ${a.getDate()}–${b.getDate()}`
  }
  return `${monthA} ${a.getDate()}–${monthB} ${b.getDate()}`
}

/** Browse card line for ticketed productions / dated tours with more than one session. */
export function formatMultiplePerformancesCardWhen(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
): string | null {
  if (!eventHasMultiplePerformances(event)) return null
  const sessions = getEventSessions(event)
  const first = sessions[0].date
  const last = sessions[sessions.length - 1].date
  return `${formatShortRange(first, last)} · Multiple performances`
}

function formatSessionClock(session: EventSession): string {
  const start = formatTime(session.startTime)
  if (!session.endTime) return start
  return `${start}–${formatTime(session.endTime)}`
}

function formatSessionDay(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday}, ${month} ${d.getDate()}`
}

export function formatSessionsDetailRows(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
): string[] {
  const sessions = getEventSessions(event)
  if (sessions.length === 0) return []
  const first = sessions[0].date
  const last = sessions[sessions.length - 1].date
  const range =
    first === last
      ? formatSessionDay(first)
      : formatShortRange(first, last)
        .replace(/\b([A-Z]{3})\b/g, (month) => month.slice(0, 1) + month.slice(1).toLowerCase())

  const byDate = new Map<string, EventSession[]>()
  for (const session of sessions) {
    const list = byDate.get(session.date) ?? []
    list.push(session)
    byDate.set(session.date, list)
  }

  const lines = [...byDate.entries()].map(([date, daySessions]) => {
    const times = daySessions.map((session) => formatSessionClock(session)).join(', ')
    return `${formatSessionDay(date)} · ${times}`
  })

  return [range, ...lines]
}

export function eventMatchesTimeFilter(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
  time: TimeFilter | string,
): boolean {
  if (!time || time === 'any') return true
  return getEventSessions(event).some((session) => timeInBucket(session.startTime, time))
}

export function eventMatchesDayFilter(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
  day: DayFilter,
  anchor = getAnchorDate(),
  now: Date = new Date(),
): boolean {
  const sessions = getEventSessions(event)
  if (day === 'today') {
    return sessions.some((session) =>
      isEventVisibleForTodayFilter(session.date, session.startTime, session.endTime, anchor, now),
    )
  }
  return sessions.some((session) => dateInDayFilter(session.date, day, anchor))
}

export function eventMatchesTemporalTab(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
  tab: TemporalTab,
  anchor = getAnchorDate(),
  now: Date = new Date(),
): boolean {
  const sessions = getEventSessions(event)
  if (tab === 'today') {
    return sessions.some((session) =>
      isEventVisibleForTodayFilter(session.date, session.startTime, session.endTime, anchor, now),
    )
  }
  return sessions.some((session) => dateInTemporalTab(session.date, tab, anchor))
}

export function eventHasSessionInDisplayWindow(
  event: Pick<Event, 'date' | 'startTime' | 'endTime' | 'sessions'>,
  isInWindow: (date: string) => boolean,
): boolean {
  return getEventSessions(event).some((session) => isInWindow(session.date))
}
