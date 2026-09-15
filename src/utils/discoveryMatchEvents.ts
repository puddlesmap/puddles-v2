import { ALL_EVENTS, ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS, ALL_SEASONAL_DRIVE_EVENTS } from '../data/events'
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

/** Admin cache plus compiled catalog (Hidden Hello Fall drive rows included). */
export function catalogMatchPool(): Event[] {
  const skipLaunchReview = new Set(ALL_LAUNCH_REVIEW_DISCOVERY_EVENTS.map((event) => event.id))
  const byId = new Map<string, Event>()
  for (const event of ALL_EVENTS) {
    if (skipLaunchReview.has(event.id)) continue
    byId.set(event.id, event)
  }
  for (const event of ALL_SEASONAL_DRIVE_EVENTS) {
    if (skipLaunchReview.has(event.id)) continue
    byId.set(event.id, event)
  }
  for (const event of adminEventPool()) {
    if (skipLaunchReview.has(event.id)) continue
    byId.set(event.id, event)
  }
  return [...byId.values()]
}

function normalizeTitle(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sameOutingDateCity(
  event: Event,
  candidate: Pick<DiscoveryCandidate, 'title' | 'date' | 'city' | 'venue'>,
): boolean {
  if (!candidate.date || event.date !== candidate.date) return false
  const want = normalizeTitle(candidate.title)
  const have = normalizeTitle(event.title)
  if (!want || !have || want !== have) return false
  const city = String(candidate.city || '').trim().toLowerCase()
  if (city && event.city.trim().toLowerCase() === city) return true
  const venue = String(candidate.venue || '').trim().toLowerCase()
  return Boolean(venue && event.venue.trim().toLowerCase() === venue)
}

/** Published or Hidden (Worth a little drive) — already on the public/seasonal site. */
export function isOnSiteCatalogStatus(status: Event['status']): boolean {
  return status === 'Published' || status === 'Hidden'
}

/**
 * Matching Events rows for a Discovery candidate.
 * Prefer converted id, then the same official URL on the same date, else title + date + city.
 * Same host URL without a matching date is not a match (library calendars share one link).
 */
export function findMatchingEventsForCandidate(candidate: DiscoveryCandidate): Event[] {
  const events = catalogMatchPool()

  if (candidate.convertedEventId?.trim()) {
    const id = candidate.convertedEventId.trim()
    const hit = events.find((event) => event.id === id)
    if (hit) return [hit]
  }

  const target = normalizeDiscoveryEventUrl(candidate.eventUrl)
  if (target && target !== '#') {
    const byUrl = events.filter(
      (event) => normalizeDiscoveryEventUrl(event.eventUrl) === target,
    )
    if (candidate.date) {
      const byDate = byUrl.filter((event) => event.date === candidate.date)
      if (byDate.length > 0) return byDate
    }
  }

  return events.filter((event) => sameOutingDateCity(event, candidate))
}

/** Live Browse or Hidden seasonal-drive row already on Puddles. */
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
