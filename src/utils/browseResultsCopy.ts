import type { DayFilter } from '../types/event'
import { formatShortDate } from './dates'

export function formatActivityCount(count: number): string {
  return `${count} ${count === 1 ? 'activity' : 'activities'}`
}

export function getBrowseActivityNoun(
  eventCount: number,
  day: DayFilter = 'anytime',
  opts?: { pickedYmd?: string | null },
): string {
  const upcoming = day === 'anytime' && !opts?.pickedYmd
  if (eventCount === 1) return upcoming ? 'upcoming activity' : 'activity'
  return upcoming ? 'upcoming activities' : 'activities'
}

/** @deprecated Use getBrowseActivityNoun */
export const getBrowseEventNoun = getBrowseActivityNoun

export function getBrowseResultsSummary(
  eventCount: number,
  _city: string,
  day: DayFilter = 'anytime',
  opts?: { pickedYmd?: string | null; nearbyContextLabel?: string | null },
): string {
  const noun = getBrowseActivityNoun(eventCount, day, opts)
  const base = opts?.pickedYmd
    ? `${eventCount} ${noun} · ${formatShortDate(new Date(`${opts.pickedYmd}T12:00:00`))}`
    : `${eventCount} ${noun}`

  if (opts?.nearbyContextLabel) {
    return `${base} · ${opts.nearbyContextLabel}`
  }

  return base
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

  if (whereMode.value === 'other') {
    return `Around the Bay · ${countLabel}`
  }

  if (whereMode.value === 'core') {
    return `South Peninsula · ${countLabel}`
  }

  return `${whereMode.value} · ${countLabel}`
}
