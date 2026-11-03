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

function adminEventPool(): Event[] {
  return resolveAdminEventsSource(ALL_EVENTS, SYNC_META.syncedAt).events
}

/**
 * Pending discovery rows are copied into the catalog as Hidden previews
 * (same id, for the launch-review page). Those copies are not on the public site.
 */
function isSyntheticDiscoveryPreview(event: Event, candidate: DiscoveryCandidate): boolean {
  return event.status === 'Hidden' && event.id === candidate.id
}

/** Matching Events rows for a Discovery candidate (by converted id, then URL + date). */
export function findMatchingEventsForCandidate(candidate: DiscoveryCandidate): Event[] {
  const events = adminEventPool().filter((event) => !isSyntheticDiscoveryPreview(event, candidate))

  if (candidate.convertedEventId?.trim()) {
    const id = candidate.convertedEventId.trim()
    const hit = events.find((event) => event.id === id)
    if (hit) return [hit]
  }

  const target = normalizeDiscoveryEventUrl(candidate.eventUrl)
  if (!target) return []

  const byUrl = events.filter(
    (event) => normalizeDiscoveryEventUrl(event.eventUrl) === target,
  )

  if (byUrl.length === 0) return []

  if (candidate.date) {
    const byDate = byUrl.filter((event) => event.date === candidate.date)
    if (byDate.length > 0) return byDate
  }

  return byUrl
}

function isOnSiteCatalogStatus(status: Event['status'] | undefined): boolean {
  return status === 'Published' || status === 'Hidden' || status === 'Cancelled'
}

/** Live Browse, Hidden, or Cancelled row already on Puddles. */
export function findOnSiteCatalogEvent(candidate: DiscoveryCandidate): Event | undefined {
  return findMatchingEventsForCandidate(candidate).find((event) => isOnSiteCatalogStatus(event.status))
}

export function findExistingDraftForCandidate(candidate: DiscoveryCandidate): Event | undefined {
  return findMatchingEventsForCandidate(candidate).find((event) => event.status === 'Draft')
}

/** Resolve catalog/Sheet event IDs for a Discovery candidate already on Puddles. */
export function findMatchingEventIdsForCandidate(candidate: DiscoveryCandidate): string[] {
  return findMatchingEventsForCandidate(candidate)
    .map((event) => event.id)
    .filter(Boolean)
}

/**
 * Most recent Approved on / Last checked date for display:
 * Discovery approve stamp first, else newest verifiedDate on matching Events rows.
 */
export function latestApprovedOnForCandidate(candidate: DiscoveryCandidate): string {
  const local = candidate.lastChecked?.trim()
  if (local) return local

  const dates = findMatchingEventsForCandidate(candidate)
    .map((event) => event.verifiedDate?.trim())
    .filter((value): value is string => Boolean(value))
    .sort()

  return dates[dates.length - 1] || ''
}

/** Fill empty lastChecked from matching Events so the Approved on column can show a date. */
export function enrichCandidatesWithSiteVerifiedDates(
  candidates: DiscoveryCandidate[],
): DiscoveryCandidate[] {
  return candidates.map((candidate) => {
    if (candidate.lastChecked?.trim()) return candidate
    const fromSite = latestApprovedOnForCandidate(candidate)
    if (!fromSite) return candidate
    return { ...candidate, lastChecked: fromSite }
  })
}
