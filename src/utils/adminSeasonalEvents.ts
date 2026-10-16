import type { AdminEventCatalog } from '../types/admin'
import { ALL_EVENTS } from '../data/events'
import {
  SEASONAL_COLLECTIONS,
  getActiveSeasonalCollections,
  getSeasonalCollection,
} from '../data/seasonalDiscovery'
import type { Event } from '../types/event'
import type { AdminReviewFlag } from './adminReviewFlags'
import { enrichPublishingFields } from './publishing'

function curatedSeasonalIds(): { collection: Set<string>; drive: Set<string> } {
  const collection = new Set<string>()
  const drive = new Set<string>()
  for (const base of SEASONAL_COLLECTIONS) {
    const curated = getSeasonalCollection(base.slug) ?? base
    for (const id of curated.collectionEventIds ?? []) collection.add(id)
    for (const id of curated.driveEventIds ?? []) drive.add(id)
  }
  return { collection, drive }
}

/** Worth a little drive / out of core cities. Explicit flag wins over inference. */
export function isRegionalListing(
  event: Pick<Event, 'id' | 'isRegional'>,
): boolean {
  if (typeof event.isRegional === 'boolean') return event.isRegional
  if (event.id.startsWith('seasonal-drive-')) return true
  return curatedSeasonalIds().drive.has(event.id)
}

/** Hello Fall / Halloween close-to-home. Explicit flag wins over inference. */
export function isSeasonalListing(
  event: Pick<Event, 'id' | 'isSeasonal'>,
): boolean {
  if (typeof event.isSeasonal === 'boolean') return event.isSeasonal
  return curatedSeasonalIds().collection.has(event.id)
}

/** Admin Seasonal events tab — seasonal and/or regional listings. */
export function isSeasonalAdminListing(
  event: Pick<Event, 'id' | 'isSeasonal' | 'isRegional'>,
): boolean {
  return isSeasonalListing(event) || isRegionalListing(event)
}

function uniqueActiveCollectionIds(): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const collection of getActiveSeasonalCollections()) {
    for (const id of [...collection.collectionEventIds, ...(collection.driveEventIds ?? [])]) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

/** Collection titles this event belongs to, including themes that are no longer live. */
export function collectionNamesForEvent(eventId: string): string[] {
  const names: string[] = []
  for (const base of SEASONAL_COLLECTIONS) {
    const collection = base.slug ? (getSeasonalCollection(base.slug) ?? base) : base
    const listed =
      collection.collectionEventIds.includes(eventId) ||
      Boolean(collection.driveEventIds?.includes(eventId))
    if (listed) names.push(collection.title)
  }
  return names
}

/**
 * Regional / Seasonal Live: every event on a collection that is on Home today.
 * Looks in the admin cache first, then the public catalog. Past dates stay off.
 * An id with no event is returned so the list can show it as missing.
 */
export function seasonalLiveMonitor(adminEvents: Event[]): {
  events: Event[]
  missingIds: string[]
} {
  const adminById = new Map(adminEvents.map((event) => [event.id, event]))
  const catalogById = new Map(ALL_EVENTS.map((event) => [event.id, event]))
  const events: Event[] = []
  const missingIds: string[] = []

  for (const id of uniqueActiveCollectionIds()) {
    const found = adminById.get(id) ?? catalogById.get(id)
    if (!found) {
      missingIds.push(id)
      continue
    }
    const event = enrichPublishingFields(found)
    if (event.isPast) continue
    if (
      event.status === 'Draft' ||
      event.status === 'Expired' ||
      event.status === 'Cancelled'
    ) {
      continue
    }
    events.push(event)
  }

  return { events, missingIds }
}

export function seasonalListingLabels(event: Pick<Event, 'id' | 'isSeasonal' | 'isRegional'>): string[] {
  const labels: string[] = []
  if (isSeasonalListing(event)) labels.push('Seasonal')
  if (isRegionalListing(event)) labels.push('Regional')
  return labels
}

export function eventMatchesCatalog(event: Event, catalog: AdminEventCatalog): boolean {
  const seasonal = isSeasonalAdminListing(event)
  return catalog === 'seasonal' ? seasonal : !seasonal
}

export function eventsForCatalog(events: Event[], catalog: AdminEventCatalog): Event[] {
  return events.filter((event) => eventMatchesCatalog(event, catalog))
}

/**
 * Needs-attention flags for one catalog.
 * Regional / Seasonal skips out-of-area on regional listings — out of core cities is expected.
 */
export function reviewFlagsForCatalog(
  flags: AdminReviewFlag[],
  events: Event[],
  catalog: AdminEventCatalog,
): AdminReviewFlag[] {
  const byId = new Map(events.map((event) => [event.id, event]))
  const scoped: AdminReviewFlag[] = []

  for (const flag of flags) {
    const catalogIds = flag.eventIds.filter((id) => {
      const event = byId.get(id)
      return event ? eventMatchesCatalog(event, catalog) : false
    })
    if (catalogIds.length === 0) continue

    if (catalog === 'seasonal' && flag.type === 'out_of_area') {
      const allRegional = catalogIds.every((id) => {
        const event = byId.get(id)
        return event ? isRegionalListing(event) : false
      })
      if (allRegional) continue
    }

    scoped.push({ ...flag, eventIds: catalogIds })
  }

  return scoped
}
