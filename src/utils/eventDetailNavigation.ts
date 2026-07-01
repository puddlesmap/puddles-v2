import type { Location } from 'react-router-dom'
import type { EventOpenSource } from '../types/analytics'

export interface EventDetailLocationState {
  fromApp: true
  eventOpenSource: EventOpenSource
  returnTo: string
  /** Frozen browse/map location rendered behind the event overlay. */
  backgroundLocation?: Location
}

export function parseEventDetailLocationState(
  state: unknown,
): EventDetailLocationState | null {
  if (!state || typeof state !== 'object') return null

  const value = state as Partial<EventDetailLocationState>
  if (value.fromApp !== true || typeof value.returnTo !== 'string' || !value.returnTo) {
    return null
  }

  return {
    fromApp: true,
    eventOpenSource: value.eventOpenSource ?? 'discovery',
    returnTo: value.returnTo,
    backgroundLocation: value.backgroundLocation,
  }
}

export function getEventDetailBackground(state: unknown): Location | null {
  return parseEventDetailLocationState(state)?.backgroundLocation ?? null
}

export function isEventModalOverlaySource(source: EventOpenSource): boolean {
  return source === 'browse_list' || source === 'browse_map' || source === 'home'
}

/** @deprecated Use isEventModalOverlaySource */
export function isBrowseEventOverlaySource(source: EventOpenSource): boolean {
  return isEventModalOverlaySource(source)
}
