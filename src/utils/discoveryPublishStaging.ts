import type { DiscoveryCandidate } from '../types/discovery'
import type { Event } from '../types/event'
import {
  catalogFlagsFromCandidate,
  includeInSeasonalFromCandidate,
  seasonalSectionForCandidate,
} from './adminCatalogPlacement.mjs'
import { loadAdminPublishQueue, stageAdminEvent } from './adminPublishQueue'
import { getAdminEventForPublish } from './discoveryApproveLocal'
import { addToSeasonalSection, getActiveThemeSlugForAdmin } from './seasonalCurationStaging'

/** Stage an approved Discovery row for the header Publish bundle. */
export function stageDiscoveryCandidateForPublish(
  candidate: DiscoveryCandidate,
  eventId: string,
): void {
  const event = getAdminEventForPublish(eventId)
  if (!event) return
  const include = includeInSeasonalFromCandidate(candidate)
  const flags = catalogFlagsFromCandidate(candidate, include)
  const prepared: Event = {
    ...event,
    ...flags,
  }
  stageAdminEvent(prepared, 'discovery', candidate.id)
  if (include) {
    addToSeasonalSection(
      event.id,
      seasonalSectionForCandidate(candidate),
      getActiveThemeSlugForAdmin(),
    )
  }
}

/** Backfill header Publish from Ready rows that are not staged yet (this browser). */
export function syncApprovedDiscoveryToPublishQueue(candidates: DiscoveryCandidate[]): number {
  const staged = new Set(
    loadAdminPublishQueue()
      .items.filter((item) => item.source === 'discovery')
      .map((item) => item.sourceId),
  )
  let added = 0
  for (const candidate of candidates) {
    if (candidate.reviewStatus !== 'approved') continue
    if (staged.has(candidate.id)) continue
    const eventId =
      candidate.convertedEventId?.trim() ||
      (getAdminEventForPublish(candidate.id) ? candidate.id : '')
    if (!eventId) continue
    stageDiscoveryCandidateForPublish(candidate, eventId)
    staged.add(candidate.id)
    added += 1
  }
  return added
}
