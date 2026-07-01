import type { DayFilter } from '../types/event'

export function formatActivityCount(count: number): string {
  return `${count} ${count === 1 ? 'activity' : 'activities'}`
}

export function getBrowseActivityNoun(eventCount: number, day: DayFilter = 'anytime'): string {
  const upcoming = day === 'anytime'
  if (eventCount === 1) return upcoming ? 'upcoming activity' : 'activity'
  return upcoming ? 'upcoming activities' : 'activities'
}

/** @deprecated Use getBrowseActivityNoun */
export const getBrowseEventNoun = getBrowseActivityNoun

export function getBrowseResultsSummary(
  eventCount: number,
  _city: string,
  day: DayFilter = 'anytime',
): string {
  return `${eventCount} ${getBrowseActivityNoun(eventCount, day)}`
}

export function getHomeFilterResultsSummary({
  whereMode,
  eventCount,
  hasNearbyCoords,
}: {
  whereMode: { kind: 'nearby' } | { kind: 'city'; value: string }
  eventCount: number
  hasNearbyCoords: boolean
}): string | null {
  if (whereMode.kind === 'nearby' && !hasNearbyCoords) return null

  const countLabel = formatActivityCount(eventCount)

  if (whereMode.kind === 'nearby') {
    return `Nearby · ${countLabel}`
  }

  if (whereMode.value === 'all') {
    return `All cities · ${countLabel}`
  }

  return `${whereMode.value} · ${countLabel}`
}
