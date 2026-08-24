import type { DiscoveryEditableFields } from './discovery'
import type { EventStatus } from './event'

/** Fields editable in Admin Events (same as Discovery + publishing status). */
export type AdminEventEditableFields = DiscoveryEditableFields & {
  status: EventStatus
}
