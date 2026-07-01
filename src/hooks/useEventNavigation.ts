import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { saveBrowseReturnSnapshot, type BrowseReturnSnapshot } from '../utils/browseReturnState'
import {
  isEventModalOverlaySource,
  type EventDetailLocationState,
} from '../utils/eventDetailNavigation'
import { eventDetailPath } from '../utils/eventPages'

export function useEventNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (event: Event, source: EventOpenSource, extra?: Partial<BrowseReturnSnapshot>) => {
      const returnTo = `${location.pathname}${location.search}${location.hash}`
      const useBrowseOverlay = isEventModalOverlaySource(source)

      if (!useBrowseOverlay) {
        saveBrowseReturnSnapshot({
          scrollY: window.scrollY,
          ...extra,
        })
      }

      navigate(eventDetailPath(event), {
        state: {
          fromApp: true,
          eventOpenSource: source,
          returnTo,
          ...(useBrowseOverlay ? { backgroundLocation: location } : {}),
        } satisfies EventDetailLocationState,
      })
    },
    [location.hash, location.pathname, location.search, navigate],
  )
}
