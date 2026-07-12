import type { EventOpenSource } from '@/types/analytics'

const STORAGE_KEY = 'puddles:event-detail-overlay'

export interface EventDetailOverlayState {
  eventOpenSource: EventOpenSource
  returnTo: string
  backgroundPath: string
}

export function saveEventDetailOverlayState(state: EventDetailOverlayState): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
