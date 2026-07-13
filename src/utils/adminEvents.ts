import type { AdminEventFilters, AdminEventRecord, AdminEventView } from '../types/admin'
import { ADMIN_EVENT_VIEWS } from '../types/admin'
import type { Event } from '../types/event'
import { addDays, getAnchorDate, startOfDay } from './dates'
import { collectAdminReviewFlags } from './adminReviewFlags'
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
): AdminEventRecord[] {
  if (viewId === 'duplicates') {
    return eventsInDuplicateClusters(events)
  }
  if (viewId === 'needs-attention') {
    const ids = new Set(
      collectAdminReviewFlags(events).flatMap((flag) => flag.eventIds),
    )
    return events.filter((event) => ids.has(event.id))
  }
  const view = getAdminEventView(viewId)
  if (!view) return events
  return filterAdminEvents(events, view.filters)
}

export function countAdminEvents(events: AdminEventRecord[], filters: AdminEventFilters): number {
  return filterAdminEvents(events, filters).length
}

export function summarizePublishingCounts(events: AdminEventRecord[]) {
  const duplicateClusters = findDuplicateClusters(events)
  const reviewFlags = collectAdminReviewFlags(events)
  return {
    published: countAdminEvents(events, { status: 'Published' }),
    draft: countAdminEvents(events, { status: 'Draft' }),
    hidden: countAdminEvents(events, { status: 'Hidden' }),
    expired: countAdminEvents(events, { status: 'Expired' }),
    live: countAdminEvents(events, { isLive: true }),
    past: countAdminEvents(events, { isPast: true }),
    needsVerification: countAdminEvents(events, { verificationStatus: 'Needs Review' }),
    duplicates: eventsInDuplicateClusters(events).length,
    duplicateGroups: duplicateClusters.length,
    needsAttention: reviewFlags.length,
  }
}
