'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearEventDetailOverlayState,
  readEventDetailOverlayState,
} from '@/utils/nextEventDetailState'

export function useCloseEventDetail() {
  const router = useRouter()
  const hasInAppReturn =
    typeof window !== 'undefined' ? Boolean(readEventDetailOverlayState()) : false

  const close = useCallback(() => {
    const overlayState = readEventDetailOverlayState()
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
