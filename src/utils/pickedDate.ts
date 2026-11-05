import type { Event } from '../types/event'
import { getEventSessions } from './eventSessions'

/** True when the event has a session on ymd, or a spanned schedule covering that day. */
export function eventMatchesPickedYmd(event: Event, ymd: string): boolean {
  if (getEventSessions(event).some((session) => session.date === ymd)) return true
  const opening = event.openingDate
  const closing = event.closingDate
  if (opening && closing && ymd >= opening && ymd <= closing) return true
  return false
}
