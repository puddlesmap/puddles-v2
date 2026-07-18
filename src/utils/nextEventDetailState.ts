import type { EventOpenSource } from '@/types/analytics'

const STORAGE_KEY = 'puddles:event-detail-overlay'

export interface EventDetailOverlayState {
  eventOpenSource: EventOpenSource
  returnTo: string
  backgroundPath: string
}

/**
 * In-memory marker for "the overlay was opened by a soft navigation in THIS JS
 * context." sessionStorage persists across hard loads/refreshes and can linger
 * when the modal is dismissed without our close() handler (e.g. browser Back).
 * A hard load starts a fresh module, so this resets to false — which is exactly
 * when the standalone event page must render instead of a stale background.
 */
let overlayActiveInMemory = false

export function saveEventDetailOverlayState(state: EventDetailOverlayState): void {
  overlayActiveInMemory = true
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** True only during an in-app soft-open (not on a hard load with stale storage). */
export function isEventDetailOverlayActive(): boolean {
  return overlayActiveInMemory && readEventDetailOverlayState() !== null
}

export function readEventDetailOverlayState(): EventDetailOverlayState | null {
  if (typeof sessionStorage === 'undefined') return null

  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<EventDetailOverlayState>
    if (
      typeof parsed.returnTo !== 'string' ||
      typeof parsed.backgroundPath !== 'string' ||
      typeof parsed.eventOpenSource !== 'string'
    ) {
      return null
    }

    return {
      eventOpenSource: parsed.eventOpenSource as EventOpenSource,
      returnTo: parsed.returnTo,
      backgroundPath: parsed.backgroundPath,
    }
  } catch {
    return null
  }
}

export function clearEventDetailOverlayState(): void {
  overlayActiveInMemory = false
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
