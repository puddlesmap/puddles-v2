import type { Event } from '../types/event'
import { resolveAgeFromSheetAndText } from './discoveryAgeHints'
import { resolveEventCost } from './eventCost'

/**
 * Re-apply description/tips hints at catalog load so tags stay correct even if
 * a sheet sync wrote broad Age Tags or Low-cost before inference ran.
 */
export function enrichEventFromCopy(event: Event): Event {
  const tips = event.tips ?? ''
  const inferredAge = resolveAgeFromSheetAndText(event.description, tips)
  const cost = resolveEventCost(event.cost, event.description, tips)

  const ageChanged =
    inferredAge &&
    (event.ageRange !== inferredAge.ageRange ||
      event.ageMin !== inferredAge.ageMin ||
      event.ageMax !== inferredAge.ageMax)
  const costChanged = cost !== event.cost

  if (!ageChanged && !costChanged) return event

  return {
    ...event,
    ...(inferredAge
      ? {
          ageRange: inferredAge.ageRange,
          ageMin: inferredAge.ageMin,
          ageMax: inferredAge.ageMax,
        }
      : {}),
    cost,
  }
}

export function enrichEventsFromCopy(events: Event[]): Event[] {
  return events.map(enrichEventFromCopy)
}
