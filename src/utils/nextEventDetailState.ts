import type { EventOpenSource } from '@/types/analytics'

const STORAGE_KEY = 'puddles:event-detail-overlay'
const SOFT_OPEN_KEY = 'puddles:event-detail-overlay-soft'

export interface EventDetailOverlayState {
  eventOpenSource: EventOpenSource
  returnTo: string
  backgroundPath: string
}

declare global {
  interface Window {
    __puddlesEventOverlaySoftOpen?: string
  }
}

/**
 * Soft-open marker must live on `window` (not a module-level let).
 * Next can evaluate this module in more than one chunk; a module flag would
 * desync and force the standalone URL page instead of the desktop modal.
 * Hard loads reset `window`, so stale sessionStorage alone cannot open a modal.
 */
function softOpenToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.__puddlesEventOverlaySoftOpen ?? null
}

export function saveEventDetailOverlayState(state: EventDetailOverlayState): void {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.__puddlesEventOverlaySoftOpen = token
  sessionStorage.setItem(SOFT_OPEN_KEY, token)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, softOpenToken: token }))
}

/** True only during an in-app soft-open (not on a hard load with stale storage). */
export function isEventDetailOverlayActive(): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return false

  const state = readEventDetailOverlayState()
  if (!state) return false

  const token = softOpenToken()
  const storedToken = sessionStorage.getItem(SOFT_OPEN_KEY)
  return Boolean(token && storedToken && token === storedToken)
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
  if (typeof window !== 'undefined') {
    delete window.__puddlesEventOverlaySoftOpen
  }
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(SOFT_OPEN_KEY)
}
