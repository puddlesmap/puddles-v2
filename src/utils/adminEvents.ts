import type {
  AdminEventCatalog,
  AdminEventFilters,
  AdminEventRecord,
  AdminEventView,
} from '../types/admin'
import { ADMIN_EVENT_VIEWS } from '../types/admin'
import type { Event } from '../types/event'
import { addDays, getAnchorDate, startOfDay } from './dates'
import { collectAdminReviewFlags } from './adminReviewFlags'
import { eventsForCatalog, isSeasonalMonitorEvent } from './adminSeasonalEvents'
import { eventsInDuplicateClusters, findDuplicateClusters } from './eventDuplicates'

export const VERIFICATION_STALE_DAYS = 30

function matchesSearch(event: Event, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return [event.title, event.venue, event.city, event.description]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function matchesBooleanFilter(value: boolean, filter: AdminEventFilters['isPast']): boolean {
  if (filter === undefined || filter === 'all') return true
  return value === filter
}

/** Last checked older than threshold — used until Verification Status column exists. */
export function isVerificationStale(
  event: Event,
  referenceDate: Date = getAnchorDate(),
  staleDays = VERIFICATION_STALE_DAYS,
): boolean {
  if (!event.verifiedDate?.trim()) return true
  const verified = startOfDay(new Date(`${event.verifiedDate}T12:00:00`))
  if (Number.isNaN(verified.getTime())) return true
  const cutoff = startOfDay(addDays(referenceDate, -staleDays))
  return verified.getTime() <= cutoff.getTime()
}

/** Filter admin event list — supports Status, Is Past, Is Live, city, date range, search. */
export function filterAdminEvents(
  events: AdminEventRecord[],
  filters: AdminEventFilters,
): AdminEventRecord[] {
  return events.filter((event) => {
    if (filters.status && filters.status !== 'all' && event.status !== filters.status) return false
    if (!matchesBooleanFilter(event.isPast, filters.isPast)) return false
    if (!matchesBooleanFilter(event.isLive, filters.isLive)) return false
    if (filters.city && filters.city !== 'all' && event.city !== filters.city) return false
    if (filters.dateFrom && event.date < filters.dateFrom) return false
    if (filters.dateTo && event.date > filters.dateTo) return false
    if (filters.search && !matchesSearch(event, filters.search)) return false
    if (filters.verificationStatus === 'Needs Review' && !isVerificationStale(event)) return false
    return true
  })
}

export function getAdminEventView(id: AdminEventView['id']): AdminEventView | undefined {
  return ADMIN_EVENT_VIEWS.find((view) => view.id === id)
}

export function filterAdminEventsByView(
  events: AdminEventRecord[],
  viewId: AdminEventView['id'],
  catalog: AdminEventCatalog = 'regular',
): AdminEventRecord[] {
  const scoped = eventsForCatalog(events, catalog)
  if (viewId === 'duplicates') {
    return eventsInDuplicateClusters(scoped)
  }
  if (viewId === 'needs-attention') {
    const ids = new Set(
      collectAdminReviewFlags(scoped).flatMap((flag) => flag.eventIds),
    )
    return scoped.filter((event) => ids.has(event.id))
  }
  if (viewId === 'live') {
    if (catalog === 'seasonal') {
      return scoped.filter((event) => isSeasonalMonitorEvent(event))
    }
    return filterAdminEvents(scoped, { isLive: true })
  }
  const view = getAdminEventView(viewId)
  if (!view) return scoped
  return filterAdminEvents(scoped, view.filters)
}

export function countAdminEvents(events: AdminEventRecord[], filters: AdminEventFilters): number {
  return filterAdminEvents(events, filters).length
}

export function summarizePublishingCounts(
  events: AdminEventRecord[],
  catalog: AdminEventCatalog = 'regular',
) {
  const scoped = eventsForCatalog(events, catalog)
  const duplicateClusters = findDuplicateClusters(scoped)
  const reviewFlags = collectAdminReviewFlags(scoped)
  return {
    published: countAdminEvents(scoped, { status: 'Published' }),
    draft: countAdminEvents(scoped, { status: 'Draft' }),
    hidden: countAdminEvents(scoped, { status: 'Hidden' }),
    cancelled: countAdminEvents(scoped, { status: 'Cancelled' }),
    expired: countAdminEvents(scoped, { status: 'Expired' }),
    live: filterAdminEventsByView(events, 'live', catalog).length,
    past: countAdminEvents(scoped, { isPast: true }),
    needsVerification: countAdminEvents(scoped, { verificationStatus: 'Needs Review' }),
    duplicates: eventsInDuplicateClusters(scoped).length,
    duplicateGroups: duplicateClusters.length,
    needsAttention: reviewFlags.length,
  }
}
