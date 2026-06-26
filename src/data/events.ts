import type { Event } from '../types/event'
import sheetEvents from './sheet-events.json'
import { getShowcaseEvents } from './showcase-events'
import { enrichPublishingFields, isPublicEvent } from '../utils/publishing'

const sheetLiveCount = (sheetEvents as Event[]).filter((event) => event.isLive).length
const includeShowcaseEvents = sheetLiveCount === 0

function withPublishing(events: Array<Omit<Event, 'isPast' | 'isLive'> & Partial<Pick<Event, 'isPast' | 'isLive'>>>): Event[] {
  return events.map((event) => enrichPublishingFields(event as Event))
}

/** All sheet-sourced events (every Status) — for admin dashboard. */
export const ALL_SHEET_EVENTS: Event[] = withPublishing(sheetEvents as Event[])

/** Curated demo events — optional fallback when showcase flag is enabled. */
export const ALL_SHOWCASE_EVENTS: Event[] = includeShowcaseEvents
  ? withPublishing(getShowcaseEvents())
  : []

/** Full catalog including drafts, hidden, expired, and past rows. */
export const ALL_EVENTS: Event[] = [...ALL_SHOWCASE_EVENTS, ...ALL_SHEET_EVENTS]

/**
 * Public website events — Events tab only, Is Live = TRUE.
 * Used by Discovery, Browse (list + map), Event Details, and calendar actions.
 */
export const LIVE_EVENTS: Event[] = ALL_EVENTS.filter(isPublicEvent)

/** @deprecated Prefer LIVE_EVENTS — kept for existing imports. */
export const MOCK_EVENTS: Event[] = LIVE_EVENTS
