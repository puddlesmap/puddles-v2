import type { DiscoveryEditableFields } from './discovery'
import type { Event, EventStatus } from './event'

/** Fields editable in Admin Events (same as Discovery + publishing status). */
export type AdminEventEditableFields = DiscoveryEditableFields & {
  status: EventStatus
  isSeasonal: boolean
  isRegional: boolean
  /** Last day of a multi-day festival or seasonal run. Blank for a single day. */
  closingDate: string
  scheduleKind: NonNullable<Event['scheduleKind']> | ''
}
