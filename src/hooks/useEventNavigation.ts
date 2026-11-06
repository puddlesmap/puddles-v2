'use client'

import { useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Event } from '@/types/event'
import type { EventOpenSource } from '@/types/analytics'
import { saveBrowseReturnSnapshot, type BrowseReturnSnapshot } from '@/utils/browseReturnState'
import { saveHomeReturnSnapshotFromLive } from '@/utils/homeReturnState'
import { clearEventDetailOverlayState } from '@/utils/nextEventDetailState'
import { eventDetailPath } from '@/utils/eventPages'

const EVENT_DETAIL_RETURN_KEY = 'puddles:event-detail-return'

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

      window.location.assign(eventDetailPath(event))
    },
    [pathname, searchParams],
  )
}
