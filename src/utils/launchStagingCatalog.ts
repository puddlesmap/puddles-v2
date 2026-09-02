import type { Event } from '../types/event'
import launchStagingEvents from '../data/launch-staging-events.json'
import { getPublicEventsFromCatalog } from '../data/events'
import { enrichPublishingFields } from './publishing'
import { collapseSameSlotDuplicates } from './eventDuplicates'
import { isPublicAgeEligible } from './ageRange'
import { isOutOfAgeAudienceForPublic } from './eventAudienceAge'
import { isPublicEvent } from './publishing'

export const LAUNCH_STAGING_STORAGE_KEY = 'puddles:launch-staging'

const STAGING_EVENTS: Event[] = (launchStagingEvents as Event[]).map((event) =>
  enrichPublishingFields(event),
)

export function getLaunchStagingEvents(): Event[] {
  return STAGING_EVENTS
}

export function isLaunchStagingRoute(pathname: string): boolean {
  if (pathname === '/experiment/seasonal-launch-review') return true
  if (pathname === '/experiment/home-launch-preview') return true
  if (pathname.startsWith('/experiment/seasonal-discovery')) return true
  return false
}

export function readLaunchStagingToggle(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(LAUNCH_STAGING_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeLaunchStagingToggle(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      window.localStorage.setItem(LAUNCH_STAGING_STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(LAUNCH_STAGING_STORAGE_KEY)
    }
  } catch {
    // ignore quota / private mode
  }
}

function normalizeUrl(url: string): string {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function mergeCatalogs(base: Event[], staging: Event[]): Event[] {
  const byId = new Map<string, Event>()
  const byUrlDate = new Map<string, string>()

  for (const event of base) {
    byId.set(event.id, event)
    const url = normalizeUrl(event.eventUrl)
    if (url && url !== '#') {
      byUrlDate.set(`${url}|${event.date}`, event.id)
    }
  }

  for (const event of staging) {
    const url = normalizeUrl(event.eventUrl)
    const urlKey = url && url !== '#' ? `${url}|${event.date}` : ''
    if (urlKey && byUrlDate.has(urlKey)) {
      byId.delete(byUrlDate.get(urlKey)!)
    }
    byId.set(event.id, event)
  }

  return [...byId.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  )
}

/** Public catalog + launch staging rows (deduped). */
export function getLaunchReviewCatalog(now: Date = new Date()): Event[] {
  const base = getPublicEventsFromCatalog(now)
  const merged = mergeCatalogs(base, STAGING_EVENTS)
  const publicMerged = merged.filter(
    (event) =>
      isPublicEvent(event, now) &&
      isPublicAgeEligible(event.ageRange) &&
      !isOutOfAgeAudienceForPublic(event),
  )
  return collapseSameSlotDuplicates(publicMerged)
}

export function isLaunchStagingEnabled(pathname: string, toggleEnabled: boolean): boolean {
  if (isLaunchStagingRoute(pathname)) return true
  return toggleEnabled
}

export function getCatalogForLaunchContext(
  pathname: string,
  toggleEnabled: boolean,
  now: Date = new Date(),
): Event[] {
  if (!isLaunchStagingEnabled(pathname, toggleEnabled)) {
    return getPublicEventsFromCatalog(now)
  }
  return getLaunchReviewCatalog(now)
}

export function getLaunchStagingSummary(now: Date = new Date()) {
  const catalog = getLaunchReviewCatalog(now)
  const stagingIds = new Set(STAGING_EVENTS.map((event) => event.id))
  const stagedLive = catalog.filter((event) => stagingIds.has(event.id))

  const countByCity = (city: string) => stagedLive.filter((event) => event.city === city).length
  const countByType = (type: string) =>
    stagedLive.filter((event) => event.types.includes(type as Event['types'][number])).length

  return {
    totalStaged: STAGING_EVENTS.length,
    stagedLive: stagedLive.length,
    sunnyvale: countByCity('Sunnyvale'),
    parentAndMe: countByType('Parent & Me'),
    festivals: countByType('Festivals & Community'),
    events: stagedLive,
  }
}
