import type { ActivityType, Event } from '../types/event'
import { normalizeVenueFromCopy } from './normalizeVenueFromCopy'
import { restoreDescriptionFromDiscovery } from './restoreDescriptionFromDiscovery'
import { resolveActivityTypes } from './resolveActivityTypes'
import {
  descriptionWithoutTips,
  extractTipsFromText,
  stripLogisticsFromDescription,
} from './eventTips'

type EnrichmentInput = Pick<
  Event,
  'id' | 'title' | 'description' | 'venue' | 'address' | 'date' | 'eventUrl' | 'types' | 'categoryTags'
> & {
  tips?: string
  sheetTypesRaw?: string
}

export function applyEventCopyEnrichment<T extends EnrichmentInput>(event: T): T {
  let description = event.description ?? ''
  let tips = event.tips ?? ''
  let venue = event.venue ?? ''
  let address = event.address ?? ''

  description = restoreDescriptionFromDiscovery(event, description)
  description = stripLogisticsFromDescription(description)

  const venueNorm = normalizeVenueFromCopy(venue, description)
  if (venueNorm.venue) venue = venueNorm.venue
  if (venueNorm.address) address = venueNorm.address

  const extractedTips = extractTipsFromText(description, tips)
  if (extractedTips) {
    description = descriptionWithoutTips(description, extractedTips)
    tips = extractedTips
  }

  const types = resolveActivityTypes(
    event.sheetTypesRaw ?? event.types.join(', '),
    event.title,
    description,
    event.categoryTags,
  )

  const changed =
    description !== event.description ||
    tips !== (event.tips ?? '') ||
    venue !== event.venue ||
    address !== event.address ||
    types.join('|') !== event.types.join('|')

  if (!changed) return event

  return {
    ...event,
    description,
    venue,
    address,
    types,
    ...(tips ? { tips } : {}),
  }
}

/** Re-resolve types when catalog already has stale Other-only tags from an old sync. */
export function resolveEventTypesFromCopy(event: Event): ActivityType[] {
  return resolveActivityTypes(
    event.types.join(', '),
    event.title,
    event.description,
    event.categoryTags,
  )
}
