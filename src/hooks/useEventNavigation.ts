'use client'

import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Event } from '@/types/event'
import type { EventOpenSource } from '@/types/analytics'
import { saveBrowseReturnSnapshot, type BrowseReturnSnapshot } from '@/utils/browseReturnState'
import { saveHomeReturnSnapshotFromLive } from '@/utils/homeReturnState'
import { clearEventDetailOverlayState } from '@/utils/nextEventDetailState'
import { eventDetailPath } from '@/utils/eventPages'
import { beginBrowseVisit, bindGuideToEventDetail } from '@/utils/discoveryAttribution'

const EVENT_DETAIL_RETURN_KEY = 'puddles:event-detail-return'

function sourceQueryValue(source: EventOpenSource): string | null {
  switch (source) {
    case 'browse_list':
    case 'browse_map':
    case 'home':
    case 'saved':
    case 'guide':
    case 'city_landing':
      return source
    default:
      return null
  }
}

/**
 * Open event detail as a full page (not the intercepting modal overlay).
 * Hard navigation avoids Next.js `(.)event` keeping Browse underneath.
 */
export function useEventNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (event: Event, source: EventOpenSource, extra?: Partial<BrowseReturnSnapshot>) => {
      const search = searchParams.toString()
      const returnTo = `${pathname}${search ? `?${search}` : ''}`

      if (source === 'home') {
        saveHomeReturnSnapshotFromLive(window.scrollY)
      }

      if (source === 'browse_list' || source === 'browse_map' || source === 'discovery') {
        beginBrowseVisit()
      }

      saveBrowseReturnSnapshot({
        scrollY: window.scrollY,
        ...extra,
      })

      clearEventDetailOverlayState()
      try {
        sessionStorage.setItem(EVENT_DETAIL_RETURN_KEY, returnTo)
      } catch {
        // ignore quota / private mode
      }

      const params = new URLSearchParams()
      const fromSource = sourceQueryValue(source)
      if (fromSource) params.set('from_source', fromSource)
      const href = params.toString()
        ? `${eventDetailPath(event)}?${params.toString()}`
        : eventDetailPath(event)

      window.location.assign(href)
    },
    [pathname, searchParams],
  )
}

export function openGuideEventDetail(eventId: string, guideSlug: string) {
  bindGuideToEventDetail(guideSlug)
  const params = new URLSearchParams({
    from_guide: guideSlug,
    from_source: 'guide',
  })
  window.location.assign(`/event/${encodeURIComponent(eventId)}?${params.toString()}`)
}
