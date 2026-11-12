import type { Event } from '../types/event'

/** Parent-facing v1 — excludes seasonal-run (would email too often). */
export function canOfferSavedReminder(event: Pick<Event, 'id' | 'status' | 'scheduleKind' | 'date' | 'sessions' | 'openingDate'>) {
  if (!event?.id) return false
  if (event.status === 'Cancelled' || event.status === 'Draft') return false
  if (event.scheduleKind === 'seasonal-run') return false
  if (event.sessions && event.sessions.length > 0) return true
  if (event.scheduleKind === 'multi-day') return Boolean(event.openingDate || event.date)
  return Boolean((event.date || '').trim())
}
