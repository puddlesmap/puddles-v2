import type { DiscoveryCandidate } from '../types/discovery'
import type { Event } from '../types/event'
import {
  catalogFlagsFromCandidate,
  includeInSeasonalFromCandidate,
  seasonalSectionForCandidate,
} from './adminCatalogPlacement.mjs'
import { stageAdminEvent } from './adminPublishQueue'
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
