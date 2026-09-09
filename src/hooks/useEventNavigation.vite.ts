import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Event } from '@/types/event'
import type { EventOpenSource } from '@/types/analytics'
import { saveBrowseReturnSnapshot, type BrowseReturnSnapshot } from '@/utils/browseReturnState'
import { isEventModalOverlaySource } from '@/utils/eventDetailNavigation'
import { saveEventDetailOverlayState } from '@/utils/nextEventDetailState'
import { eventDetailPath } from '@/utils/eventPages'

/** Vite SPA variant — react-router instead of next/navigation. */
export function useEventNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (event: Event, source: EventOpenSource, extra?: Partial<BrowseReturnSnapshot>) => {
      const returnTo = `${location.pathname}${location.search}`
      const useBrowseOverlay = isEventModalOverlaySource(source)

      if (!useBrowseOverlay) {
        saveBrowseReturnSnapshot({
          scrollY: window.scrollY,
          ...extra,
        })
      } else {
        saveEventDetailOverlayState({
          eventOpenSource: source,
          returnTo,
          backgroundPath: returnTo,
        })
      }

      navigate(eventDetailPath(event))
    },
    [location.pathname, location.search, navigate],
  )
}
