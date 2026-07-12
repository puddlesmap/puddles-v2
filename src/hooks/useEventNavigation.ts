'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Event } from '@/types/event'
import type { EventOpenSource } from '@/types/analytics'
import { saveBrowseReturnSnapshot, type BrowseReturnSnapshot } from '@/utils/browseReturnState'
import { isEventModalOverlaySource } from '@/utils/eventDetailNavigation'
import { saveEventDetailOverlayState } from '@/utils/nextEventDetailState'
import { eventDetailPath } from '@/utils/eventPages'

export function useEventNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (event: Event, source: EventOpenSource, extra?: Partial<BrowseReturnSnapshot>) => {
      const search = searchParams.toString()
      const returnTo = `${pathname}${search ? `?${search}` : ''}`
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

      router.push(eventDetailPath(event))
    },
    [pathname, router, searchParams],
  )
}
