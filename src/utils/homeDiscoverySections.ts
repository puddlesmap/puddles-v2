import type { Event } from '../types/event'
import { isLaunchAreaCity } from './cityRegions'

export const HOME_PREVIEW_SHOW_ALL_MAX = 8
export const HOME_PREVIEW_MAX_TOTAL = 10
export const HOME_PREVIEW_PENINSULA_PREF = 6
export const HOME_PREVIEW_BAY_PREF = 4

export interface HomeDiscoveryPartition {
  peninsula: Event[]
  bay: Event[]
}

export interface HomeGroupedPreview {
  peninsula: Event[]
  bay: Event[]
  peninsulaHasMore: boolean
  bayHasMore: boolean
}

export interface HomeSingleListPreview {
  events: Event[]
  hasMore: boolean
}

/** Split an already-sorted Home feed into South Peninsula vs rest of Bay Area. */
export function partitionHomeEvents(events: Event[]): HomeDiscoveryPartition {
  const peninsula: Event[] = []
  const bay: Event[] = []
  for (const event of events) {
    if (isLaunchAreaCity(event.city)) peninsula.push(event)
    else bay.push(event)
  }
  return { peninsula, bay }
}

/**
 * Cap All-cities Home sections: ≤8 show all; else prefer 6 + 4 with unused
 * slots redistributed, max 10 displayed.
 */
export function allocateHomePreview(
  peninsula: Event[],
  bay: Event[],
): HomeGroupedPreview {
  const total = peninsula.length + bay.length
  if (total <= HOME_PREVIEW_SHOW_ALL_MAX) {
    return {
      peninsula,
      bay,
      peninsulaHasMore: false,
      bayHasMore: false,
    }
  }

  let peninsulaTake = Math.min(peninsula.length, HOME_PREVIEW_PENINSULA_PREF)
  let bayTake = Math.min(bay.length, HOME_PREVIEW_BAY_PREF)
  let remaining = HOME_PREVIEW_MAX_TOTAL - peninsulaTake - bayTake

  if (remaining > 0) {
    const peninsulaExtra = Math.min(remaining, peninsula.length - peninsulaTake)
    peninsulaTake += peninsulaExtra
    remaining -= peninsulaExtra
  }
  if (remaining > 0) {
    const bayExtra = Math.min(remaining, bay.length - bayTake)
    bayTake += bayExtra
  }

  return {
    peninsula: peninsula.slice(0, peninsulaTake),
    bay: bay.slice(0, bayTake),
    peninsulaHasMore: peninsulaTake < peninsula.length,
    bayHasMore: bayTake < bay.length,
  }
}

/** Cap ungrouped Home feeds (Nearby / city / Other): ≤8 all; else first 10. */
export function allocateSingleListPreview(events: Event[]): HomeSingleListPreview {
  if (events.length <= HOME_PREVIEW_SHOW_ALL_MAX) {
    return { events, hasMore: false }
  }
  return {
    events: events.slice(0, HOME_PREVIEW_MAX_TOTAL),
    hasMore: events.length > HOME_PREVIEW_MAX_TOTAL,
  }
}
