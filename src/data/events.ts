import type { Event } from '../types/event'
import sheetEvents from './sheet-events.json'
import launchStagingEvents from './launch-staging-events.json'
import { getShowcaseEvents } from './showcase-events'
import { HALLOWEEN_DRIVE_EVENTS } from './seasonalHalloweenDriveEvents'
import { HELLO_FALL_DRIVE_EVENTS } from './seasonalHelloFallDriveEvents'
import { isPublicAgeEligible } from '../utils/ageRange'
import { enrichEventsFromCopy } from '../utils/enrichEventFromCopy'
import { getUnaddedDiscoveryReviewEvents } from '../utils/launchReviewDiscovery'
import { isOutOfAgeAudienceForPublic } from '../utils/eventAudienceAge'
import { enrichPublishingFields, isPublicEvent } from '../utils/publishing'
import { collapseSameSlotDuplicates } from '../utils/eventDuplicates'

const sheetLiveCount = (sheetEvents as Event[]).filter((event) => event.isLive).length
const includeShowcaseEvents = sheetLiveCount === 0

function withPublishing(events: Array<Omit<Event, 'isPast' | 'isLive'> & Partial<Pick<Event, 'isPast' | 'isLive'>>>): Event[] {
  return enrichEventsFromCopy(events.map((event) => enrichPublishingFields(event as Event)))
}

/** All sheet-sourced events (every Status) — for admin dashboard. */
export const ALL_SHEET_EVENTS: Event[] = withPublishing(sheetEvents as Event[])

/** Curated demo events — optional fallback when showcase flag is enabled. */
export const ALL_SHOWCASE_EVENTS: Event[] = includeShowcaseEvents
  ? withPublishing(getShowcaseEvents())
  : []

/** Seasonal editorial picks outside the public catalog (e.g. “worth a drive” farms & haunts). */
export const ALL_SEASONAL_DRIVE_EVENTS: Event[] = withPublishing([
  ...HELLO_FALL_DRIVE_EVENTS,
  ...HALLOWEEN_DRIVE_EVENTS,
])

/**
 * Localhost launch staging — merge only via LaunchStagingContext / getLaunchReviewCatalog.
 * Do not append here: staging JSON marks rows Published and would leak onto public `/`
 * while sheet counterparts remain Draft.
 */
export const ALL_LAUNCH_STAGING_EVENTS: Event[] = withPublishing(launchStagingEvents as Event[])

/** Pending discovery rows — Hidden; for /experiment/seasonal-launch-review preview only. */
export const ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS: Event[] = withPublishing(
  getUnaddedDiscoveryReviewEvents(),
)

/** Full catalog including drafts, hidden, expired, and past rows (not launch-staging overlay). */
export const ALL_EVENTS: Event[] = [
  ...ALL_SHOWCASE_EVENTS,
  ...ALL_SHEET_EVENTS,
  ...ALL_SEASONAL_DRIVE_EVENTS,
  ...ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS,
]

/**
 * Public website events — Published, upcoming, and within the rolling display window.
 * Used by Discovery, Browse (list + map), Event Details, and calendar actions.
 */
export function getPublicEventsFromCatalog(now: Date = new Date()): Event[] {
  const publicEvents = ALL_EVENTS.filter(
    (event) =>
      isPublicEvent(event, now) &&
      isPublicAgeEligible(event.ageRange) &&
      !isOutOfAgeAudienceForPublic(event),
  )
  return collapseSameSlotDuplicates(publicEvents)
}

/** Snapshot at module load — prefer getPublicEventsFromCatalog() when freshness matters. */
export const LIVE_EVENTS: Event[] = getPublicEventsFromCatalog()

/** @deprecated Prefer getPublicEventsFromCatalog() or LIVE_EVENTS — kept for existing imports. */
export const MOCK_EVENTS: Event[] = LIVE_EVENTS
