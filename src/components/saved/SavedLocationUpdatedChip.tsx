import type { Event } from '../../types/event'

/** Compact mark when venue moved after save. */
export function SavedLocationUpdatedChip({ event }: { event: Event }) {
  const from = event.locationChangedFrom?.trim()
  if (!from) return null

  return (
    <p className="saved-location-updated-chip" role="status">
      Location changed
    </p>
  )
}

/**
 * Fixed-height row under Saved desktop cards so chips don’t stretch one card
 * taller than its neighbors.
 */
export function SavedLocationUpdatedSlot({ event }: { event: Event }) {
  return (
    <div className="saved-location-updated-slot" aria-hidden={!event.locationChangedFrom?.trim()}>
      <SavedLocationUpdatedChip event={event} />
    </div>
  )
}
