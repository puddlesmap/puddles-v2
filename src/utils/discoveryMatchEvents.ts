import { ALL_EVENTS } from '../data/events'
import { SYNC_META } from '../data/syncInfo'
import type { DiscoveryCandidate } from '../types/discovery'
import type { Event } from '../types/event'
import { resolveAdminEventsSource } from './sheetSync'

export function normalizeDiscoveryEventUrl(url: string): string {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

/** Resolve catalog/Sheet event IDs for a Discovery candidate already on Puddles. */
export function findMatchingEventIdsForCandidate(candidate: DiscoveryCandidate): string[] {
  if (candidate.convertedEventId?.trim()) {
    return [candidate.convertedEventId.trim()]
  }

  const target = normalizeDiscoveryEventUrl(candidate.eventUrl)
  if (!target) return []

  const { events } = resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt)
  const byUrl = events.filter(
    (event) => normalizeDiscoveryEventUrl(event.eventUrl) === target,
  ) as Event[]

  if (byUrl.length === 0) return []

  if (candidate.date) {
    const byDate = byUrl.filter((event) => event.date === candidate.date)
    if (byDate.length > 0) return byDate.map((event) => event.id)
  }

  return byUrl.map((event) => event.id)
}
