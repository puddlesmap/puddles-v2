import { LIVE_EVENTS } from '../data/events'
import {
  getSeasonalCollection,
  SEASONAL_THEME_SCHEDULE,
  type SeasonalCollectionSlug,
} from '../data/seasonalDiscovery'
import { zonedCalendarDate } from './dates'

export type GuideLifecycleState = 'upcoming' | 'active' | 'past' | 'evergreen'

export type GuideLifecycleKind = 'seasonal' | 'evergreen'

export interface GuideLifecycleMeta {
  lifecycleKind: GuideLifecycleKind
  /** Seasonal collection slug when seasonal. */
  collectionSlug?: SeasonalCollectionSlug
  /** Editorial force — reactivation / archive without waiting on leftover events. */
  lifecycleOverride?: GuideLifecycleState
}

function seasonWindowForSlug(
  slug: SeasonalCollectionSlug,
): { activeFrom: string; activeUntil: string } | null {
  const collection = getSeasonalCollection(slug)
  if (collection?.activeFrom && collection?.activeUntil) {
    return { activeFrom: collection.activeFrom, activeUntil: collection.activeUntil }
  }
  const schedule = SEASONAL_THEME_SCHEDULE.find((entry) => entry.slug === slug)
  if (schedule) {
    return { activeFrom: schedule.activeFrom, activeUntil: schedule.activeUntil }
  }
  return null
}

/** Resolve lifecycle from season dates + optional editorial override. Not from publish date. */
export function resolveGuideLifecycleState(
  meta: GuideLifecycleMeta,
  now: Date = new Date(),
): GuideLifecycleState {
  if (meta.lifecycleOverride) return meta.lifecycleOverride
  if (meta.lifecycleKind === 'evergreen' || !meta.collectionSlug) return 'evergreen'

  const window = seasonWindowForSlug(meta.collectionSlug)
  if (!window) return 'evergreen'

  const today = zonedCalendarDate(now)
  if (today < window.activeFrom) return 'upcoming'
  if (today > window.activeUntil) return 'past'
  return 'active'
}

function eventEndYmd(event: {
  closingDate?: string
  date?: string
  openingDate?: string
}): string {
  return (event.closingDate || event.date || event.openingDate || '').trim()
}

/** True when the linked collection still has an upcoming or in-window event. */
export function collectionHasRelevantEvents(
  collectionSlug: SeasonalCollectionSlug,
  now: Date = new Date(),
): boolean {
  const collection = getSeasonalCollection(collectionSlug)
  if (!collection) return false

  const ids = new Set([
    ...collection.collectionEventIds,
    ...(collection.driveEventIds ?? []),
  ])
  if (ids.size === 0) return false

  const today = zonedCalendarDate(now)
  return LIVE_EVENTS.some((event) => {
    if (!ids.has(event.id)) return false
    const end = eventEndYmd(event)
    if (!end) return true
    return end >= today
  })
}

export function shouldShowGuideCollectionCta(
  meta: GuideLifecycleMeta,
  now: Date = new Date(),
): boolean {
  const state = resolveGuideLifecycleState(meta, now)
  if (state === 'past' || state === 'upcoming') return false
  if (state === 'evergreen') {
    if (!meta.collectionSlug) return false
    return collectionHasRelevantEvents(meta.collectionSlug, now)
  }
  // active
  if (!meta.collectionSlug) return false
  return collectionHasRelevantEvents(meta.collectionSlug, now)
}

export function getGuideLifecycleMeta(
  entry: Partial<GuideLifecycleMeta>,
): GuideLifecycleMeta {
  return {
    lifecycleKind: entry.lifecycleKind ?? 'evergreen',
    collectionSlug: entry.collectionSlug,
    lifecycleOverride: entry.lifecycleOverride,
  }
}
