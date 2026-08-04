import type { City, Event, EventStatus } from './event'

/** Admin-facing event record — same as Event with room for future verification fields. */
export type AdminEventRecord = Event

export type AdminBooleanFilter = boolean | 'all'

export interface AdminEventFilters {
  status?: EventStatus | 'all'
  isPast?: AdminBooleanFilter
  isLive?: AdminBooleanFilter
  city?: City | 'all'
  dateFrom?: string
  dateTo?: string
  search?: string
  /** Reserved for verification MVP — optional until sheet column is wired. */
  verificationStatus?: string | 'all'
}

export type AdminEventViewId =
  | 'live'
  | 'draft'
  | 'hidden'
  | 'expired'
  | 'past'
  | 'needs-verification'
  | 'duplicates'
  | 'needs-attention'

export interface AdminEventView {
  id: AdminEventViewId
  label: string
  description: string
  filters: AdminEventFilters
}

/** Default saved views for the admin Events section. */
export const ADMIN_EVENT_VIEWS: AdminEventView[] = [
  {
    id: 'live',
    label: 'Live',
    description: 'Published and not yet past — visible on the public website.',
    filters: { isLive: true },
  },
  {
    id: 'needs-attention',
    label: 'Needs attention',
    description: 'Live events that need review: duplicates, age, area, and field mismatches.',
    filters: {},
  },
  {
    id: 'past',
    label: 'Past',
    description: 'Schedule has passed — may explain why Published events are not live.',
    filters: { isPast: true },
  },
  // Kept for filters/helpers; not shown as top-level Events cards.
  {
    id: 'draft',
    label: 'Draft Events',
    description: 'Not ready for publishing.',
    filters: { status: 'Draft' },
  },
  {
    id: 'hidden',
    label: 'Hidden Events',
    description: 'Intentionally removed from the public site.',
    filters: { status: 'Hidden' },
  },
  {
    id: 'expired',
    label: 'Expired Events',
    description: 'Manually archived or no longer relevant.',
    filters: { status: 'Expired' },
  },
  {
    id: 'needs-verification',
    label: 'Needs Verification',
    description: 'Last checked more than 30 days ago or missing.',
    filters: { verificationStatus: 'Needs Review' },
  },
  {
    id: 'duplicates',
    label: 'Possible duplicates',
    description:
      'Same outing listed more than once — keep the richest row and hide the rest.',
    filters: {},
  },
]

/** Fields editable in the admin dashboard for V1 publishing. */
export const ADMIN_EDITABLE_EVENT_FIELDS = ['status'] as const

/** Read-only computed publishing indicators in admin UI. */
export const ADMIN_READONLY_PUBLISHING_FIELDS = ['isPast', 'isLive'] as const

export type AdminEditableEventField = (typeof ADMIN_EDITABLE_EVENT_FIELDS)[number]
export type AdminReadonlyPublishingField = (typeof ADMIN_READONLY_PUBLISHING_FIELDS)[number]
