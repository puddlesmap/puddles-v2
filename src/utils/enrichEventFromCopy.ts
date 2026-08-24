import type { Event } from '../types/event'
import { applyEventCopyEnrichment, resolveEventTypesFromCopy } from './applyEventCopyEnrichment'
import { resolveAgeFromSheetAndText } from './discoveryAgeHints'
import { resolveEventCost } from './eventCost'

/**
 * Re-apply description/tips hints at catalog load so tags stay correct even if
 * a sheet sync wrote broad Age Tags, Other-only types, or truncated copy.
 */
export function enrichEventFromCopy(event: Event): Event {
  const enriched = applyEventCopyEnrichment(event)

  const tips = enriched.tips ?? ''
  const inferredAge = resolveAgeFromSheetAndText(enriched.description, tips)
  const cost = resolveEventCost(enriched.cost, enriched.description, tips)
  const types = resolveEventTypesFromCopy(enriched)

  const ageChanged =
    inferredAge &&
    (enriched.ageRange !== inferredAge.ageRange ||
      enriched.ageMin !== inferredAge.ageMin ||
      enriched.ageMax !== inferredAge.ageMax)
  const costChanged = cost !== enriched.cost
  const typesChanged = types.join('|') !== enriched.types.join('|')

  if (!ageChanged && !costChanged && !typesChanged && enriched === event) return event

  return {
    ...enriched,
    types,
    ...(inferredAge && ageChanged
      ? {
          ageRange: inferredAge.ageRange,
          ageMin: inferredAge.ageMin,
          ageMax: inferredAge.ageMax,
        }
      : {}),
    ...(costChanged ? { cost } : {}),
  }
}

export function enrichEventsFromCopy(events: Event[]): Event[] {
  return events.map(enrichEventFromCopy)
}
