'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearEventDetailOverlayState,
  isEventDetailOverlayActive,
  readEventDetailOverlayState,
} from '@/utils/nextEventDetailState'

export function useCloseEventDetail() {
  const router = useRouter()
  // Only an in-app soft-open has a real history entry to return to. A hard-loaded
  // standalone page (possibly with stale sessionStorage) should fall back to /browse.
  const hasInAppReturn =
    typeof window !== 'undefined' ? isEventDetailOverlayActive() : false

  const close = useCallback(() => {
    const overlayState = isEventDetailOverlayActive() ? readEventDetailOverlayState() : null
    clearEventDetailOverlayState()

    if (overlayState?.backgroundPath) {
      router.back()
      return
    }

    if (overlayState?.returnTo) {
      router.push(overlayState.returnTo)
      return
    }

    router.push('/browse')
  }, [router])

  return { close, hasInAppReturn }
}
